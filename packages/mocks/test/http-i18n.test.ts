// Accept-Language picks the response language (az default), like the API's locale middleware.
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
});
