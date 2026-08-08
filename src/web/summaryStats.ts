import { OrderRecord } from "../types";

export interface FieldSummary {
  key: string;
  label: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

export function computeFieldSummary(records: OrderRecord[], key: string, label: string): FieldSummary {
  const values = records.map((r) => Number(r[key])).filter((v) => !isNaN(v));
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = count ? sum / count : 0;
  const min = count ? Math.min(...values) : 0;
  const max = count ? Math.max(...values) : 0;
  return { key, label, count, sum, avg, min, max };
}
