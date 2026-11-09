import { defineTexts } from "../dict";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Package detail screen: header, actions, comparison, banners and the paper page. */
export const detailText = defineTexts({
  az: {
    breadcrumb: "Yol",
    backToList: "Paketlərə qayıt",
    notFoundTitle: "Paket tapılmadı",
    notFoundBody: "Bu paket silinib və ya mövcud deyil. Audit tarixçəsində qeyd saxlanılır.",
    processingTitle: "Emal olunur…",
    meta: "Paket məlumatları",
    version: (v: number) => `Paket v${v}`,
    amount: "Məbləğ",
    date: "Tarix",
    ruleSet: "Qayda dəsti",
    owner: "Məsul",
    recheck: "Yenidən yoxla",
    rechecking: "Yoxlanılır…",
    upload: "Sənəd yüklə",
    export: "İxrac et",
    reExport: "Manifesti yenidən yüklə",
    blocked: "Bloklayan yoxlamalar var",
    approverOnly: "Hazır paketi yalnız təsdiqçi təsdiqləyə bilər.",
    noExport: "Bu vəziyyətdə və ya rolunuzla ixrac mümkün deyil",
    report: "Daxili hesabat",
    stillProcessing: "Sənədlər emal olunur",
    soon: "Tezliklə",
    // can_edit = role AND package state, so the reason names both
    noEdit: "Bu vəziyyətdə və ya rolunuzla sənəd yükləmək və çıxarışı düzəltmək mümkün deyil",
    noTasks: "Bu vəziyyətdə və ya rolunuzla tapşırıq yaratmaq mümkün deyil",
    documents: "Sənədlər və versiyalar",
    comparison: "Müqayisə",
    comparisonCaption: "Müqayisə: faktura · sifariş · təhvil",
    comparisonColumns: { field: "Sahə", invoice: "Faktura", order: "Sifariş", delivery: "Təhvil" },
    unconfirmed: (label: string) => `${label} (təsdiqlənməyib)`,
    aiSourced: "AI çıxarışı · mənbəli",
    buyer: "Alıcı",
    checks: "Yoxlamalar",
    refreshProcessing: "Emal vəziyyətini yenilə",
    reviewMatch: "Bax və təsdiqlə",
    mockExtraction:
      "Çıxarış: əvvəlcədən hazırlanmış nəticə (mock adapter) — canlı AI analizi kimi təqdim olunmur.",
    signature: "İmza",
    packageFallback: "Paket",
    rechecked: (v: number, status: string) => `Paket v${v} yenidən yoxlandı: ${status}.`,
    signatureNoted: (status: string) => `İmzanın mövcudluğu qeyd edildi. Paket: ${status}.`,
    deleted: (name: string) => `${name} silindi. Audit qeydi saxlanıldı.`,
    page: (n: number) => `Səhifə ${n}`,
    pdfFailed: "Faylı açmaq alınmadı — sitata baxın.",
    readyToSend: (amount?: string) =>
      `${amount ? `${amount}-lik faktura paketi` : "Faktura paketi"} göndərilməyə hazırdır`,
    matchMany: (n: number) => `${n} mümkün sifariş tapıldı — seçim tələb olunur`,
    matchPending: (po?: string) =>
      `Sifariş uyğunlaşdırması təsdiq gözləyir${po ? `: ${po} namizəddir` : ""}`,
    matchDisclaimer: "Semantik oxşarlıq sübut deyil — əlaqəni insan təsdiqləyir.",
    notRead: "oxunmadı",
    mismatchSr: "uyğunsuz",
    unknownSr: "naməlum",
    viewSource: "Mənbəyə bax",
    viewSourceOf: (name: string, column: string) => `Mənbəyə bax: ${name} (${column})`,
    correct: "Çıxarışı düzəlt",
    correctOf: (name: string, column: string) => `Çıxarışı düzəlt: ${name} (${column})`,
    // spaces live in the strings: the bold parts sit at different places in each language
    fixPathsTitle: "İki fərqli düzəliş yolu:",
    fixPathsBody:
      " çıxarış səhvdirsə sahəni mənbəyə baxaraq düzəldin (sənəd dəyişmir, səbəb auditə yazılır). Fakturanın özündə səhv varsa, onu mənbə sistemində düzəldib ",
    fixPathsNew: "yeni versiya",
    fixPathsEnd: " yükləyin.",
  },
  en: {
    breadcrumb: "Breadcrumb",
    backToList: "Back to packages",
    notFoundTitle: "Package not found",
    notFoundBody: "This package was deleted or does not exist. The audit history keeps a record.",
    processingTitle: "Processing…",
    meta: "Package details",
    version: (v) => `Package v${v}`,
    amount: "Amount",
    date: "Date",
    ruleSet: "Rule set",
    owner: "Owner",
    recheck: "Re-check",
    rechecking: "Checking…",
    upload: "Upload document",
    export: "Export",
    reExport: "Download manifest again",
    blocked: "There are blocking checks",
    approverOnly: "Only an approver can approve a ready package.",
    noExport: "Export is not possible in this state or with your role",
    report: "Internal report",
    stillProcessing: "Documents are being processed",
    soon: "Coming soon",
    noEdit:
      "Uploading documents and correcting extractions is not possible in this state or with your role",
    noTasks: "Creating tasks is not possible in this state or with your role",
    documents: "Documents and versions",
    comparison: "Comparison",
    comparisonCaption: "Comparison: invoice · order · delivery",
    comparisonColumns: { field: "Field", invoice: "Invoice", order: "Order", delivery: "Delivery" },
    unconfirmed: (label) => `${label} (unconfirmed)`,
    aiSourced: "AI extraction · sourced",
    buyer: "Buyer",
    checks: "Checks",
    refreshProcessing: "Refresh processing status",
    reviewMatch: "Review and confirm",
    mockExtraction:
      "Extraction: a prepared result (mock adapter) — not presented as live AI analysis.",
    signature: "Signature",
    packageFallback: "Package",
    rechecked: (v, status) => `Package v${v} re-checked: ${status}.`,
    signatureNoted: (status) => `Signature presence recorded. Package: ${status}.`,
    deleted: (name) => `${name} deleted. The audit record is kept.`,
    page: (n) => `Page ${n}`,
    pdfFailed: "Could not open the file — see the quote.",
    readyToSend: (amount) =>
      `${amount ? `The ${amount} invoice package` : "The invoice package"} is ready to send`,
    matchMany: (n) => `${n} possible orders found — a choice is required`,
    matchPending: (po) => `Order match awaits confirmation${po ? `: ${po} is the candidate` : ""}`,
    matchDisclaimer: "Semantic similarity is not proof — a person confirms the link.",
    notRead: "not read",
    mismatchSr: "mismatch",
    unknownSr: "unknown",
    viewSource: "View source",
    viewSourceOf: (name, column) => `View source: ${name} (${column})`,
    correct: "Correct extraction",
    correctOf: (name, column) => `Correct extraction: ${name} (${column})`,
    fixPathsTitle: "Two different ways to fix:",
    fixPathsBody:
      " if the extraction is wrong, correct the field by looking at its source (the document does not change, the reason goes to the audit). If the invoice itself is wrong, fix it in the source system and upload a ",
    fixPathsNew: "new version",
    fixPathsEnd: ".",
  },
});

