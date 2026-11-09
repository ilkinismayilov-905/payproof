import { defineTexts } from "../dict";

/** Customer rules screen: rule set card and version history (prototype `pgRules`). */
export const customersText = defineTexts({
  az: {
    title: "Müştəri qaydaları",
    description:
      "P0-da qaydaları səlahiyyətli şəxs formadan daxil edir. Hər dəyişiklik yeni versiya yaradır; ixrac edilməmiş paketlər yenidən yoxlanır və əvvəlki təsdiqlər etibarsızlaşır.",
    contractTitle: "Müqavilədən qayda namizədi",
    contractBody:
      "P1-də AI müqavilədən qayda namizədi çıxaracaq; insan təsdiqindən əvvəl həmin qayda maliyyə nəticəsini dəyişməyəcək.",
    requirePo: "Fakturada sifariş nömrəsi (PO) məcburidir",
    requireDelivery: "Təhvil sənədi məcburidir",
    requireSignature: "Təhvil aktında imza tələb olunur",
    signatureHint: "R-008 — insan yoxlaması, hüquqi autentifikasiya deyil",
    approverOnly: "Müştəri qaydasını yalnız təsdiqçi rolu təsdiqləyə bilər.",
    errTolerance: "Düzgün məbləğ yazın (0,00 – 1,00).",
    errReason: "Ən azı 10 simvolla səbəb yazın.",
    noChange: "Dəyişiklik yoxdur — yeni versiya yaradılmadı.",
    saved: (customer: string, v: number) =>
      `${customer}: qayda dəsti v${v} təsdiqləndi. Əlaqəli paketlər yenidən yoxlandı.`,
    ids: (externalId: string, voen: string) => `Xarici ID ${externalId} · VÖEN ${voen}`,
    version: (v: number) => `Qayda dəsti v${v}`,
    effective: (from: string, by: string) => `Qüvvədədir: ${from} · Təsdiqləyən: ${by}`,
    tolerance: "Yuvarlaqlaşdırma toleransı (AZN / USD)",
    toleranceHint: "Böyük fərqi gizlədən geniş tolerans qəbul edilmir (maks. 1,00).",
    reason: "Dəyişikliyin əsaslandırılması",
    reasonPlaceholder: "Məs.: müştərinin 01.12.2026 tarixli təchizatçı təlimatı",
    immediate: "Yeni versiya dərhal qüvvəyə minəcək.",
    needsApprover: "Təsdiq üçün təsdiqçi rolu tələb olunur.",
    saving: "Saxlanılır…",
    save: "Yeni versiya kimi təsdiqlə",
    history: (n: number) => `Versiya tarixçəsi (${n})`,
    yes: "bəli",
    no: "xeyr",
    historyRow: (po: string, delivery: string, signature: string, tolerance: string) =>
      `PO: ${po} · Təhvil: ${delivery} · İmza: ${signature} · Tolerans: ${tolerance}`,
  },
  en: {
    title: "Customer rules",
    description:
      "In P0 an authorised person enters the rules through the form. Every change creates a new version; packages not yet exported are re-checked and earlier approvals lapse.",
    contractTitle: "Rule candidate from a contract",
    contractBody:
      "In P1, AI will extract rule candidates from contracts; until a human confirms it, such a rule will not change any financial result.",
    requirePo: "An order number (PO) on the invoice is required",
    requireDelivery: "A delivery document is required",
    requireSignature: "A signature on the delivery certificate is required",
    signatureHint: "R-008 — human review, not legal authentication",
    approverOnly: "Only the approver role can confirm customer rules.",
    errTolerance: "Enter a valid amount (0.00 – 1.00).",
    errReason: "Give a reason of at least 10 characters.",
    noChange: "Nothing changed — no new version was created.",
    saved: (customer, v) =>
      `${customer}: rule set v${v} confirmed. Related packages were re-checked.`,
    ids: (externalId, voen) => `External ID ${externalId} · TIN ${voen}`,
    version: (v) => `Rule set v${v}`,
    effective: (from, by) => `In force: ${from} · Confirmed by: ${by}`,
    tolerance: "Rounding tolerance (AZN / USD)",
    toleranceHint:
      "A wide tolerance that would hide a large difference is not accepted (max. 1.00).",
    reason: "Reason for the change",
    reasonPlaceholder: "E.g. the customer's supplier instruction dated 01.12.2026",
    immediate: "The new version takes effect immediately.",
    needsApprover: "Confirming requires the approver role.",
    saving: "Saving…",
    save: "Confirm as new version",
    history: (n) => `Version history (${n})`,
    yes: "yes",
    no: "no",
    historyRow: (po, delivery, signature, tolerance) =>
      `PO: ${po} · Delivery: ${delivery} · Signature: ${signature} · Tolerance: ${tolerance}`,
  },
});
