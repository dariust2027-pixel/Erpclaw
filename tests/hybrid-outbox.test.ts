import { describe, expect, it } from "vitest";
import { emptyHybridLedger, hybridSummary, queue } from "../lib/hybrid-erp";
describe("hybrid outbox", () => { it("keeps offline actions explicit and retryable", () => { const action = queue("add-customer", { name: "Acme" }); expect(action.status).toBe("pending"); expect(action.action).toBe("add-customer"); }); it("reports queued work before remote synchronization", () => { const ledger = { ...emptyHybridLedger(), outbox: [queue("add-item", { sku: "A" })] }; expect(hybridSummary(ledger).pending).toBe(1); }); });
