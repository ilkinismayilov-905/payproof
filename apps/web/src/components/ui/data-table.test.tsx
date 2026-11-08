import type { ColumnDef } from "@tanstack/react-table";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DataTable, type Sort } from "./data-table";

type Row = { id: string; invoice: string; amount: string };
const rows: Row[] = [
  { id: "1", invoice: "INV-1042", amount: "12.000,00 AZN" },
  { id: "2", invoice: "INV-1043", amount: "500,00 USD" },
];
const columns: ColumnDef<Row>[] = [
  // sorting is opt-in: only columns the API can sort by
  { id: "invoice", header: "Faktura", accessorKey: "invoice", enableSorting: true },
  {
    id: "amount",
    header: "Məbləğ",
    accessorKey: "amount",
    meta: { align: "right" },
  },
];
const ui = (sort: Sort | null, onSortChange = vi.fn(), data = rows) => (
  <DataTable
    caption="Faktura paketləri"
    empty="Paket yoxdur"
    {...{ columns, data, sort, onSortChange }}
    getRowId={(r) => r.id}
  />
);
const invoiceHeader = () => screen.getByRole("columnheader", { name: /Faktura/ });

test("renders a captioned table with header and cells", () => {
  render(ui(null));
  expect(
    within(screen.getByRole("table", { name: "Faktura paketləri" })).getAllByRole("row"),
  ).toHaveLength(3);
  expect(screen.getByRole("cell", { name: "12.000,00 AZN" })).toHaveClass("text-right");
});

test("aria-sort reflects the sort; unsortable columns have neither button nor aria-sort", () => {
  const { rerender } = render(ui(null));
  expect(invoiceHeader()).toHaveAttribute("aria-sort", "none");
  const amount = screen.getByRole("columnheader", { name: "Məbləğ" });
  expect(within(amount).queryByRole("button")).toBeNull();
  expect(amount).not.toHaveAttribute("aria-sort");
  rerender(ui({ id: "invoice", desc: true }));
  expect(invoiceHeader()).toHaveAttribute("aria-sort", "descending");
});

test("clicking a header sorts ascending, then flips", async () => {
  const onSortChange = vi.fn();
  const { rerender } = render(ui(null, onSortChange));
  await userEvent.click(screen.getByRole("button", { name: /Faktura/ }));
  expect(onSortChange).toHaveBeenLastCalledWith({ id: "invoice", desc: false });
  rerender(ui({ id: "invoice", desc: false }, onSortChange));
  expect(invoiceHeader()).toHaveAttribute("aria-sort", "ascending");
  await userEvent.click(screen.getByRole("button", { name: /Faktura/ }));
  expect(onSortChange).toHaveBeenLastCalledWith({ id: "invoice", desc: true });
});

test("no rows → the empty slot spans the table", () => {
  render(ui(null, vi.fn(), []));
  expect(screen.getByRole("cell", { name: "Paket yoxdur" })).toHaveAttribute("colspan", "2");
});
