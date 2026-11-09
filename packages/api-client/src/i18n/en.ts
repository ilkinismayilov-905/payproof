// English UI texts — same keys as az.ts (enforced by `Dict` and test/i18n.test.ts).

import type * as az from "./az";
import type { Dict } from "./dict";

type En<K extends keyof typeof az> = Dict<(typeof az)[K]>;

export const packageStatusLabel: En<"packageStatusLabel"> = {
  PROCESSING: "Processing",
  NEEDS_REVIEW: "Needs review",
  NEEDS_FIX: "Needs fix",
  READY_FOR_APPROVAL: "Awaiting approval",
  APPROVED_READY: "Ready to send",
  EXPORTED: "Exported",
};

export const checkOutcomeLabel: En<"checkOutcomeLabel"> = {
  PASS: "Passed",
  FAIL: "Mismatch",
  UNKNOWN: "Unknown",
  NOT_APPLICABLE: "Not applicable",
};

export const taskStatusLabel: En<"taskStatusLabel"> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  SUBMITTED_FOR_RECHECK: "In recheck",
  RESOLVED: "Resolved",
};

export const documentStatusLabel: En<"documentStatusLabel"> = {
  UPLOADED: "Uploaded",
  PROCESSING: "Processing",
  EXTRACTED: "Extracted",
  REVIEW_REQUIRED: "Field not read",
  FAILED: "Processing error",
};

export const documentTypeLabel: En<"documentTypeLabel"> = {
  invoice: "Invoice",
  order: "Order",
  delivery: "Delivery note",
};

export const roleLabel: En<"roleLabel"> = {
  operator: "Operator",
  approver: "Approver",
  readonly: "View only",
  admin: "Admin",
  assignee: "Task assignee",
};

export const permissionLabel: En<"permissionLabel"> = {
  VIEW: "View packages and documents",
  EDIT_PACKAGE: "Upload documents and correct extraction",
  MANAGE_TASKS: "Create tasks",
  MANAGE_REQUIREMENTS: "Approve customer rules",
  APPROVE_PACKAGE: "Approve a ready package",
  EXPORT_PACKAGE: "Export a package",
  DELETE_PACKAGE: "Delete an unapproved package",
};

export const ruleTitle: En<"ruleTitle"> = {
  "R-001": "Mandatory purchase order number (PO)",
  "R-002": "PO matches an approved order",
  "R-003": "Parties match",
  "R-004": "Currency and unit match",
  "R-005": "Unit price match",
  "R-006": "Quantity match",
  "R-007": "Mandatory delivery note",
  "R-008": "Signature requirement (human review)",
  "R-009": "Totals add up",
  "R-010": "Overall readiness",
};

export const ruleLabel: En<"ruleLabel"> = (id) => (ruleTitle as Record<string, string>)[id] ?? id;

export const ruleShort: En<"ruleShort"> = {
  "R-001": "PO missing",
  "R-002": "PO match",
  "R-003": "Party mismatch",
  "R-004": "Currency / unit",
  "R-005": "Price difference",
  "R-006": "Quantity difference",
  "R-007": "Delivery note",
  "R-008": "Signature review",
  "R-009": "Total difference",
};

export const ruleCategory: En<"ruleCategory"> = {
  "R-001": "PO reference",
  "R-002": "PO reference",
  "R-003": "Party mismatch",
  "R-004": "Currency / unit",
  "R-005": "Price / quantity",
  "R-006": "Price / quantity",
  "R-007": "Delivery note",
  "R-008": "Delivery note",
  "R-009": "Total difference",
};

export const fieldReviewStatusLabel: En<"fieldReviewStatusLabel"> = {
  EXTRACTED: "Extracted",
  REVIEW_REQUIRED: "Field not read",
  CORRECTED: "Corrected manually",
};

export const comparisonStateLabel: En<"comparisonStateLabel"> = {
  ok: "Matches",
  mismatch: "Mismatch",
  unknown: "Not read",
  empty: "No document",
};

export const jobStatusLabel: En<"jobStatusLabel"> = {
  QUEUED: "Queued",
  RUNNING: "Processing",
  SUCCEEDED: "Ready",
  FAILED: "Processing error",
};

export const linkMethodLabel: En<"linkMethodLabel"> = {
  exact_id: "Confirmed ID",
  human: "Human confirmation",
};

export const fixHintLabel: En<"fixHintLabel"> = {
  link_order: "Choose the order",
  edit_field: "View the source, correct the field",
  review_signature: "Review and confirm the signature",
  upload_delivery: "Upload a delivery note",
  upload_invoice: "New invoice version",
};

export const errorFallback: En<"errorFallback"> = {
  VALIDATION_ERROR: "The request contains an error.",
  TASK_STATUS_NOT_ALLOWED: "The task cannot move to this status.",
  INVOICE_REQUIRED: "An export package must include the invoice.",
  IDEMPOTENCY_KEY_REUSED: "The same request was repeated with different data.",
  UNAUTHENTICATED: "Your session has ended. Please sign in again.",
  FORBIDDEN: "You do not have permission for this action.",
  NOT_FOUND: "Not found.",
  VERSION_CONFLICT: "The package has been updated; refresh the page.",
  PACKAGE_NOT_READY: "The package is not ready for this action.",
  PACKAGE_NOT_DELETABLE: "An approved package cannot be deleted.",
  TASK_ALREADY_OPEN: "An open task for this rule already exists.",
  DUPLICATE_FILE: "This file is already in the package — no new version was created.",
  DUPLICATE_INVOICE: "This invoice already exists for this customer.",
  IDEMPOTENCY_IN_PROGRESS: "The same request is still being processed.",
  FILE_TOO_LARGE: "The file is larger than 20 MB.",
  UNSUPPORTED_FILE_TYPE: "Only PDF, PNG, JPEG, CSV and XLSX are accepted.",
  RATE_LIMITED: "Too many requests — please try again shortly.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again shortly.",
  NETWORK_ERROR: "Could not reach the server. Check your internet connection.",
};
