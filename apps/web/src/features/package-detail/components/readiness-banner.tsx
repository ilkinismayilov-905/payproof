import type { Schemas } from "@payproof/api-client";
import { formatDateTime, formatMoney } from "@payproof/api-client/format";
import { detailText as t, readinessText as r } from "@payproof/api-client/i18n";
import { CircleCheck, Clock, Download, Lock, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

type Pkg = Schemas["PackageDetail"];
type Tone = "danger" | "warning" | "success" | "brand" | "neutral";

/** The newest item by an ISO timestamp — the contract does not promise any list order. */
const latest = <T,>(items: T[], at: (item: T) => string) =>
  items.reduce<T | undefined>((m, x) => (!m || at(x) > at(m) ? x : m), undefined);

const sumText = (s: Pkg["summary"]) => r.sum(s.pass, s.fail, s.unknown, s.not_applicable);

function readiness(p: Pkg): { tone: Tone; icon: LucideIcon; title: string; body: string } {
  const v = p.version;
  switch (p.status) {
    case "PROCESSING":
      return {
        tone: "neutral",
        icon: Clock,
        title: t.stillProcessing,
        body: r.processingBody,
      };
    case "NEEDS_FIX":
    case "NEEDS_REVIEW":
      return {
        tone: p.status === "NEEDS_FIX" ? "danger" : "warning",
        icon: Lock,
        title: r.blockedTitle(p.summary.blocking.length),
        body: r.blockedBody(v, sumText(p.summary)),
      };
    case "READY_FOR_APPROVAL": {
      const invalid = latest(
        p.approvals.filter((a) => !a.valid),
        (a) => a.approved_at,
      );
      return {
        tone: "brand",
        icon: CircleCheck,
        title: r.readyTitle(v),
        body: `${invalid ? r.invalidated(invalid.package_version) : ""}${r.readyBody}`,
      };
    }
    case "APPROVED_READY": {
      const a = p.current_approval;
      return {
        tone: "success",
        icon: CircleCheck,
        title: t.readyToSend(p.total ? formatMoney(p.total) : undefined),
        body: `${a ? r.approvedBy(a.approver.full_name, formatDateTime(a.approved_at), a.package_version) : ""}${r.approvedBody}`,
      };
    }
    case "EXPORTED": {
      // only an export of this version may be named under "v{v} paketi ixrac edilib"
      const e = latest(
        p.exports.filter((x) => x.package_version === v),
        (x) => x.created_at,
      );
      return {
        tone: "neutral",
        icon: Download,
        title: r.exportedTitle(v),
        body: `${e ? `${e.created_by.full_name} · ${formatDateTime(e.created_at)}. ` : ""}${r.exportedBody}`,
      };
    }
  }
}

/** R-010 overall readiness (prototype `readiness()`): one banner per status, never hideable. */
export function ReadinessBanner({ pkg, onRefresh }: { pkg: Pkg; onRefresh: () => void }) {
  const { tone, icon, title, body } = readiness(pkg);
  const processing = pkg.status === "PROCESSING";
  return (
    <Banner
      role="region"
      aria-label={title}
      tone={tone}
      icon={icon}
      title={title}
      className={cn(processing && "[&>svg]:motion-safe:animate-spin")}
      actions={
        processing && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw aria-hidden />
            {t.refreshProcessing}
          </Button>
        )
      }
    >
      {body}
    </Banner>
  );
}
