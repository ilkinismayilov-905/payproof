import { readFileSync } from "node:fs";
import openapiTS, { astToString } from "openapi-typescript";
import { describe, expect, it } from "vitest";

const contract = new URL("../../contracts/openapi.yaml", import.meta.url);
const committed = readFileSync(new URL("../src/generated/schema.ts", import.meta.url), "utf8");

describe("generated schema", () => {
  it("is up to date with packages/contracts/openapi.yaml (run `pnpm generate`)", async () => {
    const fresh = astToString(await openapiTS(contract));
    // The CLI prepends a banner; compare the generated body only.
    expect(committed.endsWith(fresh)).toBe(true);
  }, 30_000);
});
