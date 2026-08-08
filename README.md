# Order Query Builder (React Native / Expo)

A mobile app for exploring the 905-order dataset: build filters, view results
in a table, and chart them — all three stay in sync automatically.

## Setup

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a
simulator, or `w` for web.

## What's inside

- **Query tab** — build nested AND/OR filter groups. Tap "Choose field..."
  to search/browse all ~150 order fields (grouped by category: Order Info,
  Pickup, Delivery, Financials, etc.), pick an operator, and set a value.
  Operators adapt to the field's type (text/number/date/boolean/enum).
- **Table tab** — shows the currently filtered orders. Starts with a curated
  set of columns; tap "Columns" to add/remove any field. Tap a column header
  to sort, tap a row for the full record detail.
- **Charts tab** — add chart cards (bar, line, pie, scatter). Each card picks
  an X field, an aggregation (sum/avg/count/min/max), a Y field (if not
  counting), and an optional series/group-by field. Charts always reflect
  the current query filter.
- **Report tab** — generates a shareable PDF combining: a plain-English
  summary of the active filters, snapshots of every configured chart, and
  the filtered table (capped at 200 rows to keep the file size reasonable).
  Uses `expo-print` to render and `expo-sharing` to save/share the file.

## Structure

```
src/
  data/orders.json        # cleaned dataset (nested arrays/objects stripped for v1)
  schema.ts                # auto-generated field definitions (type, group, enum options)
  types.ts                 # Rule/Group/ChartConfig types
  operators.ts              # operator lists per field type
  query/evaluate.ts        # recursive filter evaluation
  query/aggregate.ts       # chart data aggregation
  context/QueryContext.tsx # shared query state -> filteredResults
  components/              # FieldPicker, ValueInput, RuleRow, GroupView, ChartCard
  screens/                 # QueryBuilderScreen, TableScreen, ChartsScreen
```

## Known v1 scope

- Nested list/object fields (truckarray, driverarray, carrierarray, invoice
  details, tax details, etc.) are excluded from filtering/table/charts. They
  need "any/all" sub-queries to be useful — a natural v1.1 addition.
- Saved queries/chart layouts aren't persisted yet (add AsyncStorage — the
  dependency is already installed).
