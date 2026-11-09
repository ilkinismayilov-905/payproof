import { afterEach, describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  formatMoney,
  formatQuantity,
} from "../src/format";
import * as i18n from "../src/i18n";
import * as az from "../src/i18n/az";
import * as en from "../src/i18n/en";
import { setLocale } from "../src/locale";

afterEach(() => setLocale("az"));

// Every leaf as "path" → kind: a missing or extra key in either language fails the comparison.
function leaves(value: unknown, path = ""): Record<string, string> {
  if (typeof value === "string") return { [path]: value.trim() ? "string" : "EMPTY" };
  if (typeof value === "function") return { [path]: `function/${value.length}` };
  return Object.assign(
    {},
    ...Object.entries(value as object).map(([k, v]) => leaves(v, path ? `${path}.${k}` : k)),
  );
}

describe("every i18n key has an az and an en value", () => {
  it("en.ts has exactly the keys of az.ts, no empty strings", () => {
    expect(leaves(en)).toEqual(leaves(az));
    expect(Object.values(leaves(az))).not.toContain("EMPTY");
  });

  it.each(["Payment secured", "Invoice paid", "Fraud detected", "AI checked everything"])(
    "en never says %j",
    (phrase) => expect(JSON.stringify(en).toLowerCase()).not.toContain(phrase.toLowerCase()),
  );
});

describe("texts follow the current locale", () => {
  it("maps and functions switch without re-importing", () => {
    expect(i18n.packageStatusLabel.APPROVED_READY).toBe("Göndərilməyə hazır");
    setLocale("en");
    expect(i18n.packageStatusLabel.APPROVED_READY).toBe("Ready to send");
    expect(i18n.ruleLabel("R-005")).toBe("Unit price match");
    expect(i18n.shellText.nav.tasks).toBe("Tasks");
    expect(i18n.loginText.signedInAs("Aygün")).toBe("Signed in as Aygün.");
    expect(Object.keys(i18n.checkOutcomeLabel)).toEqual(Object.keys(az.checkOutcomeLabel));
    expect(Object.values(i18n.checkOutcomeLabel)).toEqual(Object.values(en.checkOutcomeLabel));
  });

  it("defineTexts keeps both languages side by side", () => {
    const t = i18n.defineTexts({
      az: { hi: "Salam", n: (k: number) => `${k} ədəd` },
      en: { hi: "Hello", n: (k) => `${k} pcs` },
    });
    expect([t.hi, t.n(2)]).toEqual(["Salam", "2 ədəd"]);
    setLocale("en");
    expect([t.hi, t.n(2)]).toEqual(["Hello", "2 pcs"]);
  });
});

describe("format in en-GB", () => {
  it("groups money and quantities the English way, still from strings", () => {
    setLocale("en");
    expect(formatMoney("12000.00", "AZN")).toBe("12,000.00 AZN");
    expect(formatMoney({ amount: "-500.00", currency: "USD" })).toBe("−500.00 USD");
    expect(formatQuantity("12.500")).toBe("12.5");
    expect(formatQuantity("1200")).toBe("1,200");
  });

  it("writes dates as dd/mm/yyyy on the Baku clock and English month names", () => {
    setLocale("en");
    expect(formatDate("2026-11-03")).toBe("03/11/2026");
    expect(formatDateTime("2026-11-03T05:12:00Z")).toBe("03/11/2026, 09:12");
    expect(formatDateLong("2026-11-08")).toBe("8 November 2026");
  });
});