/** Documents panel: document cards, missing documents, version history. */
export const documentsText = defineTexts({
  az: {
    source: { pdf: "PDF", scan: "Skan", spreadsheet: "Cədvəl" },
    missing: (label: string) => `${label} yoxdur`,
    required: (v: number) =>
      `Müştəri qaydası (v${v}) bu sənədi tələb edir. “Sənəd yoxdur” — “sənəd oxunmadı” deyil.`,
    notRequired: "Bu müştəri üçün tələb olunmur.",
    upload: "Yüklə",
    awaitingLink: "Uyğunlaşdırma gözləyir",
    view: "Bax",
    newVersion: "Yeni versiya",
    history: (n: number) => `Əvvəlki versiyalar (${n}) — audit üçün saxlanılır`,
  },
  en: {
    source: { pdf: "PDF", scan: "Scan", spreadsheet: "Spreadsheet" },
    missing: (label) => `${label} missing`,
    required: (v) =>
      `The customer rule (v${v}) requires this document. “No document” is not “document unreadable”.`,
    notRequired: "Not required for this customer.",
    upload: "Upload",
    awaitingLink: "Awaiting match",
    view: "View",
    newVersion: "New version",
    history: (n) => `Previous versions (${n}) — kept for audit`,
  },
});

/** Checks panel: fixes, tasks, summary and the check groups. */
export const checksText = defineTexts({
  az: {
    noFieldToFix: "Düzəldiləcək sahə tapılmadı — yeni versiya yükləyin",
    pickOrder: "Sifarişi seç",
    reviewSignature: "İmzaya bax və təsdiqlə",
    editField: "Mənbəyə bax, sahəni düzəlt",
    uploadDelivery: "Təhvil sənədi yüklə",
    uploadInvoice: "Yeni faktura versiyası",
    createTask: "Tapşırıq yarat",
    evidence: (quote: string) => `Mənbə: ${quote}`,
    ruleSet: (v: number, n: number) => `qayda dəsti v${v} · ${n} qayda`,
    summary: "Yoxlama xülasəsi",
    blocking: "Bloklayan problemlər",
    noBlockingTitle: "Bloklayan problem yoxdur",
    noBlockingBody: "Problem uydurulmur: bütün məcburi qaydalar cari versiyada keçib.",
    cascade: (n: number) => `Asılı yoxlamalar (${n})`,
    cascadeBody: "Yuxarıdakı problem həll edilənə qədər aparılmır və paketi bloklayır.",
    rest: (n: number) => `Keçən və tətbiq olunmayan yoxlamalar (${n})`,
  },
  en: {
    noFieldToFix: "No field to correct was found — upload a new version",
    pickOrder: "Choose the order",
    reviewSignature: "Review and confirm the signature",
    editField: "View the source, correct the field",
    uploadDelivery: "Upload delivery note",
    uploadInvoice: "New invoice version",
    createTask: "Create task",
    evidence: (quote) => `Source: ${quote}`,
    ruleSet: (v, n) => `rule set v${v} · ${plural(n, "rule", "rules")}`,
    summary: "Check summary",
    blocking: "Blocking problems",
    noBlockingTitle: "No blocking problems",
    noBlockingBody: "No problems are invented: every mandatory rule passed on the current version.",
    cascade: (n) => `Dependent checks (${n})`,
    cascadeBody: "Not run until the problem above is resolved; they block the package.",
    rest: (n) => `Passed and not applicable checks (${n})`,
  },
});

