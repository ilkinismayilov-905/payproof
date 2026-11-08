import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as az from "../src/i18n/az";

const prototype = readFileSync(
  new URL("../../../docs/product/prototype/payproof-prototype.html", import.meta.url),
  "utf8",
);
// Evaluates `const NAME = { … };` from the prototype (trusted repo file, plain object literal).
const literal = (name: string): Record<string, unknown> => {
  const start = prototype.indexOf(`const ${name} = {`);
  if (start < 0) throw new Error(`${name} not found in prototype`);
  const open = prototype.indexOf("{", start);
  const end = prototype.indexOf("};", open);
  return new Function(`return (${prototype.slice(open, end + 1)});`)() as Record<string, unknown>;
};
const labels = (name: string, key = "l") =>
  Object.fromEntries(
    Object.entries(literal(name)).map(([k, v]) => [k, (v as Record<string, string>)[key]]),
  );

describe("az labels match the prototype", () => {
  it("package statuses", () => expect(az.packageStatusLabel).toEqual(labels("PST")));
  it("check outcomes", () => expect(az.checkOutcomeLabel).toEqual(labels("OUT")));
  it("task statuses", () => expect(az.taskStatusLabel).toEqual(labels("TST")));
  it("document version statuses (+ UPLOADED from the glossary)", () =>
    expect(az.documentStatusLabel).toEqual({ ...labels("DST"), UPLOADED: "Yükləndi" }));
  it("document types", () => expect(az.documentTypeLabel).toEqual(literal("TYPE_L")));
  it("rule titles, short names and categories", () => {
    expect(az.ruleTitle).toEqual(labels("RULES", "t"));
    expect(az.ruleShort).toEqual(labels("RULES", "s"));
    expect(az.ruleCategory).toEqual(literal("CAT"));
  });
  it("signed-in roles keep the prototype names", () => {
    const proto = literal("ROLE_L");
    for (const role of ["operator", "approver", "readonly"] as const)
      expect(az.roleLabel[role]).toBe(proto[role]);
  });
});

describe("az texts", () => {
  const all = JSON.stringify(az);
  it.each([
    "Ödəniş təmin edildi",
    "Faktura ödənildi",
    "Fraud aşkarlandı",
    "AI hər şeyi yoxladı",
    "Maliyyə itkisi",
  ])("never says %j", (phrase) => expect(all.toLowerCase()).not.toContain(phrase.toLowerCase()));
  it("says the package is ready to send, not paid", () => {
    expect(az.ui.approvedTitle).toBe("Paket göndərilməyə hazırdır");
  });
});
