export type HybridCompany = { id: string; name: string; currency: string; country: string; createdAt: string };
export type HybridCustomer = { id: string; name: string; email?: string; createdAt: string };
export type HybridItem = { id: string; sku: string; name: string; quantity: number; unitCost: number; createdAt: string };
export type HybridInvoice = { id: string; customerId: string; itemId: string; quantity: number; unitPrice: number; status: "draft" | "queued" | "synced" | "conflict"; createdAt: string };
export type OutboxAction = { id: string; idempotencyKey: string; action: string; args: Record<string, unknown>; createdAt: string; status: "pending" | "syncing" | "synced" | "conflict"; attempts: number; startedAt?: string; message?: string };
export type HybridLedger = { version: 1; company?: HybridCompany; customers: HybridCustomer[]; items: HybridItem[]; invoices: HybridInvoice[]; outbox: OutboxAction[]; updatedAt: string; lastSyncAt?: string };
export const emptyHybridLedger = (): HybridLedger => ({ version: 1, customers: [], items: [], invoices: [], outbox: [], updatedAt: new Date().toISOString() });
export const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
export const amount = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
export const queue = (action: string, args: Record<string, unknown>): OutboxAction => ({ id: makeId("outbox"), idempotencyKey: makeId("idem"), action, args, createdAt: new Date().toISOString(), status: "pending", attempts: 0 });
export function recoverHybridLedger(raw: string | null): HybridLedger {
  if (!raw) return emptyHybridLedger();
  try {
    const parsed = JSON.parse(raw) as Partial<HybridLedger>;
    if (parsed.version !== 1 || !Array.isArray(parsed.customers) || !Array.isArray(parsed.items) || !Array.isArray(parsed.invoices) || !Array.isArray(parsed.outbox)) return emptyHybridLedger();
    return { ...emptyHybridLedger(), ...parsed, outbox: parsed.outbox.map((entry) => ({ ...entry, idempotencyKey: entry.idempotencyKey ?? makeId("idem"), attempts: entry.attempts ?? 0, status: entry.status === "syncing" ? "pending" : entry.status, message: entry.status === "syncing" ? "Recovered after an interrupted sync. Safe to retry." : entry.message })) } as HybridLedger;
  } catch { return emptyHybridLedger(); }
}
export const invoiceTotal = (invoice: HybridInvoice) => amount(invoice.quantity * invoice.unitPrice);
export const hybridSummary = (ledger: HybridLedger) => ({ sales: amount(ledger.invoices.filter((entry) => entry.status === "synced").reduce((sum, entry) => sum + invoiceTotal(entry), 0)), pending: ledger.outbox.filter((entry) => entry.status === "pending" || entry.status === "conflict").length, inventory: amount(ledger.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)) });