/** R-010 readiness banner, one per package status. */
export const readinessText = defineTexts({
  az: {
    sum: (pass: number, fail: number, unknown: number, na: number) =>
      `${pass} keçdi, ${fail} uyğunsuz, ${unknown} naməlum, ${na} tətbiq olunmur`,
    processingBody:
      "Mətn qatı yoxlanır, lazım olduqda OCR tətbiq edilir. Emal bitməyincə heç bir nəticə göstərilmir.",
    blockedTitle: (n: number) => `Paket bloklanıb — ${n} problem həll edilməlidir`,
    blockedBody: (v: number, sum: string) =>
      `R-010: cari v${v} bütün məcburi yoxlamalardan keçməyib (${sum}). Bloklayan nəticələr düymə ilə gizlədilə bilməz.`,
    readyTitle: (v: number) =>
      `Bütün məcburi yoxlamalar v${v} üzrə keçdi — insan təsdiqi gözlənilir`,
    invalidated: (v: number) => `Əvvəlki v${v} təsdiqi etibarsızlaşıb və auditdə saxlanılır. `,
    readyBody: "Təsdiq yalnız sənəd paketinin hazırlığına aiddir.",
    approvedBy: (name: string, at: string, v: number) => `Təsdiqləyən: ${name} · ${at} · v${v}. `,
    approvedBody: "Bu, ödənişin təmin edildiyi demək deyil.",
    exportedTitle: (v: number) => `v${v} paketi ixrac edilib`,
    exportedBody: "Göndərilmə və müştərinin qəbulu Prefly-dan kənarda izlənir (P1).",
  },
  en: {
    sum: (pass, fail, unknown, na) =>
      `${pass} passed, ${fail} mismatched, ${unknown} unknown, ${na} not applicable`,
    processingBody:
      "The text layer is checked and OCR is applied when needed. No results are shown until processing finishes.",
    blockedTitle: (n) =>
      `Package blocked — ${plural(n, "problem must", "problems must")} be resolved`,
    blockedBody: (v, sum) =>
      `R-010: current v${v} has not passed every mandatory check (${sum}). Blocking results cannot be hidden with a button.`,
    readyTitle: (v) => `All mandatory checks passed on v${v} — awaiting human approval`,
    invalidated: (v) => `The earlier v${v} approval was invalidated and is kept in the audit. `,
    readyBody: "Approval only concerns the readiness of the document package.",
    approvedBy: (name, at, v) => `Approved by: ${name} · ${at} · v${v}. `,
    approvedBody: "This is not a confirmation of payment.",
    exportedTitle: (v) => `Package v${v} has been exported`,
    exportedBody: "Sending and customer acceptance are tracked outside Prefly (P1).",
  },
});

