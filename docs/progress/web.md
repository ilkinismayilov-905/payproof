# Progress — Web (W)

Sahib: lead · Step təfərrüatları: `docs/roadmap/steps/web.md`
Status: ⬜ başlanmayıb · 🟡 icrada · ✅ bitib (merge olunub) · 🚧 bloklanıb (səbəbi qeyddə)

Bu faylı yalnız bu track-in sessiyası yeniləyir (`/step` başlayanda 🟡, `/finish-step`-də ✅).

| Step | Ad | Status | Branch | Tarix | Qeyd |
|---|---|---|---|---|---|
| W-01 | Next.js skeleti | ✅ | `feat/W-01-web-skeleton` | 2026-11-08 | Next 16.4 + Tailwind 4 (tokens preset) + shadcn (radix-nova, token rəngləri) + ESLint/Vitest/Playwright; light/dark e2e ilə yoxlanır |
| W-02 | Data qatı və dev auth | ✅ | `feat/W-02-data-layer` | 2026-11-08 | api client + token (memory/sessionStorage), TanStack Query (401 → /login, toast), MSW client-only, `/login` demo seçimi, `AuthGuard`, `useMe`/`useCan`. Borc (W-03): login ekranı mətnləri hələ `i18n`-də deyil |
| W-03 | i18n və status komponentləri | ✅ | `feat/W-03-status-ui` | 2026-11-08 | `components/status` (4 badge: ikon + mətn + ton; test glossary.md-ni parse edir), `components/format` (`Money` — valyuta məcburi, `DateTime`); Tailwind `@source` design-tokens. `t` helper yoxdur — tipli map-lar birbaşa. Açıq: `documentStatusTone`-da `UPLOADED` yoxdur (web-də lokal info); login mətnləri i18n-də deyil (shared) |
| W-04 | Tətbiq çərçivəsi (shell) | ⬜ | | | |
| W-05 | Ümumi UI dəsti | ⬜ | | | |
| W-05b | Canlı yeniləmələr | ⬜ | | | ADR-0010 |
| W-06 | İcmal (dashboard) | ⬜ | | | |
| W-07 | Paketlər siyahısı | ⬜ | | | |
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
