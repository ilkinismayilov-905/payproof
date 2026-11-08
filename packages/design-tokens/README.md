# @payproof/design-tokens

Prototipin dizayn sistemi (`docs/product/prototype/payproof-prototype.html`, bölmə 1) paylaşılan tokenlər kimi. Web və mobile **eyni** paketi istifadə edir; kodda hex rəng yoxdur.

| Export | Nə |
|---|---|
| `@payproof/design-tokens/tokens.css` | CSS dəyişənləri: brand petrol `#0D5D6B`, neytrallar, semantik rənglər, avatar, sənəd görüntüləyici (`paper`), spacing 4/8, tipoqrafiya, radius, shadow, motion; light + dark |
| `@payproof/design-tokens/tailwind-preset` | Tailwind preset — bütün dəyərlər `var(--…)` |
| `@payproof/design-tokens` | Status → badge tonu xəritələri və `badgeClass` |

## Qoşulma
```css
/* app/globals.css — Tailwind v4 */
@import "tailwindcss";
@import "@payproof/design-tokens/tokens.css";
@config "../../tailwind.config.ts";
```
```ts
// tailwind.config.ts (v4-də @config ilə, v3-də birbaşa)
import preset from "@payproof/design-tokens/tailwind-preset";
export default { presets: [preset], content: ["./src/**/*.{ts,tsx}"] };
```
Preset Tailwind-in default palitrasını **əvəz edir**: `bg-red-500` yoxdur, yalnız token rəngləri var.

## Class-lar
| Qrup | Nümunə |
|---|---|
| Rəng | `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `border-border-strong`, `text-text`, `text-text-2`, `text-text-3` |
| Brand | `bg-brand` (= 600), `text-brand-foreground`, `bg-brand-50`, `text-brand-700` |
| Semantik | `text-success` / `bg-success-bg`, `warning`, `danger` (+ `text-danger-foreground`), `info`, `neutral` |
| Avatar | `bg-avatar-3 text-avatar-3-text` |
| Sənəd | `bg-paper`, `text-paper-ink`, `bg-paper-hl`, `ring-paper-hl-ring`, `bg-paper-scan` |
| Spacing | `p-1`…`p-12` (4px addım, token dəyəri), `h-topbar` |
| Mətn | `text-xs` 12 · `text-sm` 13 · `text-md` 14 · `text-lg` 16 · `text-xl` 18 · `text-2xl` 22 · `text-3xl` 28 · `text-4xl` 34; `font-sans`, `font-mono` |
| Digər | `rounded-sm/md/lg/xl/full`, `shadow-1/2/3`, `bg-overlay`, `transition duration-base ease-base` (token müddəti və easing) |

Diqqət: `text-sm` Tailwind default-u (14px) deyil, prototipin 13px-idir.

## Status badge-ləri
```tsx
import { badgeClass, packageStatusTone } from "@payproof/design-tokens";
import { packageStatusLabel } from "@payproof/api-client/i18n"; // S-05

<span className={`badge ${badgeClass[packageStatusTone[status]]}`}>{packageStatusLabel[status]}</span>
```
| Xəritə | Dəyərlər → ton |
|---|---|
| `packageStatusTone` | PROCESSING info · NEEDS_REVIEW warning · NEEDS_FIX danger · READY_FOR_APPROVAL brand · APPROVED_READY success · EXPORTED neutral |
| `checkOutcomeTone` | PASS success · FAIL danger · UNKNOWN warning · NOT_APPLICABLE neutral |
| `taskStatusTone` | OPEN neutral · IN_PROGRESS info · SUBMITTED_FOR_RECHECK warning · RESOLVED success |
| `documentStatusTone` | EXTRACTED success · REVIEW_REQUIRED warning · PROCESSING info · FAILED danger |

Rəng yeganə siqnal deyil: badge həmişə mətn (və ya ikon + `sr-only` mətn) daşıyır.

## Light / dark
Dark OS seçiminə görə avtomatik açılır. App-də əl ilə dəyişmək üçün `<html data-theme="dark">` və ya `data-theme="light"` (OS dark olsa belə light saxlayır). Dəyərlər hər iki yolda eynidir; `dark:` variantı lazım deyil.

## Dəyişiklik
`tokens.css` prototiplə dəyişən-dəyişən eyni saxlanılır — `pnpm --filter @payproof/design-tokens test` bunu yoxlayır. Token dəyişirsə, əvvəl prototip, sonra bu paket.
