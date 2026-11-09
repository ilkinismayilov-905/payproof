import type { Schemas } from "@payproof/api-client";
import { detailText as t } from "@payproof/api-client/i18n";
import { Link2 } from "lucide-react";
import { Banner } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";

/**
 * The order link is an AI suggestion until a human confirms it (prototype `#matchBanner`).
 * The choice dialog itself is W-10.
 */
export function MatchBanner({
  pkg,
  onReview,
}: {
  pkg: Schemas["PackageDetail"];
  onReview: () => void;
}) {
  const { confirmed, candidates } = pkg.link;
  if (confirmed || pkg.status === "PROCESSING") return null;
  const title =
    candidates.length > 1
      ? t.matchMany(candidates.length)
      : t.matchPending(candidates[0]?.po_number);
  return (
    <Banner
      role="region"
      aria-label={title}
      tone="warning"
      icon={Link2}
      title={title}
      actions={
        <Button size="sm" onClick={onReview}>
          <Link2 aria-hidden />
          {t.reviewMatch}
        </Button>
      }
    >
      {`${candidates.map((c) => `${c.po_number}: ${c.reason}`).join(" · ")} ${t.matchDisclaimer}`.trim()}
    </Banner>
  );
}
