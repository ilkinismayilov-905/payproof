// Azerbaijani UI texts — docs/product/glossary.md and the prototype's label maps (PST, OUT, TST, DST, RULES, CAT, ROLE_L, TYPE_L, PERM_L).
// Each map is keyed by the contract enum, so a new enum value fails typecheck until it gets a label.

import type { components } from "../generated/schema";

type S = components["schemas"];
type RuleId =
  "R-001" | "R-002" | "R-003" | "R-004" | "R-005" | "R-006" | "R-007" | "R-008" | "R-009";

export const packageStatusLabel = {
  PROCESSING: "Emal olunur",
  NEEDS_REVIEW: "Yoxlama tələb edir",
  NEEDS_FIX: "Düzəliş tələb edir",
  READY_FOR_APPROVAL: "Təsdiq gözləyir",
  APPROVED_READY: "Göndərilməyə hazır",
  EXPORTED: "İxrac edilib",
} as const satisfies Record<S["PackageStatus"], string>;

export const checkOutcomeLabel = {
  PASS: "Keçdi",
  FAIL: "Uyğunsuz",
  UNKNOWN: "Naməlum",
  NOT_APPLICABLE: "Tətbiq olunmur",
} as const satisfies Record<S["CheckOutcome"], string>;

export const taskStatusLabel = {
  OPEN: "Açıq",
  IN_PROGRESS: "İcrada",
  SUBMITTED_FOR_RECHECK: "Yenidən yoxlamada",
  RESOLVED: "Həll edilib",
} as const satisfies Record<S["TaskStatus"], string>;

export const documentStatusLabel = {
  UPLOADED: "Yükləndi",
  PROCESSING: "Emal olunur",
  EXTRACTED: "Çıxarıldı",
  REVIEW_REQUIRED: "Sahə oxunmadı",
  FAILED: "Emal xətası",
} as const satisfies Record<S["DocumentVersionStatus"], string>;

export const documentTypeLabel = {
  invoice: "Faktura",
  order: "Sifariş",
  delivery: "Təhvil sənədi",
} as const satisfies Record<S["DocumentType"], string>;

export const roleLabel = {
  operator: "Operator",
  approver: "Təsdiqçi",
  readonly: "Yalnız baxış",
  admin: "Admin",
  assignee: "Tapşırıq icraçısı",
} as const satisfies Record<S["Role"], string>;

export const permissionLabel = {
  VIEW: "Paketlərə və sənədlərə baxmaq",
  EDIT_PACKAGE: "Sənəd yükləmək və çıxarışı düzəltmək",
  MANAGE_TASKS: "Tapşırıq yaratmaq",
  MANAGE_REQUIREMENTS: "Müştəri qaydasını təsdiqləmək",
  APPROVE_PACKAGE: "Hazır paketi təsdiqləmək",
  EXPORT_PACKAGE: "Paketi ixrac etmək",
  DELETE_PACKAGE: "Təsdiqlənməmiş paketi silmək",
} as const satisfies Record<S["Permission"], string>;

export const ruleTitle = {
  "R-001": "Məcburi sifariş nömrəsi (PO)",
  "R-002": "PO təsdiqlənmiş sifarişə uyğundur",
  "R-003": "Tərəflərin uyğunluğu",
  "R-004": "Valyuta və vahid uyğunluğu",
  "R-005": "Vahid qiymət uyğunluğu",
  "R-006": "Miqdar uyğunluğu",
  "R-007": "Məcburi təhvil sənədi",
  "R-008": "İmza tələbi (insan yoxlaması)",
  "R-009": "Cəmlərin arifmetik uyğunluğu",
} as const satisfies Record<RuleId, string>;

export const ruleShort = {
  "R-001": "PO çatışmır",
  "R-002": "PO uyğunluğu",
  "R-003": "Tərəf fərqi",
  "R-004": "Valyuta / vahid",
  "R-005": "Qiymət fərqi",
  "R-006": "Miqdar fərqi",
  "R-007": "Təhvil sənədi",
  "R-008": "İmza yoxlaması",
  "R-009": "Cəm fərqi",
} as const satisfies Record<RuleId, string>;

export const ruleCategory = {
  "R-001": "PO istinadı",
  "R-002": "PO istinadı",
  "R-003": "Tərəf uyğunsuzluğu",
  "R-004": "Valyuta / vahid",
  "R-005": "Qiymət / miqdar",
  "R-006": "Qiymət / miqdar",
  "R-007": "Təhvil sənədi",
  "R-008": "Təhvil sənədi",
  "R-009": "Cəm fərqi",
} as const satisfies Record<RuleId, string>;

/** Common UI texts. */
export const ui = {
  loading: "Yüklənir…",
  retry: "Yenidən cəhd edin",
  errorTitle: "Məlumat yüklənmədi",
  emptyFiltered: "Filtrə uyğun nəticə yoxdur",
  clearFilters: "Filtrləri təmizlə",
  versionConflictTitle: "Paket yenilənib",
  versionConflictBody: "Başqa istifadəçi paketi dəyişib. Ən son versiyaya baxıb yenidən cəhd edin.",
  forbidden: "Bu əməliyyat üçün səlahiyyətiniz yoxdur.",
  approvedTitle: "Paket göndərilməyə hazırdır",
  approvedHint: "Bu, ödəniş zəmanəti deyil — yalnız sənəd hazırlığıdır.",
  problemAmountHint:
    "Bu məbləğ zərər sayılmır. Hər paket bir dəfə sayılır; AZN və USD çevrilmədən ayrıca göstərilir.",
  aiSuggestion: "AI təklifi · insan təsdiqi tələb olunur",
  system: "Sistem",
} as const;
