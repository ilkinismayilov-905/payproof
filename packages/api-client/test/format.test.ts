import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  formatMoney,
  formatQuantity,
} from "../src/format";

describe("formatMoney (decimal string in, no float math)", () => {
  it.each([
    ["12000.00", "AZN", "12.000,00 AZN"],
    ["29706.00", "AZN", "29.706,00 AZN"],
    ["1800.00", "USD", "1.800,00 USD"],
    ["9.10", "AZN", "9,10 AZN"],
    ["0.00", "AZN", "0,00 AZN"],
    ["1234567890123.45", "AZN", "1.234.567.890.123,45 AZN"],
  ])("%s %s → %s", (amount, currency, expected) => {
    expect(formatMoney(amount, currency)).toBe(expected);
  });

  it("formats negatives with a real minus sign and no currency when omitted", () => {
    expect(formatMoney("-500.00")).toBe("−500,00");
    expect(formatMoney("500.00")).toBe("500,00");
  });

  it("accepts a Money object", () => {
    expect(formatMoney({ amount: "3100.00", currency: "AZN" })).toBe("3.100,00 AZN");
  });

  it("keeps precision a float would lose", () => {
    expect(formatMoney("90071992547409.93", "AZN")).toBe("90.071.992.547.409,93 AZN");
  });

  it.each(["12000", "12000.5", "1,00", "abc", "", "1e3"])("rejects non-contract value %j", (v) => {
    expect(() => formatMoney(v, "AZN")).toThrow();
  });
});

describe("formatQuantity", () => {
  it.each([
    ["800", "800"],
    ["1200", "1.200"],
    ["12.500", "12,5"],
    ["0.125", "0,125"],
  ])("%s → %s", (q, expected) => expect(formatQuantity(q)).toBe(expected));
});

describe("dates (shown in Asia/Baku, UTC+4)", () => {
  it("formatDate: date-only strings never shift", () => {
    expect(formatDate("2026-11-03")).toBe("03.11.2026");
  });
  it("formatDate: timestamps use the Baku calendar day", () => {
    expect(formatDate("2026-11-03T21:30:00Z")).toBe("04.11.2026");
  });
  it("formatDateTime converts UTC to Baku wall-clock time", () => {
    expect(formatDateTime("2026-11-03T05:12:00Z")).toBe("03.11.2026, 09:12");
    expect(formatDateTime("2026-11-03T05:12:00+04:00")).toBe("03.11.2026, 05:12");
  });
  it("formatDateTime of a date-only string is just the date", () => {
    expect(formatDateTime("2026-11-03")).toBe("03.11.2026");
  });
  it("formatDateLong uses Azerbaijani month names", () => {
    expect(formatDateLong("2026-11-08")).toBe("8 noyabr 2026");
    expect(formatDateLong("2026-01-01T20:30:00Z")).toBe("2 yanvar 2026");
  });
  it("rejects garbage", () => {
    expect(() => formatDate("yesterday")).toThrow();
  });
});
