import { unwrap } from "@payproof/api-client";
import { describe, expect, it } from "vitest";
import { as, mock, pkgId } from "./api";
import { assertSchema } from "./contract";

const KEY = (k: string) => `00000000-0000-4000-8000-${k.padStart(12, "0")}`;
const approve = (api: Awaited<ReturnType<typeof as>>, n: number, key: string, v = 1, rs = 2) =>
  api.POST("/v1/packages/{package_id}/approve", {
    params: { path: { package_id: pkgId(n) }, header: { "Idempotency-Key": KEY(key) } },
    body: { expected_version: v, expected_requirement_set_version: rs, documents_reviewed: true },
  });

describe("approval handlers (state-machines.md order)", () => {
  it("operator → 403; approver approves INV-1038; repeat (new key) → same approval, no new event", async () => {
    await expect(approve(await as("u1"), 1038, "1")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    const api = await as("u2");
    const first = await unwrap(approve(api, 1038, "2"));
    assertSchema("ApprovalRecord", first);
    const events = mock.db.audit.length;
    expect(await unwrap(approve(api, 1038, "3"))).toEqual(first);
    expect(mock.db.audit.length).toBe(events);
  });

  it("stale package or rule set version → 409 VERSION_CONFLICT", async () => {
    const api = await as("u2");
    await expect(approve(api, 1038, "4", 2)).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
    await expect(approve(api, 1038, "5", 1, 1)).rejects.toMatchObject({
      code: "VERSION_CONFLICT",
      details: { current_requirement_set_version: 2 },
    });
  });

  it("a blocked package → 409 PACKAGE_NOT_READY with its blockers", async () => {
    await expect(approve(await as("u2"), 1042, "6")).rejects.toMatchObject({
      code: "PACKAGE_NOT_READY",
      details: { status: "NEEDS_REVIEW", blocking: ["R-001", "R-002", "R-007"] },
    });
  });

  it("exports INV-1035 once; re-export returns the same export", async () => {
    const api = await as("u1");
    const d = await unwrap(
      api.GET("/v1/packages/{package_id}", { params: { path: { package_id: pkgId(1035) } } }),
    );
    const body = {
      expected_version: 1,
      expected_requirement_set_version: 1,
      document_version_ids: d.documents.map((x) => x.current.id),
    };
    const opts = (k: string) => ({
      params: { path: { package_id: pkgId(1035) }, header: { "Idempotency-Key": KEY(k) } },
      body,
    });
    const first = await unwrap(api.POST("/v1/packages/{package_id}/export", opts("7")));
    assertSchema("ExportResult", first);
    const again = await unwrap(api.POST("/v1/packages/{package_id}/export", opts("8")));
    expect(again.export).toEqual(first.export);
    expect(mock.db.pkg("pkg_1035").exports).toHaveLength(1);
  });

  it("export without the invoice → 422 INVOICE_REQUIRED; not approved → 409", async () => {
    const api = await as("u1");
    const d = await unwrap(
      api.GET("/v1/packages/{package_id}", { params: { path: { package_id: pkgId(1035) } } }),
    );
    const ids = d.documents.filter((x) => x.type !== "invoice").map((x) => x.current.id);
    const send = (n: number, v: number, rs: number, k: string, document_version_ids: string[]) =>
      api.POST("/v1/packages/{package_id}/export", {
        params: { path: { package_id: pkgId(n) }, header: { "Idempotency-Key": KEY(k) } },
        body: { expected_version: v, expected_requirement_set_version: rs, document_version_ids },
      });
    await expect(send(1035, 1, 1, "9", ids)).rejects.toMatchObject({
      code: "INVOICE_REQUIRED",
      status: 422,
    });
    const r = await unwrap(
      api.GET("/v1/packages/{package_id}", { params: { path: { package_id: pkgId(1038) } } }),
    );
    await expect(send(1038, 1, 2, "10", [r.documents[0]!.current.id])).rejects.toMatchObject({
      code: "PACKAGE_NOT_READY",
    });
  });
});
