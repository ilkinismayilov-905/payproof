"use client";

import type { Schemas } from "@payproof/api-client";
import { formatDateTime } from "@payproof/api-client/format";
import { actionLabel, tasksText } from "@payproof/api-client/i18n";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { keepFocusOnPage } from "@/components/ui/restore-focus";
import { useAdvanceTask, useCancelTask } from "../mutations";

type Task = Schemas["Task"];

/** What a submitted task came back as: the system resolves it only when its rule passes. */
function submittedToast(before: Task, after: Task) {
  if (after.status === "RESOLVED") return toast.success(tasksText.resolvedToast(after.number));
  if (after.status === "IN_PROGRESS")
    return toast.warning(tasksText.stillFailing(after.number, before.rule_id));
  toast.info(tasksText.sentForRecheck(after.number));
}

/**
 * Moves a task forward and cancels it. There is deliberately no "resolve" action: only the
 * system sets RESOLVED, when the task's rule passes.
 */
export function TaskActions({ task, canManage }: { task: Task; canManage: boolean }) {
  const advance = useAdvanceTask();
  const cancel = useCancelTask();
  const [confirming, setConfirming] = useState(false);
  const busy = advance.isPending || cancel.isPending;

  if (task.status === "RESOLVED")
    return (
      <span className="text-text-3 text-xs">
        {task.resolved_at && tasksText.resolvedAt(formatDateTime(task.resolved_at))}
      </span>
    );
  const next =
    task.status === "OPEN"
      ? { status: "IN_PROGRESS" as const, label: tasksText.take }
      : task.status === "IN_PROGRESS"
        ? { status: "SUBMITTED_FOR_RECHECK" as const, label: tasksText.submit }
        : null;
  return (
    <div className="flex items-center justify-end gap-1.5">
      {next ? (
        canManage && (
          <Button
            variant="outline"
            size="sm"
            aria-disabled={busy}
            onClick={() =>
              busy ||
              advance.mutate(
                { task, status: next.status },
                {
                  onSuccess: (after) => {
                    keepFocusOnPage(); // the row may have left the current tab
                    if (next.status === "IN_PROGRESS") toast.info(tasksText.taken(after.number));
                    else submittedToast(task, after);
                  },
                },
              )
            }
          >
            {next.label}
          </Button>
        )
      ) : (
        <span className="text-text-3 text-xs">{tasksText.awaitingCheck}</span>
      )}
      {canManage && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tasksText.cancelAria(task.number)}
            title={actionLabel.cancel}
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden />
          </Button>
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={tasksText.cancelTitle(task.number)}
            description={tasksText.cancelDescription}
            confirmLabel={tasksText.cancelConfirm}
            onConfirm={async () => {
              await cancel.mutateAsync(task);
              toast.success(tasksText.cancelled(task.number));
            }}
          />
        </>
      )}
    </div>
  );
}
