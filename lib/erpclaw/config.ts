import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { GatewayConfig } from "./types";

const CONFIG_KEY = "erpclaw.gateway.config.v1";
const TOKEN_KEY = "erpclaw.gateway.token.v1";

async function saveSensitive(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getSensitive(key: string) {
  if (Platform.OS === "web") return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function removeSensitive(key: string) {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadGatewayConfig(): Promise<GatewayConfig | null> {
  const raw = await AsyncStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Omit<GatewayConfig, "token">;
  const token = await getSensitive(TOKEN_KEY);
  return { ...parsed, token: token ?? undefined };
}

export async function saveGatewayConfig(config: GatewayConfig) {
  const { token, ...nonSensitive } = config;
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(nonSensitive));
  if (token) await saveSensitive(TOKEN_KEY, token);
  else await removeSensitive(TOKEN_KEY);
}

export async function clearGatewayConfig() {
  await AsyncStorage.removeItem(CONFIG_KEY);
  await removeSensitive(TOKEN_KEY);
}
