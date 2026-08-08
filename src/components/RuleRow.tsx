import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, FlatList, Platform } from "react-native";
import { Rule, Operator } from "../types";
import { getFieldDef } from "../schema";
import { OPERATORS_BY_TYPE } from "../operators";
import FieldPicker from "./FieldPicker";
import ValueInput from "./ValueInput";
import FieldDropdownButton from "../web/FieldDropdownButton";
import OperatorDropdownButton from "../web/OperatorDropdownButton";

const isWeb = Platform.OS === "web";

interface Props {
  rule: Rule;
  onChange: (r: Rule) => void;
  onDelete: () => void;
}

export default function RuleRow({ rule, onChange, onDelete }: Props) {
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [opPickerOpen, setOpPickerOpen] = useState(false);
  const fieldDef = rule.field ? getFieldDef(rule.field) : undefined;
  const operators = fieldDef ? OPERATORS_BY_TYPE[fieldDef.type] : [];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {isWeb ? (
          <View style={{ flex: 1 }}>
            <FieldDropdownButton
              label={fieldDef ? fieldDef.label : ""}
              onSelect={(f) => onChange({ ...rule, field: f.key, operator: "", value: undefined })}
            />
          </View>
        ) : (
          <Pressable style={styles.fieldBtn} onPress={() => setFieldPickerOpen(true)}>
            <Text style={styles.fieldText} numberOfLines={1}>
              {fieldDef ? fieldDef.label : "Choose field..."}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      </View>

      {fieldDef &&
        (isWeb ? (
          <OperatorDropdownButton
            value={rule.operator}
            options={operators}
            onSelect={(v) => onChange({ ...rule, operator: v as Operator, value: undefined })}
          />
        ) : (
          <Pressable style={styles.opBtn} onPress={() => setOpPickerOpen(true)}>
            <Text>{operators.find((o) => o.value === rule.operator)?.label ?? "Choose operator..."}</Text>
          </Pressable>
        ))}

      {fieldDef && rule.operator && (
        <ValueInput
          field={fieldDef}
          operator={rule.operator}
          value={rule.value}
          onChange={(v) => onChange({ ...rule, value: v })}
        />
      )}

      {!isWeb && (
        <>
          <FieldPicker
            visible={fieldPickerOpen}
            onClose={() => setFieldPickerOpen(false)}
            onSelect={(f) => onChange({ ...rule, field: f.key, operator: "", value: undefined })}
          />

          <Modal visible={opPickerOpen} transparent animationType="fade" onRequestClose={() => setOpPickerOpen(false)}>
            <Pressable style={styles.overlay} onPress={() => setOpPickerOpen(false)}>
              <View style={styles.opList}>
                <FlatList
                  data={operators}
                  keyExtractor={(o) => o.value}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.opRow}
                      onPress={() => {
                        onChange({ ...rule, operator: item.value as Operator, value: undefined });
                        setOpPickerOpen(false);
                      }}
                    >
                      <Text>{item.label}</Text>
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f7f7f9",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    gap: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  fieldText: { fontWeight: "600" },
  deleteBtn: { padding: 6 },
  deleteText: { color: "#ff3b30", fontSize: 16 },
  opBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 30 },
  opList: { backgroundColor: "#fff", borderRadius: 10, maxHeight: 300 },
  opRow: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee" },
});
