import { Group, Rule } from "../types";
import { getFieldDef } from "../schema";

function formatValue(rule: Rule): string {
  const def = getFieldDef(rule.field);
  if (!def) return "";
  if (def.type === "date") {
    if (Array.isArray(rule.value)) {
      const [a, b] = rule.value as [string, string];
      return `${a ? new Date(a).toLocaleDateString() : "?"} – ${b ? new Date(b).toLocaleDateString() : "?"}`;
    }
    return rule.value ? new Date(String(rule.value)).toLocaleDateString() : "";
  }
  if (Array.isArray(rule.value)) return rule.value.join(", ");
  return String(rule.value ?? "");
}

const OP_LABELS: Record<string, string> = {
  equals: "is",
  contains: "contains",
  startsWith: "starts with",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  between: "is between",
  before: "is before",
  after: "is after",
  onDay: "is on",
  isTrue: "is true",
  isFalse: "is false",
  in: "is any of",
  notIn: "is none of",
};

function describeRule(rule: Rule): string {
  if (!rule.field || !rule.operator) return "";
  const def = getFieldDef(rule.field);
  const label = def?.label ?? rule.field;
  const opLabel = OP_LABELS[rule.operator] ?? rule.operator;
  const needsValue = !["isEmpty", "isNotEmpty", "isTrue", "isFalse"].includes(rule.operator);
  return needsValue ? `${label} ${opLabel} ${formatValue(rule)}` : `${label} ${opLabel}`;
}

export function describeGroup(group: Group): string {
  const parts = group.children
    .map((child) => (child.kind === "rule" ? describeRule(child) : describeGroup(child)))
    .filter(Boolean);

  if (parts.length === 0) return "";
  const joined = parts.join(` ${group.combinator} `);
  return group.children.length > 1 ? `(${joined})` : joined;
}

export function hasActiveFilters(group: Group): boolean {
  return describeGroup(group).length > 0;
}
