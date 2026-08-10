import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList, Switch, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FieldDef, Operator } from "../types";
import { operatorNeedsNoValue, operatorNeedsRange } from "../operators";
import EnumDropdownButton from "../web/EnumDropdownButton";

const isWeb = Platform.OS === "web";

interface Props {
  field: FieldDef;
  operator: Operator | "";
  value: unknown;
  onChange: (v: unknown) => void;
  minDate?: string; // ISO string; for date fields, constrains the picker to the data's actual range
  maxDate?: string;
}

export default function ValueInput({ field, operator, value, onChange, minDate, maxDate }: Props) {
  if (!operator || operatorNeedsNoValue(operator)) return null;

  if (field.type === "enum") {
    return <EnumMultiSelect field={field} value={(value as string[]) || []} onChange={onChange} />;
  }

  if (field.type === "number") {
    if (operatorNeedsRange(operator)) {
      const [lo, hi] = (value as [number, number]) || [undefined, undefined];
      return (
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Min"
            keyboardType="numeric"
            value={lo?.toString() ?? ""}
            onChangeText={(t) => onChange([Number(t) || 0, hi ?? 0])}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Max"
            keyboardType="numeric"
            value={hi?.toString() ?? ""}
            onChangeText={(t) => onChange([lo ?? 0, Number(t) || 0])}
          />
        </View>
      );
    }
    return (
      <TextInput
        style={styles.input}
        placeholder="Value"
        keyboardType="numeric"
        value={value?.toString() ?? ""}
        onChangeText={(t) => onChange(Number(t) || 0)}
      />
    );
  }

  if (field.type === "date") {
    if (operatorNeedsRange(operator)) {
      const [lo, hi] = (value as [string, string]) || [undefined, undefined];
      return (
        <View>
          <View style={styles.row}>
            <DatePickerField value={lo} onChange={(d) => onChange([d, hi])} placeholder="From" min={minDate} max={maxDate} />
            <DatePickerField value={hi} onChange={(d) => onChange([lo, d])} placeholder="To" min={minDate} max={maxDate} />
          </View>
          {(lo || hi) ? (
            <Pressable onPress={() => onChange([undefined, undefined])}>
              <Text style={styles.clearLink}>Clear dates (match any date)</Text>
            </Pressable>
          ) : (
            <Text style={styles.hintText}>No dates selected — matches any date</Text>
          )}
        </View>
      );
    }
    return (
      <View>
        <DatePickerField
          value={value as string | undefined}
          onChange={onChange}
          placeholder="Select date"
          min={minDate}
          max={maxDate}
        />
        {value ? (
          <Pressable onPress={() => onChange(undefined)}>
            <Text style={styles.clearLink}>Clear date (match any date)</Text>
          </Pressable>
        ) : (
          <Text style={styles.hintText}>No date selected — matches any date</Text>
        )}
      </View>
    );
  }

  // text
  return (
    <TextInput
      style={styles.input}
      placeholder="Value"
      value={(value as string) ?? ""}
      onChangeText={onChange}
    />
  );
}

function toInputDateValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value?: string;
  onChange: (iso: string) => void;
  placeholder: string;
  min?: string;
  max?: string;
}) {
  const [show, setShow] = useState(false);
  const dateVal = value ? new Date(value) : new Date();

  // @react-native-community/datetimepicker has no usable web renderer — fall
  // back to a native HTML date input on web instead of a dead Pressable.
  if (isWeb) {
    return (
      <View style={[styles.input, styles.half, styles.webDateWrap]}>
        {React.createElement("input", {
          type: "date",
          value: toInputDateValue(value),
          min: toInputDateValue(min) || undefined,
          max: toInputDateValue(max) || undefined,
          onChange: (e: any) => {
            const v = e.target.value;
            if (!v) return;
            const [y, m, d] = v.split("-").map(Number);
            onChange(new Date(y, m - 1, d).toISOString());
          },
          style: webDateInputStyle,
        })}
      </View>
    );
  }

  return (
    <>
      <Pressable style={[styles.input, styles.half]} onPress={() => setShow(true)}>
        <Text>{value ? new Date(value).toLocaleDateString() : placeholder}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={dateVal}
          mode="date"
          minimumDate={min ? new Date(min) : undefined}
          maximumDate={max ? new Date(max) : undefined}
          onChange={(_, selected) => {
            setShow(false);
            if (selected) onChange(selected.toISOString());
          }}
        />
      )}
    </>
  );
}

const webDateInputStyle: any = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 14,
  fontFamily: "inherit",
  width: "100%",
  color: "inherit",
};

function EnumMultiSelect({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = field.options ?? [];

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  if (isWeb) {
    return <EnumDropdownButton options={options} value={value} onChange={onChange} />;
  }

  return (
    <>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text numberOfLines={1}>{value.length ? value.join(", ") : "Select values"}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{field.label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o}
            renderItem={({ item }) => (
              <Pressable style={styles.optionRow} onPress={() => toggle(item)}>
                <Text>{item}</Text>
                <Switch value={value.includes(item)} onValueChange={() => toggle(item)} />
              </Pressable>
            )}
          />
          <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 42,
    justifyContent: "center",
    flex: 1,
  },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  webDateWrap: { paddingVertical: 0 },
  clearLink: { color: "#007aff", fontWeight: "600", fontSize: 12, marginTop: 6 },
  hintText: { color: "#999", fontSize: 12, marginTop: 6, fontStyle: "italic" },
  modalContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  closeBtn: { paddingVertical: 14, alignItems: "center" },
  closeText: { color: "#007aff", fontWeight: "600" },
});
