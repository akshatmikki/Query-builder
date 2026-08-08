import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { useQuery } from "../context/QueryContext";
import { FIELD_SCHEMA, getFieldDef } from "../schema";
import { OrderRecord } from "../types";

const COL_WIDTH = 130;

export default function TableScreen() {
  const { filteredResults, tableColumns: columns, setTableColumns: setColumns } = useQuery();
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<OrderRecord | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

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

  const formatCell = (key: string, value: unknown) => {
    const def = getFieldDef(key);
    if (value === null || value === undefined || value === "") return "—";
    if (def?.type === "date") return new Date(String(value)).toLocaleDateString();
    if (def?.type === "boolean") return value ? "Yes" : "No";
    if (def?.type === "number") return Number(value).toLocaleString();
    return String(value);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Table</Text>
        <Text style={styles.subtitle}>{filteredResults.length} rows</Text>
        <Pressable style={styles.colBtn} onPress={() => setColumnPickerOpen(true)}>
          <Text style={styles.colBtnText}>Columns</Text>
        </Pressable>
      </View>

      <ScrollView horizontal>
        <View>
          <View style={styles.headerRow}>
            {columns.map((c) => (
              <Pressable key={c} style={styles.headerCell} onPress={() => toggleSort(c)}>
                <Text style={styles.headerCellText} numberOfLines={2}>
                  {getFieldDef(c)?.label ?? c} {sortKey === c ? (sortAsc ? "▲" : "▼") : ""}
                </Text>
              </Pressable>
            ))}
          </View>
          <FlatList
            data={sorted}
            keyExtractor={(item, i) => String(item.orderid ?? i)}
            renderItem={({ item, index }) => (
              <Pressable
                style={[styles.dataRow, index % 2 === 0 && styles.dataRowAlt]}
                onPress={() => setSelectedRow(item)}
              >
                {columns.map((c) => (
                  <View key={c} style={styles.dataCell}>
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

      {/* Column picker */}
      <Modal visible={columnPickerOpen} animationType="slide" onRequestClose={() => setColumnPickerOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <Text style={styles.modalTitle}>Columns</Text>
          <FlatList
            data={FIELD_SCHEMA}
            keyExtractor={(f) => f.key}
            renderItem={({ item }) => {
              const active = columns.includes(item.key);
              return (
                <Pressable
                  style={styles.colRow}
                  onPress={() =>
                    setColumns(
                      active ? columns.filter((k) => k !== item.key) : [...columns, item.key]
                    )
                  }
                >
                  <Text>{item.label}</Text>
                  <Text style={{ color: active ? "#007aff" : "#ccc" }}>{active ? "✓" : ""}</Text>
                </Pressable>
              );
            }}
          />
          <Pressable style={styles.closeBtn} onPress={() => setColumnPickerOpen(false)}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* Row detail */}
      <Modal visible={!!selectedRow} animationType="slide" onRequestClose={() => setSelectedRow(null)}>
        <SafeAreaView style={styles.modalSafe}>
          <Text style={styles.modalTitle}>Order Detail</Text>
          <FlatList
            data={selectedRow ? Object.entries(selectedRow) : []}
            keyExtractor={([k]) => k}
            renderItem={({ item: [k, v] }) => (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>{getFieldDef(k)?.label ?? k}</Text>
                <Text style={styles.detailVal}>{formatCell(k, v)}</Text>
              </View>
            )}
          />
          <Pressable style={styles.closeBtn} onPress={() => setSelectedRow(null)}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#888" },
  colBtn: { backgroundColor: "#007aff", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  colBtnText: { color: "#fff", fontWeight: "600" },
  headerRow: { flexDirection: "row", backgroundColor: "#f2f2f4" },
  headerCell: { width: COL_WIDTH, padding: 8, borderRightWidth: StyleSheet.hairlineWidth, borderColor: "#ddd" },
  headerCellText: { fontWeight: "700", fontSize: 12 },
  dataRow: { flexDirection: "row" },
  dataRowAlt: { backgroundColor: "#fafafa" },
  dataCell: { width: COL_WIDTH, padding: 8, borderRightWidth: StyleSheet.hairlineWidth, borderColor: "#eee" },
  dataCellText: { fontSize: 13 },
  modalSafe: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  colRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  detailKey: { color: "#888", flex: 1 },
  detailVal: { flex: 1, textAlign: "right" },
  closeBtn: { paddingVertical: 14, alignItems: "center" },
  closeText: { color: "#007aff", fontWeight: "600" },
});
