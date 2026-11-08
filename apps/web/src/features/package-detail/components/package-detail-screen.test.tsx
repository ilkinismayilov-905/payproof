import { mockIds } from "@payproof/mocks";
import { screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { setToken } from "@/lib/auth";
import { renderWithQuery } from "@/test/render";
import { PackageDetailScreen } from "./package-detail-screen";

beforeEach(() => setToken(`mock.${mockIds.user("u1")}`));
const PKG_1042 = mockIds.pkg("pkg_1042");

test("loading, then breadcrumb and header with the package's key facts", async () => {
  renderWithQuery(<PackageDetailScreen id={PKG_1042} />);
  expect(screen.getByRole("status")).toHaveTextContent("Yüklənir…");
  expect(await screen.findByRole("heading", { level: 1, name: "INV-1042" })).toBeInTheDocument();
  const crumb = screen.getByRole("navigation", { name: "Yol" });
  expect(within(crumb).getByRole("link", { name: "Faktura paketləri" })).toHaveAttribute(
    "href",
    "/packages",
  );
  expect(crumb).toHaveTextContent("INV-1042");
  const meta = screen.getByRole("list", { name: "Paket məlumatları" });
  expect(meta).toHaveTextContent("B Mağazalar Şəbəkəsi");
  expect(meta).toHaveTextContent("Məbləğ: 12.000,00 AZN");
  expect(meta).toHaveTextContent(/Tarix: \d{2}\.\d{2}\.\d{4}/);
  expect(meta).toHaveTextContent(/Qayda dəsti: v\d+/);
  expect(meta).toHaveTextContent("Məsul: Aygün Məmmədova");
  expect(screen.getByText(/^Paket v\d+$/)).toBeInTheDocument();
});

test("a missing package says so and leads back to the list", async () => {
  renderWithQuery(<PackageDetailScreen id="0193a000-0000-7000-8002-000000009999" />);
  expect(await screen.findByRole("heading", { name: "Paket tapılmadı" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Paketlərə qayıt" })).toHaveAttribute(
    "href",
    "/packages",
  );
});
