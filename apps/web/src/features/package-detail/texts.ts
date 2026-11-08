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
} as const;
