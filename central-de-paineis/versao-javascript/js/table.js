import { h, useMemo, useState } from "./react.js";

export function DataTable({ columns, rows, getKey, emptyMessage = "Nada para mostrar." }) {
  const [sort, setSort] = useState(null);

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

  function toggleSort(key) {
    setSort((current) =>
      current?.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  }

  return h(
    "div",
    { className: "table-wrap" },
    h(
      "table",
      null,
      h(
        "thead",
        null,
        h(
          "tr",
          null,
          columns.map((column) => {
            const isSorted = sort?.key === column.key;
            const ariaSort = isSorted
              ? sort.dir === "asc"
                ? "ascending"
                : "descending"
              : undefined;

            return h(
              "th",
              {
                key: column.key,
                className: column.align === "right" ? "num" : undefined,
                "aria-sort": ariaSort,
              },
              column.sortValue
                ? h(
                    "button",
                    { type: "button", className: "th-sort", onClick: () => toggleSort(column.key) },
                    column.header,
                    h(
                      "span",
                      { "aria-hidden": "true" },
                      isSorted ? (sort.dir === "asc" ? " ↑" : " ↓") : " ↕",
                    ),
                  )
                : column.header,
            );
          }),
        ),
      ),

      h(
        "tbody",
        null,
        sortedRows.map((row) =>
          h(
            "tr",
            { key: getKey(row) },
            columns.map((column) =>
              h(
                "td",
                { key: column.key, className: column.align === "right" ? "num" : undefined },
                column.render(row),
              ),
            ),
          ),
        ),
      ),
    ),

    sortedRows.length === 0 && h("p", { className: "empty" }, emptyMessage),
  );
}
