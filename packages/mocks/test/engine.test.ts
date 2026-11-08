import { describe, expect, it } from "vitest";
import expected from "../../../fixtures/expected.json";
import { evaluate } from "../src/engine";
import { createMockDb } from "../src/store";

const IMPLEMENTED = ["R-001", "R-002", "R-003", "R-004"];
const cases = Object.entries(expected.packages).filter(([, e]) => e.status !== "PROCESSING");

describe("mock rule engine = prototype engine (fixtures/expected.json)", () => {
  it.each(cases)("%s rule outcomes", (_inv, e) => {
    const db = createMockDb();
    const got = Object.fromEntries(
      evaluate(db, db.pkg(e.package_id)).map((c) => [c.rule_id, c.outcome]),
    );
    const want = Object.fromEntries(
      Object.entries(e.checks).filter(([r]) => IMPLEMENTED.includes(r)),
    );
    expect(got).toMatchObject(want);
  });

  it("INV-1042 R-001: FAIL with the prototype message and an invoice quote", () => {
    const db = createMockDb();
    const r001 = evaluate(db, db.pkg("pkg_1042")).find((c) => c.rule_id === "R-001")!;
    expect(r001).toMatchObject({
      outcome: "FAIL",
      cascade: false,
      fix_hint: "upload_invoice",
      message:
        "Müştəri qaydası fakturada sifariş nömrəsi tələb edir, fakturada isə PO göstərilməyib.",
    });
    expect(r001.evidence).toEqual([{ doc: "invoice", hl: "po", quote: "Sifariş №: —" }]);
  });

  it("INV-1047 R-001: unreadable PO is UNKNOWN (never PASS) and cascades to R-002", () => {
    const db = createMockDb();
    const checks = evaluate(db, db.pkg("pkg_1047"));
    expect(checks.find((c) => c.rule_id === "R-001")).toMatchObject({
      outcome: "UNKNOWN",
      fix_hint: "edit_field",
    });
    expect(checks.find((c) => c.rule_id === "R-001")!.evidence[0]!.quote).toBe(
      "Sifariş №: PO-3?7 (oxunmur)",
    );
    expect(checks.find((c) => c.rule_id === "R-002")).toMatchObject({
      outcome: "UNKNOWN",
      cascade: true,
    });
  });

  it("INV-1046 R-003: a delivery note of another buyer FAILs", () => {
    const db = createMockDb();
    const r003 = evaluate(db, db.pkg("pkg_1046")).find((c) => c.rule_id === "R-003")!;
    expect(r003).toMatchObject({ outcome: "FAIL", fix_hint: "upload_delivery" });
    expect(r003.message).toContain("C Restoran Qrupu");
  });

  it("INV-1049 R-004: currency mismatch is UNKNOWN, no automatic conversion", () => {
    const db = createMockDb();
    const r004 = evaluate(db, db.pkg("pkg_1049")).find((c) => c.rule_id === "R-004")!;
    expect(r004.outcome).toBe("UNKNOWN");
    expect(r004.message).toContain("Faktura USD, sifariş AZN");
  });
});
