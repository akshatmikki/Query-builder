import { OrderRecord } from "../types";

export interface GroupNode {
  level: number;
  field: string;
  label: string;
  path: string;
  rows: OrderRecord[];
  children?: GroupNode[];
}

// Recursively partitions rows by each field in `fields` in order, so the
// first field is the outermost section and later fields nest inside it.
// `formatLabel` lets callers control how a raw cell value becomes the
// section label (e.g. date/boolean/number formatting), so the table view
// and CSV export can share this logic and never disagree on grouping.
export function buildGroups(
  rows: OrderRecord[],
  fields: string[],
  formatLabel: (field: string, value: unknown) => string,
  level = 0,
  parentPath = ""
): GroupNode[] {
  if (level >= fields.length) return [];
  const field = fields[level];
  const map = new Map<string, OrderRecord[]>();
  for (const rec of rows) {
    const label = formatLabel(field, rec[field]);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(rec);
  }
  const keys = Array.from(map.keys());
  const known = keys.filter((k) => k !== "—").sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const unknown = keys.filter((k) => k === "—");
  return [...known, ...unknown].map((label) => {
    const path = `${parentPath}${parentPath ? "›" : ""}${field}=${label}`;
    const groupRows = map.get(label)!;
    return {
      level,
      field,
      label,
      path,
      rows: groupRows,
      children: level + 1 < fields.length ? buildGroups(groupRows, fields, formatLabel, level + 1, path) : undefined,
    };
  });
}
