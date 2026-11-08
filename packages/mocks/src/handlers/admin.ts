// Create a package from a demo document set (async job), delete a never-approved package.
import { http, HttpResponse } from "msw";
import { MockError } from "../domain/audit";
import { createPackage, deletePackage } from "../domain/packages";
import { id, slugOf } from "../ids";
import {
  currentUser,
  expectVersion,
  idempotent,
  json,
  packageOf,
  requirePermission,
  route,
  type Ctx,
} from "./http";
import { fileField, form, startJob } from "./multipart";

const noContent = () => new HttpResponse(null, { status: 204 });

export const adminHandlers = (ctx: Ctx) => [
  http.post(
    "*/v1/packages",
    route(ctx, async ({ request }, db) => {
      const user = currentUser(db, request);
      requirePermission(user, "EDIT_PACKAGE");
      const f = await form(request);
      const customer = slugOf.customer(String(f.get("customer_id") ?? ""));
      const owner = slugOf.user(String(f.get("owner_id") ?? ""));
      if (!customer || !db.customers.some((c) => c.id === customer) || !owner || !db.user(owner))
        throw new MockError("VALIDATION_ERROR", "Müştəri və məsul şəxs məcburidir.", 422);
      const files = [
        fileField(f, "invoice"),
        fileField(f, "order", true),
        fileField(f, "delivery", true),
      ]
        .filter((x): x is File => x !== null)
        .map((x) => x.name);
      return idempotent(db, request, `create:${customer}:${owner}:${files.join(",")}`, async () => {
        const p = await createPackage(
          db,
          { customer_id: customer, owner_id: owner, files },
          user.id,
        );
        const job = startJob(db, "create_package", p);
        return json({ job_id: job.id, package_id: id.pkg(p.id) }, 202);
      });
    }),
  ),
  http.delete(
    "*/v1/packages/:package_id",
    route(ctx, ({ request, params }, db) => {
      const user = currentUser(db, request);
      requirePermission(user, "DELETE_PACKAGE");
      const p = packageOf(db, params.package_id);
      expectVersion(p, Number(new URL(request.url).searchParams.get("expected_version")));
      deletePackage(db, p, user.id);
      return noContent();
    }),
  ),
];
