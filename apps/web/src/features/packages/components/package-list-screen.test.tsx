import { mockIds } from "@payproof/mocks";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { setToken } from "@/lib/auth";
import { renderWithQuery } from "@/test/render";
import { PackageListScreen } from "./package-list-screen";

const nav = vi.hoisted(() => ({ search: "", push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
}));
beforeEach(() => {
  setToken(`mock.${mockIds.user("u1")}`);
  nav.search = "";
  nav.push.mockClear();
});

const table = () => screen.findByRole("table", { name: "Faktura paketləri" });
const bodyRows = async () =>
  within(await table())
    .getAllByRole("row")
    .slice(1);

test("all packages with every column, newest change first", async () => {
  renderWithQuery(<PackageListScreen />);
  expect(await bodyRows()).toHaveLength(14);
  const headers = within(await table())
    .getAllByRole("columnheader")
    .map((h) => h.textContent);
  expect(headers).toEqual([
    "Faktura №",
    "Müştəri",
    "Tarix",
    "Məbləğ",
    "Vəziyyət",
    "Bloklayan",
    "Məsul şəxs",
    "Son yenilənmə",
  ]);
  expect(screen.getByRole("columnheader", { name: /Son yenilənmə/ })).toHaveAttribute(
    "aria-sort",
    "descending",
  );
  expect(screen.getByText("Göstərilir: 14 / 14 paket")).toBeInTheDocument();
});

test("a shared link opens the same filtered view", async () => {
  nav.search = "status=NEEDS_FIX";
  renderWithQuery(<PackageListScreen />);
  const rows = await bodyRows();
  expect(rows).toHaveLength(4);
  rows.forEach((r) => expect(r).toHaveTextContent("Düzəliş tələb edir"));
});

test("row click and header sort update the URL", async () => {
  renderWithQuery(<PackageListScreen />);
  const [first] = await bodyRows();
  await userEvent.click(within(first!).getAllByRole("cell")[1]!);
  expect(nav.push).toHaveBeenLastCalledWith(expect.stringMatching(/^\/packages\/0193a000-/));
  await userEvent.click(screen.getByRole("button", { name: /Məbləğ/ }));
  expect(nav.push).toHaveBeenLastCalledWith("/packages?sort=total", { scroll: false });
});

test("nothing matches: say so and offer to clear the filters", async () => {
  nav.search = "q=YOX-999&sort=-total";
  renderWithQuery(<PackageListScreen />);
  expect(
    await screen.findByRole("heading", { name: "Heç bir paket tapılmadı" }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Filtrləri təmizlə" }));
  expect(nav.push).toHaveBeenLastCalledWith("/packages?sort=-total", { scroll: false }); // sort survives
});
