import React, { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { useQuery } from "../../context/QueryContext";
import ChartRenderer from "../../components/ChartRenderer";
import { colors, shadow, radius } from "../theme";

interface Props {
  selectedChartId: string | null;
}

export default function ChartsPane({ selectedChartId }: Props) {
  const { filteredResults, charts } = useQuery();
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const config = charts.find((c) => c.id === selectedChartId);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  if (!config) {
    return (
      <View style={styles.root} onLayout={onLayout}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>◱</Text>
          <Text style={styles.emptyTitle}>{charts.length === 0 ? "No charts yet" : "No chart selected"}</Text>
          <Text style={styles.emptyHint}>
            {charts.length === 0
              ? "Use “Add chart” in the panel on the right to create your first chart."
              : "Pick a chart from the list on the right to view it here."}
          </Text>
        </View>
      </View>
    );
  }

  const contentWidth = Math.max(canvasSize.width - 48, 0);
  const contentHeight = Math.max(canvasSize.height - 100, 320);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <View style={styles.card}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {config.title || "Untitled chart"}
        </Text>
        {canvasSize.width > 0 && (
          <ChartRenderer config={config} records={filteredResults} width={contentWidth} height={contentHeight} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  card: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 34, color: colors.border },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  emptyHint: { fontSize: 13, color: colors.subtext, textAlign: "center" },
});
