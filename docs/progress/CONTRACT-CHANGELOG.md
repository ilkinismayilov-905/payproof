# API müqaviləsi — dəyişiklik jurnalı

`packages/contracts/openapi.yaml`-dakı hər dəyişiklik burada qeyd olunur (`/contract-change`). Frontend track-ləri yeni qeyd görəndə: `/sync` → `pnpm --filter @payproof/api-client generate` → mock-ları yoxla.

| Tarix | Versiya | Dəyişiklik | Pozucu? | Təsir edən track-lər | Branch |
|---|---|---|---|---|---|
| 2026-11-08 | v0 (0.1.0) | İlkin P0 müqaviləsi: api-contract.md-dəki 32 endpoint + `GET /v1/auth/dev-users` (dev-login seçimi üçün) — cəmi 33 əməliyyat. Yeni xəta kodları: `IDEMPOTENCY_KEY_REUSED` (422), `IDEMPOTENCY_IN_PROGRESS` (409), `PACKAGE_NOT_DELETABLE` (409), `INTERNAL_ERROR`. Dəyişən paket əməliyyatları (match, field, signature-review, validate) yenilənmiş `PackageDetail` qaytarır; approve body-si `documents_reviewed: true` tələb edir | — | B, W, M | `feat/S-04-openapi` |
