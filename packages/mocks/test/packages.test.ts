import { describe, expect, it } from "vitest";
import expected from "../../../fixtures/expected.json";
import { createPackage, finishProcessing } from "../src/domain/packages";
import { info } from "../src/engine/status";
import { createMockDb } from "../src/store";

describe("package lifecycle", () => {
  it.each(Object.entries(expected.newsets))(
    "new set %s is PROCESSING, then reaches its expected status",
    async (inv, want) => {
      const db = createMockDb();
      const set = db.newsets.find((n) => n.invoice_number === inv)!;
      const p = await createPackage(
        db,
        { customer_id: set.customer_id, owner_id: "u1", files: set.files },
        "u1",
      );
      expect(p).toMatchObject({ id: `pkg_${inv.slice(4)}`, processing: true, version: 1 });
      expect(info(db, p).status).toBe("PROCESSING");
      finishProcessing(db, p);
      expect(p.order_link).toMatchObject({
        confirmed: true,
        method: "exact_id",
        confirmed_by: "system",
      });
      const i = info(db, p);
      expect(i.status).toBe(want.status);
      expect(i.primary.map((c) => ({ rule_id: c.rule_id, outcome: c.outcome }))).toEqual(
        want.blockers,
      );
    },
  );

  it("rejects files that are not a demo set (mock mode cannot extract them)", async () => {
    const db = createMockDb();
    await expect(
      createPackage(db, { customer_id: "c1", owner_id: "u1", files: ["random.pdf"] }, "u1"),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("reports a duplicate invoice for the same customer", async () => {
    const db = createMockDb();
    const set = db.newsets[0]!;
    await createPackage(
      db,
      { customer_id: set.customer_id, owner_id: "u1", files: set.files },
      "u1",
    );
    await expect(
      createPackage(db, { customer_id: set.customer_id, owner_id: "u1", files: set.files }, "u1"),
    ).rejects.toMatchObject({
      code: "DUPLICATE_INVOICE",
    });
  });
});
