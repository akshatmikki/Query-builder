import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { useQuery } from "../../context/QueryContext";
import { getFieldDef } from "../../schema";
import { OrderRecord } from "../../types";
import { colors, shadow, radius, webTransition } from "../theme";

const COL_WIDTH = 150;

interface Props {
  density: "comfortable" | "compact";
}

function formatCell(key: string, value: unknown) {
  const def = getFieldDef(key);
  if (value === null || value === undefined || value === "") return "—";
  if (def?.type === "date") return new Date(String(value)).toLocaleDateString();
  if (def?.type === "boolean") return value ? "Yes" : "No";
  if (def?.type === "number") return Number(value).toLocaleString();
  return String(value);
}

export default function TablePane({ density }: Props) {
  const { filteredResults, tableColumns: columns } = useQuery();
  const [selectedRow, setSelectedRow] = useState<OrderRecord | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const rowPad = density === "compact" ? 5 : 10;

  const sorted = React.useMemo(() => {
    if (!sortKey) return filteredResults;
    const copy = [...filteredResults];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av === null || av === undefined ? -1 : bv === null || bv === undefined ? 1 : av > bv ? 1 : -1;
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [filteredResults, sortKey, sortAsc]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>
          {filteredResults.length.toLocaleString()} row{filteredResults.length === 1 ? "" : "s"} · {columns.length} column
          {columns.length === 1 ? "" : "s"}
        </Text>
      </View>

      {columns.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>▤</Text>
          <Text style={styles.emptyTitle}>No columns selected</Text>
          <Text style={styles.emptyText}>Open "Columns" on the left sidebar to add fields to this table.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                {columns.map((c) => {
                  const active = sortKey === c;
                  return (
                    <Pressable
                      key={c}
                      style={[styles.headerCell, { paddingVertical: rowPad }]}
                      onPress={() => toggleSort(c)}
                    >
                      <Text style={[styles.headerCellText, active && styles.headerCellTextActive]} numberOfLines={2}>
                        {getFieldDef(c)?.label ?? c}
                      </Text>
                      {active && <Text style={styles.sortIcon}>{sortAsc ? "▲" : "▼"}</Text>}
                    </Pressable>
                  );
                })}
              </View>
              <FlatList
                style={{ flex: 1 }}
                data={sorted}
                keyExtractor={(item, i) => String(item.orderid ?? i)}
                renderItem={({ item, index }) => (
                  <Pressable
                    style={[
                      styles.dataRow,
                      index % 2 === 0 && styles.dataRowAlt,
                      hoverRow === index && styles.dataRowHover,
                    ]}
                    onPress={() => setSelectedRow(item)}
                    onHoverIn={() => setHoverRow(index)}
                    onHoverOut={() => setHoverRow(null)}
                  >
                    {columns.map((c) => (
                      <View key={c} style={[styles.dataCell, { paddingVertical: rowPad }]}>
                        <Text numberOfLines={1} style={styles.dataCellText}>
                          {formatCell(c, item[c])}
                        </Text>
                      </View>
                    ))}
                  </Pressable>
                )}
              />
            </View>
          </ScrollView>
        </View>
      )}

      <Modal visible={!!selectedRow} transparent animationType="fade" onRequestClose={() => setSelectedRow(null)}>
        <Pressable style={styles.overlay} onPress={() => setSelectedRow(null)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Order Detail</Text>
            <ScrollView style={{ maxHeight: 480 }}>
              {selectedRow &&
                Object.entries(selectedRow).map(([k, v]) => (
                  <View key={k} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{getFieldDef(k)?.label ?? k}</Text>
                    <Text style={styles.detailVal}>{formatCell(k, v)}</Text>
                  </View>
                ))}
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setSelectedRow(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  toolbar: { marginBottom: 10 },
  toolbarText: { fontSize: 12, fontWeight: "600", color: colors.subtext },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 4 },
  emptyIcon: { fontSize: 30, color: colors.border, marginBottom: 6 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  emptyText: { color: colors.subtext, textAlign: "center", fontSize: 13, maxWidth: 280 },
  card: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  headerRow: { flexDirection: "row", backgroundColor: colors.panelAlt, borderBottomWidth: 1, borderColor: colors.border },
  headerCell: {
    width: COL_WIDTH,
    paddingHorizontal: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerCellText: { fontWeight: "700", fontSize: 11, color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.3 },
  headerCellTextActive: { color: colors.accent },
  sortIcon: { fontSize: 9, color: colors.accent },
  dataRow: { flexDirection: "row", ...webTransition, transitionDuration: "80ms" },
  dataRowAlt: { backgroundColor: colors.panelAlt },
  dataRowHover: { backgroundColor: colors.accentSoft },
  dataCell: { width: COL_WIDTH, paddingHorizontal: 10, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  dataCellText: { fontSize: 13, color: colors.text },
  overlay: { flex: 1, backgroundColor: "rgba(20,22,26,0.4)", alignItems: "center", justifyContent: "center", padding: 20 },
  dialog: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: 20, width: 480, maxWidth: "100%", ...shadow.card, shadowOpacity: 0.25 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: colors.text },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 12,
  },
  detailKey: { color: colors.subtext, flex: 1 },
  detailVal: { flex: 1, textAlign: "right", color: colors.text },
  closeBtn: { paddingVertical: 12, alignItems: "center", marginTop: 6 },
  closeText: { color: colors.accent, fontWeight: "600" },
});
