import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChartConfig, OrderRecord } from "../types";
import ChartRenderer from "../components/ChartRenderer";
import { colors, shadow, radius, webTransition } from "./theme";

export type ChartSpan = "auto" | "full";

const TYPE_ICON: Record<ChartConfig["type"], string> = {
  bar: "▤",
  line: "⟋",
  pie: "◔",
  scatter: "✦",
};

interface Props {
  charts: ChartConfig[];
  records: OrderRecord[];
  chartWidth: number;
  spans: Record<string, ChartSpan>;
  onSpanToggle: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  registerRef: (id: string, node: any) => void;
}

// Drag-to-reorder mirrors TablePane's column-drag pattern (pointer listeners
// on window rather than RN's responder system, since this grid is web-only),
// extended to 2D nearest-card distance since cards can sit in any grid cell.
export default function ReportChartGrid({
  charts,
  records,
  chartWidth,
  spans,
  onSpanToggle,
  onReorder,
  registerRef,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, any>());
  const overIdRef = useRef<string | null>(null);

  const startDrag = (id: string, e: any) => {
    e.preventDefault?.();
    setDragId(id);
    setOverId(id);
    overIdRef.current = id;
  };

  useEffect(() => {
    if (!dragId) return;
    const handleMove = (e: PointerEvent) => {
      let closest: string | null = null;
      let closestDist = Infinity;
      cardRefs.current.forEach((node, id) => {
        if (!node?.getBoundingClientRect) return;
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = id;
        }
      });
      if (closest) {
        overIdRef.current = closest;
        setOverId(closest);
      }
    };
    const handleUp = () => {
      const ids = charts.map((c) => c.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(overIdRef.current ?? dragId);
      if (from !== -1 && to !== -1 && from !== to) {
        const next = [...ids];
        next.splice(from, 1);
        next.splice(to, 0, dragId);
        onReorder(next);
      }
      setDragId(null);
      setOverId(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId, charts]);

  // Column width tracks the user's chosen PDF chart size so the on-screen
  // grid matches what gets exported; auto-fill wraps to new rows as the pane
  // narrows, so charts land side by side or stacked without any extra logic.
  const colWidth = Math.min(Math.max(chartWidth, 320), 520);

  return (
    <View style={[styles.grid, { gridTemplateColumns: `repeat(auto-fill, minmax(${colWidth}px, 1fr))` } as any]}>
      {charts.map((c) => {
        const span = spans[c.id] ?? "auto";
        return (
          <View
            key={c.id}
            ref={(node: any) => {
              if (node) cardRefs.current.set(c.id, node);
              else cardRefs.current.delete(c.id);
            }}
            style={[
              styles.card,
              span === "full" && styles.cardFull,
              dragId === c.id && styles.cardDragging,
              overId === c.id && dragId !== null && dragId !== c.id && styles.cardDragOver,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.gripHandle} onPointerDown={(e: any) => startDrag(c.id, e)}>
                  <Text style={styles.gripText}>⠿</Text>
                </View>
                <Text style={styles.typeIcon}>{TYPE_ICON[c.type] ?? "▤"}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {c.title || "Untitled chart"}
                </Text>
              </View>
              <Pressable
                style={[styles.spanBtn, span === "full" && styles.spanBtnActive]}
                onPress={() => onSpanToggle(c.id)}
              >
                <Text style={[styles.spanBtnText, span === "full" && styles.spanBtnTextActive]}>
                  {span === "full" ? "Full width" : "Auto"}
                </Text>
              </Pressable>
            </View>
            <View ref={(r: any) => registerRef(c.id, r)} style={styles.chartWrap}>
              <ChartRenderer config={c} records={records} width={chartWidth} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    // @ts-ignore web-only CSS grid layout
    display: "grid",
    gap: 18,
  } as any,
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    minWidth: 0,
    overflow: "hidden",
    ...shadow.card,
    ...webTransition,
  },
  cardFull: {
    // @ts-ignore web-only CSS grid spanning
    gridColumn: "1 / -1",
  } as any,
  cardDragging: { opacity: 0.45, transform: [{ scale: 0.99 }] },
  cardDragOver: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 },
  gripHandle: {
    paddingHorizontal: 2,
    // @ts-ignore web-only cursor + selection hints
    cursor: "grab",
    userSelect: "none",
  } as any,
  gripText: { fontSize: 13, color: colors.subtext },
  typeIcon: { fontSize: 13, color: colors.accent },
  cardTitle: { fontSize: 14.5, fontWeight: "700", color: colors.text, flexShrink: 1 },
  spanBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    ...webTransition,
  },
  spanBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  spanBtnText: { fontSize: 11, fontWeight: "700", color: colors.subtext },
  spanBtnTextActive: { color: "#fff" },
  chartWrap: { alignItems: "center" },
});
