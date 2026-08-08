import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "./theme";

interface Props {
  label: string;
  value: string;
}

export default function StatTile({ label, value }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.panelAlt,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 92,
    flexGrow: 1,
  },
  value: { fontSize: 17, fontWeight: "600", color: colors.text },
  label: { fontSize: 11, color: colors.subtext, marginTop: 2 },
});
