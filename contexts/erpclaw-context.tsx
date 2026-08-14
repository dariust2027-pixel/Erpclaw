import { useRouter } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { actionSafety } from "@/lib/erpclaw/action-safety";
import { clearGatewayConfig, loadGatewayConfig, saveGatewayConfig } from "@/lib/erpclaw/config";
import { checkGateway, executeGatewayAction, getCatalog } from "@/lib/erpclaw/gateway";
import type { ActionResult, Company, GatewayCatalog, GatewayConfig, GatewayHealth } from "@/lib/erpclaw/types";

type ERPClawContextValue = { config: GatewayConfig | null; health: GatewayHealth | null; catalog: GatewayCatalog | null; companies: Company[]; loading: boolean; error: string | null; connect: (config: GatewayConfig) => Promise<void>; disconnect: () => Promise<void>; refresh: () => Promise<void>; execute: (action: string, args: Record<string, unknown>, forceConfirmation?: boolean) => Promise<ActionResult>; };
const ERPClawContext = createContext<ERPClawContextValue | null>(null);

function extractCompanies(result: ActionResult): Company[] {
  const raw = result.companies;
  if (!Array.isArray(raw)) return [];
  return raw.filter((company): company is Company => Boolean(company) && typeof company === "object" && "id" in company && "name" in company);
}

export function ERPClawProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [catalog, setCatalog] = useState<GatewayCatalog | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshWithConfig = useCallback(async (nextConfig: GatewayConfig) => { const [nextHealth, nextCatalog, companiesResult] = await Promise.all([checkGateway(nextConfig), getCatalog(nextConfig), executeGatewayAction(nextConfig, "list-companies", {}, false)]); setHealth(nextHealth); setCatalog(nextCatalog); setCompanies(extractCompanies(companiesResult)); }, []);
  useEffect(() => { void (async () => { try { const saved = await loadGatewayConfig(); if (!saved) return; setConfig(saved); await refreshWithConfig(saved); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not restore the ERPClaw connection."); } finally { setLoading(false); } })(); }, [refreshWithConfig]);
  const connect = useCallback(async (nextConfig: GatewayConfig) => { setLoading(true); setError(null); try { await refreshWithConfig(nextConfig); await saveGatewayConfig(nextConfig); setConfig(nextConfig); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not connect to ERPClaw."); throw cause; } finally { setLoading(false); } }, [refreshWithConfig]);
  const refresh = useCallback(async () => { if (!config) return; setLoading(true); setError(null); try { await refreshWithConfig(config); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh ERPClaw data."); throw cause; } finally { setLoading(false); } }, [config, refreshWithConfig]);
  const disconnect = useCallback(async () => { await clearGatewayConfig(); setConfig(null); setHealth(null); setCatalog(null); setCompanies([]); setError(null); router.replace("/connect" as never); }, [router]);
  const execute = useCallback(async (action: string, args: Record<string, unknown>, forceConfirmation = false) => { if (!config) throw new Error("Connect to an ERPClaw gateway before running actions."); const result = await executeGatewayAction(config, action, args, forceConfirmation || actionSafety(action) !== "read"); if (["setup-company", "seed-defaults", "setup-chart-of-accounts"].includes(action) || action.startsWith("add-") || action.startsWith("create-") || action.startsWith("delete-")) await refresh(); return result; }, [config, refresh]);
  const value = useMemo(() => ({ config, health, catalog, companies, loading, error, connect, disconnect, refresh, execute }), [catalog, companies, config, connect, disconnect, error, execute, health, loading, refresh]);
  return <ERPClawContext.Provider value={value}>{children}</ERPClawContext.Provider>;
}

export function useERPClaw() { const context = useContext(ERPClawContext); if (!context) throw new Error("useERPClaw must be used inside ERPClawProvider."); return context; }
