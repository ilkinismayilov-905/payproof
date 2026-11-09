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
