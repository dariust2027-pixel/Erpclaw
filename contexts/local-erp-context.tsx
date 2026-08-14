import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { emptyLedger, issueInvoice, makeId, money, recordPayment, type LocalCompany, type OfflineLedger } from "@/lib/offline-erp";

const STORAGE_KEY = "erpclaw.standalone.ledger.v1";
type Context = {
  ledger: OfflineLedger; loading: boolean; createCompany: (input: Pick<LocalCompany, "name" | "currency" | "country">) => void;
  addCustomer: (name: string, email?: string) => void; addItem: (sku: string, name: string, quantity: number, unitCost: number) => void;
  addInvoice: (customerId: string, itemId: string, quantity: number, unitPrice: number) => void; issue: (invoiceId: string) => void; pay: (invoiceId: string) => void; reset: () => void;
};
const LocalERPContext = createContext<Context | null>(null);

export function LocalERPProvider({ children }: { children: React.ReactNode }) {
  const [ledger, setLedger] = useState<OfflineLedger>(emptyLedger()); const [loading, setLoading] = useState(true);
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) setLedger(JSON.parse(raw) as OfflineLedger); }).finally(() => setLoading(false)); }, []);
  const change = useCallback((mapper: (current: OfflineLedger) => OfflineLedger) => setLedger((current) => { const next = { ...mapper(current), updatedAt: new Date().toISOString() }; void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; }), []);
  const createCompany = useCallback((input: Pick<LocalCompany, "name" | "currency" | "country">) => change((current) => ({ ...current, company: { id: makeId("company"), ...input, createdAt: new Date().toISOString() } })), [change]);
  const addCustomer = useCallback((name: string, email?: string) => change((current) => ({ ...current, customers: [...current.customers, { id: makeId("customer"), name, email, createdAt: new Date().toISOString() }] })), [change]);
  const addItem = useCallback((sku: string, name: string, quantity: number, unitCost: number) => change((current) => ({ ...current, items: [...current.items, { id: makeId("item"), sku, name, quantity: money(quantity), unitCost: money(unitCost), createdAt: new Date().toISOString() }] })), [change]);
  const addInvoice = useCallback((customerId: string, itemId: string, quantity: number, unitPrice: number) => change((current) => ({ ...current, invoices: [...current.invoices, { id: makeId("invoice"), customerId, itemId, quantity: money(quantity), unitPrice: money(unitPrice), status: "draft", createdAt: new Date().toISOString() }] })), [change]);
  const issue = useCallback((invoiceId: string) => change((current) => issueInvoice(current, invoiceId)), [change]);
  const pay = useCallback((invoiceId: string) => change((current) => recordPayment(current, invoiceId)), [change]);
  const reset = useCallback(() => { const next = emptyLedger(); setLedger(next); void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }, []);
  const value = useMemo(() => ({ ledger, loading, createCompany, addCustomer, addItem, addInvoice, issue, pay, reset }), [ledger, loading, createCompany, addCustomer, addItem, addInvoice, issue, pay, reset]);
  return <LocalERPContext.Provider value={value}>{children}</LocalERPContext.Provider>;
}
export function useLocalERP() { const value = useContext(LocalERPContext); if (!value) throw new Error("useLocalERP must be used inside LocalERPProvider."); return value; }
