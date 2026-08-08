import React, { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery } from "../context/QueryContext";
import { ALL_ORDERS } from "../schema";
import LeftPanel from "./LeftPanel";
import RightPanel, { Section } from "./RightPanel";
import TablePane from "./panes/TablePane";
import ChartsPane from "./panes/ChartsPane";
import ReportPane, { ReportPaneHandle, ReportStatus } from "./panes/ReportPane";
import Drawer from "./Drawer";
import { useLayoutMode } from "./useLayoutMode";
import { colors, shadow, webTransition, LEFT_WIDTH, RIGHT_WIDTH } from "./theme";
import { downloadCsv } from "./exportCsv";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "table", label: "Table" },
  { key: "charts", label: "Charts" },
  { key: "report", label: "Report" },
];

export default function WebAppShell() {
  const { filteredResults, charts, tableColumns, resetQuery } = useQuery();
  const layout = useLayoutMode();

  const [section, setSection] = useState<Section>("table");
  const [selectedChartId, setSelectedChartId] = useState<string | null>(charts[0]?.id ?? null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [rowCap, setRowCap] = useState(200);
  const [chartWidth, setChartWidth] = useState(600);
  const [summaryFields, setSummaryFields] = useState<string[]>([]);
  const [excludedChartIds, setExcludedChartIds] = useState<string[]>([]);
  const [reportStatus, setReportStatus] = useState<ReportStatus>({ generating: false });
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const reportRef = useRef<ReportPaneHandle>(null);

  const includedChartIds = charts.filter((c) => c.xField && !excludedChartIds.includes(c.id)).map((c) => c.id);
  const toggleIncludedChart = (id: string) =>
    setExcludedChartIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const showLeftDocked = layout === "wide" || layout === "medium";
  const showRightDocked = layout === "wide";

  const rightPanelEl = (
    <RightPanel
      section={section}
      density={density}
      onDensityChange={setDensity}
      selectedChartId={selectedChartId}
      rowCap={rowCap}
      onRowCapChange={setRowCap}
      includedChartIds={includedChartIds}
      onToggleIncludedChart={toggleIncludedChart}
      chartWidth={chartWidth}
      onChartWidthChange={setChartWidth}
      summaryFields={summaryFields}
      onSummaryFieldsChange={setSummaryFields}
      reportStatus={reportStatus}
      onGenerate={() => reportRef.current?.generate()}
      onExportCsv={() => downloadCsv(filteredResults, tableColumns)}
    />
  );

  const leftPanelEl = <LeftPanel />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!showLeftDocked && (
            <Pressable style={styles.iconBtn} onPress={() => setLeftOpen(true)}>
              <Text style={styles.iconBtnText}>☰</Text>
            </Pressable>
          )}
          <View style={styles.brandRow}>
            <View style={styles.brandMark} />
            <Text style={styles.brand}>Order Query Studio</Text>
          </View>
        </View>

        <View style={styles.segmentGroup}>
          {SECTIONS.map((s) => (
            <Pressable
              key={s.key}
              style={[styles.segment, section === s.key && styles.segmentActive]}
              onPress={() => setSection(s.key)}
            >
              <Text style={[styles.segmentText, section === s.key && styles.segmentTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.matchBadge}>
            {filteredResults.length} / {ALL_ORDERS.length} orders
          </Text>
          <Pressable onPress={resetQuery} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          {!showRightDocked && (
            <Pressable style={styles.iconBtn} onPress={() => setRightOpen(true)}>
              <Text style={styles.iconBtnText}>⚙</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {showLeftDocked && <View style={[styles.leftDock, { width: LEFT_WIDTH }]}>{leftPanelEl}</View>}

        <View style={styles.middle}>
          {section === "table" && <TablePane density={density} />}
          {section === "charts" && <ChartsPane selectedChartId={selectedChartId} onSelectChart={setSelectedChartId} />}
          {section === "report" && (
            <ReportPane
              ref={reportRef}
              rowCap={rowCap}
              includedChartIds={includedChartIds}
              chartWidth={chartWidth}
              summaryFields={summaryFields}
              onStatusChange={setReportStatus}
            />
          )}
        </View>

        {showRightDocked && <View style={[styles.rightDock, { width: RIGHT_WIDTH }]}>{rightPanelEl}</View>}
      </View>

      {!showLeftDocked && (
        <Drawer visible={leftOpen} onClose={() => setLeftOpen(false)} side="left" width={LEFT_WIDTH}>
          {leftPanelEl}
        </Drawer>
      )}
      {!showRightDocked && (
        <Drawer visible={rightOpen} onClose={() => setRightOpen(false)} side="right" width={RIGHT_WIDTH}>
          {rightPanelEl}
        </Drawer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, position: "relative" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    height: 58,
    backgroundColor: colors.panel,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    zIndex: 10,
    ...shadow.header,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.accent,
    // @ts-ignore web-only gradient
    backgroundImage: `linear-gradient(135deg, ${colors.accent}, #00c2ff)`,
  },
  brand: { fontSize: 15, fontWeight: "800", color: colors.text, letterSpacing: 0.1 },
  iconBtn: { padding: 7, borderRadius: 8, backgroundColor: colors.panelAlt, ...webTransition },
  iconBtnText: { fontSize: 15, color: colors.text },
  segmentGroup: { flexDirection: "row", backgroundColor: colors.panelAlt, borderRadius: 9, padding: 3 },
  segment: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 7, ...webTransition },
  segmentActive: { backgroundColor: colors.accent, ...shadow.card, shadowOpacity: 0.18, shadowRadius: 8 },
  segmentText: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  segmentTextActive: { color: "#fff" },
  matchBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 20,
  },
  resetBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: "#fff1f0", ...webTransition },
  resetText: { color: colors.danger, fontWeight: "700", fontSize: 12 },
  body: { flex: 1, flexDirection: "row" },
  leftDock: { borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.panel, ...shadow.panel },
  rightDock: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    ...shadow.panel,
    shadowOffset: { width: -2, height: 0 },
  },
  middle: { flex: 1, backgroundColor: colors.bg },
});
