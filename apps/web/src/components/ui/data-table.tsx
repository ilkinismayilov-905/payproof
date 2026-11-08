"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TData/TValue are required by the interface
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "right";
  }
}

export type Sort = { id: string; desc: boolean };

const SORTED = {
  asc: { aria: "ascending", Icon: ArrowUp },
  desc: { aria: "descending", Icon: ArrowDown },
  none: { aria: "none", Icon: ArrowUpDown },
} as const;

interface Props<T> {
  /** Accessible table name (visually hidden). */
  caption: string;
  columns: ColumnDef<T>[];
  data: T[];
  getRowId: (row: T) => string;
  /** Sorting is done by the server; the screen keeps it (in the URL) and passes it in. */
  sort?: Sort | null;
  onSortChange?: (sort: Sort) => void;
  /** Shown in a full-width row when there is no data. */
  empty: ReactNode;
}

/** Prototype `.table`: sortable headers announce their state with `aria-sort`. */
export function DataTable<T>({
  caption,
  columns,
  data,
  getRowId,
  sort = null,
  onSortChange,
  empty,
}: Props<T>) {
  // TanStack Table returns non-memoizable functions; React Compiler is off here, nothing to skip.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSorting: Boolean(onSortChange),
    // opt-in per column: the API sorts by a fixed list of keys (openapi `sort`), others would 422
    defaultColumn: { enableSorting: false },
    state: { sorting: sort ? [sort] : [] },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const label = flexRender(column.columnDef.header, header.getContext());
                const { aria, Icon } = SORTED[sorted || "none"];
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={column.getCanSort() ? aria : undefined}
                    className={cn(
                      "border-border bg-surface-2 text-text-3 border-b px-4 py-2.5 text-left text-xs font-bold tracking-wide whitespace-nowrap uppercase",
                      column.columnDef.meta?.align === "right" && "text-right",
                    )}
                  >
                    {column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.({ id: column.id, desc: sorted === "asc" })}
                        className="hover:text-text focus-visible:ring-ring inline-flex min-h-6 items-center gap-1 rounded-sm uppercase outline-none focus-visible:ring-2 pointer-coarse:min-h-11"
                      >
                        {label}
                        <Icon
                          aria-hidden
                          className={cn("size-[13px]", sorted ? "text-brand" : "opacity-55")}
                        />
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-border hover:bg-surface-2 border-b transition-colors duration-base last:border-b-0"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    "px-4 py-3 align-middle",
                    cell.column.columnDef.meta?.align === "right" && "text-right tabular-nums",
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={table.getVisibleLeafColumns().length}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
