import { FieldType, Operator } from "./types";

export const OPERATORS_BY_TYPE: Record<FieldType, { value: Operator; label: string }[]> = {
  text: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "startsWith", label: "Starts with" },
    { value: "isEmpty", label: "Is empty" },
    { value: "isNotEmpty", label: "Is not empty" },
  ],
  number: [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "gt", label: ">" },
    { value: "gte", label: "≥" },
    { value: "lt", label: "<" },
    { value: "lte", label: "≤" },
    { value: "between", label: "Between" },
  ],
  date: [
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
    { value: "onDay", label: "On day" },
  ],
  boolean: [
    { value: "isTrue", label: "Is true" },
    { value: "isFalse", label: "Is false" },
  ],
  enum: [
    { value: "in", label: "Is any of" },
    { value: "notIn", label: "Is none of" },
  ],
};

export function operatorNeedsNoValue(op: Operator | ""): boolean {
  return op === "isEmpty" || op === "isNotEmpty" || op === "isTrue" || op === "isFalse";
}

export function operatorNeedsRange(op: Operator | ""): boolean {
  return op === "between";
}
