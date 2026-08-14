import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocalERPProvider } from "@/contexts/local-erp-context";
import { ThemeProvider } from "@/lib/theme-provider";
export default function RootLayout() { return <SafeAreaProvider><ThemeProvider><LocalERPProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="standalone-onboarding" options={{ presentation: "modal" }} /></Stack></LocalERPProvider></ThemeProvider></SafeAreaProvider>; }
