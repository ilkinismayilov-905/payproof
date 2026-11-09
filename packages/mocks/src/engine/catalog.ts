// Rule titles and problem categories in the request language: az from @payproof/api-client i18n,
// en = apps/api domain/rules/catalog.py.
import { ruleCategory, ruleTitle } from "@payproof/api-client/i18n";
import { locale } from "../i18n";

const TITLE_EN: Record<string, string> = {
  "R-001": "Mandatory purchase order number (PO)",
  "R-002": "PO matches an approved order",
  "R-003": "Parties match",
  "R-004": "Currency and unit match",
  "R-005": "Unit price match",
  "R-006": "Quantity match",
  "R-007": "Mandatory delivery note",
  "R-008": "Signature requirement (human review)",
  "R-009": "Totals add up",
};

const CATEGORY_EN: Record<string, string> = {
  "R-001": "PO reference",
  "R-002": "PO reference",
  "R-003": "Party mismatch",
  "R-004": "Currency / unit",
  "R-005": "Price / quantity",
  "R-006": "Price / quantity",
  "R-007": "Delivery note",
  "R-008": "Delivery note",
  "R-009": "Total difference",
};

const get = (m: Record<string, string>, id: string) => m[id] ?? id;
export const ruleTitleOf = (id: string) => get(locale() === "en" ? TITLE_EN : ruleTitle, id);
export const ruleCategoryOf = (id: string) =>
  get(locale() === "en" ? CATEGORY_EN : ruleCategory, id);
