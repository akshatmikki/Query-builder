import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { FieldDef } from "../types";
import FieldPickerContent from "./FieldPickerContent";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (field: FieldDef) => void;
}

export default function FieldPicker({ visible, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <FieldPickerContent
          onSelect={(f) => {
            onSelect(f);
            onClose();
          }}
        />
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  closeBtn: { paddingVertical: 14, alignItems: "center" },
  closeText: { color: "#007aff", fontWeight: "600" },
});
