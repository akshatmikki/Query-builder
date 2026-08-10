export type FieldType = "text" | "number" | "boolean" | "date" | "enum";

export interface FieldDef {
  key: string; // matches key in order record
  label: string; // human-readable
  type: FieldType;
  group: string; // category for the field picker
  options?: string[]; // populated when type === "enum"
}

export type TextOperator = "equals" | "contains" | "startsWith" | "isEmpty" | "isNotEmpty";
export type NumberOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "between";
export type DateOperator = "before" | "after" | "between" | "onDay";
export type BooleanOperator = "isTrue" | "isFalse";
export type EnumOperator = "in" | "notIn";

export type Operator =
  | TextOperator
  | NumberOperator
  | DateOperator
  | BooleanOperator
  | EnumOperator;

export interface Rule {
  kind: "rule";
  id: string;
  field: string; // FieldDef.key, "" until chosen
  operator: Operator | "";
  value: unknown; // shape depends on field type + operator
}

export type Combinator = "AND" | "OR";

export interface Group {
  kind: "group";
  id: string;
  combinator: Combinator;
  children: Array<Rule | Group>;
}

export type OrderRecord = Record<string, unknown>;

export type ChartType = "bar" | "line" | "pie" | "scatter";
export type Aggregation = "sum" | "avg" | "count" | "min" | "max";
export type DateBucket = "day" | "week" | "month" | "quarter" | "year";

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xField: string; // categorical / date field
  yField: string; // numeric field (ignored for pie/count)
  aggregation: Aggregation;
  seriesField?: string; // optional grouping/series field
  dateBucket?: DateBucket; // only used when xField is a date field; defaults to "month"
  dateRangeOperator?: DateOperator; // optional range filter, only used when xField is a date field
  dateRangeValue?: unknown; // string for before/after/onDay, [string, string] for between
}

export interface SavedQuery {
  id: string;
  name: string;
  root: Group;
  createdAt: string;
}
