import { getFieldDef } from "../schema";
import { OrderRecord } from "../types";
import { FieldSummary } from "../web/summaryStats";
import { formatCompact } from "../web/formatNumber";

export interface ReportChartBlock {
  title: string;
  html: string; // fully-formed <img> tag (native) or raw <svg> markup (web)
  widthPx?: number;
}

export function formatCell(key: string, value: unknown): string {
  const def = getFieldDef(key);
  if (value === null || value === undefined || value === "") return "—";
  if (def?.type === "date") return new Date(String(value)).toLocaleDateString();
  if (def?.type === "boolean") return value ? "Yes" : "No";
  if (def?.type === "number") return Number(value).toLocaleString();
  return String(value);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Wide column selections need the extra horizontal room or they clip at the
// page edge — this dataset routinely has 10+ columns selected at once.
const LANDSCAPE_COLUMN_THRESHOLD = 6;

export function getReportOrientation(columns: string[]): "portrait" | "landscape" {
  return columns.length > LANDSCAPE_COLUMN_THRESHOLD ? "landscape" : "portrait";
}

export function buildReportHtml(opts: {
  filterSummary: string;
  totalMatching: number;
  totalAll: number;
  columns: string[];
  rows: OrderRecord[];
  truncated: boolean;
  rowCap: number;
  chartBlocks: ReportChartBlock[];
  summaryBlocks?: FieldSummary[];
}): { html: string; orientation: "portrait" | "landscape" } {
  const { filterSummary, totalMatching, totalAll, columns, rows, truncated, rowCap, chartBlocks, summaryBlocks = [] } = opts;
  const orientation = getReportOrientation(columns);

  const tableHead = columns.map((c) => `<th>${escapeHtml(getFieldDef(c)?.label ?? c)}</th>`).join("");
  const tableRows = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(formatCell(c, r[c]))}</td>`).join("")}</tr>`)
    .join("");

  const chartsHtml = chartBlocks
    .map(
      (c) => `
        <div class="chart-block" style="max-width:${c.widthPx ?? 600}px">
          <h3>${escapeHtml(c.title)}</h3>
          ${c.html}
        </div>`
    )
    .join("");

  const statTile = (label: string, value: string) =>
    `<div class="stat-tile"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`;

  const summaryHtml = summaryBlocks
    .map(
      (s) => `
        <div class="summary-card">
          <h3>${escapeHtml(s.label)}</h3>
          <div class="stat-row">
            ${statTile("Count", s.count.toLocaleString())}
            ${statTile("Sum", formatCompact(s.sum))}
            ${statTile("Average", formatCompact(s.avg))}
            ${statTile("Min", formatCompact(s.min))}
            ${statTile("Max", formatCompact(s.max))}
          </div>
        </div>`
    )
    .join("");

  return { html: `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A4 ${orientation}; margin: 14mm; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1a1a1a; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        .filters { background: #eaf3ff; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px; }
        h2 { font-size: 16px; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 5px 7px; text-align: left; }
        th { background: #f2f2f4; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; break-inside: avoid; }
        tr:nth-child(even) { background: #fafafa; }
        .chart-block { margin-top: 16px; page-break-inside: avoid; break-inside: avoid; }
        .chart-block svg { max-width: 100%; height: auto; }
        .summary-card { margin-top: 12px; page-break-inside: avoid; break-inside: avoid; }
        .summary-card h3 { font-size: 13px; margin: 0 0 6px; }
        .stat-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .stat-tile { background: #f6f7f9; border-radius: 6px; padding: 8px 12px; min-width: 84px; }
        .stat-value { font-size: 15px; font-weight: 600; }
        .stat-label { font-size: 10px; color: #767a82; margin-top: 2px; }
        .note { color: #999; font-size: 11px; margin-top: 6px; }
      </style>
    </head>
    <body>
      <h1>Order Report</h1>
      <div class="meta">Generated ${new Date().toLocaleString()} — ${totalMatching} of ${totalAll} orders matched</div>
      <div class="filters"><strong>Filters:</strong> ${filterSummary ? escapeHtml(filterSummary) : "None (showing all orders)"}</div>

      ${summaryBlocks.length ? `<h2>Summary</h2>${summaryHtml}` : ""}

      ${chartBlocks.length ? `<h2>Charts</h2>${chartsHtml}` : ""}

      <h2>Table (${rows.length}${truncated ? ` of ${totalMatching}` : ""} rows)</h2>
      ${truncated ? `<div class="note">Table truncated to first ${rowCap} rows for report size — full result set available in the app.</div>` : ""}
      <table>
        <thead><tr>${tableHead}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
  </html>`, orientation };
}
