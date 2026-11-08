import { createApiClient } from "@payproof/api-client";
import { getToken } from "./auth";

// In mock mode the MSW worker answers `*/v1/...` on any origin, so the same base URL works for both.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = createApiClient({ baseUrl: API_BASE, getToken });
