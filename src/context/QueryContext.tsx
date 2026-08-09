import React, { createContext, useContext, useMemo, useState } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { ChartConfig, Group, OrderRecord } from "../types";
import { ALL_ORDERS, DEFAULT_TABLE_COLUMNS } from "../schema";
import { filterRecords } from "../query/evaluate";

function emptyRoot(): Group {
  return { kind: "group", id: uuidv4(), combinator: "AND", children: [] };
}

export function newChart(index: number): ChartConfig {
  return {
    id: uuidv4(),
    title: `Chart ${index}`,
    type: "bar",
    xField: "",
    yField: "",
    aggregation: "count",
  };
}

interface QueryContextValue {
  root: Group;
  setRoot: (g: Group) => void;
  filteredResults: OrderRecord[];
  resetQuery: () => void;

  tableColumns: string[];
  setTableColumns: (cols: string[]) => void;

  groupByFields: string[];
  setGroupByFields: (fields: string[]) => void;

  charts: ChartConfig[];
  setCharts: (c: ChartConfig[]) => void;
}

const QueryContext = createContext<QueryContextValue | undefined>(undefined);

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [root, setRoot] = useState<Group>(emptyRoot());
  const [tableColumns, setTableColumns] = useState<string[]>(DEFAULT_TABLE_COLUMNS);
  const [groupByFields, setGroupByFields] = useState<string[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([newChart(1)]);

  const filteredResults = useMemo(() => filterRecords(ALL_ORDERS, root), [root]);

  const resetQuery = () => setRoot(emptyRoot());

  return (
    <QueryContext.Provider
      value={{
        root,
        setRoot,
        filteredResults,
        resetQuery,
        tableColumns,
        setTableColumns,
        groupByFields,
        setGroupByFields,
        charts,
        setCharts,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
};

export function useQuery(): QueryContextValue {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error("useQuery must be used within QueryProvider");
  return ctx;
}

export { emptyRoot };
