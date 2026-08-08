import React from "react";
import { View, Text, Pressable } from "react-native";
import Dropdown from "./Dropdown";
import { colors } from "./theme";
import { triggerStyles as s } from "./triggerStyles";

interface Props {
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSelect: (v: string) => void;
}

export default function OperatorDropdownButton({ value, options, placeholder = "Choose operator...", onSelect }: Props) {
  const selected = options.find((o) => o.value === value);
  return (
    <Dropdown
      width={220}
      maxHeight={300}
      trigger={({ onPress, open }) => (
        <Pressable style={[s.trigger, open && s.triggerOpen]} onPress={onPress}>
          <Text style={[s.triggerText, !selected && { color: colors.subtext }]}>{selected?.label ?? placeholder}</Text>
          <Text style={s.chevron}>{open ? "▲" : "▼"}</Text>
        </Pressable>
      )}
    >
      {({ close }) => (
        <View style={{ paddingVertical: 4 }}>
          {options.map((o) => (
            <Pressable
              key={o.value}
              style={[s.optRow, o.value === value && { backgroundColor: colors.accentSoft }]}
              onPress={() => {
                onSelect(o.value);
                close();
              }}
            >
              <Text style={s.optText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Dropdown>
  );
}
