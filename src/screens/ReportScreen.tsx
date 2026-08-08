import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

import { useQuery } from "../context/QueryContext";
import { getFieldDef, ALL_ORDERS, FIELD_SCHEMA } from "../schema";
import { describeGroup, hasActiveFilters } from "../query/describe";
import ChartRenderer from "../components/ChartRenderer";
import { buildReportHtml } from "../report/buildReportHtml";
import { computeFieldSummary } from "../web/summaryStats";

const MAX_TABLE_ROWS = 200;
const NUMERIC_FIELDS = FIELD_SCHEMA.filter((f) => f.type === "number");

export default function ReportScreen() {
  const { root, filteredResults, tableColumns, charts } = useQuery();
  const [generating, setGenerating] = useState(false);
  const shotRefs = useRef<(ViewShot | null)[]>([]);

  const configuredCharts = charts.filter((c) => c.xField);
  const [includedChartIds, setIncludedChartIds] = useState<string[]>([]);
  const [summaryFields, setSummaryFields] = useState<string[]>([]);

  // Keep the include-set in sync as charts are added/removed elsewhere in the app.
  const knownChartIds = configuredCharts.map((c) => c.id).join(",");
  React.useEffect(() => {
    setIncludedChartIds(configuredCharts.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownChartIds]);

  const toggleChart = (id: string) => {
    setIncludedChartIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };
  const toggleSummaryField = (key: string) => {
    setSummaryFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const chartImages: { title: string; dataUri: string }[] = [];
      for (let i = 0; i < configuredCharts.length; i++) {
        const chart = configuredCharts[i];
        if (!includedChartIds.includes(chart.id)) continue;
        const ref = shotRefs.current[i];
        if (!ref?.capture) continue;
        const uri = await ref.capture();
        // capture() returns a local file path; read+inline as base64 data URI so it's
        // portable inside the standalone HTML passed to Print.
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        chartImages.push({ title: chart.title, dataUri: `data:image/png;base64,${base64}` });
      }

      const truncated = filteredResults.length > MAX_TABLE_ROWS;
      const rows = filteredResults.slice(0, MAX_TABLE_ROWS);
      const summaryBlocks = summaryFields.map((key) =>
        computeFieldSummary(filteredResults, key, getFieldDef(key)?.label ?? key)
      );

      const { html, orientation } = buildReportHtml({
        filterSummary: describeGroup(root),
        totalMatching: filteredResults.length,
        totalAll: ALL_ORDERS.length,
        columns: tableColumns,
        rows,
        truncated,
        rowCap: MAX_TABLE_ROWS,
        chartBlocks: chartImages.map((c) => ({
          title: c.title,
          html: `<img src="${c.dataUri}" style="width:100%;max-width:600px;" />`,
        })),
        summaryBlocks,
      });

      // printToFileAsync has no orientation flag — swap the US Letter page
      // dimensions to get the same effect for wide (landscape) tables.
      const { uri } = await Print.printToFileAsync({
        html,
        width: orientation === "landscape" ? 792 : 612,
        height: orientation === "landscape" ? 612 : 792,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        Alert.alert("PDF generated", `Saved to: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert("Report failed", e?.message ?? "Something went wrong generating the PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Report</Text>
        <Text style={styles.subtitle}>{filteredResults.length} orders in current query</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Filters</Text>
          <Text style={styles.summaryText}>
            {hasActiveFilters(root) ? describeGroup(root) : "None — full dataset"}
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Table columns</Text>
          <Text style={styles.summaryText}>
            {tableColumns.map((c) => getFieldDef(c)?.label ?? c).join(", ")}
          </Text>
          {filteredResults.length > MAX_TABLE_ROWS && (
            <Text style={styles.note}>
              PDF table will be capped at {MAX_TABLE_ROWS} rows (of {filteredResults.length}).
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Summary fields</Text>
        {NUMERIC_FIELDS.length === 0 && <Text style={styles.note}>No numeric fields available to summarize.</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {NUMERIC_FIELDS.map((f) => {
            const active = summaryFields.includes(f.key);
            return (
              <Pressable
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleSummaryField(f.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Charts included ({includedChartIds.length} of {configuredCharts.length})</Text>
        {configuredCharts.length === 0 && (
          <Text style={styles.note}>No charts configured yet — add fields to charts in the Charts tab to include them.</Text>
        )}

        {configuredCharts.map((c, i) => {
          const included = includedChartIds.includes(c.id);
          return (
            <View key={c.id} style={styles.shotCard}>
              <Pressable style={styles.chartHeaderRow} onPress={() => toggleChart(c.id)}>
                <View style={[styles.checkbox, included && styles.checkboxChecked]}>
                  {included && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.chartTitle}>{c.title}</Text>
              </Pressable>
              {/* Ref wraps only the chart, not the title — buildReportHtml adds its
                  own heading, so capturing the title here would duplicate it. */}
              <ViewShot ref={(r) => (shotRefs.current[i] = r)} options={{ format: "png", quality: 0.9 }}>
                <ChartRenderer config={c} records={filteredResults} />
              </ViewShot>
            </View>
          );
        })}

        <Pressable style={styles.generateBtn} onPress={handleGenerate} disabled={generating}>
          {generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateText}>Generate & Share PDF</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#888" },
  scroll: { padding: 16, paddingBottom: 60 },
  summaryBox: { backgroundColor: "#f7f7f9", borderRadius: 10, padding: 12, marginBottom: 12 },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", marginBottom: 4 },
  summaryText: { fontSize: 14 },
  note: { fontSize: 12, color: "#999", marginTop: 6 },
  sectionLabel: { fontSize: 14, fontWeight: "700", marginTop: 8, marginBottom: 8 },
  shotCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 10, marginBottom: 12 },
  chartTitle: { fontWeight: "700", marginBottom: 6 },
  chartHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#bbb",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#007aff", borderColor: "#007aff" },
  checkboxMark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  chipRow: { flexDirection: "row", marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#007aff",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#007aff" },
  chipText: { color: "#007aff", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  generateBtn: {
    backgroundColor: "#007aff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  generateText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
