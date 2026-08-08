import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useQuery, newChart } from "../context/QueryContext";
import { ChartConfig } from "../types";
import ChartCard from "../components/ChartCard";

export default function ChartsScreen() {
  const { filteredResults, charts, setCharts } = useQuery();

  const updateChart = (id: string, c: ChartConfig) =>
    setCharts(charts.map((ch) => (ch.id === id ? c : ch)));

  const deleteChart = (id: string) => setCharts(charts.filter((ch) => ch.id !== id));

  const addChart = () => setCharts([...charts, newChart(charts.length + 1)]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Charts</Text>
        <Text style={styles.subtitle}>{filteredResults.length} orders in view</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {charts.map((c) => (
          <ChartCard
            key={c.id}
            config={c}
            records={filteredResults}
            onChange={(updated) => updateChart(c.id, updated)}
            onDelete={() => deleteChart(c.id)}
          />
        ))}
        <Pressable style={styles.addBtn} onPress={addChart}>
          <Text style={styles.addText}>+ Add chart</Text>
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
  addBtn: {
    borderWidth: 1,
    borderColor: "#007aff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  addText: { color: "#007aff", fontWeight: "700" },
});
