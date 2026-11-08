"use client";

import { Bell, Menu, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, Ref } from "react";
import { UserMenu } from "./user-menu";

const iconButton =
  "text-text-2 hover:bg-surface-2 hover:text-text focus-visible:ring-ring inline-grid size-10 shrink-0 place-items-center rounded-md outline-none focus-visible:ring-2 disabled:opacity-50";

export function Topbar({
  onOpenNav,
  menuButtonRef,
}: {
  onOpenNav: () => void;
  /** The drawer returns focus here when it closes. */
  menuButtonRef?: Ref<HTMLButtonElement>;
}) {
  const router = useRouter();

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(q ? `/packages?q=${encodeURIComponent(q)}` : "/packages");
  };

  return (
    <header className="bg-surface border-border flex h-topbar shrink-0 items-center gap-3 border-b px-3 md:px-5">
      <button
        ref={menuButtonRef}
        type="button"
        aria-label="Menyunu aç"
        onClick={onOpenNav}
        className={`${iconButton} md:hidden`}
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <Link
        href="/overview"
        className="focus-visible:ring-ring flex shrink-0 items-center gap-2.5 rounded-md text-lg font-bold tracking-tight outline-none focus-visible:ring-2"
      >
        <span className="bg-brand text-brand-foreground grid size-[30px] place-items-center rounded-[9px]">
          <ShieldCheck aria-hidden className="size-[18px]" strokeWidth={2.4} />
        </span>
        <span className="max-md:sr-only">PayProof</span>
      </Link>
      <span
        title="Bütün məlumatlar sintetikdir"
        className="bg-warning-bg text-warning shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold max-md:hidden"
      >
        Sintetik demo
      </span>

      <form role="search" onSubmit={search} className="mx-auto w-full max-w-md min-w-0">
        <label className="border-border-strong bg-surface focus-within:ring-ring flex h-10 items-center gap-2 rounded-md border px-3 focus-within:ring-2">
          <Search aria-hidden className="text-text-3 size-4 shrink-0" />
          <span className="sr-only">Paket axtar</span>
          <input
            type="search"
            name="q"
            maxLength={100}
            autoComplete="off"
            placeholder="Faktura, müştəri və ya PO axtar…"
            className="placeholder:text-text-3 w-full min-w-0 bg-transparent outline-none"
          />
        </label>
      </form>

      <button type="button" aria-label="Bildirişlər" disabled className={iconButton}>
        <Bell aria-hidden className="size-5" />
      </button>
      <UserMenu />
    </header>
  );
}
