import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import {
  VictoryChart,
  VictoryBar,
  VictoryGroup,
  VictoryLine,
  VictoryPie,
  VictoryScatter,
  VictoryTheme,
  VictoryAxis,
  VictoryLegend,
  VictoryLabel,
  VictoryVoronoiContainer,
  VictoryTooltip,
} from "victory-native";
import { ChartConfig, OrderRecord } from "../types";
import { aggregateForChart, foldOtherByCategory, foldOtherBySeries, formatBucketLabel } from "../query/aggregate";
import { formatCompact } from "../web/formatNumber";
import { getFieldDef } from "../schema";

const screenWidth = Dimensions.get("window").width;
// Validated categorical palette (dataviz skill): fixed hue order, adjacent-pair
// CVD-safe. Never reorder or cycle — a 9th series folds into "Other" instead.
export const SERIES_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

const TEXT_COLOR = "#33383f";
const MAX_LABEL_CHARS = 12;

// Shared "professional" tooltip look — dark flyout, soft rounded corners,
// comfortable padding — used by both the pie hover tooltip and the
// bar/line/scatter voronoi tooltip so hovering feels consistent everywhere.
const TOOLTIP_FLYOUT_STYLE = { fill: "#1c2128", stroke: "#3a4048", strokeWidth: 1 };
const TOOLTIP_TEXT_STYLE = { fill: "#ffffff", fontSize: 11, fontWeight: "600" as const };
const TOOLTIP_PADDING = { top: 8, bottom: 8, left: 10, right: 10 };

function truncateLabel(v: string): string {
  return v.length > MAX_LABEL_CHARS ? `${v.slice(0, MAX_LABEL_CHARS - 1)}…` : v;
}

// Picks readable label ink for a given slice fill (dataviz skill: labels set
// inside a colored fill must pick white/ink by the fill's luminance).
function contrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#14171c" : "#ffffff";
}

interface Props {
  config: ChartConfig;
  records: OrderRecord[];
  width?: number;
  height?: number;
}

