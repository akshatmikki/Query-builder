import orders from "./data/orders.json";
import { FieldDef, FieldType, OrderRecord } from "./types";

const DATE_KEY_HINTS = ["date", "on", "from", "to"];
const ENUM_MAX_DISTINCT = 25;

// Manually curated groupings for the most-used fields. Anything not listed
// here falls into "Other" automatically, so the schema always covers all
// fields even as the underlying dataset changes.
const GROUP_MAP: Record<string, string> = {
  ordernumber: "Order Info",
  orderstatus: "Order Info",
  statuscode: "Order Info",
  orderformtype: "Order Info",
  orderdate: "Order Info",
  enquirydate: "Order Info",
  quotationdate: "Order Info",
  customercode: "Customer",
  customername: "Customer",
  customermobile: "Customer",
  customerorderno: "Customer",
  pickupdate: "Pickup",
  pickupnumber: "Pickup",
  pickupnotes: "Pickup",
  pickupstopcode: "Pickup",
  pickuplocationname: "Pickup",
  pickupfulladdress: "Pickup",
  deliverydate: "Delivery",
  deliverynumber: "Delivery",
  deliverynotes: "Delivery",
  deliverystopcode: "Delivery",
  deliverylocationname: "Delivery",
  deliveryfulladdress: "Delivery",
  freightcharges: "Financials",
  fuelcharges: "Financials",
  othercharges: "Financials",
  totalfreight: "Financials",
  grosstotalfreight: "Financials",
  totaltaxamount: "Financials",
  totaltaxpercent: "Financials",
  pretaxamount: "Financials",
  totaladdition: "Financials",
  totaldeduction: "Financials",
  currencycode: "Financials",
  valueofgoods: "Financials",
  offeredamount: "Financials",
  outprofitamount: "Financials",
  accountingstatus: "Financials",
  distance: "Shipment",
  distanceunit: "Shipment",
  weight: "Shipment",
  weightunit: "Shipment",
  quantity: "Shipment",
  quantityunit: "Shipment",
  equipmenttype: "Shipment",
  loadtypelucode: "Shipment",
  commodityname: "Shipment",
  hazmat: "Compliance",
  overdimension: "Compliance",
  csa: "Compliance",
  pip: "Compliance",
  fast: "Compliance",
  ctpat: "Compliance",
  isbid: "Compliance",
  isarchived: "Compliance",
  isdeleted: "Compliance",
  isactive: "Compliance",
  salesmancode: "Salesman",
  salesmanname: "Salesman",
  createdby: "Audit",
  createdon: "Audit",
  modifiedby: "Audit",
  modifiedon: "Audit",
  callsource: "Audit",
};

function inferType(key: string, values: unknown[]): FieldType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "text";

  const jsTypes = new Set(nonNull.map((v) => typeof v));
  if (jsTypes.size === 1 && jsTypes.has("boolean")) return "boolean";

  if (jsTypes.has("number") || (jsTypes.has("string") && nonNull.every((v) => !isNaN(Number(v))))) {
    if (jsTypes.has("number")) return "number";
  }

  const lowerKey = key.toLowerCase();
  if (DATE_KEY_HINTS.some((h) => lowerKey.endsWith(h)) || lowerKey.includes("date")) {
    const looksLikeDate = nonNull.every(
      (v) => typeof v === "string" && !isNaN(Date.parse(v as string))
    );
    if (looksLikeDate) return "date";
  }

  if (jsTypes.has("string")) {
    const distinct = new Set(nonNull as string[]);
    if (distinct.size <= ENUM_MAX_DISTINCT) return "enum";
    return "text";
  }

  return "text";
}

function buildFieldDefs(): FieldDef[] {
  const data = orders as OrderRecord[];
  const sample = data.slice(0, 400); // enough to infer type/cardinality reliably
  const keys = Object.keys(data[0] || {}).filter(
    (k) => typeof data[0][k] !== "object" || data[0][k] === null
  );

  return keys
    .map((key) => {
      const values = sample.map((r) => r[key]);
      const type = inferType(key, values);
      const def: FieldDef = {
        key,
        label: humanize(key),
        type,
        group: GROUP_MAP[key] || "Other",
      };
      if (type === "enum") {
        const distinct = Array.from(
          new Set(
            data
              .map((r) => r[key])
              .filter((v) => v !== null && v !== undefined && v !== "") as string[]
          )
        ).sort();
        def.options = distinct;
      }
      return def;
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export const FIELD_SCHEMA: FieldDef[] = buildFieldDefs();

export const FIELD_GROUPS: string[] = Array.from(
  new Set(FIELD_SCHEMA.map((f) => f.group))
).sort();

export function getFieldDef(key: string): FieldDef | undefined {
  return FIELD_SCHEMA.find((f) => f.key === key);
}

export const DEFAULT_TABLE_COLUMNS = [
  "ordernumber",
  "customername",
  "orderstatus",
  "orderdate",
  "pickupdate",
  "deliverydate",
  "freightcharges",
  "totalfreight",
  "equipmenttype",
];

export const ALL_ORDERS = orders as OrderRecord[];
