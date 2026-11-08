# Progress — Backend (B)

Sahib: lead · Step təfərrüatları: `docs/roadmap/steps/backend.md`
Status: ⬜ başlanmayıb · 🟡 icrada · ✅ bitib (merge olunub) · 🚧 bloklanıb (səbəbi qeyddə)

Bu faylı yalnız bu track-in sessiyası yeniləyir (`/step` başlayanda 🟡, `/finish-step`-də ✅).

| Step | Ad | Status | Branch | Tarix | Qeyd |
|---|---|---|---|---|---|
| B-01 | FastAPI skeleti | ✅ | `feat/B-01-api-skeleton` | 2026-11-08 | uv + ruff/mypy strict/pytest; settings, JSON log + `X-Correlation-ID`, standart xəta formatı, `/v1/health` (sxemdən gizli — kontraktda yoxdur) |
| B-02 | DB təməli | ✅ | `feat/B-02-db-foundation` | 2026-11-08 | async engine/session, `Base` + uuid7/timestamp/tenant mixin-ləri, async Alembic (boş baseline), `make migrate`; tenant qoruyucusu session səviyyəsində (`bind_tenant`) — kontekstsiz ORM sorğusu, başqa tenant-a yazma və rebind xəta verir; test DB `<db>_test` + rollback |
| B-03 | Kimlik və müştəri modelləri | ✅ | `feat/B-03-identity-models` | 2026-11-08 | miqrasiya 0002–0003; `requirement_sets`-də `company_id` + composite FK (müştəri və təsdiqçi eyni tenant-dan), dəyişməzlik trigger-i (B-09 reset: TRUNCATE); `memberships` tenant qoruyucusundan kənar; model↔miqrasiya drift testi. B-10: `assignee` daxil ola bilməz (ADR-0008) |
| B-04 | Paket və sənəd modelləri | ✅ | `feat/B-04-package-models` | 2026-11-08 | miqrasiya 0004–0010, 13 cədvəl; hamısı tenant-lı, valideyn/övlad və istifadəçi istinadları composite same-tenant FK; paket faktura sahələri PROCESSING zamanı NULL, silinmiş paket nömrəni azad edir; validation run paketin müştərisinin qayda dəstinə bağlıdır; `evidence_ids` FK-sız (B-17-də yoxlanır) |
| B-05 | Tapşırıq, təsdiq, ixrac, audit, bildiriş, job modelləri | ✅ | `feat/B-05-workflow-models` | 2026-11-08 | miqrasiya 0011–0014; audit append-only trigger; bir versiyaya bir qüvvədə təsdiq (partial unique), təsdiq run-a 5 sütunlu FK ilə bağlı; bir qayda üçün bir açıq tapşırıq (partial unique); `jobs` tenant qoruyucusundan kənar (B-14 açıq filtr) |
| B-06 | Domen primitivləri | ✅ | `feat/B-06-domain-primitives` | 2026-11-08 | `Money` (valyuta məcburi, HALF_UP, NUMERIC(18,2) aralığı), enum-lar openapi ilə test olunur, icazə matrisi security.md-dən; `PackageSnapshot` + `parties` (R-003 mesajı) — rules-engine.md yeniləndi; modellərdə literal Role/Currency/status siyahıları enum-larla əvəzləndi (SQL eyni) |
| B-07 | Qayda mühərriki I — R-001…R-004 | ✅ | `feat/B-07-rules-engine-1` | 2026-11-08 | `domain/rules/` — hər qayda ayrı modul, mesajlar mock/prototiplə eyni; R-004 vahid fərqi və oxunmamış vahid → UNKNOWN (mesaj yeni), R-003 oxunmamış təhvil alıcısı → UNKNOWN; evidence field path üzrə (`rules/paths.py`) |
| B-08 | Qayda mühərriki II — R-005…R-009, status törədilməsi, golden test | ✅ | `feat/B-08-rules-engine-2` | 2026-11-08 | R-005…R-009, `evaluate()`, `derive_status()`; golden 14/14 + yeni dəstlər + INV-1042 axını; mesajlar TS mühərriki ilə bayt-bayt eyni (review yoxladı); oxunmamış dəyər/sətir və nəticəsiz run heç vaxt PASS/READY deyil |
| B-09 | Seed əmri | ✅ | `feat/B-09-seed` | 2026-11-08 | `payproof-seed [--reset]` / `make seed [RESET=1]`: bir tranzaksiya, slug→uuid5 (deterministik), seed varsa no-op, reset TRUNCATE; cari run + nəticələr hər bitmiş paket üçün; storage faylları (B-13) və audit tarixçəsi (B-12) hələ yoxdur; tenant guard artıq model import-u ilə qeydiyyatdan keçir |
| B-10 | Auth, tenant, səlahiyyət | ✅ | `feat/B-10-auth` | 2026-11-08 | HS256 dev token (sub/exp/iat/aud/iss, alg pinned), `current_member` (üzvlük DB-dən, `bind_tenant`), `require()`, `/me`, `/users`, dev-users/dev-login yalnız `ENV=dev`; fail-closed: `ENV` məcburi, prod-da dev token yoxdur (JWKS gələnə qədər 500) və zəif `JWT_SECRET` ilə qalxmır; dev-users = assignee olmayan bütün üzvlər |
| B-11 | Oxuma API-ləri | ✅ | `feat/B-11-read-api` | 2026-11-08 | `GET /v1/dashboard`, `/v1/packages` (filtr/sort/cursor, yaddaşda), `/v1/packages/{id}`; status cari versiyanın son run-ından, sabit sorğu sayı; openapi jsonschema testi (14 detal); öz access log-u; `check_results.fix_hint` (0015); DB → snapshot builder (B-17 üçün); candidates (B-16) və evidence (B-15) hələ boş |
| B-12 | Audit servisi | ⬜ | | | |
| B-12b | SSE canlı hadisələr | ⬜ | | | ADR-0010 |
| B-13 | Storage və yükləmə | ⬜ | | | |
| B-14 | Job növbəsi və worker | ⬜ | | | |
| B-15 | Çıxarış pipeline-ı | ⬜ | | | |
| B-16 | Sifariş uyğunlaşdırması | ⬜ | | | |
| B-17 | Validation run, imza yoxlaması | ⬜ | | | |
| B-18 | Çıxarış düzəlişi | ⬜ | | | |
| B-19 | Tapşırıqlar API | ⬜ | | | |
| B-20 | Təsdiq | ⬜ | | | |
| B-21 | İxrac və daxili hesabat | ⬜ | | | |
| B-22 | Müştəri qaydaları API | ⬜ | | | |
| B-23 | Bildirişlər API | ⬜ | | | |
| B-24 | Yeni paket və silmə | ⬜ | | | |
| B-25 | Real çıxarış (stretch) | ⬜ | | | |
| B-26 | Möhkəmləndirmə və müqavilə testi | ⬜ | | | |
