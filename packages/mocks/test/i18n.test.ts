import { describe, expect, it } from "vitest";
import { negotiate } from "../src/i18n";

describe("Accept-Language negotiation = apps/api core/i18n.negotiate", () => {
  it.each([
    [null, "az"],
    ["", "az"],
    ["en", "en"],
    ["en-GB", "en"],
    ["EN-us,az;q=0.5", "en"],
    ["az;q=0.4, en;q=0.8", "en"],
    ["en;q=0.5, az;q=0.5", "en"], // tie keeps header order
    ["az, en", "az"],
    ["en;q=0", "az"],
    ["en;q=abc", "az"],
    ["fr, de;q=0.9", "az"],
    ["fr, en;q=0.1", "en"],
  ])("%s → %s", (header, want) => expect(negotiate(header)).toBe(want));
});
