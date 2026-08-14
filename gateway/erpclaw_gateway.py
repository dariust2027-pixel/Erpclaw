#!/usr/bin/env python3
"""Small self-hosted adapter that exposes the official ERPClaw router over HTTP.

The Android app uses this as a control plane only: accounting rules and writes
remain inside the upstream ERPClaw Python router and its database.
"""
from __future__ import annotations
import hmac
import json
import os
import subprocess
import sys
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

HOST = os.environ.get("ERPCLAW_GATEWAY_HOST", "127.0.0.1")
PORT = int(os.environ.get("ERPCLAW_GATEWAY_PORT", "8787"))
TOKEN = os.environ.get("ERPCLAW_GATEWAY_TOKEN", "")
ALLOWED_ORIGINS = {origin.strip() for origin in os.environ.get("ERPCLAW_ALLOWED_ORIGINS", "").split(",") if origin.strip()}
SOURCE_ROOT = Path(os.environ.get("ERPCLAW_SOURCE", Path(__file__).resolve().parents[2])).resolve()
ROUTER = SOURCE_ROOT / "scripts" / "db_query.py"
DEMO_ACTIONS = {"seed-demo-data"}
IDEMPOTENCY_FILE = Path(os.environ.get("ERPCLAW_IDEMPOTENCY_FILE", Path(os.environ.get("ERPCLAW_HOME", ".")) / "mobile-idempotency.json"))
IDEMPOTENCY_LOCK = threading.Lock()

class GatewayFailure(Exception):
    def __init__(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST, details: Any = None): super().__init__(message); self.status, self.details = status, details

def run_router(action: str, args: dict[str, Any] | None = None, confirmed: bool = False) -> dict[str, Any]:
    if not ROUTER.is_file(): raise GatewayFailure(f"ERPClaw router is not available at {ROUTER}", HTTPStatus.SERVICE_UNAVAILABLE)
    command = [sys.executable, str(ROUTER), "--action", action]
    for key, value in (args or {}).items():
        if not isinstance(key, str) or not key.replace("_", "").replace("-", "").isalnum(): raise GatewayFailure("Action argument names must contain letters, numbers, underscores, or dashes.")
        if value is None or value is False: continue
        command.append("--" + key.replace("_", "-"))
        if value is not True: command.append(json.dumps(value, separators=(",", ":")) if isinstance(value, (dict, list)) else str(value))
    if confirmed: command.append("--user-confirmed")
    completed = subprocess.run(command, capture_output=True, text=True, timeout=90, check=False, env=os.environ.copy())
    raw = completed.stdout.strip() or completed.stderr.strip()
    try: payload = json.loads(raw) if raw else {}
    except json.JSONDecodeError: payload = {"message": raw or "ERPClaw returned no response.", "status": "error"}
    if completed.returncode != 0 or payload.get("status") == "error": raise GatewayFailure(str(payload.get("message") or "ERPClaw rejected the action."), HTTPStatus.UNPROCESSABLE_ENTITY, payload)
    return payload

def engine_actions() -> list[str]:
    catalog = run_router("list-all-actions")
    actions = list(catalog.get("core_actions", []))
    for module_actions in catalog.get("module_actions", {}).values(): actions.extend(module_actions)
    return sorted({action for action in actions if action not in DEMO_ACTIONS})

def load_idempotency() -> dict[str, dict[str, Any]]:
    try:
        return json.loads(IDEMPOTENCY_FILE.read_text(encoding="utf-8")) if IDEMPOTENCY_FILE.is_file() else {}
    except (OSError, json.JSONDecodeError):
        return {}

def save_idempotency(records: dict[str, dict[str, Any]]) -> None:
    IDEMPOTENCY_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = IDEMPOTENCY_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps(records, separators=(",", ":")), encoding="utf-8")
    temporary.replace(IDEMPOTENCY_FILE)

