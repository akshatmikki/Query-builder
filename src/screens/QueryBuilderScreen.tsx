import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useQuery } from "../context/QueryContext";
import GroupView from "../components/GroupView";
import { ALL_ORDERS } from "../schema";

export default function QueryBuilderScreen() {
  const { root, setRoot, filteredResults, resetQuery } = useQuery();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Query Builder</Text>
        <Pressable onPress={resetQuery}>
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      </View>
      <View style={styles.resultBanner}>
        <Text style={styles.resultText}>
          {filteredResults.length} of {ALL_ORDERS.length} orders match
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GroupView group={root} onChange={setRoot} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: { fontSize: 22, fontWeight: "800" },
  reset: { color: "#ff3b30", fontWeight: "600" },
  resultBanner: {
    backgroundColor: "#eaf3ff",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  resultText: { color: "#007aff", fontWeight: "700", textAlign: "center" },
  scroll: { padding: 16, paddingBottom: 60 },
});
