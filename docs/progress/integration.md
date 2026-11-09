# Progress — Integration (I)

Sahib: lead · Step təfərrüatları: `docs/roadmap/steps/integration.md`
Status: ⬜ başlanmayıb · 🟡 icrada · ✅ bitib (merge olunub) · 🚧 bloklanıb (səbəbi qeyddə)

Bu faylı yalnız bu track-in sessiyası yeniləyir (`/step` başlayanda 🟡, `/finish-step`-də ✅).

| Step | Ad | Status | Branch | Tarix | Qeyd |
|---|---|---|---|---|---|
| I-01 | Tam axın real stack-də | ✅ | `feat/I-01-e2e-real` | 2026-11-09 | Compose-a `web` (`apps/web/Dockerfile`, real API, `NEXT_PUBLIC_API_URL` build arg); `make demo` = up --build --wait + migrate + seed (image-lər hazır olanda ~20 s). Playwright `E2E_API=stack` (`pnpm --filter web e2e:stack`): işlək stack-ə qarşı, sıfırlama `POST /v1/demo/reset` ilə; bütün suite (67) keçir, CI `web-e2e-stack`. INV-1042 axını audit-də bütün addımları yoxlayır (link, iki yükləmə, imza, yoxlama, təsdiq, ixrac); iki tab SSE ≤ 2 s hər iki istiqamətdə (veb↔veb). Tapıntı: TRUNCATE açıq oxucu ilə deadlock → reset 500 — savepoint + təkrar (`fix(I-01)`). **Mobil hissə avtomatlaşdırılmayıb — manual, mobil komanda ilə:** mobil repo müqavilə 0.3.0 ilə sinxron, mock-suz real API, iki cihazda (Aygün veb, Rəşad mobil) ≤ 2 s. "Təmiz maşında 5 dəqiqə" image build daxil CI-da ölçülür |
| I-02 | Demo hazırlığı | ✅ | `feat/I-02-demo-ready` | 2026-11-09 | İstifadəçi menyusunda "Demo məlumatlarını sıfırla" (prototip mətnləri, `ConfirmDialog`; yalnız dev — `dev-users` mövcud olanda, `POST /v1/demo/reset`, sonra bütün keş refetch + `/overview`); real stack-də server ~0,6 s, e2e < 3 s. İnternetsiz: e2e `offlineGuard` — localhost-dan kənara istənilən brauzer sorğusu testi yıxır (mock + stack 68/68); backend-də xarici müştəri yalnız `extraction/llm.py`. `docs/product/demo-script.md` (13 addım, hazır cavablar, "Nə real, nə simulyasiyadır", lokal vs hosted Render), README "Demo". Shortcut: mətnlər `features/shell/demo.ts`-də (shared i18n açarı yoxdur); sıfırlama canlı hadisə göndərmir — digər cihazda refresh. **Quru məşq (iki nəfər) — insan üçün açıq** (ssenaridəki cədvəl) |
| I-03 | v0.1.0 buraxılışı | ⬜ | | | |
