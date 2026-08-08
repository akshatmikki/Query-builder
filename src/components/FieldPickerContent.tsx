import React, { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, SectionList } from "react-native";
import { FIELD_SCHEMA } from "../schema";
import { FieldDef } from "../types";

interface Props {
  onSelect: (field: FieldDef) => void;
  autoFocus?: boolean;
  compact?: boolean;
}

export default function FieldPickerContent({ onSelect, autoFocus = true, compact = false }: Props) {
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? FIELD_SCHEMA.filter(
          (f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
        )
      : FIELD_SCHEMA;

    const byGroup: Record<string, FieldDef[]> = {};
    filtered.forEach((f) => {
      byGroup[f.group] = byGroup[f.group] || [];
      byGroup[f.group].push(f);
    });
    return Object.entries(byGroup)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [search]);

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      <TextInput
        placeholder="Search fields..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        autoFocus={autoFocus}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        style={compact ? styles.compactList : undefined}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onSelect(item)}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.type}>{item.type}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: "#fff" },
  compactContainer: { padding: 10 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  compactList: { maxHeight: 280 },
  sectionHeader: {
    fontWeight: "700",
    fontSize: 12,
    color: "#888",
    backgroundColor: "#fff",
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    gap: 8,
  },
  label: { fontSize: 14, flexShrink: 1 },
  type: { fontSize: 11, color: "#999" },
});
