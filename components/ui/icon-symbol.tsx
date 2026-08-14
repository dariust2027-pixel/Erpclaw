import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
type Map = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>; type Name = keyof typeof MAPPING;
const MAPPING = { "house.fill": "home", "person.2.fill": "people", "cube.box.fill": "inventory-2", "doc.text.fill": "receipt-long", "chart.bar.fill": "bar-chart", "gearshape.fill": "settings", "paperplane.fill": "send", "chevron.left.forwardslash.chevron.right": "code", "chevron.right": "chevron-right" } as Map;
export function IconSymbol({ name, size = 24, color, style }: { name: Name; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) { return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />; }
