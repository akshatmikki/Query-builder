import { Aggregation, ChartConfig, DateBucket, OrderRecord } from "../types";
import { getFieldDef } from "../schema";

export interface AggPoint {
  x: string; // category / date label
  y: number;
  series?: string;
}

const MAX_CATEGORIES = 8; // matches the 8-slot categorical palette; the rest folds into "Other"
const MAX_SERIES = 8;

function numOrZero(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function applyAgg(values: number[], agg: Aggregation): number {
  if (values.length === 0) return 0;
  switch (agg) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return 0;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Buckets a raw date value into a sortable label. All formats are chosen so
// plain string sort == chronological order (no separate date-sort path needed).
export function bucketDateValue(raw: unknown, granularity: DateBucket): string {
  const d = new Date(String(raw));
  if (isNaN(d.getTime())) return "Unknown";
  const y = d.getFullYear();
  switch (granularity) {
    case "day":
      return `${y}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    case "week": {
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return `${weekStart.getFullYear()}-${pad2(weekStart.getMonth() + 1)}-${pad2(weekStart.getDate())}`;
    }
    case "quarter":
      return `${y}-Q${Math.floor(d.getMonth() / 3) + 1}`;
    case "year":
      return String(y);
    case "month":
    default:
      return `${y}-${pad2(d.getMonth() + 1)}`;
  }
}

/**
 * Groups records by xField (and optional seriesField), aggregates yField,
 * and returns flat points ready to feed into victory-native.
 */
export function aggregateForChart(records: OrderRecord[], config: ChartConfig): AggPoint[] {
  const isDateX = getFieldDef(config.xField)?.type === "date";
  const granularity = config.dateBucket ?? "month";
  const buckets = new Map<string, number[]>();

  for (const rec of records) {
    const xRaw = rec[config.xField];
    const x =
      xRaw === null || xRaw === undefined || xRaw === ""
        ? "Unknown"
        : isDateX
        ? bucketDateValue(xRaw, granularity)
        : String(xRaw);
    const seriesRaw = config.seriesField ? rec[config.seriesField] : undefined;
    const series = config.seriesField
      ? seriesRaw === null || seriesRaw === undefined || seriesRaw === ""
        ? "Unknown"
        : String(seriesRaw)
      : undefined;

    const key = series ? `${x}__${series}` : x;
    const y = config.aggregation === "count" ? 1 : numOrZero(rec[config.yField]);

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(y);
  }

  const points: AggPoint[] = [];
  for (const [key, values] of buckets.entries()) {
    const [x, series] = key.split("__");
    points.push({ x, y: applyAgg(values, config.aggregation), series });
  }

  return sortPoints(points, isDateX);
}

// Date-bucket labels (YYYY-MM-DD / YYYY-MM / YYYY-Qn / YYYY) sort correctly as
// plain strings. Everything else falls back to numeric sort when every value
// parses as a number (so "2" sorts before "10"), else alphabetical.
function sortPoints(points: AggPoint[], isDateX: boolean): AggPoint[] {
  const known = points.filter((p) => p.x !== "Unknown");
  const unknown = points.filter((p) => p.x === "Unknown");

  if (isDateX) {
    known.sort((a, b) => a.x.localeCompare(b.x));
  } else {
    const allNumeric = known.length > 0 && known.every((p) => p.x.trim() !== "" && !isNaN(Number(p.x)));
    known.sort((a, b) => (allNumeric ? Number(a.x) - Number(b.x) : a.x.localeCompare(b.x)));
  }
  return [...known, ...unknown];
}

/**
 * Collapses a long tail of categories into a single "Other" bucket so a pie
 * (or any single-series chart) never exceeds the fixed 8-color categorical
 * palette. Keeps the top (maxCategories - 1) by value, sums the rest.
 */
export function foldOtherByCategory(points: AggPoint[], maxCategories: number = MAX_CATEGORIES): AggPoint[] {
  if (points.length <= maxCategories) return points;
  const ranked = [...points].sort((a, b) => b.y - a.y);
  const kept = ranked.slice(0, maxCategories - 1);
  const rest = ranked.slice(maxCategories - 1);
  const otherY = rest.reduce((sum, p) => sum + p.y, 0);
  return [...kept, { x: "Other", y: otherY }];
}

/**
 * Collapses a long tail of series (group-by values) into "Other" so a
 * grouped bar/line/scatter chart never has to cycle the categorical palette.
 * Keeps the top (maxSeries - 1) series by total value across all x buckets.
 */
export function foldOtherBySeries(points: AggPoint[], maxSeries: number = MAX_SERIES): AggPoint[] {
  const seriesNames = Array.from(new Set(points.map((p) => p.series ?? "")));
  if (seriesNames.length <= maxSeries) return points;

  const totals = new Map<string, number>();
  for (const p of points) {
    const s = p.series ?? "";
    totals.set(s, (totals.get(s) ?? 0) + p.y);
  }
  const keep = new Set(
    [...seriesNames].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0)).slice(0, maxSeries - 1)
  );

  const merged = new Map<string, AggPoint>();
  for (const p of points) {
    const series = keep.has(p.series ?? "") ? p.series : "Other";
    const key = `${p.x}__${series}`;
    const existing = merged.get(key);
    if (existing) existing.y += p.y;
    else merged.set(key, { x: p.x, y: p.y, series });
  }
  return Array.from(merged.values());
}
