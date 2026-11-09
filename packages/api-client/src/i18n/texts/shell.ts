import { defineTexts } from "../dict";

/** App shell texts not covered by `shellText` (az.ts/en.ts). */
export const navText = defineTexts({
  az: {
    /** Screen-reader suffix after a nav item's counter ("Tapşırıqlar 6 açıq"). */
    open: "açıq",
  },
  en: {
    open: "open",
  },
});

/** User menu: reset the demo data (ENV=dev only). */
export const demoText = defineTexts({
  az: {
    reset: "Demo məlumatlarını sıfırla",
    confirmTitle: "Demonu sıfırlamaq?",
    confirmBody:
      "Bütün dəyişikliklər (təsdiqlər, yükləmələr, tapşırıqlar) silinəcək və ilkin sintetik məlumatlar bərpa olunacaq. Bu əməliyyat geri qaytarılmır.",
    confirm: "Bəli, sıfırla",
    done: "Demo məlumatları ilkin vəziyyətə qaytarıldı.",
  },
  en: {
    reset: "Reset demo data",
    confirmTitle: "Reset the demo?",
    confirmBody:
      "All changes (approvals, uploads, tasks) will be deleted and the original synthetic data restored. This cannot be undone.",
    confirm: "Yes, reset",
    done: "Demo data has been restored to its original state.",
  },
});
