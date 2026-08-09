import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "../context/QueryContext";
import { ALL_ORDERS, FIELD_SCHEMA, getFieldDef } from "../schema";
import GroupView from "../components/GroupView";
import ColumnChecklist from "./ColumnChecklist";
import FieldDropdownButton from "./FieldDropdownButton";
import PanelSection from "./PanelSection";
import { colors } from "./theme";

export default function LeftPanel() {
  const {
    root,
    setRoot,
    filteredResults,
    resetQuery,
    tableColumns,
    setTableColumns,
    groupByFields,
    setGroupByFields,
  } = useQuery();

  const addGroupField = (key: string) => setGroupByFields([...groupByFields, key]);
  const removeGroupField = (key: string) => setGroupByFields(groupByFields.filter((k) => k !== key));
  const moveGroupField = (from: number, to: number) => {
    if (to < 0 || to >= groupByFields.length) return;
    const next = [...groupByFields];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setGroupByFields(next);
  };
  const availableGroupFields = FIELD_SCHEMA.filter((f) => !groupByFields.includes(f.key));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Query Builder</Text>
        <Text style={styles.matchText}>
          {filteredResults.length} of {ALL_ORDERS.length} orders match
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PanelSection title="Columns" subtitle="Fields shown in the table" defaultOpen={false}>
          <ColumnChecklist selected={tableColumns} onChange={setTableColumns} />
        </PanelSection>

        <PanelSection
          title="Group by"
          subtitle="Nest the table into sections — first field groups outermost"
          defaultOpen={false}
        >
          {groupByFields.length > 0 && (
            <View style={styles.groupList}>
              {groupByFields.map((key, i) => (
                <View key={key} style={styles.groupRow}>
                  <Text style={styles.groupIndex}>{i + 1}</Text>
                  <Text style={styles.groupLabel} numberOfLines={1}>
                    {getFieldDef(key)?.label ?? key}
                  </Text>
                  <Pressable
                    style={styles.groupBtn}
                    onPress={() => moveGroupField(i, i - 1)}
                    disabled={i === 0}
                    hitSlop={4}
                  >
                    <Text style={[styles.groupBtnText, i === 0 && styles.groupBtnTextDisabled]}>▲</Text>
                  </Pressable>
                  <Pressable
                    style={styles.groupBtn}
                    onPress={() => moveGroupField(i, i + 1)}
                    disabled={i === groupByFields.length - 1}
                    hitSlop={4}
                  >
                    <Text
                      style={[
                        styles.groupBtnText,
                        i === groupByFields.length - 1 && styles.groupBtnTextDisabled,
                      ]}
                    >
                      ▼
                    </Text>
                  </Pressable>
                  <Pressable style={styles.groupBtn} onPress={() => removeGroupField(key)} hitSlop={4}>
                    <Text style={styles.groupBtnRemove}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          {availableGroupFields.length > 0 && (
            <FieldDropdownButton
              label=""
              placeholder={groupByFields.length ? "+ Add another level" : "None"}
              fields={availableGroupFields}
              onSelect={(f) => addGroupField(f.key)}
            />
          )}
          {groupByFields.length > 0 && (
            <Pressable onPress={() => setGroupByFields([])} style={{ marginTop: 6 }}>
              <Text style={styles.resetLink}>Clear grouping</Text>
            </Pressable>
          )}
        </PanelSection>

        <PanelSection title="Filters" subtitle="Every rule and operator for this query" defaultOpen>
          <View style={styles.filterHeaderRow}>
            <Pressable onPress={resetQuery}>
              <Text style={styles.resetLink}>Reset all filters</Text>
            </Pressable>
          </View>
          <GroupView group={root} onChange={setRoot} />
        </PanelSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.panel },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.panelAlt,
  },
  title: { fontSize: 14, fontWeight: "800", color: colors.text, textTransform: "uppercase", letterSpacing: 0.4 },
  matchText: { fontSize: 12, color: colors.accent, fontWeight: "700", marginTop: 5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  filterHeaderRow: { alignItems: "flex-end", marginBottom: 6 },
  resetLink: { color: colors.danger, fontSize: 12, fontWeight: "600" },
  groupList: { marginBottom: 8, gap: 6 },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.panelAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  groupIndex: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    backgroundColor: colors.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 16,
  },
  groupLabel: { flex: 1, fontSize: 13, color: colors.text, fontWeight: "600" },
  groupBtn: { paddingHorizontal: 3, paddingVertical: 2 },
  groupBtnText: { fontSize: 10, color: colors.subtext, fontWeight: "700" },
  groupBtnTextDisabled: { opacity: 0.3 },
  groupBtnRemove: { fontSize: 11, color: colors.danger, fontWeight: "700" },
});
