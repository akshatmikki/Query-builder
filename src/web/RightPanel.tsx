import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { useQuery } from "../context/QueryContext";
import { ChartConfig, ChartType, Aggregation } from "../types";
import FieldDropdownButton from "./FieldDropdownButton";
import ColumnChecklist from "./ColumnChecklist";
import { colors, webTransition } from "./theme";
import PanelSection from "./PanelSection";
import { ReportStatus } from "./panes/ReportPane";
import { getFieldDef, FIELD_SCHEMA } from "../schema";

export type Section = "table" | "charts" | "report";

const CHART_TYPES: ChartType[] = ["bar", "line", "pie", "scatter"];
const AGGS: Aggregation[] = ["sum", "avg", "count", "min", "max"];
const ROW_CAP_CHOICES = [50, 200, 500, 1000];
const CHART_WIDTH_CHOICES: { label: string; value: number }[] = [
  { label: "Small", value: 400 },
  { label: "Medium", value: 600 },
  { label: "Large", value: 800 },
  { label: "XL", value: 1000 },
];
const NUMBER_FIELDS = FIELD_SCHEMA.filter((f) => f.type === "number");

interface Props {
  section: Section;
  density: "comfortable" | "compact";
  onDensityChange: (d: "comfortable" | "compact") => void;
  selectedChartId: string | null;
  rowCap: number;
  onRowCapChange: (n: number) => void;
  includedChartIds: string[];
  onToggleIncludedChart: (id: string) => void;
  chartWidth: number;
  onChartWidthChange: (n: number) => void;
  summaryFields: string[];
  onSummaryFieldsChange: (keys: string[]) => void;
  reportStatus: ReportStatus;
  onGenerate: () => void;
  onExportCsv: () => void;
}

export default function RightPanel({
  section,
  density,
  onDensityChange,
  selectedChartId,
  rowCap,
  onRowCapChange,
  includedChartIds,
  onToggleIncludedChart,
  chartWidth,
  onChartWidthChange,
  summaryFields,
  onSummaryFieldsChange,
  reportStatus,
  onGenerate,
  onExportCsv,
}: Props) {
  const sectionLabel = section === "table" ? "Table view" : section === "charts" ? "Chart editor" : "Report options";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customize</Text>
        <Text style={styles.headerSubtitle}>{sectionLabel}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {section === "table" && (
          <TableCustomization density={density} onDensityChange={onDensityChange} onExportCsv={onExportCsv} />
        )}
        {section === "charts" && <ChartCustomization selectedChartId={selectedChartId} />}
        {section === "report" && (
          <ReportCustomization
            rowCap={rowCap}
            onRowCapChange={onRowCapChange}
            includedChartIds={includedChartIds}
            onToggleIncludedChart={onToggleIncludedChart}
            chartWidth={chartWidth}
            onChartWidthChange={onChartWidthChange}
            summaryFields={summaryFields}
            onSummaryFieldsChange={onSummaryFieldsChange}
            reportStatus={reportStatus}
            onGenerate={onGenerate}
          />
        )}
      </ScrollView>
    </View>
  );
}

