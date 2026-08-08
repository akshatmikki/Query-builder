import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "../context/QueryContext";
import { ALL_ORDERS } from "../schema";
import GroupView from "../components/GroupView";
import ColumnChecklist from "./ColumnChecklist";
import PanelSection from "./PanelSection";
import { colors } from "./theme";

export default function LeftPanel() {
  const { root, setRoot, filteredResults, resetQuery, tableColumns, setTableColumns } = useQuery();

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
});
