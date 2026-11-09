// Golden parity with the API: every fixture package × R-001…R-009, az and en text character for character.
import { describe, expect, it } from "vitest";
import golden from "../../../fixtures/check-messages.json";
import expected from "../../../fixtures/expected.json";
import { info } from "../src/engine/status";
import { createMockDb } from "../src/store";

const ids = Object.fromEntries(
  Object.entries(expected.packages).map(([inv, e]) => [inv, e.package_id]),
);

describe("mock rule messages = API messages (fixtures/check-messages.json)", () => {
  it.each(Object.entries(golden))("%s", (inv, want) => {
    const db = createMockDb();
    const got = Object.fromEntries(
      info(db, db.pkg(ids[inv]!)).checks.map((c) => [
        c.rule_id,
        { az: c.message, en: c.message_en },
      ]),
    );
    expect(got).toEqual(want);
  });
});
