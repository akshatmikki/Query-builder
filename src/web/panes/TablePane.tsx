import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { useQuery } from "../../context/QueryContext";
import { FIELD_SCHEMA, getFieldDef } from "../../schema";
import { OrderRecord } from "../../types";
import { GroupNode, buildGroups } from "../../query/groupRows";
import Dropdown from "../Dropdown";
import FieldPickerContent from "../../components/FieldPickerContent";
import { colors, shadow, radius, webTransition } from "../theme";

const COL_WIDTH = 168;
const ADD_COL_WIDTH = 140;

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

type FlatRow =
  | { kind: "banner"; key: string; level: number; field: string; label: string; count: number }
  | { kind: "data"; key: string; item: OrderRecord; zebra: number };

function flattenGroups(nodes: GroupNode[], collapsed: Set<string>, out: FlatRow[]) {
  nodes.forEach((node) => {
    out.push({ kind: "banner", key: node.path, level: node.level, field: node.field, label: node.label, count: node.rows.length });
    if (collapsed.has(node.path)) return;
    if (node.children && node.children.length) {
      flattenGroups(node.children, collapsed, out);
    } else {
      node.rows.forEach((item, i) => out.push({ kind: "data", key: `${node.path}__${item.orderid ?? i}`, item, zebra: i }));
    }
  });
}

