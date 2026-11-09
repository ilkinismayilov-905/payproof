// UI language, shared by i18n texts, format helpers and the Accept-Language header.
// One user per browser tab, so a module-level value is enough; the server always renders `az`.

export const LOCALES = ["az", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "az";

let current: Locale = DEFAULT_LOCALE;

export const getLocale = (): Locale => current;

export function setLocale(locale: Locale): void {
  current = locale;
}

export const isLocale = (value: unknown): value is Locale =>
  (LOCALES as readonly unknown[]).includes(value);
