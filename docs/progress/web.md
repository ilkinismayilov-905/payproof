# Progress — Web (W)

Sahib: lead · Step təfərrüatları: `docs/roadmap/steps/web.md`
Status: ⬜ başlanmayıb · 🟡 icrada · ✅ bitib (merge olunub) · 🚧 bloklanıb (səbəbi qeyddə)

Bu faylı yalnız bu track-in sessiyası yeniləyir (`/step` başlayanda 🟡, `/finish-step`-də ✅).

| Step | Ad | Status | Branch | Tarix | Qeyd |
|---|---|---|---|---|---|
| W-01 | Next.js skeleti | ✅ | `feat/W-01-web-skeleton` | 2026-11-08 | Next 16.4 + Tailwind 4 (tokens preset) + shadcn (radix-nova, token rəngləri) + ESLint/Vitest/Playwright; light/dark e2e ilə yoxlanır |
| W-02 | Data qatı və dev auth | ✅ | `feat/W-02-data-layer` | 2026-11-08 | api client + token (memory/sessionStorage), TanStack Query (401 → /login, toast), MSW client-only, `/login` demo seçimi, `AuthGuard`, `useMe`/`useCan`. Borc (W-03): login ekranı mətnləri hələ `i18n`-də deyil |
| W-03 | i18n və status komponentləri | ✅ | `feat/W-03-status-ui` | 2026-11-08 | `components/status` (4 badge: ikon + mətn + ton; test glossary.md-ni parse edir), `components/format` (`Money` — valyuta məcburi, `DateTime`); Tailwind `@source` design-tokens. `t` helper yoxdur — tipli map-lar birbaşa. Follow-up (shared PR #23 + `refactor/W-03-shared-followups`): `UPLOADED` tonu design-tokens-də; login/shell/düymə mətnləri `loginText`/`shellText`/`actionLabel`-dən; problem günü `bakuDaysBetween` |
| W-04 | Tətbiq çərçivəsi (shell) | ✅ | `feat/W-04-app-shell` | 2026-11-08 | `features/shell`: sidebar (aktiv route, açıq tapşırıq sayı, yığma localStorage-də, P1 toast), topbar (axtarış → `/packages?q=`, bildiriş yeri — W-16, istifadəçi menyusu: demo hesabı / çıxış), <768 drawer (Radix Dialog), skip link; route placeholder-ləri W-06+ üçün. Radix birbaşa (`radix-ui`), shadcn dropdown/sheet yox |
| W-05 | Ümumi UI dəsti | ✅ | `feat/W-05-ui-kit` | 2026-11-08 | `components/ui`: `PageHeader`, `Panel`, `Banner` (5 ton), `EmptyState` (`headingLevel`), `Skeleton*` + `Loading` (bir status bölgəsi), `ConfirmDialog` (Radix AlertDialog, ilkin fokus "Ləğv et"), `DataTable` (manual sort, sütun üzrə opt-in `enableSorting`, `aria-sort`); `pointer-coarse:` ≥44px (Button + shell), e2e touch testi; `destructive` düymə doymuş qırmızı |
| W-05b | Canlı yeniləmələr | ⬜ | | | ADR-0010 |
| W-06 | İcmal (dashboard) | ✅ | `feat/W-06-dashboard` | 2026-11-08 | `features/dashboard`: təqdimat kartı (localStorage), 4 KPI → `/packages?status=…`, valyuta üzrə məbləğ, top problem, problem yaşı (Bakı günü, server kimi), qayda bar-ları + status donut (HTML/SVG, prototip kimi — Recharts əlavə edilmədi; mətn alternativi var), diqqət cədvəli (`/v1/packages?status=NEEDS_FIX,NEEDS_REVIEW&sort=-problem_age&limit=5`), təsdiq tarixçəsi; `Panel flush`. "Yeni paket" düyməsi W-14-də |
| W-07 | Paketlər siyahısı | ✅ | `feat/W-07-packages-list` | 2026-11-08 | `/packages`: filtrlər/sort/cursor URL-də (API ilə eyni adlar, `features/packages/url.ts` yoxlayır), axtarış debounce + `replace`, filtrlər `push`; tarix `from`/`to` (paylaşılan link sabit qalsın); cursor pagination ("İlk"/"Növbəti", əvvəlki = Geri); `DataTable` `onRowClick` + sort props-dan; `SearchBox`, `useCustomers`, `useAssignableUsers` |
| W-08 | Paket detalı I — başlıq, banner-lər, sənədlər, tarixçə | ⬜ | | | |
| W-09 | Paket detalı II — müqayisə və mənbə göstəricisi | ⬜ | | | |
| W-10 | Paket detalı III — yoxlamalar paneli və əməliyyatlar | ⬜ | | | |
| W-11 | Çıxarış düzəlişi və yükləmə | ⬜ | | | |
| W-12 | Tapşırıqlar | ⬜ | | | |
| W-13 | Təsdiq və ixrac | ⬜ | | | |
| W-14 | Yeni paket və silmə | ⬜ | | | |
| W-15 | Müştəri qaydaları | ⬜ | | | |
| W-16 | Audit və bildirişlər | ⬜ | | | |
| W-17 | Keyfiyyət keçidi + E2E | ⬜ | | | |
| W-18 | Real API-yə keçid | ⬜ | | | |
