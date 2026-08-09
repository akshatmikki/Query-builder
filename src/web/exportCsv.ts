import { OrderRecord } from "../types";
import { getFieldDef } from "../schema";
import { buildGroups } from "../query/groupRows";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatGroupLabel(key: string, value: unknown): string {
  const def = getFieldDef(key);
  if (value === null || value === undefined || value === "") return "—";
  if (def?.type === "date") return new Date(String(value)).toLocaleDateString();
  if (def?.type === "boolean") return value ? "Yes" : "No";
  if (def?.type === "number") return Number(value).toLocaleString();
  return String(value);
}

// Mirrors the on-screen grouped table: each group gets its own labeled
// section line (indented per nesting level) directly above its rows, so the
// exported file matches whatever grouping is currently applied in the UI.
export function downloadCsv(
  rows: OrderRecord[],
  columns: string[],
  groupByFields: string[] = [],
  filename = "orders.csv"
) {
  const header = columns.map((c) => csvEscape(getFieldDef(c)?.label ?? c)).join(",");
  const lines: string[] = [header];
  const rowLine = (r: OrderRecord) => columns.map((c) => csvEscape(r[c])).join(",");

  if (groupByFields.length > 0) {
    const groups = buildGroups(rows, groupByFields, formatGroupLabel);
    const walk = (nodes: ReturnType<typeof buildGroups>) => {
      nodes.forEach((node) => {
        const indent = "  ".repeat(node.level);
        const fieldLabel = getFieldDef(node.field)?.label ?? node.field;
        lines.push(csvEscape(`${indent}${fieldLabel}: ${node.label} (${node.rows.length} rows)`));
        if (node.children && node.children.length) walk(node.children);
        else node.rows.forEach((r) => lines.push(rowLine(r)));
      });
    };
    walk(groups);
  } else {
    rows.forEach((r) => lines.push(rowLine(r)));
  }

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
