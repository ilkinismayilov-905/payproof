import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import preset from "../src/tailwind-preset";
import {
  badgeClass,
  checkOutcomeTone,
  documentStatusTone,
  packageStatusTone,
  taskStatusTone,
} from "../src";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const declared = new Set([...read("../tokens.css").matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const defs = JSON.parse(read("../../../fixtures/schema/defs.json")).$defs;

const leaves = (o: unknown, path = ""): [string, string][] =>
  typeof o === "string"
    ? [[path, o]]
    : Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
const theme = preset.theme as Record<string, unknown>;

describe("tailwind preset", () => {
  it("only references declared token variables (no hex)", () => {
    const values = leaves(theme);
    expect(values.length).toBeGreaterThan(50);
    for (const [path, value] of values) {
      if (["transparent", "currentColor", "inherit", "0", "none"].includes(value)) continue;
      expect(value, path).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
      const refs = [...value.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
      expect(refs.length, path).toBeGreaterThan(0);
      for (const ref of refs) expect(declared.has(ref), `${path} → ${ref}`).toBe(true);
    }
  });
});

describe("status → badge tone", () => {
  it.each([
    ["package_status", packageStatusTone],
    ["outcome", checkOutcomeTone],
    ["task_status", taskStatusTone],
  ])("covers every %s value from the fixtures schema", (def, map) => {
    expect(Object.keys(map).sort()).toEqual([...defs[def].enum].sort());
  });

  it("covers every document version status", () => {
    expect(Object.keys(documentStatusTone).sort()).toEqual([
      "EXTRACTED",
      "FAILED",
      "PROCESSING",
      "REVIEW_REQUIRED",
    ]);
  });

  it("matches the prototype colours for package statuses", () => {
    expect(packageStatusTone).toEqual({
      PROCESSING: "info",
      NEEDS_REVIEW: "warning",
      NEEDS_FIX: "danger",
      READY_FOR_APPROVAL: "brand",
      APPROVED_READY: "success",
      EXPORTED: "neutral",
    });
  });

  it("badge classes use preset colours only", () => {
    const colors = new Set(
      leaves(theme.colors).map(([p]) =>
        p
          .slice(1)
          .replace(/\.DEFAULT$/, "")
          .replace(".", "-"),
      ),
    );
    for (const cls of Object.values(badgeClass).flatMap((c) => c.split(" "))) {
      expect(colors.has(cls.replace(/^(bg|text)-/, "")), cls).toBe(true);
    }
  });
});
