import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useQuery, newChart } from "../../context/QueryContext";
import ChartRenderer from "../../components/ChartRenderer";
import { colors, shadow, radius, webTransition } from "../theme";

interface Props {
  selectedChartId: string | null;
  onSelectChart: (id: string) => void;
}

export default function ChartsPane({ selectedChartId, onSelectChart }: Props) {
  const { filteredResults, charts, setCharts } = useQuery();
  const { width } = useWindowDimensions();
  const cardWidth = width >= 1500 ? 460 : width >= 1100 ? 380 : "100%";
  const [hoverId, setHoverId] = useState<string | null>(null);

  const addChart = () => {
    const c = newChart(charts.length + 1);
    setCharts([...charts, c]);
    onSelectChart(c.id);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.grid}>
        {charts.map((c) => {
          const active = c.id === selectedChartId;
          const hovered = hoverId === c.id;
          return (
            <Pressable
              key={c.id}
              style={[
                styles.card,
                { width: cardWidth as any },
                (hovered || active) && shadow.card,
                active && styles.cardActive,
              ]}
              onPress={() => onSelectChart(c.id)}
              onHoverIn={() => setHoverId(c.id)}
              onHoverOut={() => setHoverId(null)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {c.title || "Untitled chart"}
                </Text>
                {active && <Text style={styles.editingTag}>Editing</Text>}
              </View>
              <ChartRenderer config={c} records={filteredResults} width={typeof cardWidth === "number" ? cardWidth - 24 : undefined} />
            </Pressable>
          );
        })}
        <Pressable style={[styles.addCard, { width: cardWidth as any }]} onPress={addChart}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addText}>Add chart</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...webTransition,
  },
  cardActive: { borderColor: colors.accent },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
  editingTag: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: colors.accent,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  addCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.accent,
    borderRadius: radius.lg,
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    gap: 4,
    ...webTransition,
  },
  addIcon: { color: colors.accent, fontWeight: "700", fontSize: 22, lineHeight: 22 },
  addText: { color: colors.accent, fontWeight: "700", fontSize: 13 },
});
