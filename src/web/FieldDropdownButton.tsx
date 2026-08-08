import React from "react";
import { Text, Pressable, ViewStyle } from "react-native";
import Dropdown from "./Dropdown";
import FieldPickerContent from "../components/FieldPickerContent";
import { FieldDef } from "../types";
import { colors } from "./theme";
import { triggerStyles as s } from "./triggerStyles";

interface Props {
  label: string;
  placeholder?: string;
  onSelect: (f: FieldDef) => void;
  style?: ViewStyle;
  align?: "left" | "right";
}

export default function FieldDropdownButton({ label, placeholder = "Choose field...", onSelect, style, align }: Props) {
  return (
    <Dropdown
      width={300}
      maxHeight={380}
      align={align}
      trigger={({ onPress, open }) => (
        <Pressable style={[s.trigger, open && s.triggerOpen, style]} onPress={onPress}>
          <Text style={[s.triggerText, !label && { color: colors.subtext }]} numberOfLines={1}>
            {label || placeholder}
          </Text>
          <Text style={s.chevron}>{open ? "▲" : "▼"}</Text>
        </Pressable>
      )}
    >
      {({ close }) => (
        <FieldPickerContent
          compact
          autoFocus
          onSelect={(f) => {
            onSelect(f);
            close();
          }}
        />
      )}
    </Dropdown>
  );
}
