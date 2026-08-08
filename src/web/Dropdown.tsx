import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { createPortal } from "react-dom";
import { colors } from "./theme";

interface RenderTriggerProps {
  onPress: () => void;
  open: boolean;
}

interface RenderContentProps {
  close: () => void;
}

interface Props {
  trigger: (p: RenderTriggerProps) => React.ReactNode;
  children: (p: RenderContentProps) => React.ReactNode;
  width?: number;
  maxHeight?: number;
  align?: "left" | "right";
}

interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Anchored, content-sized dropdown for web — replaces full-screen Modals so
// pickers read as compact popovers instead of taking over the viewport.
//
// The panel is rendered through a portal into document.body with
// `position: fixed`, rather than as a normal descendant. React Native Web
// gives every View its own stacking context (position: relative by default),
// so a high z-index buried inside a nested tree can't out-rank a later
// sibling of one of its ancestors (e.g. a GroupView's "+ Rule" row right
// below the trigger) — only escaping the tree entirely via a portal fixes
// that reliably.
export default function Dropdown({ trigger, children, width = 280, maxHeight = 360, align = "left" }: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const triggerRef = useRef<any>(null);
  const panelRef = useRef<any>(null);

  const updateRect = () => {
    const node = triggerRef.current;
    if (node && typeof node.getBoundingClientRect === "function") {
      const r = node.getBoundingClientRect();
      setRect({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
    }
  };

  useLayoutEffect(() => {
    if (open) updateRect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: any) => {
      const t = e.target;
      if (triggerRef.current?.contains?.(t)) return;
      if (panelRef.current?.contains?.(t)) return;
      setOpen(false);
    };
    const handleReflow = () => updateRect();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("scroll", handleReflow, true);
    window.addEventListener("resize", handleReflow);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("scroll", handleReflow, true);
      window.removeEventListener("resize", handleReflow);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  let left = 0;
  if (rect) {
    left = align === "right" ? rect.right - width : rect.left;
    const margin = 8;
    left = Math.min(Math.max(margin, left), window.innerWidth - width - margin);
  }

  return (
    <>
      <View ref={triggerRef} style={styles.root}>
        {trigger({ onPress: () => setOpen((o) => !o), open })}
      </View>
      {open &&
        rect &&
        createPortal(
          <View ref={panelRef} style={[styles.panel, { width, maxHeight, top: rect.bottom + 6, left }]}>
            {children({ close: () => setOpen(false) })}
          </View>,
          document.body
        )}
    </>
  );
}

const styles = StyleSheet.create({
  root: {},
  panel: {
    position: "fixed" as any,
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    zIndex: 9999,
    overflow: "hidden",
  },
});
