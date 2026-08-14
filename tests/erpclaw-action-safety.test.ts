import { describe, expect, it } from "vitest";

import { actionDomain, actionSafety, humanizeAction } from "../lib/erpclaw/action-safety";

describe("ERPClaw action safety classification", () => {
  it("keeps reports and lookups read-only", () => {
    expect(actionSafety("list-companies")).toBe("read");
    expect(actionSafety("profit-and-loss")).toBe("read");
    expect(actionSafety("verify-backup")).toBe("read");
  });

  it("requires a confirmation for ordinary business changes", () => {
    expect(actionSafety("add-customer")).toBe("write");
    expect(actionSafety("submit-sales-invoice")).toBe("write");
    expect(actionSafety("setup-company")).toBe("write");
  });

  it("flags irreversible or high-impact paths for a second confirmation", () => {
    expect(actionSafety("restore-database")).toBe("destructive");
    expect(actionSafety("delete-payment")).toBe("destructive");
    expect(actionSafety("install-module")).toBe("destructive");
  });

  it("presents catalog items in business-friendly groups and titles", () => {
    expect(actionDomain("create-sales-invoice")).toBe("Sales");
    expect(actionDomain("list-warehouses")).toBe("Inventory");
    expect(humanizeAction("profit-and-loss")).toBe("Profit And Loss");
  });
});
