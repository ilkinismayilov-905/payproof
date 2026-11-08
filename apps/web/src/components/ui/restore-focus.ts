import { useRef } from "react";

/**
 * For Radix dialogs opened from state instead of a Trigger: remember what had focus when the
 * dialog opened and return focus there on close (Radix can't know the opener).
 * Spread onto `Dialog.Content` / `AlertDialog.Content`.
 */
export function useRestoreFocus() {
  const opener = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      opener.current?.focus();
    },
  };
}
