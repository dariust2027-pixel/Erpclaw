import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton, Card, LoadingBlock, StatusPill } from "@/components/erpclaw-ui";
import { ScreenContainer } from "@/components/screen-container";
import { summarize } from "@/lib/offline-erp";
import { useLocalERP } from "@/contexts/local-erp-context";

export default function HomeScreen() {
  const router = useRouter(); const { ledger, loading } = useLocalERP(); const summary = summarize(ledger);
  useEffect(() => { if (!loading && !ledger.company) router.replace("/standalone-onboarding" as never); }, [ledger.company, loading, router]);
  if (loading) return <ScreenContainer><LoadingBlock label="Opening your local ledger…" /></ScreenContainer>; if (!ledger.company) return null;
  const currency = ledger.company.currency;
  return <ScreenContainer className="px-5"><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><View><Text style={styles.eyebrow}>STANDALONE ERP</Text><Text style={styles.title}>{ledger.company.name}</Text></View><StatusPill label="OFFLINE READY" tone="success" /></View><Card><Text style={styles.cardTitle}>Local accounting workspace</Text><Text style={styles.body}>Everything below is stored on this device. There is no connection dependency.</Text></Card><View style={styles.metrics}><Metric label="Sales" value={summary.sales} currency={currency} /><Metric label="Cash" value={summary.cash} currency={currency} /><Metric label="Receivables" value={summary.receivables} currency={currency} /><Metric label="Inventory" value={summary.inventory} currency={currency} /></View><View style={styles.actions}><AppButton title="Add customer" icon="person-add" onPress={() => router.push("/(tabs)/customers" as never)} /><AppButton title="Add item" icon="inventory-2" onPress={() => router.push("/(tabs)/inventory" as never)} tone="secondary" /><AppButton title="Create invoice" icon="receipt-long" onPress={() => router.push("/(tabs)/documents" as never)} tone="secondary" /><AppButton title="View reports" icon="assessment" onPress={() => router.push("/(tabs)/reports" as never)} tone="secondary" /></View></ScrollView></ScreenContainer>;
}
function Metric({ label, value, currency }: { label: string; value: number; currency: string }) { return <Card style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{currency} {value.toFixed(2)}</Text></Card>; }
const styles = StyleSheet.create({ content: { gap: 16, paddingVertical: 22 }, header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", gap: 12 }, eyebrow: { color: "#0D5C5A", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 }, title: { color: "#17201E", fontSize: 27, fontWeight: "800" }, cardTitle: { color: "#17201E", fontSize: 18, fontWeight: "800" }, body: { color: "#64716C", fontSize: 14, lineHeight: 20 }, metrics: { gap: 10 }, metric: { gap: 4 }, metricLabel: { color: "#64716C", fontSize: 13, fontWeight: "700" }, metricValue: { color: "#17201E", fontSize: 21, fontWeight: "800" }, actions: { gap: 10 } });
