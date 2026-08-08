import { StyleSheet } from "react-native";
import { colors } from "./theme";

export const triggerStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 8,
  },
  triggerOpen: { borderColor: colors.accent },
  triggerText: { fontSize: 13, color: colors.text, flexShrink: 1 },
  chevron: { fontSize: 9, color: colors.subtext },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optText: { fontSize: 13, color: colors.text, flexShrink: 1 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel,
  },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
