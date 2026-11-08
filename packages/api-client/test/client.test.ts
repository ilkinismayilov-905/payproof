import { describe, expect, it } from "vitest";
import { ApiError, createApiClient } from "../src";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function setup(
  respond: (req: Request) => Response | Promise<Response>,
  token: string | null = "t0k",
) {
  const seen: Request[] = [];
  const client = createApiClient({
    baseUrl: "http://api.test",
    getToken: () => token,
    fetch: async (input: Request) => {
      seen.push(input);
      return respond(input);
    },
  });
  return { client, seen };
}

describe("createApiClient", () => {
  it("sends the bearer token and returns data on success", async () => {
    const { client, seen } = setup(() => json(200, { items: [] }));
    const { data } = await client.GET("/v1/customers");
    expect(data).toEqual({ items: [] });
    expect(seen[0]!.url).toBe("http://api.test/v1/customers");
    expect(seen[0]!.headers.get("Authorization")).toBe("Bearer t0k");
  });

  it("omits Authorization when there is no token", async () => {
    const { client, seen } = setup(() => json(200, { items: [] }), null);
    await client.GET("/v1/auth/dev-users");
    expect(seen[0]!.headers.has("Authorization")).toBe(false);
  });

  it("throws ApiError with the contract error code, message and status", async () => {
    const body = {
      error: {
        code: "VERSION_CONFLICT",
        message: "Paket v3-ə yenilənib; səhifəni yeniləyin.",
        details: { current_version: 3 },
      },
    };
    const { client } = setup(() => json(409, body));
    const err = await client
      .POST("/v1/packages/{package_id}/validate", {
        params: { path: { package_id: "0193a000-0000-7000-8002-000000001042" } },
        body: { expected_version: 2 },
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      code: "VERSION_CONFLICT",
      status: 409,
      message: body.error.message,
      details: { current_version: 3 },
    });
  });

  it("maps a non-JSON error response to INTERNAL_ERROR", async () => {
    const { client } = setup(() => new Response("<html>Bad gateway</html>", { status: 502 }));
    await expect(client.GET("/v1/me")).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      status: 502,
    });
  });

  it("maps a network failure to NETWORK_ERROR", async () => {
    const { client } = setup(() => {
      throw new TypeError("fetch failed");
    });
    await expect(client.GET("/v1/me")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });
});