export default function TablePane({ density }: Props) {
  const {
    filteredResults,
    tableColumns: columns,
    setTableColumns,
    groupByFields,
    setGroupByFields,
  } = useQuery();
  const [selectedRow, setSelectedRow] = useState<OrderRecord | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Column drag-to-reorder state (web-only pointer tracking, mirrors Dropdown's
  // approach of attaching listeners directly to the document/window rather than
  // relying on RN's gesture responder system, since this pane is web-only).
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const headerRefs = useRef(new Map<string, any>());
  const overKeyRef = useRef<string | null>(null);

  const rowPad = density === "compact" ? 5 : 10;
  const totalWidth = columns.length * COL_WIDTH;

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

  const grouped = useMemo(() => {
    if (groupByFields.length === 0) return null;
    return buildGroups(sorted, groupByFields, formatCell);
  }, [sorted, groupByFields]);

  const flatData: FlatRow[] = useMemo(() => {
    if (!grouped) {
      return sorted.map((item, i) => ({ kind: "data", key: String(item.orderid ?? i), item, zebra: i }));
    }
    const out: FlatRow[] = [];
    flattenGroups(grouped, collapsedGroups, out);
    return out;
  }, [grouped, sorted, collapsedGroups]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleGroupCollapsed = (label: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  const removeColumn = (key: string) => setTableColumns(columns.filter((k) => k !== key));

  const startDrag = (key: string, e: any) => {
    e.preventDefault?.();
    setDragKey(key);
    setOverKey(key);
    overKeyRef.current = key;
  };

  useEffect(() => {
    if (!dragKey) return;
    const handleMove = (e: PointerEvent) => {
      let closest: string | null = null;
      let closestDist = Infinity;
      headerRefs.current.forEach((node, key) => {
        if (!node?.getBoundingClientRect) return;
        const rect = node.getBoundingClientRect();
        const mid = rect.left + rect.width / 2;
        const dist = Math.abs(e.clientX - mid);
        if (dist < closestDist) {
          closestDist = dist;
          closest = key;
        }
      });
      if (closest) {
        overKeyRef.current = closest;
        setOverKey(closest);
      }
    };
    const handleUp = () => {
      const from = columns.indexOf(dragKey);
      const to = columns.indexOf(overKeyRef.current ?? dragKey);
      if (from !== -1 && to !== -1 && from !== to) {
        const next = [...columns];
        next.splice(from, 1);
        next.splice(to, 0, dragKey);
        setTableColumns(next);
      }
      setDragKey(null);
      setOverKey(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragKey]);

  return (
    <View style={styles.page}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>
          {filteredResults.length.toLocaleString()} row{filteredResults.length === 1 ? "" : "s"} · {columns.length} column
          {columns.length === 1 ? "" : "s"}
          {grouped ? ` · ${grouped.length} group${grouped.length === 1 ? "" : "s"}` : ""}
        </Text>
        {groupByFields.length > 0 && (
          <View style={styles.groupChipRow}>
            {groupByFields.map((f) => (
              <Pressable
                key={f}
                style={styles.groupChip}
                onPress={() => setGroupByFields(groupByFields.filter((k) => k !== f))}
              >
                <Text style={styles.groupChipText} numberOfLines={1}>
                  {getFieldDef(f)?.label ?? f}
                </Text>
                <Text style={styles.groupChipClose}>✕</Text>
              </Pressable>
            ))}
          </View>
        )}
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
                    <View
                      key={c}
                      ref={(node: any) => {
                        if (node) headerRefs.current.set(c, node);
                        else headerRefs.current.delete(c);
                      }}
                      style={[
                        styles.headerCell,
                        { paddingVertical: rowPad },
                        dragKey === c && styles.headerCellDragging,
                        overKey === c && dragKey !== null && dragKey !== c && styles.headerCellDragOver,
                      ]}
                    >
                      <View style={styles.gripHandle} onPointerDown={(e: any) => startDrag(c, e)}>
                        <Text style={styles.gripText}>⠿</Text>
                      </View>
                      <Pressable style={styles.headerLabelBtn} onPress={() => toggleSort(c)}>
                        <Text
                          style={[styles.headerCellText, active && styles.headerCellTextActive]}
                          numberOfLines={1}
                        >
                          {getFieldDef(c)?.label ?? c}
                        </Text>
                        {active && <Text style={styles.sortIcon}>{sortAsc ? "▲" : "▼"}</Text>}
                      </Pressable>
                      <Pressable style={styles.removeColBtn} onPress={() => removeColumn(c)} hitSlop={6}>
                        <Text style={styles.removeColText}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
                <Dropdown
                  width={280}
                  maxHeight={360}
                  trigger={({ onPress, open }) => (
                    <Pressable
                      style={[styles.addColCell, { paddingVertical: rowPad }, open && styles.addColCellOpen]}
                      onPress={onPress}
                    >
                      <Text style={styles.addColText}>+ Add column</Text>
                    </Pressable>
                  )}
                >
                  {({ close }) => (
                    <FieldPickerContent
                      compact
                      autoFocus
                      fields={FIELD_SCHEMA.filter((f) => !columns.includes(f.key))}
                      onSelect={(f) => {
                        setTableColumns([...columns, f.key]);
                        close();
                      }}
                    />
                  )}
                </Dropdown>
              </View>
              <FlatList
                style={{ flex: 1 }}
                data={flatData}
                keyExtractor={(row) => row.key}
                renderItem={({ item }) => {
                  if (item.kind === "banner") {
                    const isCollapsed = collapsedGroups.has(item.key);
                    return (
                      <Pressable
                        style={[
                          styles.groupBanner,
                          { minWidth: totalWidth, paddingLeft: 12 + item.level * 20 },
                          item.level > 0 && styles.groupBannerNested,
                        ]}
                        onPress={() => toggleGroupCollapsed(item.key)}
                      >
                        <View style={styles.groupBannerLeft}>
                          <Text style={styles.groupChevron}>{isCollapsed ? "▸" : "▾"}</Text>
                          <Text
                            style={[styles.groupBannerText, item.level > 0 && styles.groupBannerTextNested]}
                            numberOfLines={1}
                          >
                            {getFieldDef(item.field)?.label ?? item.field}: {item.label}
                          </Text>
                        </View>
                        <Text style={styles.groupBannerCount}>
                          {item.count} row{item.count === 1 ? "" : "s"}
                        </Text>
                      </Pressable>
                    );
                  }
                  const rec = item.item;
                  return (
                    <Pressable
                      style={[
                        styles.dataRow,
                        item.zebra % 2 === 0 && styles.dataRowAlt,
                        hoverKey === item.key && styles.dataRowHover,
                      ]}
                      onPress={() => setSelectedRow(rec)}
                      onHoverIn={() => setHoverKey(item.key)}
                      onHoverOut={() => setHoverKey(null)}
                    >
                      {columns.map((c) => (
                        <View key={c} style={[styles.dataCell, { paddingVertical: rowPad }]}>
                          <Text numberOfLines={1} style={styles.dataCellText}>
                            {formatCell(c, rec[c])}
                          </Text>
                        </View>
                      ))}
                    </Pressable>
                  );
                }}
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
  toolbar: { marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  toolbarText: { fontSize: 12, fontWeight: "600", color: colors.subtext },
  groupChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  groupChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    ...webTransition,
  },
  groupChipText: { fontSize: 12, fontWeight: "700", color: colors.accent, maxWidth: 220 },
  groupChipClose: { fontSize: 11, fontWeight: "700", color: colors.accent },
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
    paddingHorizontal: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    ...webTransition,
  },
  headerCellDragging: { opacity: 0.4 },
  headerCellDragOver: { backgroundColor: colors.accentSoft },
  gripHandle: {
    paddingHorizontal: 2,
    // @ts-ignore web-only cursor + selection hints
    cursor: "grab",
    userSelect: "none",
  } as any,
  gripText: { fontSize: 12, color: colors.subtext },
  headerLabelBtn: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  headerCellText: { fontWeight: "700", fontSize: 11, color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.3 },
  headerCellTextActive: { color: colors.accent },
  sortIcon: { fontSize: 9, color: colors.accent },
  removeColBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
    ...webTransition,
  },
  removeColText: { fontSize: 10, color: colors.danger, fontWeight: "700" },
  addColCell: {
    width: ADD_COL_WIDTH,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderColor: colors.border,
    ...webTransition,
  },
  addColCellOpen: { backgroundColor: colors.accentSoft },
  addColText: { fontSize: 11, fontWeight: "700", color: colors.accent },
  groupBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.accentSoft,
    borderBottomWidth: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...webTransition,
  },
  groupBannerNested: { backgroundColor: colors.panelAlt },
  groupBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  groupChevron: { fontSize: 11, color: colors.accent },
  groupBannerText: { fontSize: 12.5, fontWeight: "700", color: colors.accentDark },
  groupBannerTextNested: { fontSize: 12, fontWeight: "600", color: colors.text },
  groupBannerCount: { fontSize: 11, fontWeight: "600", color: colors.subtext },
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
