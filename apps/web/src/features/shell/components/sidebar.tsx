"use client";

import {
  ChevronLeft,
  ChevronRight,
  History,
  LayoutGrid,
  ListChecks,
  Package,
  Plug,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useMe } from "@/features/auth";
import { useOpenTaskCount } from "@/features/tasks";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/overview", label: "İcmal", icon: LayoutGrid },
  { href: "/packages", label: "Faktura paketləri", icon: Package },
  { href: "/tasks", label: "Tapşırıqlar", icon: ListChecks },
  { href: "/rules", label: "Müştəri qaydaları", icon: Scale },
  { href: "/audit", label: "Audit tarixçəsi", icon: History },
];
const SOON: { label: string; icon: LucideIcon }[] = [
  { label: "ERP inteqrasiyası", icon: Plug },
  { label: "Müqavilə çıxarışı", icon: Sparkles },
];

const item = (collapsed: boolean) =>
  cn(
    "text-text-2 hover:bg-surface-2 hover:text-text flex min-h-[42px] w-full pointer-coarse:min-h-11 items-center gap-3 rounded-md px-3 text-md font-semibold transition duration-base ease-base",
    "focus-visible:ring-ring outline-none focus-visible:ring-2",
    "aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-700",
    collapsed && "justify-center px-0",
  );
const label = (collapsed: boolean) => (collapsed ? "sr-only" : "truncate");

interface Props {
  collapsed: boolean;
  /** Omitted in the mobile drawer, which is never collapsed. */
  onToggleCollapse?: () => void;
  /** The drawer closes itself after a navigation. */
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: Props) {
  const pathname = usePathname();
  const openTasks = useOpenTaskCount().data;
  const company = useMe().data?.company.name;

  return (
    <nav
      aria-label="Əsas naviqasiya"
      className="flex h-full flex-col gap-0.5 overflow-x-hidden overflow-y-auto p-3"
    >
      {NAV.map(({ href, label: text, icon: Icon }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        const count = href === "/tasks" ? openTasks : undefined;
        return (
          <Link
            key={href}
            href={href}
            title={text}
            aria-current={current ? "page" : undefined}
            aria-label={count ? `${text}, ${count} açıq` : undefined}
            onClick={onNavigate}
            className={item(collapsed)}
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            <span className={label(collapsed)}>{text}</span>
            {!!count && !collapsed && (
              <span
                aria-hidden
                className="bg-danger-bg text-danger ml-auto rounded-full px-[7px] py-px text-[11px] font-bold"
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}

      <div
        className={cn(
          "text-text-3 px-3 pt-4 pb-1 text-[11px] font-bold tracking-wider uppercase",
          collapsed && "sr-only",
        )}
      >
        Tezliklə (P1)
      </div>
      {SOON.map(({ label: text, icon: Icon }) => (
        <button
          key={text}
          type="button"
          title={`${text} — tezliklə`}
          onClick={() => toast.info(`${text} — tezliklə. MVP-yə daxil deyil.`)}
          className={item(collapsed)}
        >
          <Icon aria-hidden className="size-5 shrink-0" />
          <span className={label(collapsed)}>{text}</span>
          <span
            className={cn(
              "border-border text-text-3 ml-auto rounded-full border px-1.5 text-[10px] font-bold",
              collapsed && "sr-only",
            )}
          >
            P1
          </span>
        </button>
      ))}

      {!collapsed && (
        <p className="bg-surface-2 text-text-2 mt-auto rounded-md p-3 text-xs">
          <b>{company}</b>
          <br />
          Sintetik məlumatlarla demo. Real bank, e-poçt və ERP əməliyyatı yoxdur.
        </p>
      )}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Menyunu genişləndir" : "Menyunu yığ"}
          aria-expanded={!collapsed}
          title={collapsed ? "Genişləndir" : "Yığ"}
          className={cn(item(collapsed), collapsed ? "mt-auto" : "mt-2")}
        >
          {collapsed ? (
            <ChevronRight aria-hidden className="size-5" />
          ) : (
            <ChevronLeft aria-hidden className="size-5" />
          )}
          <span aria-hidden className={label(collapsed)}>
            Menyunu yığ
          </span>
        </button>
      )}
    </nav>
  );
}
