import type { Config } from "tailwindcss";

// Every value points at a CSS variable from tokens.css, so light/dark switch without `dark:` variants.
const v = (name: string) => `var(--${name})`;
const scale = <K extends string>(prefix: string, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, v(`${prefix}-${k}`)])) as Record<K, string>;
const semantic = (name: string) => ({ DEFAULT: v(name), bg: v(`${name}-bg`) });

const preset = {
  content: [],
  theme: {
    // Replaces Tailwind's default palette: only token colours exist.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      brand: {
        ...scale("brand", ["50", "100", "500", "600", "700"] as const),
        DEFAULT: v("brand-600"),
        foreground: v("on-brand"),
      },
      bg: v("bg"),
      surface: { DEFAULT: v("surface"), 2: v("surface-2"), 3: v("surface-3") },
      border: { DEFAULT: v("border"), strong: v("border-strong") },
      text: { DEFAULT: v("text"), 2: v("text-2"), 3: v("text-3") },
      success: semantic("success"),
      warning: semantic("warning"),
      danger: { ...semantic("danger"), foreground: v("on-danger") },
      info: semantic("info"),
      neutral: semantic("neutral"),
      avatar: Object.fromEntries(
        [1, 2, 3, 4, 5].map((n) => [n, { DEFAULT: v(`av-${n}`), text: v(`av-${n}t`) }]),
      ),
      paper: {
        DEFAULT: v("paper"),
        ink: v("paper-ink"),
        line: v("paper-line"),
        muted: v("paper-muted"),
        hl: v("paper-hl"),
        "hl-ring": v("paper-hl-ring"),
        scan: v("paper-scan"),
      },
      overlay: v("overlay"),
      "stage-glow": v("stage-glow"),
    },
    fontFamily: { sans: v("font"), mono: v("mono") },
    fontSize: scale("fs", ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const),
    borderRadius: { none: "0", ...scale("r", ["sm", "md", "lg", "xl", "full"] as const) },
    boxShadow: { none: "none", ...scale("sh", ["1", "2", "3"] as const) },
    extend: {
      // Tailwind's numeric spacing already uses a 4px step; these pin it to the token values.
      spacing: {
        ...scale("sp", ["1", "2", "3", "4", "5", "6", "8", "10", "12"] as const),
        topbar: v("topbar-h"),
      },
      transitionDuration: { DEFAULT: v("dur") },
      transitionTimingFunction: { DEFAULT: v("ease") },
    },
  },
} satisfies Config;

export default preset;