export default function ChartRenderer({ config, records, width, height: heightProp }: Props) {
  const w = width ?? screenWidth - 32;
  if (!config.xField || (config.type !== "pie" && config.aggregation !== "count" && !config.yField)) {
    return <Text style={styles.hint}>Configure fields to render this chart.</Text>;
  }

  const rawPoints = aggregateForChart(records, config);
  if (rawPoints.length === 0) {
    return <Text style={styles.hint}>No data for the current query/fields.</Text>;
  }

  const isDateX = getFieldDef(config.xField)?.type === "date";
  const granularity = config.dateBucket ?? "month";
  const formatXValue = (raw: string, compact = false) =>
    isDateX ? formatBucketLabel(raw, granularity, compact) : truncateLabel(raw);

  if (config.type === "pie") {
    const points = foldOtherByCategory(rawPoints);
    const total = points.reduce((sum, p) => sum + p.y, 0) || 1;
    const legendHeight = points.length > 1 ? Math.ceil(points.length / 3) * 22 + 10 : 0;
    const pieHeight = Math.max((heightProp ?? 240) - legendHeight, 160);
    const MIN_LABEL_PCT = 5;

    const pieEvents =
      Platform.OS === "web"
        ? [
            {
              target: "data" as const,
              eventHandlers: {
                onMouseOver: () => [{ target: "labels" as const, mutation: () => ({ active: true }) }],
                onMouseOut: () => [{ target: "labels" as const, mutation: () => ({ active: false }) }],
              },
            },
          ]
        : undefined;

    // Renders an inline "%" label for slices big enough to fit one; on hover
    // (web only) every slice — including tiny ones with no inline label —
    // shows a tooltip with its name, value, and exact percent.
    const PieSliceLabel = (props: any) => {
      const { active, datum, index } = props;
      const pct = Math.round((datum.y / total) * 100);
      if (active) {
        return (
          <VictoryTooltip
            {...props}
            text={`${formatXValue(String(datum.x))}\n${formatCompact(datum.y)} (${pct}%)`}
            cornerRadius={6}
            pointerLength={8}
            flyoutPadding={TOOLTIP_PADDING}
            flyoutStyle={TOOLTIP_FLYOUT_STYLE}
            style={TOOLTIP_TEXT_STYLE}
            renderInPortal={false}
          />
        );
      }
      if (pct < MIN_LABEL_PCT) return null;
      return (
        <VictoryLabel
          {...props}
          text={`${pct}%`}
          style={{ fontSize: 10, fill: contrastTextColor(SERIES_COLORS[Number(index) % SERIES_COLORS.length]) }}
        />
      );
    };

    return (
      <View style={{ alignItems: "center" }}>
        <VictoryPie
          data={points.map((p) => ({ x: p.x, y: p.y }))}
          width={w}
          height={pieHeight}
          padding={40}
          colorScale={SERIES_COLORS}
          labels={({ datum }) => String(datum.x)}
          labelComponent={<PieSliceLabel />}
          events={pieEvents}
        />
        {points.length > 1 && (
          <VictoryLegend
            width={w}
            height={legendHeight}
            orientation="horizontal"
            itemsPerRow={3}
            gutter={14}
            style={{ labels: { fontSize: 10, fill: TEXT_COLOR } }}
            data={points.map((p, i) => ({
              name: formatXValue(p.x),
              symbol: { fill: SERIES_COLORS[i % SERIES_COLORS.length] },
            }))}
          />
        )}
      </View>
    );
  }

  const hasSeries = !!config.seriesField;
  const points = hasSeries ? foldOtherBySeries(rawPoints) : rawPoints;
  const seriesNames = hasSeries
    ? Array.from(new Set(points.map((p) => p.series || "Unknown"))).sort((a, b) =>
        a === "Other" ? 1 : b === "Other" ? -1 : 0
      )
    : [undefined];
  const legendHeight = hasSeries ? Math.ceil(seriesNames.length / 3) * 20 + 6 : 0;
  const height = Math.max((heightProp ?? 260) - legendHeight, 200);
  const xAxisTitle = getFieldDef(config.xField)?.label ?? "";
  const yAxisTitle = config.aggregation === "count" ? "Count" : getFieldDef(config.yField)?.label ?? "";

  // Bar charts need a width capped to how many categories/bars there actually
  // are — otherwise a handful of bars stretched across a wide canvas end up
  // huge, far apart, and crowding the y-axis. Line/scatter charts don't have
  // this problem, so they keep using the full available width.
  const isBar = config.type === "bar";
  const categoryCount = new Set(points.map((p) => p.x)).size || 1;
  const groupWidth = 90 * (hasSeries ? seriesNames.length : 1) + 40;
  const plotWidth = isBar ? Math.min(w, Math.max(260, categoryCount * groupWidth)) : w;
  const domainPadding = isBar ? Math.max(30, plotWidth * 0.05) : 20;
  const barBandwidth = (plotWidth - domainPadding * 2) / categoryCount;
  const barWidth = isBar
    ? Math.max(6, Math.min(56, (barBandwidth / (hasSeries ? seriesNames.length : 1)) * 0.7))
    : undefined;

  const seriesElements = seriesNames.map((s, i) => {
    const data = points
      .filter((p) => (s ? p.series === s : true))
      .map((p) => ({ x: p.x, y: p.y, series: p.series }));
    const color = SERIES_COLORS[i % SERIES_COLORS.length];

    if (config.type === "bar") {
      return (
        <VictoryBar
          key={String(s)}
          data={data}
          barWidth={barWidth}
          style={{ data: { fill: color } }}
          labels={(d) => formatCompact(d.datum.y)}
          labelComponent={<VictoryLabel dy={-6} style={{ fontSize: 8, fill: TEXT_COLOR }} />}
        />
      );
    }
    if (config.type === "line") {
      return (
        <VictoryLine
          key={String(s)}
          data={data}
          style={{ data: { stroke: color, strokeWidth: 2 } }}
          labels={(d) => formatCompact(d.datum.y)}
          labelComponent={<VictoryLabel dy={-8} textAnchor="middle" style={{ fontSize: 8, fill: TEXT_COLOR }} />}
        />
      );
    }
    return (
      <VictoryScatter
        key={String(s)}
        data={data}
        size={4}
        style={{ data: { fill: color } }}
        labels={(d) => formatCompact(d.datum.y)}
        labelComponent={<VictoryLabel dy={-10} textAnchor="middle" style={{ fontSize: 8, fill: TEXT_COLOR }} />}
      />
    );
  });

  return (
    <View style={{ alignItems: "center" }}>
      {hasSeries && (
        <VictoryLegend
          width={w}
          height={legendHeight}
          orientation="horizontal"
          itemsPerRow={3}
          gutter={12}
          style={{ labels: { fontSize: 9, fill: TEXT_COLOR } }}
          data={seriesNames.map((s, i) => ({
            name: truncateLabel(String(s)),
            symbol: { fill: SERIES_COLORS[i % SERIES_COLORS.length] },
          }))}
        />
      )}
      <VictoryChart
        theme={VictoryTheme.material}
        width={plotWidth}
        height={height}
        domainPadding={domainPadding}
        padding={{ top: 10, left: 68, right: 20, bottom: 78 }}
        containerComponent={
          Platform.OS === "web" ? (
            <VictoryVoronoiContainer
              voronoiDimension="x"
              labels={({ datum }: any) =>
                `${xAxisTitle ? `${xAxisTitle}: ` : ""}${formatXValue(String(datum.x))}${
                  datum.series ? ` (${datum.series})` : ""
                }\n${yAxisTitle ? `${yAxisTitle}: ` : ""}${formatCompact(datum.y)}`
              }
              labelComponent={
                <VictoryTooltip
                  cornerRadius={6}
                  pointerLength={8}
                  flyoutPadding={TOOLTIP_PADDING}
                  flyoutStyle={TOOLTIP_FLYOUT_STYLE}
                  style={TOOLTIP_TEXT_STYLE}
                />
              }
            />
          ) : undefined
        }
      >
        <VictoryAxis
          tickFormat={(t) => formatXValue(String(t), true)}
          style={{ tickLabels: { fontSize: 8, angle: -35, textAnchor: "end", fill: TEXT_COLOR } }}
          label={xAxisTitle}
          axisLabelComponent={<VictoryLabel dy={30} style={{ fontSize: 10, fontWeight: "700", fill: TEXT_COLOR }} />}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => formatCompact(Number(t))}
          style={{ tickLabels: { fontSize: 8, fill: TEXT_COLOR } }}
          label={yAxisTitle}
          axisLabelComponent={<VictoryLabel dy={-48} style={{ fontSize: 10, fontWeight: "700", fill: TEXT_COLOR }} />}
        />
        {isBar && hasSeries ? (
          <VictoryGroup offset={barWidth ? barWidth + 4 : undefined}>{seriesElements}</VictoryGroup>
        ) : (
          seriesElements
        )}
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: "#999", textAlign: "center", paddingVertical: 40 },
});
