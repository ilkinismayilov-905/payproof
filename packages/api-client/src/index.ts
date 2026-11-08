export { ApiError, createApiClient, unwrap } from "./client";
export type { ApiClient, ApiClientOptions, ErrorCode } from "./client";
export type { components, operations, paths } from "./generated/schema";

import type { components } from "./generated/schema";
/** Contract schema by name: `Schemas["PackageDetail"]`. */
export type Schemas = components["schemas"];
