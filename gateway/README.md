# ERPClaw Action Gateway

The Android client communicates with the upstream Python ERPClaw engine through this small, self-hosted adapter. The adapter does not implement accounting logic or modify SQLite directly; each request is converted into a safe argument vector and sent to the official `scripts/db_query.py` router.

| Endpoint | Function |
|---|---|
| `GET /health` | Verifies that ERPClaw is reachable and returns the current catalog count. |
| `GET /v1/catalog` | Returns core and installed-module actions, excluding demo-data seeding. |
| `POST /v1/actions/{action}` | Passes JSON arguments and explicit confirmation to the official ERPClaw router. |

For local validation, set the engine source and a dedicated data location, then start the adapter.

```bash
export ERPCLAW_SOURCE=/path/to/erpclaw
export ERPCLAW_HOME=/path/to/erpclaw-data
export ERPCLAW_GATEWAY_TOKEN='replace-with-a-long-random-token'
python3 /path/to/erpclaw-android/gateway/erpclaw_gateway.py
```

The reference process listens on `127.0.0.1`. Place it behind a TLS reverse proxy or VPN for a mobile device. In production, expose only HTTPS, use a strong token, restrict the host and database as financial infrastructure, and set `ERPCLAW_ALLOWED_ORIGINS` to a comma-separated browser-origin allow list when web access is required. With this variable empty, browser-origin requests receive no permissive CORS header.

> The gateway rejects `seed-demo-data` even if a connected engine advertises it. The mobile app creates only a user-confirmed company foundation.
