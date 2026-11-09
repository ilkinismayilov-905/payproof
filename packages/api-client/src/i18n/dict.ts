import { getLocale } from "../locale";

/** Same shape as an Azerbaijani text map, with plain strings: an English map must have every key. */
export type Dict<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : { [K in keyof T]: Dict<T[K]> };

/**
 * Live view of a text map: every property read picks the current locale, so call sites keep
 * `texts.key` and switch language without re-importing. Read it during render, never at module level.
 */
export function live<T extends object>(byLocale: { az: T; en: Dict<T> }): T {
  const pick = () => byLocale[getLocale()] as T;
  if (typeof byLocale.az === "function")
    return ((...args: unknown[]) => (pick() as (...a: unknown[]) => unknown)(...args)) as T;
  return new Proxy(byLocale.az, { get: (_, key) => Reflect.get(pick(), key) });
}

/** A feature's texts in both languages side by side: `export const fooText = defineTexts({ az: {…}, en: {…} })`. */
export function defineTexts<T extends object>(texts: { az: T; en: Dict<T> }): T {
  definedTexts.push(texts);
  return live(texts);
}

/** Every `defineTexts` pair, for the az/en key-parity test. */
export const definedTexts: { az: object; en: object }[] = [];