/** Approve and export dialogs, the manifest and the internal report. */
export const approvalText = defineTexts({
  az: {
    reportFile: "daxili_hesabat",
    reportSaved: "Daxili yoxlama hesabatı yükləndi.",
    noExportFor: (v: number) => `v${v} üçün ixrac tapılmadı.`,
    manifestAgain: (v: number) =>
      `Manifest yenidən yükləndi. v${v} artıq ixrac edilib — yeni audit hadisəsi yaradılmadı.`,
    conflictBody:
      "Siz baxarkən paket dəyişdi. Təsdiq və ixrac yalnız cari versiyaya bağlıdır — yeni versiyaya baxın və yenidən cəhd edin.",
    summary: (pass: number, fail: number, unknown: number, na: number) =>
      `${pass} keçdi · ${fail} uyğunsuz · ${unknown} naməlum · ${na} tətbiq olunmur`,
    approveTitle: (invoice: string | null) => `${invoice} paketini təsdiqlə`,
    cannotApprove: "Təsdiq mümkün deyil",
    blockingChecks: (ids: string) => `Bloklayan yoxlamalar: ${ids}.`,
    notAwaiting: "Paket təsdiq gözləyən vəziyyətdə deyil.",
    currentVersion: "Cari versiya",
    documents: "Sənədlər",
    reviewedAck: "Cari versiyanın sənədlərinə, mənbə sübutlarına və əvvəlki düzəlişlərə baxdım.",
    ackMissing: "Təsdiqdən əvvəl bu qeydi işarələyin.",
    notPayment: "Bu təsdiq bank ödənişinə səlahiyyət vermir — yalnız sənəd paketinin hazırlığıdır.",
    approving: "Təsdiqlənir…",
    exported: (invoice: string | null, v: number) => `${invoice} v${v} ixrac edildi.`,
    manifestSaved: "Manifest yükləndi.",
    manifestFailed: "Fayl yüklənmədi — “Manifesti yenidən yüklə” ilə təkrarlayın.",
    exportTitle: (invoice: string | null) => `${invoice}: ixrac paketi`,
    exportDescription:
      "Müştəriyə göstəriləcək sənədləri seçin. Göndərmə Prefly-dan kənarda aparılır.",
    noInvoice: "Paketdə faktura yoxdur — ixrac mümkün deyil.",
    invoiceMandatory: (file: string) => `${file} · təsdiqlənmiş versiya, məcburidir`,
    internalTitle: "Daxili məlumatlar paketə daxil deyil",
    internalBody:
      "Daxili AI izahları, əməkdaş şərhləri və audit qeydləri xarici paketə avtomatik əlavə olunmur. Daxili yoxlama hesabatı ayrıca yüklənə bilər.",
    exporting: "İxrac olunur…",
    exportSubmit: "İxrac et və manifesti yüklə",
  },
  en: {
    reportFile: "internal_report",
    reportSaved: "Internal check report downloaded.",
    noExportFor: (v) => `No export found for v${v}.`,
    manifestAgain: (v) =>
      `Manifest downloaded again. v${v} was already exported — no new audit event was created.`,
    conflictBody:
      "The package changed while you were viewing it. Approval and export are bound to the current version only — review the new version and try again.",
    summary: (pass, fail, unknown, na) =>
      `${pass} passed · ${fail} mismatched · ${unknown} unknown · ${na} not applicable`,
    approveTitle: (invoice) => `Approve package ${invoice}`,
    cannotApprove: "Approval is not possible",
    blockingChecks: (ids) => `Blocking checks: ${ids}.`,
    notAwaiting: "The package is not awaiting approval.",
    currentVersion: "Current version",
    documents: "Documents",
    reviewedAck:
      "I have reviewed the current version's documents, source evidence and earlier corrections.",
    ackMissing: "Tick this box before approving.",
    notPayment:
      "This approval does not authorise a bank payment — it only marks the document package as ready.",
    approving: "Approving…",
    exported: (invoice, v) => `${invoice} v${v} exported.`,
    manifestSaved: "Manifest downloaded.",
    manifestFailed: "The file was not downloaded — retry with “Download manifest again”.",
    exportTitle: (invoice) => `${invoice}: export package`,
    exportDescription:
      "Choose the documents the customer will see. Sending happens outside Prefly.",
    noInvoice: "The package has no invoice — export is not possible.",
    invoiceMandatory: (file) => `${file} · approved version, mandatory`,
    internalTitle: "Internal data is not part of the package",
    internalBody:
      "Internal AI explanations, staff comments and audit records are never added to the external package automatically. The internal check report can be downloaded separately.",
    exporting: "Exporting…",
    exportSubmit: "Export and download manifest",
  },
});

