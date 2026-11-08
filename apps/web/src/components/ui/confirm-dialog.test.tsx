import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

function Harness({ onConfirm }: { onConfirm: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Paketi sil</button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Paket silinsin?"
        description="Bu əməliyyat geri qaytarılmır."
        confirmLabel="Sil"
        onConfirm={onConfirm}
      />
    </>
  );
}

const open = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Paketi sil" }));
  return screen.findByRole("alertdialog", { name: "Paket silinsin?" });
};

test("starts on Cancel, traps focus, Esc closes and returns focus", async () => {
  render(<Harness onConfirm={vi.fn()} />);
  const dialog = await open();
  expect(dialog).toHaveAccessibleDescription("Bu əməliyyat geri qaytarılmır.");
  expect(screen.getByRole("button", { name: "Ləğv et" })).toHaveFocus();

  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Sil" })).toHaveFocus();
  await userEvent.tab(); // wraps around inside the dialog
  expect(screen.getByRole("button", { name: "Ləğv et" })).toHaveFocus();

  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Paketi sil" })).toHaveFocus();
});

test("destructive confirm runs the action and closes", async () => {
  const onConfirm = vi.fn();
  render(<Harness onConfirm={onConfirm} />);
  await open();
  const confirm = screen.getByRole("button", { name: "Sil" });
  expect(confirm).toHaveClass("bg-destructive/10");
  await userEvent.click(confirm);
  expect(onConfirm).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});

test("async confirm: buttons wait, a failure keeps the dialog open", async () => {
  let fail!: (e: Error) => void;
  const onConfirm = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
  render(<Harness onConfirm={onConfirm} />);
  await open();
  await userEvent.click(screen.getByRole("button", { name: "Sil" }));
  expect(screen.getByRole("button", { name: "Sil" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Ləğv et" })).toBeDisabled();

  fail(new Error("409"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Sil" })).toBeEnabled());
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
});
