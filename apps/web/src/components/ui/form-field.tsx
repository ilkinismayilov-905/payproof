import { useId, type ReactNode } from "react";

/**
 * Label + control + error (or hint), wired for screen readers: the render prop gets the control
 * id and what describes it. Errors replace the hint so only one message is read.
 */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children(id, error ? `${id}-err` : hint ? `${id}-hint` : undefined)}
      {error ? (
        <p id={`${id}-err`} className="text-danger text-sm">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-text-3 text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