class Handler(BaseHTTPRequestHandler):
    server_version = "ERPClawGateway/1.0"
    def log_message(self, fmt: str, *args: Any) -> None: sys.stderr.write("ERPClaw gateway: " + fmt % args + "\n")
    def end_headers(self) -> None:
        origin = self.headers.get("Origin")
        if origin and origin in ALLOWED_ORIGINS: self.send_header("Access-Control-Allow-Origin", origin); self.send_header("Vary", "Origin")
        self.send_header("X-Content-Type-Options", "nosniff"); self.send_header("Cache-Control", "no-store"); super().end_headers()
    def respond(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8"); self.send_response(status); self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def authorized(self) -> bool:
        if not TOKEN: return True
        header = self.headers.get("Authorization", "")
        return header.startswith("Bearer ") and hmac.compare_digest(header[7:], TOKEN)
    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000: raise GatewayFailure("Request body exceeds the 1 MB limit.", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        try: payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError as error: raise GatewayFailure("Request body must be valid JSON.") from error
        if not isinstance(payload, dict): raise GatewayFailure("Request body must be a JSON object.")
        return payload
    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT); self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-ERPClaw-Client, X-Idempotency-Key"); self.end_headers()
    def do_GET(self) -> None:
        if not self.authorized(): self.respond(HTTPStatus.UNAUTHORIZED, {"message": "Unauthorized."}); return
        path = urlparse(self.path).path
        try:
            if path == "/health":
                actions = engine_actions(); self.respond(HTTPStatus.OK, {"status": "ok", "engine": "ERPClaw", "catalogTotal": len(actions)}); return
            if path == "/v1/catalog":
                actions = engine_actions(); self.respond(HTTPStatus.OK, {"actions": actions, "total": len(actions)}); return
            self.respond(HTTPStatus.NOT_FOUND, {"message": "Not found."})
        except GatewayFailure as failure: self.respond(failure.status, {"message": str(failure), "details": failure.details})
        except subprocess.TimeoutExpired: self.respond(HTTPStatus.GATEWAY_TIMEOUT, {"message": "ERPClaw did not respond within the gateway timeout."})
    def do_POST(self) -> None:
        if not self.authorized(): self.respond(HTTPStatus.UNAUTHORIZED, {"message": "Unauthorized."}); return
        path = urlparse(self.path).path
        if not path.startswith("/v1/actions/"): self.respond(HTTPStatus.NOT_FOUND, {"message": "Not found."}); return
        try:
            action = unquote(path.removeprefix("/v1/actions/"))
            if action not in set(engine_actions()): raise GatewayFailure("This action is not exposed by the connected ERPClaw engine.", HTTPStatus.NOT_FOUND)
            payload = self.read_json(); args = payload.get("args", {})
            if not isinstance(args, dict): raise GatewayFailure("The args field must be a JSON object.")
            key = self.headers.get("X-Idempotency-Key", "").strip()
            if key and (len(key) > 200 or not key.replace("_", "").replace("-", "").isalnum()): raise GatewayFailure("Invalid idempotency key.")
            with IDEMPOTENCY_LOCK:
                records = load_idempotency()
                if key and key in records:
                    self.respond(HTTPStatus.OK, records[key]["result"]); return
                result = run_router(action, args, bool(payload.get("confirmed")))
                if key:
                    records[key] = {"action": action, "result": result}
                    save_idempotency(records)
            self.respond(HTTPStatus.OK, result)
        except GatewayFailure as failure: self.respond(failure.status, {"message": str(failure), "details": failure.details})
        except subprocess.TimeoutExpired: self.respond(HTTPStatus.GATEWAY_TIMEOUT, {"message": "ERPClaw did not respond within the gateway timeout."})

if __name__ == "__main__":
    if not ROUTER.is_file(): raise SystemExit(f"Set ERPCLAW_SOURCE to the directory containing scripts/db_query.py; missing: {ROUTER}")
    print(f"ERPClaw gateway listening on {HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
