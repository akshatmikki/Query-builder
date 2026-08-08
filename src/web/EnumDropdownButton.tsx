import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import Dropdown from "./Dropdown";
import { colors } from "./theme";
import { triggerStyles as s } from "./triggerStyles";

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

export default function EnumDropdownButton({ options, value, onChange, placeholder = "Select values" }: Props) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);

  return (
    <Dropdown
      width={280}
      maxHeight={320}
      trigger={({ onPress, open }) => (
        <Pressable style={[s.trigger, open && s.triggerOpen]} onPress={onPress}>
          <Text style={[s.triggerText, !value.length && { color: colors.subtext }]} numberOfLines={1}>
            {value.length ? value.join(", ") : placeholder}
          </Text>
          <Text style={s.chevron}>{open ? "▲" : "▼"}</Text>
        </Pressable>
      )}
    >
      {() => (
        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingVertical: 6 }}>
          {options.map((opt) => {
            const active = value.includes(opt);
            return (
              <Pressable key={opt} style={s.optRow} onPress={() => toggle(opt)}>
                <View style={[s.checkbox, active && s.checkboxActive]}>{active && <Text style={s.checkmark}>✓</Text>}</View>
                <Text style={s.optText} numberOfLines={1}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Dropdown>
  );
}
