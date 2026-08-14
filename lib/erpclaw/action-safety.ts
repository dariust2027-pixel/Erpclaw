import type { ActionSafety } from "./types";

const READ_ONLY_PREFIXES = ["list-", "get-", "check-", "status", "trial-", "profit-", "balance-", "cash-", "ar-aging", "ap-aging", "general-ledger", "party-ledger", "dimension-", "multi-dim-", "comparative-", "tax-summary", "payment-summary", "gl-summary", "lease-", "revenue-", "consolidation-", "standards-", "resolve-", "available-", "search-", "verify-", "validate-", "tutorial", "install-guide", "schema-plan", "schema-drift"];

const DESTRUCTIVE_ACTIONS = new Set(["cleanup-backups", "close-fiscal-year", "delete-credential", "delete-journal-entry", "delete-payment", "delete-putaway-rule", "delete-recurring-template", "delete-tax-template", "import-master-key-from-backup", "install-module", "remove-custom-field", "remove-item-alternative", "remove-module", "restore-database", "rollback-foundation", "schema-apply", "schema-rollback", "update-foundation"]);

export function actionSafety(action: string): ActionSafety {
  if (DESTRUCTIVE_ACTIONS.has(action) || action.startsWith("delete-")) return "destructive";
  if (READ_ONLY_PREFIXES.some((prefix) => action === prefix || action.startsWith(prefix))) return "read";
  return "write";
}

export function actionDomain(action: string): string {
  if (/customer|quotation|sales|invoice|credit-note|dunning|sales-partner/.test(action)) return "Sales";
  if (/supplier|purchase|material-request|rfq|landed-cost|debit-note/.test(action)) return "Buying";
  if (/item|warehouse|stock|batch|serial|pick|reservation|putaway|repack/.test(action)) return "Inventory";
  if (/employee|leave|attendance|shift|salary|payroll|garnishment|department|designation|expense-claim/.test(action)) return "People";
  if (/meter|billing|usage|rate-plan|prepaid|recurring/.test(action)) return "Billing";
  if (/lease|revenue|ic-|intercompany|consolidation|elimination/.test(action)) return "Advanced";
  if (/account|gl-|journal|fiscal|currency|payment|tax|trial|profit|balance|cash|aging|ledger|budget|dimension/.test(action)) return "Finance";
  if (/company|user|role|credential|backup|module|schema|foundation|onboard|initialize/.test(action)) return "Administration";
  return "Other";
}

export function humanizeAction(action: string): string {
  return action.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
