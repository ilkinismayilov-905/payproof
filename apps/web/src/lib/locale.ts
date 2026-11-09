import { DEFAULT_LOCALE, isLocale, type Locale } from "@payproof/api-client/i18n";
import { useSyncExternalStore } from "react";

// The user's language choice, kept per browser; Providers applies it (setLocale, <html lang>, refetch).
const KEY = "prefly.locale";
const listeners = new Set<() => void>();
let chosen: Locale | undefined; // this page's choice, also when storage is blocked

function storedLocale(): Locale {
  if (chosen) return chosen;
  try {
    const value = localStorage.getItem(KEY);
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE; // storage blocked (private mode)
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export function changeLocale(locale: Locale): void {
  chosen = locale;
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    // not persisted; still applied for this page
  }
  listeners.forEach((listener) => listener());
}

/** Current UI language; the server render (and hydration) always uses the default. */
export const useLocale = (): Locale =>
  useSyncExternalStore(subscribe, storedLocale, () => DEFAULT_LOCALE);
