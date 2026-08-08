import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Group, Rule } from "../types";
import RuleRow from "./RuleRow";

interface Props {
  group: Group;
  onChange: (g: Group) => void;
  onDelete?: () => void;
  depth?: number;
}

export default function GroupView({ group, onChange, onDelete, depth = 0 }: Props) {
  const updateChild = (index: number, child: Rule | Group) => {
    const children = [...group.children];
    children[index] = child;
    onChange({ ...group, children });
  };

  const removeChild = (index: number) => {
    const children = group.children.filter((_, i) => i !== index);
    onChange({ ...group, children });
  };

  const addRule = () => {
    const newRule: Rule = { kind: "rule", id: uuidv4(), field: "", operator: "", value: undefined };
    onChange({ ...group, children: [...group.children, newRule] });
  };

  const addGroup = () => {
    const newGroup: Group = { kind: "group", id: uuidv4(), combinator: "AND", children: [] };
    onChange({ ...group, children: [...group.children, newGroup] });
  };

  return (
    <View style={[styles.container, depth > 0 && styles.nested]}>
      <View style={styles.topRow}>
        <View style={styles.combinatorSwitch}>
          {(["AND", "OR"] as const).map((c) => (
            <Pressable
              key={c}
              style={[styles.combBtn, group.combinator === c && styles.combBtnActive]}
              onPress={() => onChange({ ...group, combinator: c })}
            >
              <Text style={[styles.combText, group.combinator === c && styles.combTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
        {onDelete && (
          <Pressable onPress={onDelete} style={styles.deleteGroupBtn}>
            <Text style={styles.deleteText}>Remove group ✕</Text>
          </Pressable>
        )}
      </View>

      {group.children.map((child, i) =>
        child.kind === "rule" ? (
          <RuleRow
            key={child.id}
            rule={child}
            onChange={(r) => updateChild(i, r)}
            onDelete={() => removeChild(i)}
          />
        ) : (
          <GroupView
            key={child.id}
            group={child}
            onChange={(g) => updateChild(i, g)}
            onDelete={() => removeChild(i)}
            depth={depth + 1}
          />
        )
      )}

      <View style={styles.addRow}>
        <Pressable style={styles.addBtn} onPress={addRule}>
          <Text style={styles.addText}>+ Rule</Text>
        </Pressable>
        <Pressable style={styles.addBtn} onPress={addGroup}>
          <Text style={styles.addText}>+ Group</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  nested: {
    borderLeftWidth: 2,
    borderLeftColor: "#007aff33",
    paddingLeft: 10,
    marginLeft: 4,
    backgroundColor: "#fafaff",
    borderRadius: 8,
    padding: 8,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  combinatorSwitch: { flexDirection: "row", backgroundColor: "#eee", borderRadius: 8, overflow: "hidden" },
  combBtn: { paddingVertical: 6, paddingHorizontal: 16 },
  combBtnActive: { backgroundColor: "#007aff" },
  combText: { fontWeight: "700", color: "#555" },
  combTextActive: { color: "#fff" },
  deleteGroupBtn: { padding: 6 },
  deleteText: { color: "#ff3b30", fontSize: 13 },
  addRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  addBtn: {
    borderWidth: 1,
    borderColor: "#007aff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  addText: { color: "#007aff", fontWeight: "600" },
});
