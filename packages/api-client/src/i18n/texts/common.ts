import { defineTexts } from "../dict";

/** App-level texts (dev mock gate). */
export const commonText = defineTexts({
  az: {
    mockFailed: "Demo API (MSW) işə düşmədi: public/mockServiceWorker.js yoxdur.",
  },
  en: {
    mockFailed: "The demo API (MSW) did not start: public/mockServiceWorker.js is missing.",
  },
});
