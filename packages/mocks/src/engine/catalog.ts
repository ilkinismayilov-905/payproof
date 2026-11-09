// Rule titles and problem categories in the request language — @payproof/api-client i18n
// (same text as apps/api domain/rules/catalog.py).
import { ruleCategory, ruleTitle } from "@payproof/api-client/i18n";
import { inLocale, locale } from "../i18n";

const get = (m: Record<string, string>, id: string) => inLocale(locale(), () => m[id] ?? id);
export const ruleTitleOf = (id: string) => get(ruleTitle, id);
export const ruleCategoryOf = (id: string) => get(ruleCategory, id);
