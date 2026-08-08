// Auto-compact formatting for stat-tile values: 1,284 / 12.9K / 4.2M
export function formatCompact(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs < 1000) return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