/** Correcting an extracted field against its source. */
export const correctionText = defineTexts({
  az: {
    valueRequired: "Yeni dəyəri yazın.",
    amountFormat: "Məbləği nöqtə ilə yazın, məsələn 9.10.",
    qtyFormat: "Miqdarı rəqəmlə yazın, məsələn 300.",
    reasonShort: "Səbəb ən azı 3 simvol olmalıdır.",
    corrected: (label: string) => `${label} düzəldildi.`,
    title: (label: string) => `Çıxarışı düzəlt: ${label}`,
    description: "Sənəd dəyişmir — dəyəri mənbəyə baxaraq düzəldirsiniz, səbəb auditə yazılır.",
    readValue: (value: string) => `Oxunan dəyər: ${value}`,
    newValue: "Yeni dəyər",
    reason: "Səbəb",
    invoiceWrong:
      "Fakturanın özündə səhv varsa, onu mənbə sistemində düzəldib yeni versiya yükləyin — düzəliş yalnız çıxarış səhvi üçündür.",
    uploadInstead: "Bunun əvəzinə yeni versiya yükləyin",
    save: "Düzəlişi yadda saxla",
  },
  en: {
    valueRequired: "Enter the new value.",
    amountFormat: "Write the amount with a dot, e.g. 9.10.",
    qtyFormat: "Write the quantity as a number, e.g. 300.",
    reasonShort: "The reason must be at least 3 characters.",
    corrected: (label) => `${label} corrected.`,
    title: (label) => `Correct extraction: ${label}`,
    description:
      "The document does not change — you correct the value by looking at its source; the reason goes to the audit.",
    readValue: (value) => `Extracted value: ${value}`,
    newValue: "New value",
    reason: "Reason",
    invoiceWrong:
      "If the invoice itself is wrong, fix it in the source system and upload a new version — a correction is only for extraction errors.",
    uploadInstead: "Upload a new version instead",
    save: "Save correction",
  },
});

/** Evidence viewer and the R-008 signature review. */
export const evidenceText = defineTexts({
  az: {
    oldVersion: (v: number, current: number) =>
      `Köhnə versiya: bu sübut v${v}-dəndir, cari versiya v${current}-dir.`,
    scan: "Skan sənəd: mətn OCR ilə oxunub — dəyəri mənbə ilə müqayisə edin.",
    signatureTitle: "İmza tələbi (R-008)",
    signatureBody:
      "Qəbul edənin imza sahəsinə baxın. Təsdiqiniz yalnız imzanın vizual mövcudluğunu qeyd edir — hüquqi autentifikasiya deyil.",
    noBbox: "Vurğulama koordinatı yoxdur — səhifə və sitat göstərilir.",
    quote: "Sitat",
    recording: "Qeyd edilir…",
    confirmSignature: "İmzanın mövcudluğunu təsdiqləyirəm",
    notFound: "Mənbə sənəd tapılmadı",
  },
  en: {
    oldVersion: (v, current) =>
