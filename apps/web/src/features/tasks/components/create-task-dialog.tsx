"use client";

import type { Schemas } from "@payproof/api-client";
import { formatDate } from "@payproof/api-client/format";
import { actionLabel, tasksText as t } from "@payproof/api-client/i18n";
import { Plus } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckOutcomeBadge } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { Field, fieldInput as input } from "@/components/ui/form-field";
import { useRestoreFocus } from "@/components/ui/restore-focus";
import { useAssignableUsers } from "@/features/users";
import { addDays, bakuToday, defaultAssignee, stepTemplate } from "../helpers";
import { useCreateTask } from "../mutations";

interface Props {
  pkg: Schemas["PackageDetail"];
  check: Schemas["CheckResult"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A correction task for a failing or unknown check (prototype `mTask`). */
export function CreateTaskDialog({ pkg, check, open, onOpenChange }: Props) {
  const users = useAssignableUsers();
  const create = useCreateTask(pkg.id);
  const focus = useRestoreFocus();
  const today = bakuToday();
  const po = pkg.link.order_po ?? pkg.link.candidates[0]?.po_number ?? null;
  const [picked, setWho] = useState<string | null>(null);
  // the rule's usual owner until the user picks someone else
  const who = picked ?? (users.data ? defaultAssignee(check.rule_id, users.data) : "");
  const [step, setStep] = useState(() => stepTemplate(check.rule_id, po));
  const [due, setDue] = useState(() => addDays(today, 2));
  const [comment, setComment] = useState("");
  const [shown, setShown] = useState(false);

  const errors = {
    who: who ? null : t.errWho,
    step: step.trim().length >= 10 ? null : t.errStep,
    due: !due ? t.errDue : due < today ? t.errDuePast : null,
  };
  const show = (e: string | null) => (shown ? e : null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setShown(true);
    if (errors.who || errors.step || errors.due || create.isPending) return;
    create.mutate(
      {
        rule_id: check.rule_id,
        assignee_id: who,
        step: step.trim(),
        due_date: due,
        ...(comment.trim() && { comment: comment.trim() }),
      },
      {
        onSuccess: (task) => {
          onOpenChange(false);
          toast.success(t.created(task.number, task.assignee.full_name, formatDate(task.due_date)));
        },
        // someone else was faster: the card now shows their task, the form has nothing left to do
        onError: (error) => {
          if (error.code === "TASK_ALREADY_OPEN") onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => create.isPending || onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay fixed inset-0 z-50" />
        <Dialog.Content
          {...focus}
          className="bg-surface border-border shadow-3 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[min(600px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border"
        >
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
            <div className="px-6 pt-5 pb-3">
              <Dialog.Title className="text-xl font-semibold">{t.dialogTitle}</Dialog.Title>
              <Dialog.Description className="text-text-2 text-sm">
                {`${pkg.invoice_number} · ${check.rule_id} ${check.title}`}
              </Dialog.Description>
            </div>
            <div className="flex flex-col gap-3 overflow-auto px-6 pb-4">
              <div className="bg-surface-2 rounded-md p-3 text-sm">
                <CheckOutcomeBadge status={check.outcome} />
                <p className="mt-1.5">{check.message}</p>
              </div>
              <Field label={t.assignee} error={show(errors.who)}>
                {(id, d) => (
                  <select
                    id={id}
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    aria-invalid={Boolean(show(errors.who)) || undefined}
                    aria-describedby={d}
                    className={input}
                  >
                    <option value="">{t.pick}</option>
                    {users.data?.map((u) => (
                      <option key={u.id} value={u.id}>{`${u.full_name} — ${u.title}`}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label={t.col.step} error={show(errors.step)}>
                {(id, d) => (
                  <textarea
                    id={id}
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    aria-invalid={Boolean(show(errors.step)) || undefined}
                    aria-describedby={d}
                    className={input}
                  />
                )}
              </Field>
              <Field label={t.col.due} error={show(errors.due)} hint={t.dueHint}>
                {(id, d) => (
                  <input
                    id={id}
                    type="date"
                    value={due}
                    min={today}
                    onChange={(e) => setDue(e.target.value)}
                    aria-invalid={Boolean(show(errors.due)) || undefined}
                    aria-describedby={d}
                    className={input}
                  />
                )}
              </Field>
              <Field label={t.commentLabel}>
                {(id) => (
                  <input
                    id={id}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    autoComplete="off"
                    className={input}
                  />
                )}
              </Field>
            </div>
            <div className="border-border flex flex-wrap justify-end gap-2 border-t px-6 py-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="lg">
                  {actionLabel.cancel}
                </Button>
              </Dialog.Close>
              <Button type="submit" size="lg" aria-disabled={create.isPending}>
                <Plus aria-hidden />
                {create.isPending ? t.creating : t.create}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
