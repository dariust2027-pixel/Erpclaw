export type LocalCompany = { id: string; name: string; currency: string; country: string; createdAt: string };
export type LocalCustomer = { id: string; name: string; email?: string; createdAt: string };
export type LocalItem = { id: string; sku: string; name: string; quantity: number; unitCost: number; createdAt: string };
export type LocalInvoice = { id: string; customerId: string; itemId: string; quantity: number; unitPrice: number; status: "draft" | "issued" | "paid"; createdAt: string; issuedAt?: string; paidAt?: string };
export type LocalJournal = { id: string; date: string; reference: string; account: "Cash" | "Accounts Receivable" | "Sales" | "Inventory"; debit: number; credit: number; memo: string };
export type OfflineLedger = { version: 1; company?: LocalCompany; customers: LocalCustomer[]; items: LocalItem[]; invoices: LocalInvoice[]; journals: LocalJournal[]; updatedAt: string };

export const emptyLedger = (): OfflineLedger => ({ version: 1, customers: [], items: [], invoices: [], journals: [], updatedAt: new Date().toISOString() });
export const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
export const money = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
export const invoiceTotal = (invoice: LocalInvoice) => money(invoice.quantity * invoice.unitPrice);

export function issueInvoice(ledger: OfflineLedger, invoiceId: string): OfflineLedger {
  const invoice = ledger.invoices.find((entry) => entry.id === invoiceId);
  if (!invoice || invoice.status !== "draft") return ledger;
  const item = ledger.items.find((entry) => entry.id === invoice.itemId);
  if (!item || item.quantity < invoice.quantity) throw new Error("Not enough local stock to issue this invoice.");
  const total = invoiceTotal(invoice); const now = new Date().toISOString();
  return {
    ...ledger,
    updatedAt: now,
    items: ledger.items.map((entry) => entry.id === item.id ? { ...entry, quantity: money(entry.quantity - invoice.quantity) } : entry),
    invoices: ledger.invoices.map((entry) => entry.id === invoice.id ? { ...entry, status: "issued", issuedAt: now } : entry),
    journals: [...ledger.journals,
      { id: makeId("je"), date: now, reference: invoice.id, account: "Accounts Receivable", debit: total, credit: 0, memo: "Invoice issued" },
      { id: makeId("je"), date: now, reference: invoice.id, account: "Sales", debit: 0, credit: total, memo: "Invoice issued" },
    ],
  };
}

export function recordPayment(ledger: OfflineLedger, invoiceId: string): OfflineLedger {
  const invoice = ledger.invoices.find((entry) => entry.id === invoiceId);
  if (!invoice || invoice.status !== "issued") return ledger;
  const total = invoiceTotal(invoice); const now = new Date().toISOString();
  return {
    ...ledger,
    updatedAt: now,
    invoices: ledger.invoices.map((entry) => entry.id === invoice.id ? { ...entry, status: "paid", paidAt: now } : entry),
    journals: [...ledger.journals,
      { id: makeId("je"), date: now, reference: invoice.id, account: "Cash", debit: total, credit: 0, memo: "Payment received" },
      { id: makeId("je"), date: now, reference: invoice.id, account: "Accounts Receivable", debit: 0, credit: total, memo: "Payment received" },
    ],
  };
}

export function summarize(ledger: OfflineLedger) {
  const invoices = ledger.invoices.filter((invoice) => invoice.status !== "draft");
  const sales = money(invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0));
  const receivables = money(ledger.invoices.filter((invoice) => invoice.status === "issued").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0));
  const cash = money(ledger.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0));
  const inventory = money(ledger.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0));
  return { sales, receivables, cash, inventory, journalEntries: ledger.journals.length };
}
