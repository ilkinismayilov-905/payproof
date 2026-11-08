# PayProof

> Find the document issue before it becomes a payment delay.

PayProof B2B satış fakturasını müştərinin sifarişi və təhvil sənədi ilə tutuşdurur, ödənişi ləngidə bilən sənəd problemlərini mənbə sübutu ilə göstərir, düzəlişi məsul şəxsə yönləndirir və hazır paketi insan təsdiqindən sonra ixrac edir.

**Status:** MVP (P0) implementasiyası başlayır. Bütün demo məlumatları sintetikdir.

## Komponentlər
| | Texnologiya | İstifadəçi |
|---|---|---|
| `apps/api` | Python 3.12, FastAPI, PostgreSQL, S3 (MinIO) | — |
| `apps/web` | Next.js, TypeScript, Tailwind, shadcn/ui | Maliyyə komandası (operator, təsdiqçi, auditor) |
| `apps/mobile` | Next.js PWA (mobil-first) | Təsdiqçi (status + təsdiq) |
| `packages/*` | API müqaviləsi, generasiya olunan client, mock-lar, dizayn tokenləri | — |

## Başlamaq
1. `docs/00-START-HERE.md` — kim nəyi oxuyur, necə başlanır.
2. Alətlər: Node 22+, pnpm 9+, [uv](https://docs.astral.sh/uv/), Docker, git, Claude Code.
3. `./scripts/setup.sh` — git hook-larını aktivləşdirir və alətləri yoxlayır.
4. Claude Code-u repo kökündə açın və `/next-step shared` yazın.

## Sənədlər
- Məhsul: `docs/product/` (brif, prototip, komanda bələdçisi PDF)
- Arxitektura: `docs/architecture/`
- Mühəndislik qaydaları: `docs/engineering/`
- Roadmap və step-lər: `docs/roadmap/`
- Prompt-lar: `docs/prompts/`
- Progress: `docs/progress/`

## Prototip
`docs/product/prototype/payproof-prototype.html` faylını brauzerdə açın — internetsiz işləyir, veb və mobil görünüşləri, 13 addımlı demo bələdçisi var. Implementasiyada ekranlar, mətnlər, statuslar və demo dataset buradan götürülür.
