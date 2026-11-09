import { mockIds } from "@payproof/mocks";
import { server } from "@payproof/mocks/node";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Toaster } from "sonner";
import { beforeEach, expect, test, vi } from "vitest";
import { getToken, setToken } from "@/lib/auth";
import { renderWithQuery } from "@/test/render";
import { UserMenu } from "./user-menu";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
beforeEach(() => setToken(`mock.${mockIds.user("u1")}`));

const openMenu = async () => {
  const trigger = await screen.findByRole("button", { name: /Aygün Məmmədova/ });
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  return screen.findByRole("menu");
};

test("switches to another demo account from the keyboard", async () => {
  renderWithQuery(<UserMenu />);
  await openMenu();
  expect(screen.getByRole("menuitemradio", { name: /Aygün Məmmədova/ })).toBeChecked();
  await userEvent.click(screen.getByRole("menuitemradio", { name: /Rəşad Əliyev/ }));
  expect(await screen.findByRole("button", { name: /Rəşad Əliyev/ })).toHaveAccessibleName(
    /Təsdiqçi/,
  );
  expect(getToken()).toBe(`mock.${mockIds.user("u2")}`);
});

test("dev: resets the demo after a confirmation, then shows the overview", async () => {
  let resets = 0;
  server.use(
    http.post("*/v1/demo/reset", () => (resets++, new HttpResponse(null, { status: 204 }))),
  );
  renderWithQuery(
    <>
      <UserMenu />
      <Toaster />
    </>,
  );
  await openMenu();
  await userEvent.click(screen.getByRole("menuitem", { name: "Demo məlumatlarını sıfırla" }));
  const dialog = await screen.findByRole("alertdialog", { name: "Demonu sıfırlamaq?" });
  expect(resets).toBe(0); // nothing happens before the confirmation
  await userEvent.click(within(dialog).getByRole("button", { name: "Bəli, sıfırla" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/overview"));
  expect(resets).toBe(1);
  expect(await screen.findByText("Demo məlumatları ilkin vəziyyətə qaytarıldı.")).toBeVisible();
});

test("outside dev (no demo login) there is no reset", async () => {
  server.use(http.get("*/v1/auth/dev-users", () => new HttpResponse(null, { status: 404 })));
  renderWithQuery(<UserMenu />);
  await openMenu();
  expect(screen.getByRole("menuitem", { name: "Çıxış" })).toBeVisible();
  expect(screen.queryByRole("menuitem", { name: /sıfırla/ })).toBeNull();
});

test("signs out to the login screen", async () => {
  const { client } = renderWithQuery(<UserMenu />);
  await openMenu();
  await userEvent.click(screen.getByRole("menuitem", { name: "Çıxış" }));
  expect(getToken()).toBeNull();
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
});
