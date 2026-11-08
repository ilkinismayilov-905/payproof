// Order link, field correction, signature review, re-validation → the updated PackageDetail.
import { http } from "msw";
import { MockError } from "../domain/audit";
import { confirmLink, correctField, reviewSignature } from "../domain/review";
import { validate } from "../domain/validate";
import { slugOf } from "../ids";
import { packageDetail } from "../views/detail";
import { fieldById } from "../views/documents";
import {
  body,
  currentUser,
  expectVersion,
  json,
  notFound,
  packageOf,
  requirePermission,
  required,
  route,
  type Ctx,
} from "./http";

export const reviewHandlers = (ctx: Ctx) => [
  http.post(
    "*/v1/packages/:package_id/matches",
    route(ctx, async ({ request, params }, db) => {
      const user = currentUser(db, request);
      requirePermission(user, "EDIT_PACKAGE");
      const p = packageOf(db, params.package_id);
      const b = await body(request);
      expectVersion(p, b.expected_version);
      const po = slugOf.order(required(b.order_id, "order_id"));
      const order = po ? db.orders[po] : undefined;
      if (!order || order.customer_id !== p.customer_id)
        throw new MockError("VALIDATION_ERROR", "Bu müştəriyə aid sifariş tapılmadı.", 422, {
          fields: { order_id: "Naməlum sifariş." },
        });
      confirmLink(db, p, order.po_number, user.id);
      return json(packageDetail(db, p, user.id));
    }),
  ),
  http.patch(
    "*/v1/fields/:field_id",
    route(ctx, async ({ request, params }, db) => {
      const user = currentUser(db, request);
      requirePermission(user, "EDIT_PACKAGE");
      const field = fieldById(db, String(params.field_id));
      if (!field) throw notFound();
      const b = await body(request);
      expectVersion(field.pkg, b.expected_version);
      const reason = required(b.reason, "reason");
      if (reason.trim().length < 3)
        throw new MockError("VALIDATION_ERROR", "Səbəb məcburidir.", 422, {
          fields: { reason: "Ən azı 3 simvol." },
        });
      correctField(db, field.pkg, field.path, required(b.value, "value"), reason, user.id);
      return json(packageDetail(db, field.pkg, user.id));
    }),
  ),
  http.post(
    "*/v1/packages/:package_id/signature-review",
    route(ctx, async ({ request, params }, db) => {
      const user = currentUser(db, request);
      requirePermission(user, "EDIT_PACKAGE");
      const p = packageOf(db, params.package_id);
      expectVersion(p, (await body(request)).expected_version);
      if (!p.delivery)
        throw new MockError("VALIDATION_ERROR", "Paketdə təhvil sənədi yoxdur.", 422);
      reviewSignature(db, p, user.id);
      return json(packageDetail(db, p, user.id));
    }),
  ),
  http.post(
    "*/v1/packages/:package_id/validate",
    route(ctx, async ({ request, params }, db) => {
      const user = currentUser(db, request);
      requirePermission(user, "EDIT_PACKAGE");
      const p = packageOf(db, params.package_id);
      expectVersion(p, (await body(request)).expected_version);
      validate(db, p, user.id);
      return json(packageDetail(db, p, user.id));
    }),
  ),
];
