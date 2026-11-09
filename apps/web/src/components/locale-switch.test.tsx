import { shellText } from "@payproof/api-client/i18n";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { Providers } from "@/app/providers";
import { changeLocale } from "@/lib/locale";
import { LocaleSwitch } from "./locale-switch";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
afterEach(() => changeLocale("az"));

const Probe = () => <p>{shellText.nav.tasks}</p>;

test("switching to English re-renders texts, sets <html lang> and is remembered", async () => {
  render(
    <Providers>
      <LocaleSwitch />
      <Probe />
    </Providers>,
  );
  expect(screen.getByText("Tapşırıqlar")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "English" }));
  expect(await screen.findByText("Tasks")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  expect(document.documentElement.lang).toBe("en");
  expect(localStorage.getItem("prefly.locale")).toBe("en");
});
