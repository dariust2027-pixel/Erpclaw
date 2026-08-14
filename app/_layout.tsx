import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ERPClawProvider } from "@/contexts/erpclaw-context";
import { ThemeProvider } from "@/lib/theme-provider";

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><ERPClawProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="connect" options={{ gestureEnabled: false }} /><Stack.Screen name="onboarding" options={{ presentation: "modal" }} /><Stack.Screen name="action/[name]" options={{ presentation: "card" }} /><Stack.Screen name="result" options={{ presentation: "modal" }} /></Stack></ERPClawProvider></ThemeProvider></SafeAreaProvider>;
}
