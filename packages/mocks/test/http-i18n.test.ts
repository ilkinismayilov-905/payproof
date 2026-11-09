// Accept-Language picks the response language (az default), like the API's locale middleware.
import { setLocale } from "@payproof/api-client/i18n";
import { describe, expect, it } from "vitest";
import { id } from "../src/ids";
import { BASE, pkgId } from "./api";

async function get(path: string, lang?: string) {
  const login = await fetch(`${BASE}/v1/auth/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: id.user("u1") }),
  });
  const { access_token } = (await login.json()) as { access_token: string };
  const headers: Record<string, string> = { Authorization: `Bearer ${access_token}` };
  if (lang) headers["Accept-Language"] = lang;
  return (await fetch(`${BASE}${path}`, { headers })).json() as Promise<Record<string, any>>;
}

describe("response language", () => {
  it("check messages and titles follow Accept-Language", async () => {
    const r001 = async (lang?: string) =>
      ((await get(`/v1/packages/${pkgId(1042)}`, lang)).checks as any[]).find(
        (c) => c.rule_id === "R-001",
      );
    expect(await r001()).toMatchObject({ title: "Məcburi sifariş nömrəsi (PO)" });
    expect(await r001("en-GB,az;q=0.5")).toMatchObject({
      title: "Mandatory purchase order number (PO)",
      message:
        "The customer rule requires an order number on the invoice, but the invoice shows no PO.",
    });
  });

  it("dashboard top issue category and errors are English on request", async () => {
    const d = await get("/v1/dashboard", "en");
    expect(["PO reference", "Price / quantity", "Delivery note"]).toContain(d.top_issue.category);
    expect((await get(`/v1/packages/${id.pkg("pkg_none")}`, "en")).error).toMatchObject({
      code: "NOT_FOUND",
      message: "Not found.",
    });
    expect((await get(`/v1/packages/${id.pkg("pkg_none")}`)).error.message).toBe(
      "Obyekt tapılmadı.",
    );
  });

  it("INV-1042 detail in English: labels, match reason, no Azerbaijani server text", async () => {
    const d = await get(`/v1/packages/${pkgId(1042)}`, "en");
    const text = JSON.stringify(d);
    for (const az of ["fakturada", "sifariş nömrəsi", "Yoxlama tələb edir"])
      expect(text).not.toContain(az);
    expect(d.link.candidates[0].reason).toBe(
      "Buyer, both product codes (GY-1L, DY-5) and quantities match. Order date: 28/10/2026.",
    );
    expect(d.comparison.rows[0].label).toBe("Order No. (PO)");
    expect(d.fields[0].label).toBe("Order No. (PO)");
    const az = await get(`/v1/packages/${pkgId(1042)}`);
    expect(az.link.candidates[0].reason).toContain("Sifariş tarixi: 28.10.2026.");
  });

  it("seeded notifications serve text_en; az server texts ignore the web UI locale", async () => {
    const n = (await get("/v1/notifications", "en")).items as { text: string }[];
    expect(n.map((x) => x.text)).toContain(
      "INV-1048: 2 possible orders found — a choice is required.",
    );
    setLocale("en"); // the web app's UI language, shared with the mock in the browser
    try {
      const r009 = ((await get(`/v1/packages/${pkgId(1031)}`)).checks as any[]).find(
        (c) => c.rule_id === "R-009",
      );
      expect(r009.message).toMatch(/^Sətirlərin cəmi [\d.]+,\d\d /);
    } finally {
      setLocale("az");
    }
  });
});
