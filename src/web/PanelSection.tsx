import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "./theme";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function PanelSection({ title, subtitle, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.container}>
      <Pressable style={({ hovered }: any) => [styles.header, hovered && styles.headerHovered]} onPress={() => setOpen(!open)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>▸</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  header: { flexDirection: "row", alignItems: "center", borderRadius: 6, marginHorizontal: -6, paddingHorizontal: 6, paddingVertical: 2 },
  headerHovered: { backgroundColor: colors.panelAlt },
  title: { fontSize: 12.5, fontWeight: "700", color: colors.text, textTransform: "uppercase", letterSpacing: 0.4 },
  subtitle: { fontSize: 11, color: colors.subtext, marginTop: 2 },
  chevron: { fontSize: 11, color: colors.subtext, fontWeight: "700", paddingHorizontal: 4 },
  chevronOpen: { transform: [{ rotate: "90deg" }] },
  body: { marginTop: 10 },
});
