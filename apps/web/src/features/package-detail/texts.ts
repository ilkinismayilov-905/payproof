// shortcut: package detail texts (from the prototype) are kept here until the shared i18n package
// gets keys for them — one file to move.
export const detailText = {
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
  upload: "Sənəd yüklə",
  export: "İxrac et",
  reExport: "Manifesti yenidən yüklə",
  blocked: "Bloklayan yoxlamalar var",
  stillProcessing: "Sənədlər emal olunur",
  soon: "Tezliklə",
  documents: "Sənədlər və versiyalar",
  mockExtraction:
    "Çıxarış: əvvəlcədən hazırlanmış nəticə (mock adapter) — canlı AI analizi kimi təqdim olunmur.",
} as const;
