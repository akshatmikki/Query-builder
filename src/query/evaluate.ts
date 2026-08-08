import { Group, OrderRecord, Rule } from "../types";
import { getFieldDef } from "../schema";

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function toDate(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const t = Date.parse(String(v));
  return isNaN(t) ? null : t;
}

function evaluateRule(record: OrderRecord, rule: Rule): boolean {
  if (!rule.field || !rule.operator) return true; // incomplete rule = no-op filter
  const def = getFieldDef(rule.field);
  const raw = record[rule.field];
  if (!def) return true;

  switch (def.type) {
    case "text": {
      const strVal = (raw ?? "").toString().toLowerCase();
      const target = String(rule.value ?? "").toLowerCase();
      switch (rule.operator) {
        case "equals":
          return strVal === target;
        case "contains":
          return strVal.includes(target);
        case "startsWith":
          return strVal.startsWith(target);
        case "isEmpty":
          return strVal.trim() === "";
        case "isNotEmpty":
          return strVal.trim() !== "";
        default:
          return true;
      }
    }
    case "number": {
      const n = toNumber(raw);
      if (n === null) return false;
      const v = rule.value as number | [number, number] | undefined;
      switch (rule.operator) {
        case "eq":
          return n === Number(v);
        case "neq":
          return n !== Number(v);
        case "gt":
          return n > Number(v);
        case "gte":
          return n >= Number(v);
        case "lt":
          return n < Number(v);
        case "lte":
          return n <= Number(v);
        case "between": {
          const [lo, hi] = (v as [number, number]) ?? [null, null];
          if (lo === null || hi === null) return true;
          return n >= lo && n <= hi;
        }
        default:
          return true;
      }
    }
    case "boolean": {
      const b = Boolean(raw);
      if (rule.operator === "isTrue") return b === true;
      if (rule.operator === "isFalse") return b === false;
      return true;
    }
    case "date": {
      const t = toDate(raw);
      if (t === null) return false;
      switch (rule.operator) {
        case "before":
          return t < (toDate(rule.value) ?? Infinity);
        case "after":
          return t > (toDate(rule.value) ?? -Infinity);
        case "between": {
          const [lo, hi] = (rule.value as [string, string]) ?? [null, null];
          const loT = toDate(lo);
          const hiT = toDate(hi);
          if (loT === null || hiT === null) return true;
          return t >= loT && t <= hiT;
        }
        case "onDay": {
          const target = toDate(rule.value);
          if (target === null) return true;
          const d1 = new Date(t);
          const d2 = new Date(target);
          return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
          );
        }
        default:
          return true;
      }
    }
    case "enum": {
      const selected = (rule.value as string[]) ?? [];
      if (selected.length === 0) return true;
      const strVal = String(raw ?? "");
      const isIn = selected.includes(strVal);
      return rule.operator === "in" ? isIn : !isIn;
    }
    default:
      return true;
  }
}

export function evaluateGroup(record: OrderRecord, group: Group): boolean {
  if (group.children.length === 0) return true;
  const results = group.children.map((child) =>
    child.kind === "group" ? evaluateGroup(record, child) : evaluateRule(record, child)
  );
  return group.combinator === "AND" ? results.every(Boolean) : results.some(Boolean);
}

export function filterRecords(records: OrderRecord[], root: Group): OrderRecord[] {
  return records.filter((r) => evaluateGroup(r, root));
}
