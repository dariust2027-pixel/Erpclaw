import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HybridERPProvider } from "@/contexts/hybrid-erp-context";
import { ThemeProvider } from "@/lib/theme-provider";

export default function RootLayout() { return <SafeAreaProvider><ThemeProvider><HybridERPProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="hybrid-onboarding" options={{ presentation: "modal" }} /><Stack.Screen name="hybrid-connect" options={{ presentation: "modal" }} /></Stack></HybridERPProvider></ThemeProvider></SafeAreaProvider>; }
