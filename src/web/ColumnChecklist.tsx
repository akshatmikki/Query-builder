import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { FIELD_SCHEMA } from "../schema";
import { FieldDef } from "../types";
import { colors } from "./theme";

interface Props {
  selected: string[];
  onChange: (keys: string[]) => void;
  fields?: FieldDef[];
  searchPlaceholder?: string;
}

export default function ColumnChecklist({ selected, onChange, fields = FIELD_SCHEMA, searchPlaceholder = "Search columns..." }: Props) {
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? fields.filter((f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q))
      : fields;
    const byGroup: Record<string, FieldDef[]> = {};
    filtered.forEach((f) => {
      byGroup[f.group] = byGroup[f.group] || [];
      byGroup[f.group].push(f);
    });
    return Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b));
  }, [search, fields]);

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  return (
    <View>
      <TextInput
        placeholder={searchPlaceholder}
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        placeholderTextColor={colors.subtext}
      />
      <View style={styles.selectedRow}>
        <Text style={styles.selectedCount}>{selected.length} selected</Text>
        {selected.length > 0 && (
          <Pressable onPress={() => onChange([])}>
            <Text style={styles.clearLink}>Clear all</Text>
          </Pressable>
        )}
      </View>
      {sections.map(([group, fields]) => (
        <View key={group} style={styles.group}>
          <Text style={styles.groupLabel}>{group}</Text>
          {fields.map((f) => {
            const active = selected.includes(f.key);
            return (
              <Pressable key={f.key} style={styles.row} onPress={() => toggle(f.key)}>
                <View style={[styles.checkbox, active && styles.checkboxActive]}>
                  {active && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    fontSize: 13,
    backgroundColor: colors.panel,
  },
  selectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  selectedCount: { fontSize: 11, color: colors.subtext, fontWeight: "600" },
  clearLink: { fontSize: 11, color: colors.accent, fontWeight: "600" },
  group: { marginBottom: 10 },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: 8,
  },
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
  rowLabel: { fontSize: 13, color: colors.text, flexShrink: 1 },
});
