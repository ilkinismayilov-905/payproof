import { defineTexts } from "../dict";

/** Audit history screen and its table. */
export const auditText = defineTexts({
  az: {
    title: "Audit tarixçəsi",
    description:
      "Kim, nə vaxt, hansı versiyada, nəyi dəyişdi. Daxili qeydlər xarici ixrac paketinə daxil edilmir.",
    csv: "CSV yüklə",
    csvDone: "Audit jurnalı CSV kimi yükləndi.",
    searchLabel: "Auditdə axtar",
    searchPlaceholder: "Hərəkət, faktura və ya təfərrüat axtar",
    user: "İstifadəçi",
    userAll: "İstifadəçi: hamısı",
    caption: "Audit hadisələri",
    emptyTitle: "Uyğun hadisə yoxdur",
    emptyDescription: "Axtarış sözünü dəyişin və ya istifadəçi filtrini təmizləyin.",
    footer: (n: number, truncated: boolean) =>
      `${n} hadisə${truncated ? " · ən son 100-ü göstərilir (tam jurnal CSV-də)" : ""} · append-only jurnal, redaktə edilmir`,
    col: { time: "Vaxt", user: "İstifadəçi", event: "Hadisə", package: "Paket" },
    packageFallback: "Paket",
  },
  en: {
    title: "Audit history",
    description:
      "Who changed what, when and in which version. Internal notes are not included in the external export package.",
    csv: "Download CSV",
    csvDone: "Audit log downloaded as CSV.",
    searchLabel: "Search the audit log",
    searchPlaceholder: "Search action, invoice or detail",
    user: "User",
    userAll: "User: all",
    caption: "Audit events",
    emptyTitle: "No matching events",
    emptyDescription: "Change the search term or clear the user filter.",
    footer: (n, truncated) =>
      `${n} event${n === 1 ? "" : "s"}${truncated ? " · showing the latest 100 (full log in the CSV)" : ""} · append-only log, never edited`,
    col: { time: "Time", user: "User", event: "Event", package: "Package" },
    packageFallback: "Package",
  },
});
