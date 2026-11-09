"use client";

import { LOCALES, localeText } from "@payproof/api-client/i18n";
import { changeLocale, useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

/** AZ / EN toggle for screens without the user menu (login). */
export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  return (
    <div
      role="group"
      aria-label={localeText.label}
      className={cn("border-border bg-surface flex w-fit rounded-md border p-0.5", className)}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => changeLocale(l)}
          className="text-text-2 aria-pressed:bg-brand-50 aria-pressed:text-brand-700 focus-visible:ring-ring min-h-9 rounded-[5px] px-3 text-sm font-semibold outline-none focus-visible:ring-2 pointer-coarse:min-h-11"
        >
          {localeText[l]}
        </button>
      ))}
    </div>
  );
}
