// Response language from `Accept-Language` (az | en, default az) — same negotiation as apps/api core/i18n.py.
import {
  documentTypeLabel,
  getLocale,
  ruleLabel,
  setLocale as setUiLocale,
} from "@payproof/api-client/i18n";

export type Locale = "az" | "en";
/** User-facing text in both UI languages; az is the default. */
export interface Msg {
  az: string;
  en: string;
}

/** Highest-q supported language (`en-GB` counts as `en`); ties keep header order; else az. */
export function negotiate(header: string | null | undefined): Locale {
  let best: Locale = "az";
  let bestQ = 0;
  for (const part of (header ?? "").split(",")) {
    const [tag = "", ...params] = part.split(";").map((p) => p.trim());
    let q = 1;
    for (const p of params) {
      const i = p.indexOf("=");
      const key = i < 0 ? p : p.slice(0, i);
      if (key.trim().toLowerCase() === "q") {
        const v = i < 0 ? "" : p.slice(i + 1).trim();
        q = v === "" ? 0 : Number(v); // NaN never wins, like Python's ValueError → 0
      }
    }
    const lang = tag.toLowerCase().split("-")[0];
    if ((lang === "az" || lang === "en") && q > bestQ) [best, bestQ] = [lang, q];
  }
  return best;
}

// shortcut: one language per mock at a time (set by each request); concurrent requests with
// different Accept-Language could interleave across awaits — a browser sends one language.
let current: Locale = "az";
export const setLocale = (l: Locale) => void (current = l);
export const locale = () => current;

/** The text in `l` (default: the current request's language); a plain string is the same in both. */
export const tr = (m: string | Msg, l: Locale = current) => (typeof m === "string" ? m : m[l]);

/**
 * Runs api-client helpers (format, i18n labels) in `l`. They follow the UI's locale, which in the
 * browser is the web app's — so the mock switches it only for this synchronous call, then restores it.
 */
export function inLocale<T>(l: Locale, fn: () => T): T {
  const ui = getLocale();
  setUiLocale(l);
  try {
    return fn();
  } finally {
    setUiLocale(ui);
  }
}

/** Both languages of a text built with api-client helpers. */
export const both = (fn: () => string): Msg => ({ az: inLocale("az", fn), en: inLocale("en", fn) });

/** api-client labels in both languages (audit text uses `.az`). */
export const label = {
  doc: (type: keyof typeof documentTypeLabel) => both(() => documentTypeLabel[type]),
  rule: (id: string) => both(() => ruleLabel(id)),
};
