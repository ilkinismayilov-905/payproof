import { describe, expect, it } from "vitest";
import { deletePackage } from "../src/domain/packages";
import { saveRequirements } from "../src/domain/rules";
import { info } from "../src/engine/status";
import { createMockDb } from "../src/store";

describe("delete and requirement changes", () => {
  it("deletes only packages that were never approved (soft, audited)", () => {
    const db = createMockDb();
    deletePackage(db, db.pkg("pkg_1043"), "u1");
    expect(db.pkg("pkg_1043").deleted).toBe(true);
    expect(db.tasks.some((t) => t.package_id === "pkg_1043")).toBe(false);
    expect(db.audit.at(-1)).toMatchObject({ action: "package.deleted", actor_id: "u1" });
    for (const id of ["pkg_1036", "pkg_1038"])
      expect(() => deletePackage(db, db.pkg(id), "u1")).toThrow(
        expect.objectContaining({ code: "PACKAGE_NOT_DELETABLE", status: 409 }),
      );
  });

  it("a new rule set invalidates approvals of not-exported packages and re-validates", () => {
    const db = createMockDb();
    const c2 = db.customer("c2");
    const set = saveRequirements(
      db,
      c2,
      {
        ...c2.requirement_sets[0]!,
        effective_from: "2026-12-01",
        reason: "Dekabrdan imza tələb olunur.",
      },
      "u2",
    );
    expect(set).toMatchObject({ version: 2, approved_by: "u2" });
    expect(db.pkg("pkg_1035").approvals[0]).toMatchObject({ valid: false });
    expect(info(db, db.pkg("pkg_1035")).status).toBe("READY_FOR_APPROVAL");
    expect(info(db, db.pkg("pkg_1031")).status).toBe("EXPORTED");
    expect(db.pkg("pkg_1031").approvals[0]!.valid).toBe(true);
  });
});
