// `@payproof/api-client/i18n`: every text follows the current locale (`setLocale`), az by default.
// Dictionaries: az.ts (source) and en.ts (same keys). New feature texts: `defineTexts({ az, en })`.

import * as az from "./az";
import { live } from "./dict";
import * as en from "./en";

type Az = typeof az;
const pick = <K extends keyof Az>(name: K): Az[K] =>
  live({ az: az[name], en: en[name] } as { az: Az[K]; en: never });

export type { CheckRuleId, RuleId } from "./az";
export { defineTexts, type Dict } from "./dict";
export { DEFAULT_LOCALE, getLocale, isLocale, LOCALES, setLocale, type Locale } from "../locale";

export const packageStatusLabel = pick("packageStatusLabel");
export const checkOutcomeLabel = pick("checkOutcomeLabel");
export const taskStatusLabel = pick("taskStatusLabel");
export const documentStatusLabel = pick("documentStatusLabel");
export const documentTypeLabel = pick("documentTypeLabel");
export const roleLabel = pick("roleLabel");
export const permissionLabel = pick("permissionLabel");
export const ruleTitle = pick("ruleTitle");
export const ruleLabel = pick("ruleLabel");
export const ruleShort = pick("ruleShort");
export const ruleCategory = pick("ruleCategory");
export const fieldReviewStatusLabel = pick("fieldReviewStatusLabel");
export const comparisonStateLabel = pick("comparisonStateLabel");
export const jobStatusLabel = pick("jobStatusLabel");
export const linkMethodLabel = pick("linkMethodLabel");
export const fixHintLabel = pick("fixHintLabel");
export const errorFallback = pick("errorFallback");
export const ui = pick("ui");
export const loginText = pick("loginText");
export const shellText = pick("shellText");
export const actionLabel = pick("actionLabel");
export const localeText = pick("localeText");
