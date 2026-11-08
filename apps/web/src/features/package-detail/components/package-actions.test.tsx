import type { Schemas } from "@payproof/api-client";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PackageActions } from "./package-actions";

const ui = (status: Schemas["PackageStatus"], pending = false) =>
  render(<PackageActions status={status} recheck={{ onClick: () => {}, pending }} />);
const names = () => screen.getAllByRole("button").map((b) => b.textContent);

test.each([
  ["READY_FOR_APPROVAL", "Təsdiqlə"],
  ["APPROVED_READY", "İxrac et"],
  ["EXPORTED", "Manifesti yenidən yüklə"],
] as const)("%s → primary action %s", (status, primary) => {
  ui(status);
  expect(names()).toEqual(["Yenidən yoxla", "Sənəd yüklə", primary]);
});

test.each(["NEEDS_FIX", "NEEDS_REVIEW", "PROCESSING"] as const)(
  "%s → approval is visibly blocked, with the reason",
  (status) => {
    ui(status);
    const approve = screen.getByRole("button", { name: "Təsdiqlə" });
    expect(approve).toHaveAttribute("aria-disabled", "true");
    expect(approve).toHaveAccessibleDescription(/Bloklayan yoxlamalar var|Sənədlər emal olunur/);
  },
);

test("actions that arrive in later steps are inert but focusable and explained", () => {
  ui("READY_FOR_APPROVAL");
  for (const b of screen.getAllByRole("button").filter((b) => b.textContent !== "Yenidən yoxla")) {
    expect(b).toHaveAttribute("aria-disabled", "true");
    expect(b).not.toBeDisabled(); // stays in the tab order, so the reason can be read
  }
});

test("re-check shows its progress", () => {
  ui("NEEDS_FIX", true);
  expect(screen.getByRole("button", { name: "Yoxlanılır…" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});