function TableCustomization({
  density,
  onDensityChange,
  onExportCsv,
}: {
  density: "comfortable" | "compact";
  onDensityChange: (d: "comfortable" | "compact") => void;
  onExportCsv: () => void;
}) {
  const { filteredResults, tableColumns } = useQuery();
  return (
    <>
      <PanelSection title="Row density" defaultOpen>
        <View style={styles.segmentRow}>
          {(["comfortable", "compact"] as const).map((d) => (
            <Pressable
              key={d}
              style={[styles.segment, density === d && styles.segmentActive]}
              onPress={() => onDensityChange(d)}
            >
              <Text style={[styles.segmentText, density === d && styles.segmentTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </PanelSection>

      <PanelSection title="Export" defaultOpen>
        <Text style={styles.hint}>
          {filteredResults.length} rows × {tableColumns.length} columns
        </Text>
        <Pressable style={styles.primaryBtn} onPress={onExportCsv}>
          <Text style={styles.primaryBtnText}>Export CSV</Text>
        </Pressable>
      </PanelSection>
    </>
  );
}

function ChartCustomization({ selectedChartId }: { selectedChartId: string | null }) {
  const { charts, setCharts } = useQuery();
  const config = charts.find((c) => c.id === selectedChartId);

  if (!config) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>◱</Text>
        <Text style={styles.hint}>Select a chart in the middle panel to edit it.</Text>
      </View>
    );
  }

  const update = (patch: Partial<ChartConfig>) =>
    setCharts(charts.map((c) => (c.id === config.id ? { ...c, ...patch } : c)));

  const deleteChart = () => setCharts(charts.filter((c) => c.id !== config.id));

  return (
    <>
      <PanelSection title="Title" defaultOpen>
        <TextInput
          style={styles.textInput}
          value={config.title}
          onChangeText={(t) => update({ title: t })}
          placeholder="Chart title"
        />
      </PanelSection>

      <PanelSection title="Chart type" defaultOpen>
        <View style={styles.chipRow}>
          {CHART_TYPES.map((t) => (
            <Pressable key={t} style={[styles.chip, config.type === t && styles.chipActive]} onPress={() => update({ type: t })}>
              <Text style={[styles.chipText, config.type === t && styles.chipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </PanelSection>

      <PanelSection title="X field" subtitle="Category or date" defaultOpen>
        <FieldDropdownButton
          label={getFieldDef(config.xField)?.label ?? ""}
          onSelect={(f) => update({ xField: f.key })}
        />
      </PanelSection>

      <PanelSection title="Aggregation" defaultOpen>
        <View style={styles.chipRow}>
          {AGGS.map((a) => (
            <Pressable
              key={a}
              style={[styles.chip, config.aggregation === a && styles.chipActive]}
              onPress={() => update({ aggregation: a })}
            >
              <Text style={[styles.chipText, config.aggregation === a && styles.chipTextActive]}>{a}</Text>
            </Pressable>
          ))}
        </View>
      </PanelSection>

      {config.aggregation !== "count" && (
        <PanelSection title="Y field" subtitle="Numeric" defaultOpen>
          <FieldDropdownButton
            label={getFieldDef(config.yField)?.label ?? ""}
            onSelect={(f) => update({ yField: f.key })}
          />
        </PanelSection>
      )}

      <PanelSection title="Series / group by" subtitle="Optional" defaultOpen>
        <FieldDropdownButton
          label={config.seriesField ? getFieldDef(config.seriesField)?.label ?? "" : ""}
          placeholder="None"
          onSelect={(f) => update({ seriesField: f.key })}
        />
        {config.seriesField && (
          <Pressable onPress={() => update({ seriesField: undefined })}>
            <Text style={styles.link}>Clear series field</Text>
          </Pressable>
        )}
      </PanelSection>

      <Pressable style={styles.dangerBtn} onPress={deleteChart}>
        <Text style={styles.dangerBtnText}>Delete chart</Text>
      </Pressable>
    </>
  );
}

function ReportCustomization({
  rowCap,
  onRowCapChange,
  includedChartIds,
  onToggleIncludedChart,
  chartWidth,
  onChartWidthChange,
  summaryFields,
  onSummaryFieldsChange,
  reportStatus,
  onGenerate,
}: {
  rowCap: number;
  onRowCapChange: (n: number) => void;
  includedChartIds: string[];
  onToggleIncludedChart: (id: string) => void;
  chartWidth: number;
  onChartWidthChange: (n: number) => void;
  summaryFields: string[];
  onSummaryFieldsChange: (keys: string[]) => void;
  reportStatus: ReportStatus;
  onGenerate: () => void;
}) {
  const { charts } = useQuery();
  const configuredCharts = charts.filter((c) => c.xField);

  return (
    <>
      <PanelSection title="Summary fields" subtitle="Numeric fields to summarize (count/sum/avg/min/max)" defaultOpen={false}>
        <ColumnChecklist
          fields={NUMBER_FIELDS}
          selected={summaryFields}
          onChange={onSummaryFieldsChange}
          searchPlaceholder="Search numeric fields..."
        />
      </PanelSection>

      <PanelSection title="Row cap" subtitle="Rows included in the exported table" defaultOpen>
        <View style={styles.chipRow}>
          {ROW_CAP_CHOICES.map((n) => (
            <Pressable key={n} style={[styles.chip, rowCap === n && styles.chipActive]} onPress={() => onRowCapChange(n)}>
              <Text style={[styles.chipText, rowCap === n && styles.chipTextActive]}>{n}</Text>
            </Pressable>
          ))}
        </View>
      </PanelSection>

      <PanelSection title="Charts to include" defaultOpen>
        {configuredCharts.length === 0 && <Text style={styles.hint}>No charts configured yet.</Text>}
        {configuredCharts.map((c) => {
          const active = includedChartIds.includes(c.id);
          return (
            <Pressable key={c.id} style={styles.checkRow} onPress={() => onToggleIncludedChart(c.id)}>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>{active && <Text style={styles.checkmark}>✓</Text>}</View>
              <Text style={styles.checkLabel} numberOfLines={1}>
                {c.title}
              </Text>
            </Pressable>
          );
        })}
      </PanelSection>

      <PanelSection title="Chart size in PDF" subtitle="Width of each chart in the exported report" defaultOpen>
        <View style={styles.chipRow}>
          {CHART_WIDTH_CHOICES.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, chartWidth === opt.value && styles.chipActive]}
              onPress={() => onChartWidthChange(opt.value)}
            >
              <Text style={[styles.chipText, chartWidth === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </PanelSection>

      <Pressable style={styles.primaryBtn} onPress={onGenerate} disabled={reportStatus.generating}>
        {reportStatus.generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Generate report</Text>
        )}
      </Pressable>
      {reportStatus.message && (
        <Text style={[styles.hint, reportStatus.error && { color: colors.danger }]}>{reportStatus.message}</Text>
      )}
    </>
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
  headerSubtitle: { fontSize: 12, color: colors.accent, fontWeight: "700", marginTop: 5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  hint: { fontSize: 12, color: colors.subtext, marginBottom: 8 },
  emptyState: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyStateIcon: { fontSize: 26, color: colors.border },
  link: { color: colors.accent, fontWeight: "600", fontSize: 12, marginTop: 4 },
  segmentRow: { flexDirection: "row", backgroundColor: colors.panelAlt, borderRadius: 8, overflow: "hidden" },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center" },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { fontSize: 12, fontWeight: "600", color: colors.subtext, textTransform: "capitalize" },
  segmentTextActive: { color: "#fff" },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 4,
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    ...webTransition,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  dangerBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 20,
    ...webTransition,
  },
  dangerBtnText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.accent, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 12, ...webTransition },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.accent, fontWeight: "600", fontSize: 12, textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 9, fontSize: 13, backgroundColor: colors.panelAlt },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: "#fff", fontSize: 11, fontWeight: "700" },
  checkLabel: { fontSize: 13, color: colors.text, flexShrink: 1 },
});
