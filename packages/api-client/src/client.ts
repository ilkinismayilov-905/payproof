import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./generated/schema";

export type ErrorCode = components["schemas"]["ErrorCode"] | "NETWORK_ERROR";

/** Every non-2xx response and network failure surfaces as ApiError; `message` is Azerbaijani and UI-safe. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Called per request; return null/undefined when signed out. */
  getToken?: () => string | null | undefined;
  /** Custom fetch (tests, MSW in node). */
  fetch?: (input: Request) => Promise<Response>;
}

const UNEXPECTED = "Gözlənilməz xəta baş verdi. Bir az sonra yenidən cəhd edin.";
const OFFLINE = "Serverə qoşulmaq alınmadı. İnternet bağlantısını yoxlayın.";

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.clone().json()) as {
      error?: { code?: ErrorCode; message?: string; details?: Record<string, unknown> };
    };
    if (body.error?.code && body.error.message) {
      return new ApiError(
        body.error.code,
        body.error.message,
        response.status,
        body.error.details ?? {},
      );
    }
  } catch {
    // not JSON — fall through
  }
  return new ApiError("INTERNAL_ERROR", UNEXPECTED, response.status);
}

export function createApiClient({ baseUrl, getToken, fetch }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl, ...(fetch ? { fetch } : {}) });
  const middleware: Middleware = {
    onRequest({ request }) {
      const token = getToken?.();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
    async onResponse({ response }) {
      if (!response.ok) throw await toApiError(response);
      return response;
    },
    onError({ error }) {
      if (error instanceof ApiError) return error;
      return new ApiError("NETWORK_ERROR", OFFLINE, 0);
    },
  };
  client.use(middleware);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
