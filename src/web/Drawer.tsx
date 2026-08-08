import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { colors } from "./theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  side: "left" | "right";
  width: number;
  children: React.ReactNode;
}

export default function Drawer({ visible, onClose, side, width, children }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.panel,
          { width },
          side === "left"
            ? { left: 0, borderTopRightRadius: 16, borderBottomRightRadius: 16 }
            : { right: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20,22,26,0.35)",
    zIndex: 50,
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
