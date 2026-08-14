import type { ActionResult, GatewayCatalog, GatewayConfig, GatewayHealth } from "./types";
import { GatewayError } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

function normalizeUrl(baseUrl: string, allowInsecureLocal: boolean) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) throw new GatewayError("Enter the address of your ERPClaw action gateway.");
  let parsed: URL;
  try { parsed = new URL(trimmed); } catch { throw new GatewayError("Enter a complete gateway URL, including https://."); }
  const localHttp = parsed.protocol === "http:" && /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(parsed.hostname);
  if (parsed.protocol !== "https:" && !(localHttp && allowInsecureLocal)) throw new GatewayError("Use HTTPS for your gateway. Enable private-network HTTP only for a trusted local gateway.");
  return trimmed;
}

async function request<T>(config: GatewayConfig, path: string, init?: RequestInit): Promise<T> {
  const baseUrl = normalizeUrl(config.baseUrl, config.allowInsecureLocal);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json", "X-ERPClaw-Client": "android", ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}), ...(init?.headers ?? {}) }, signal: controller.signal });
    const raw = await response.text();
    let data: unknown = raw;
    try { data = raw ? JSON.parse(raw) : {}; } catch { /* Preserve plain-text gateway failures. */ }
    if (!response.ok) {
      const message = typeof data === "object" && data && "message" in data ? String((data as { message: unknown }).message) : `The ERPClaw gateway returned ${response.status}.`;
      throw new GatewayError(message, response.status, data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new GatewayError("The ERPClaw gateway did not respond in time. Check the address and network connection.");
    throw new GatewayError("Unable to reach the ERPClaw gateway. Check the URL, token, and network connection.");
  } finally { clearTimeout(timeout); }
}

export const checkGateway = (config: GatewayConfig) => request<GatewayHealth>(config, "/health");
export async function getCatalog(config: GatewayConfig): Promise<GatewayCatalog> {
  const payload = await request<GatewayCatalog & { core_actions?: string[] }>(config, "/v1/catalog");
  const actions = Array.isArray(payload.actions) ? payload.actions : payload.core_actions ?? [];
  return { ...payload, actions, total: payload.total ?? actions.length };
}
export const executeGatewayAction = (config: GatewayConfig, action: string, args: Record<string, unknown>, confirmed: boolean, idempotencyKey?: string) => request<ActionResult>(config, `/v1/actions/${encodeURIComponent(action)}`, { method: "POST", headers: idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined, body: JSON.stringify({ args, confirmed }) });
