"use client";

import type { Schemas } from "@payproof/api-client";
import { formatDate } from "@payproof/api-client/format";
import { customersText as t } from "@payproof/api-client/i18n";
import { Check, Lock, Scale } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, fieldInput } from "@/components/ui/form-field";
import { bakuToday } from "@/features/tasks/helpers";
import { useCreateRequirementSet } from "../queries";
import { parseTolerance, sameRules } from "../rules";
import { RuleHistory } from "./rule-history";

type Flag = "require_po" | "require_delivery" | "require_signature";
// a function: labels follow the current language
const switches = (): { key: Flag; label: string; hint: string }[] => [
  { key: "require_po", label: t.requirePo, hint: "R-001, R-002" },
  { key: "require_delivery", label: t.requireDelivery, hint: "R-007" },
  { key: "require_signature", label: t.requireSignature, hint: t.signatureHint },
];

/**
 * One customer's rule set (prototype `pgRules`). Every save is a new immutable version: the
 * customer's packages are re-checked and earlier approvals lapse. Render with `key` = version.
 */
export function CustomerRulesCard({
  customer,
  canSave,
}: {
  customer: Schemas["Customer"];
  canSave: boolean;
}) {
  const cur = customer.current_requirements;
  const save = useCreateRequirementSet(customer.id);
  const [flags, setFlags] = useState<Record<Flag, boolean>>({
    require_po: cur.require_po,
    require_delivery: cur.require_delivery,
    require_signature: cur.require_signature,
  });
  const [tolerance, setTolerance] = useState(cur.tolerance.replace(".", ","));
  const [reason, setReason] = useState("");
  const [shown, setShown] = useState(false);
  const parsed = parseTolerance(tolerance);
  const errors = {
    tolerance: parsed ? null : t.errTolerance,
    reason: reason.trim().length >= 10 ? null : t.errReason,
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return void toast.warning(t.approverOnly);
    setShown(true);
    if (errors.tolerance || errors.reason || save.isPending) return;
    const next = { ...flags, tolerance: parsed! };
    if (sameRules(cur, next)) return void toast.warning(t.noChange);
    // mutateAsync, not a mutate callback: the saved version re-mounts this card before the
    // refresh ends, and React Query drops callbacks of an unmounted observer
    save
      .mutateAsync({
        ...next,
        reason: reason.trim(),
        effective_from: bakuToday(),
        expected_version: cur.version,
      })
      .then(
        (rs) => toast.success(t.saved(customer.name, rs.version)),
        () => {}, // the global handler already explains the error
      );
  };

  return (
    <section
      aria-labelledby={`rules-${customer.id}`}
      className="bg-surface border-border shadow-1 flex flex-col gap-3 rounded-lg border p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={`rules-${customer.id}`} className="text-lg font-bold">
            {customer.name}
          </h2>
          <p className="text-text-3 text-xs">{t.ids(customer.external_id, customer.voen)}</p>
        </div>
        <span className="bg-brand-50 text-brand inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-bold">
          <Scale aria-hidden className="size-3.5" />
          {t.version(cur.version)}
        </span>
      </div>
      <p className="text-text-2 text-sm">
        {t.effective(formatDate(cur.effective_from), cur.approved_by.full_name)}
      </p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        {switches().map((s) => (
          <label
            key={s.key}
            className="has-focus-visible:ring-ring flex cursor-pointer items-start gap-3 rounded-md has-focus-visible:ring-2"
          >
            <input
              type="checkbox"
              role="switch"
              checked={flags[s.key]}
              onChange={(e) => setFlags({ ...flags, [s.key]: e.target.checked })}
              className="accent-brand mt-0.5 size-5 shrink-0 pointer-coarse:size-6"
            />
            <span>
              <b className="text-sm">{s.label}</b>
              <span className="text-text-3 block text-xs">{s.hint}</span>
            </span>
          </label>
        ))}
        <Field label={t.tolerance} error={shown ? errors.tolerance : null} hint={t.toleranceHint}>
          {(id, d) => (
            <input
              id={id}
              inputMode="decimal"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              aria-invalid={(shown && Boolean(errors.tolerance)) || undefined}
              aria-describedby={d}
              className={fieldInput}
            />
          )}
        </Field>
        <Field label={t.reason} error={shown ? errors.reason : null}>
          {(id, d) => (
            <textarea
              id={id}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t.reasonPlaceholder}
              aria-invalid={(shown && Boolean(errors.reason)) || undefined}
              aria-describedby={d}
              className={fieldInput}
            />
          )}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-text-3 flex items-center gap-1 text-xs">
            {canSave ? (
              t.immediate
            ) : (
              <>
                <Lock aria-hidden className="size-3.5" />
                {t.needsApprover}
              </>
            )}
          </span>
          <Button
            type="submit"
            aria-disabled={!canSave || save.isPending}
            title={canSave ? undefined : t.approverOnly}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            <Check aria-hidden />
            {save.isPending ? t.saving : t.save}
          </Button>
        </div>
      </form>
      {/* versions are numbered 1…n, so the current one is also the count */}
      <RuleHistory customerId={customer.id} count={cur.version} />
    </section>
  );
}
