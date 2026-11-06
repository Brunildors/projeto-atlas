import { useMemo, useState } from "react";
import type { Column, SortState } from "../types";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
  emptyMessage = "Nada para mostrar.",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;

    const pick = column.sortValue;

    return [...rows].sort((a, b) => {
      const left = pick(a);
      const right = pick(b);

      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "pt-BR");

      return sort.dir === "asc" ? result : -result;
    });
  }, [rows, columns, sort]);

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sort?.key === column.key;
              const ariaSort = isSorted
                ? sort.dir === "asc"
                  ? "ascending"
                  : "descending"
                : undefined;

              return (
                <th
                  key={column.key}
                  className={column.align === "right" ? "num" : undefined}
                  aria-sort={ariaSort}
                >
                  {column.sortValue ? (
                    <button type="button" className="th-sort" onClick={() => toggleSort(column.key)}>
                      {column.header}
                      <span aria-hidden="true">
                        {isSorted ? (sort.dir === "asc" ? " ↑" : " ↓") : " ↕"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={getKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === "right" ? "num" : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sortedRows.length === 0 && <p className="empty">{emptyMessage}</p>}
    </div>
  );
}
