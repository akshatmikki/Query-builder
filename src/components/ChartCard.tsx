import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { ChartConfig, Aggregation, ChartType, DateBucket, OrderRecord } from "../types";
import { FIELD_SCHEMA, getFieldDef } from "../schema";
import FieldPicker from "./FieldPicker";
import ChartRenderer from "./ChartRenderer";

const CHART_TYPES: ChartType[] = ["bar", "line", "pie", "scatter"];
const AGGS: Aggregation[] = ["sum", "avg", "count", "min", "max"];
const DATE_BUCKETS: DateBucket[] = ["day", "week", "month", "quarter", "year"];

interface Props {
  config: ChartConfig;
  records: OrderRecord[];
  onChange: (c: ChartConfig) => void;
  onDelete: () => void;
}

export default function ChartCard({ config, records, onChange, onDelete }: Props) {
  const [editing, setEditing] = useState(!config.xField);
  const [pickerFor, setPickerFor] = useState<"x" | "y" | "series" | null>(null);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{config.title || "Untitled chart"}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setEditing(!editing)}>
            <Text style={styles.link}>{editing ? "Done" : "Edit"}</Text>
          </Pressable>
          <Pressable onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>

      <ChartRenderer config={config} records={records} />

      {editing && (
        <View style={styles.editor}>
          <Text style={styles.label}>Chart type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CHART_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, config.type === t && styles.chipActive]}
                onPress={() => onChange({ ...config, type: t })}
              >
                <Text style={[styles.chipText, config.type === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>X field (category / date)</Text>
          <Pressable style={styles.fieldBtn} onPress={() => setPickerFor("x")}>
            <Text>{getFieldDef(config.xField)?.label ?? "Choose field..."}</Text>
          </Pressable>

          {getFieldDef(config.xField)?.type === "date" && (
            <>
              <Text style={styles.label}>Group dates by</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {DATE_BUCKETS.map((b) => (
                  <Pressable
                    key={b}
                    style={[styles.chip, (config.dateBucket ?? "month") === b && styles.chipActive]}
                    onPress={() => onChange({ ...config, dateBucket: b })}
                  >
                    <Text style={[styles.chipText, (config.dateBucket ?? "month") === b && styles.chipTextActive]}>
                      {b}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.label}>Aggregation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {AGGS.map((a) => (
              <Pressable
                key={a}
                style={[styles.chip, config.aggregation === a && styles.chipActive]}
                onPress={() => onChange({ ...config, aggregation: a })}
              >
                <Text style={[styles.chipText, config.aggregation === a && styles.chipTextActive]}>{a}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {config.aggregation !== "count" && (
            <>
              <Text style={styles.label}>Y field (numeric)</Text>
              <Pressable style={styles.fieldBtn} onPress={() => setPickerFor("y")}>
                <Text>{getFieldDef(config.yField)?.label ?? "Choose field..."}</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.label}>Series / group by (optional)</Text>
          <Pressable style={styles.fieldBtn} onPress={() => setPickerFor("series")}>
            <Text>{config.seriesField ? getFieldDef(config.seriesField)?.label : "None"}</Text>
          </Pressable>
          {config.seriesField && (
            <Pressable onPress={() => onChange({ ...config, seriesField: undefined })}>
              <Text style={styles.link}>Clear series field</Text>
            </Pressable>
          )}
        </View>
      )}

      <FieldPicker
        visible={pickerFor === "x"}
        onClose={() => setPickerFor(null)}
        onSelect={(f) => onChange({ ...config, xField: f.key })}
      />
      <FieldPicker
        visible={pickerFor === "y"}
        onClose={() => setPickerFor(null)}
        onSelect={(f) => onChange({ ...config, yField: f.key })}
      />
      <FieldPicker
        visible={pickerFor === "series"}
        onClose={() => setPickerFor(null)}
        onSelect={(f) => onChange({ ...config, seriesField: f.key })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#f7f7f9", borderRadius: 12, padding: 12, marginBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 14 },
  link: { color: "#007aff", fontWeight: "600" },
  deleteText: { color: "#ff3b30", fontWeight: "600" },
  hint: { color: "#999", textAlign: "center", paddingVertical: 40 },
  editor: { marginTop: 8, gap: 4 },
  label: { fontSize: 12, color: "#888", marginTop: 8, fontWeight: "700", textTransform: "uppercase" },
  fieldBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  chipRow: { flexDirection: "row" },
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
});
