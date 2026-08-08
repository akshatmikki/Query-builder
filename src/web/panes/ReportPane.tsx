import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "../../context/QueryContext";
import { getFieldDef, ALL_ORDERS } from "../../schema";
import { describeGroup, hasActiveFilters } from "../../query/describe";
import ChartRenderer from "../../components/ChartRenderer";
import { buildReportHtml } from "../../report/buildReportHtml";
import { computeFieldSummary } from "../summaryStats";
import { formatCompact } from "../formatNumber";
import StatTile from "../StatTile";
import { colors, shadow, radius } from "../theme";

export interface ReportPaneHandle {
  generate: () => Promise<void>;
}

export interface ReportStatus {
  generating: boolean;
  message?: string;
  error?: boolean;
}

interface Props {
  rowCap: number;
  includedChartIds: string[];
  chartWidth: number;
  summaryFields: string[];
  onStatusChange: (status: ReportStatus) => void;
}

const PREVIEW_ROWS = 15;

// expo-print's web shim ignores the html it's given and just calls
// window.print() on the current document (see ExponentPrint.web.js), which
// prints the whole app instead of the report. Print the report HTML from an
// isolated hidden iframe instead so only that content reaches the printer.
function printReportHtml(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      resolve();
    };

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      cleanup();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    win.onafterprint = cleanup;
    setTimeout(() => {
      win.focus();
      win.print();
      // Some browsers (e.g. Safari) don't fire onafterprint reliably.
      setTimeout(cleanup, 1000);
    }, 150);
  });
}

function formatCell(key: string, value: unknown): string {
  const def = getFieldDef(key);
  if (value === null || value === undefined || value === "") return "—";
  if (def?.type === "date") return new Date(String(value)).toLocaleDateString();
  if (def?.type === "boolean") return value ? "Yes" : "No";
  if (def?.type === "number") return Number(value).toLocaleString();
  return String(value);
}

const ReportPane = forwardRef<ReportPaneHandle, Props>(function ReportPane(
  { rowCap, includedChartIds, chartWidth, summaryFields, onStatusChange },
  ref
) {
  const { root, filteredResults, tableColumns, charts } = useQuery();
  const chartRefs = useRef<Record<string, any>>({});

  const configuredCharts = charts.filter((c) => c.xField);
  const includedCharts = configuredCharts.filter((c) => includedChartIds.includes(c.id));
  const previewRows = filteredResults.slice(0, PREVIEW_ROWS);
  const summaries = summaryFields.map((key) => computeFieldSummary(filteredResults, key, getFieldDef(key)?.label ?? key));

  useImperativeHandle(ref, () => ({
    generate: async () => {
      onStatusChange({ generating: true });
      try {
        const rows = filteredResults.slice(0, rowCap);
        const truncated = filteredResults.length > rowCap;

        const chartBlocks = includedCharts.map((c) => {
          const node = chartRefs.current[c.id];
          const svg = node && node.innerHTML ? node.innerHTML : "";
          return {
            title: c.title,
            html: svg ? svg : `<p style="color:#999">Chart preview unavailable</p>`,
            widthPx: chartWidth,
          };
        });

        const { html } = buildReportHtml({
          filterSummary: describeGroup(root),
          totalMatching: filteredResults.length,
          totalAll: ALL_ORDERS.length,
          columns: tableColumns,
          rows,
          truncated,
          rowCap,
          chartBlocks,
          summaryBlocks: summaries,
        });

        await printReportHtml(html);
        onStatusChange({ generating: false, message: "Print dialog opened — choose “Save as PDF” to export." });
      } catch (e: any) {
        onStatusChange({ generating: false, message: e?.message ?? "Failed to generate report.", error: true });
      }
    },
  }));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.heading}>Report preview</Text>

      <View style={styles.box}>
        <Text style={styles.boxLabel}>Filters</Text>
        <Text style={styles.boxText}>{hasActiveFilters(root) ? describeGroup(root) : "None — full dataset"}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.boxLabel}>Columns ({tableColumns.length})</Text>
        <Text style={styles.boxText}>{tableColumns.map((c) => getFieldDef(c)?.label ?? c).join(", ") || "None selected"}</Text>
      </View>

      <Text style={styles.sectionLabel}>Summary ({summaries.length})</Text>
      {summaries.length === 0 && (
        <Text style={styles.note}>No summary fields selected — add numeric fields to summarize on the right.</Text>
      )}
      {summaries.map((s) => (
        <View key={s.key} style={styles.summaryCard}>
          <Text style={styles.chartTitle}>{s.label}</Text>
          <View style={styles.statRow}>
            <StatTile label="Count" value={s.count.toLocaleString()} />
            <StatTile label="Sum" value={formatCompact(s.sum)} />
            <StatTile label="Average" value={formatCompact(s.avg)} />
            <StatTile label="Min" value={formatCompact(s.min)} />
            <StatTile label="Max" value={formatCompact(s.max)} />
          </View>
        </View>
      ))}

      <Text style={styles.sectionLabel}>Charts included ({includedCharts.length})</Text>
      {includedCharts.length === 0 && (
        <Text style={styles.note}>
          {configuredCharts.length === 0
            ? "No charts configured yet — add one from the Charts view."
            : "No charts checked for inclusion — toggle them on the right."}
        </Text>
      )}
      {includedCharts.map((c) => (
        <View key={c.id} style={[styles.chartCard, { maxWidth: chartWidth + 26 }]}>
          <Text style={styles.chartTitle}>{c.title}</Text>
          {/* Ref wraps only the chart itself — buildReportHtml adds its own
              <h3> title, so capturing the title Text here would duplicate it. */}
          <View ref={(r) => (chartRefs.current[c.id] = r)}>
            <ChartRenderer config={c} records={filteredResults} width={chartWidth} />
          </View>
        </View>
      ))}

      <Text style={styles.sectionLabel}>
        Table preview ({Math.min(previewRows.length, PREVIEW_ROWS)} of {filteredResults.length} rows shown — export
        includes up to {rowCap})
      </Text>
      <ScrollView horizontal style={styles.tableScroll}>
        <View>
          <View style={styles.tableHeaderRow}>
            {tableColumns.map((c) => (
              <Text key={c} style={styles.tableHeaderCell}>
                {getFieldDef(c)?.label ?? c}
              </Text>
            ))}
          </View>
          {previewRows.map((r, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              {tableColumns.map((c) => (
                <Text key={c} style={styles.tableCell} numberOfLines={1}>
                  {formatCell(c, r[c])}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
});

export default ReportPane;

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 60, maxWidth: 780 },
  heading: { fontSize: 19, fontWeight: "800", color: colors.text, marginBottom: 14 },
  box: { backgroundColor: colors.panel, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 12, ...shadow.card },
  boxLabel: { fontSize: 11, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.3 },
  boxText: { fontSize: 14, color: colors.text },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 },
  note: { fontSize: 12, color: colors.subtext, marginBottom: 8 },
  summaryCard: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, marginBottom: 12, ...shadow.card },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chartCard: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, marginBottom: 12, ...shadow.card },
  chartTitle: { fontWeight: "700", marginBottom: 6, color: colors.text },
  tableScroll: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.panel, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: colors.panelAlt },
  tableHeaderCell: { width: 130, padding: 6, fontSize: 11, fontWeight: "700", color: colors.text },
  tableRow: { flexDirection: "row" },
  tableRowAlt: { backgroundColor: colors.panelAlt },
  tableCell: { width: 130, padding: 6, fontSize: 12, color: colors.text },
});
