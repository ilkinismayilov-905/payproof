# API müqaviləsi — dəyişiklik jurnalı

`packages/contracts/openapi.yaml`-dakı hər dəyişiklik burada qeyd olunur (`/contract-change`). Frontend track-ləri yeni qeyd görəndə: `/sync` → `pnpm --filter @payproof/api-client generate` → mock-ları yoxla.

| Tarix | Versiya | Dəyişiklik | Pozucu? | Təsir edən track-lər | Branch |
|---|---|---|---|---|---|
| — | v0 | S-04-də ilkin müqavilə yaradılacaq | — | B, W, M | `feat/S-04-openapi` |
