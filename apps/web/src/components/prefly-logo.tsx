import { cn } from "@/lib/utils";

/** Prefly mark: a "P" whose stem is a torn receipt. Colors come from `.prefly-logo` in globals.css (light/dark). */
export function PreflyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("prefly-logo", className)}>
      <path
        fill="var(--logo-ink)"
        fillRule="evenodd"
        d="M26 8H62.5A25.5 28.1 0 0 1 62.5 64.2H51.5V92L44.9 86.5 38.3 92 31.7 86.5 25.2 92 18.6 86.5 12 92V22A14 14 0 0 1 26 8ZM51 24.5H57.4A10.6 10.6 0 0 1 57.4 45.7H51Z"
      />
      <g fill="var(--logo-line)">
        <rect x="18" y="31.2" width="25.5" height="5.8" rx="2.9" />
        <rect x="18" y="41.8" width="13.4" height="5.8" rx="2.9" />
        <rect x="18" y="52.8" width="20.9" height="5.8" rx="2.9" />
        <rect x="18" y="63.9" width="16.1" height="5.8" rx="2.9" />
      </g>
      <rect x="41.5" y="52.9" width="6" height="6" rx="1" fill="var(--logo-accent)" />
    </svg>
  );
}
