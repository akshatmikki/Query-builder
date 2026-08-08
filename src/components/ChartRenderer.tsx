import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import {
  VictoryChart,
  VictoryBar,
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
import { aggregateForChart, foldOtherByCategory, foldOtherBySeries } from "../query/aggregate";
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
}

export default function ChartRenderer({ config, records, width }: Props) {
  const w = width ?? screenWidth - 32;
  if (!config.xField || (config.type !== "pie" && config.aggregation !== "count" && !config.yField)) {
    return <Text style={styles.hint}>Configure fields to render this chart.</Text>;
  }

  const rawPoints = aggregateForChart(records, config);
  if (rawPoints.length === 0) {
    return <Text style={styles.hint}>No data for the current query/fields.</Text>;
  }

  if (config.type === "pie") {
    const points = foldOtherByCategory(rawPoints);
    const total = points.reduce((sum, p) => sum + p.y, 0) || 1;

    return (
      <View style={{ alignItems: "center" }}>
        <VictoryPie
          data={points.map((p) => ({ x: p.x, y: p.y }))}
          width={w}
          height={240}
          padding={40}
          colorScale={SERIES_COLORS}
          style={{
            labels: {
              fontSize: 10,
              fill: ({ index }: any) => contrastTextColor(SERIES_COLORS[Number(index) % SERIES_COLORS.length]),
            },
          }}
          labels={({ datum }) => `${Math.round((datum.y / total) * 100)}%`}
        />
        {points.length > 1 && (
          <VictoryLegend
            width={w}
            height={Math.ceil(points.length / 3) * 22 + 10}
            orientation="horizontal"
            itemsPerRow={3}
            gutter={14}
            style={{ labels: { fontSize: 10, fill: TEXT_COLOR } }}
            data={points.map((p, i) => ({
              name: truncateLabel(p.x),
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
  const height = 260;
  const xAxisTitle = getFieldDef(config.xField)?.label ?? "";
  const yAxisTitle = config.aggregation === "count" ? "Count" : getFieldDef(config.yField)?.label ?? "";

  return (
    <View>
      {hasSeries && (
        <VictoryLegend
          width={w}
          height={Math.ceil(seriesNames.length / 3) * 20 + 6}
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
        width={w}
        height={height}
        domainPadding={20}
        padding={{ top: 10, left: 68, right: 20, bottom: 78 }}
        containerComponent={
          Platform.OS === "web" ? (
            <VictoryVoronoiContainer
              voronoiDimension="x"
              labels={({ datum }: any) =>
                `${xAxisTitle ? `${xAxisTitle}: ` : ""}${truncateLabel(String(datum.x))}${
                  datum.series ? ` (${datum.series})` : ""
                }\n${yAxisTitle ? `${yAxisTitle}: ` : ""}${formatCompact(datum.y)}`
              }
              labelComponent={
                <VictoryTooltip
                  cornerRadius={4}
                  flyoutStyle={{ fill: "#14171c", stroke: TEXT_COLOR }}
                  style={{ fill: "#ffffff", fontSize: 9 }}
                />
              }
            />
          ) : undefined
        }
      >
        <VictoryAxis
          tickFormat={(t) => truncateLabel(String(t))}
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
        {seriesNames.map((s, i) => {
          const data = points
            .filter((p) => (s ? p.series === s : true))
            .map((p) => ({ x: p.x, y: p.y, series: p.series }));
          const color = SERIES_COLORS[i % SERIES_COLORS.length];

          if (config.type === "bar") {
            return (
              <VictoryBar
                key={String(s)}
                data={data}
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
        })}
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: "#999", textAlign: "center", paddingVertical: 40 },
});
