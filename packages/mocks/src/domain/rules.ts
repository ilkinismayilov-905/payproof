// New customer requirement set version (approver only — checked by the HTTP layer). Sets are immutable:
// approvals under an older version stop counting and affected packages are re-validated.
import type { MockDb } from "../store";
import type { Customer, RequirementSet } from "../types";
import { log } from "./audit";
import { validate } from "./validate";

export type RuleInput = Omit<RequirementSet, "version" | "approved_by">;

export function saveRequirements(
  db: MockDb,
  c: Customer,
  input: RuleInput,
  actor: string,
): RequirementSet {
  const version = c.requirement_sets[c.requirement_sets.length - 1]!.version + 1;
  const set: RequirementSet = { ...input, version, approved_by: actor };
  c.requirement_sets.push(set);
  log(db, {
    actor,
    action: "requirements.updated",
    message: `${c.name}: qayda dəsti v${version} — ${input.reason}`,
    objectType: "requirement_set",
  });
  for (const p of db.packages) {
    if (p.deleted || p.processing || p.customer_id !== c.id) continue;
    if (p.exports.some((e) => e.package_version === p.version)) continue; // exported under its own rules
    for (const a of p.approvals)
      if (a.valid && a.requirement_set_version < version) {
        a.valid = false;
        a.invalidated_reason = `qayda dəsti v${version} qüvvəyə mindi`;
        a.invalidated_at = db.nowIso();
        log(db, {
          actor: "system",
          action: "approval.invalidated",
          message: `v${a.package_version} təsdiqi qayda dəsti v${version} qüvvəyə mindiyi üçün qüvvədən düşdü`,
          pkg: p.id,
          objectType: "approval",
        });
      }
    validate(db, p);
  }
  return set;
}
