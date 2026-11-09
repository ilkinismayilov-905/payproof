# ADR-0007: Sənəd çıxarışı adapter arxasında
**Status:** qəbul edilib · 2026-11-08

**Qərar:** `ExtractionAdapter` protokolu: `extract(document_version) -> ExtractionResult(fields, lines, evidence, unreadable, warnings)`. İmplementasiyalar:
- `MockExtractionAdapter` — fixtures-dan əvvəlcədən hazırlanmış nəticə; UI-də "əvvəlcədən hazırlanmış nəticə (mock adapter)" kimi etiketlənir. Default.
- `PdfTextAdapter` — PDF mətn qatı (PyMuPDF), CSV/XLSX parser.
- ~~`OcrAdapter` — Tesseract (`aze`, `eng`).~~ B-25-də yazılmadı (istifadəçi qərarı, 2026-11-09): skan/şəkil də `LlmAdapter`-ə gedir.
- `LlmAdapter` — Claude (`AI_API_KEY`, `AI_MODEL`); PDF və şəkil birbaşa model-ə (document/image bloku), cavab `output_config` JSON sxemi ilə; CSV/XLSX deterministik `PdfTextAdapter` cədvəl oxucusu ilə. Açar yoxdursa, API xətası, refusal və ya sxemə uymayan cavab → mock nəticəsinin sətir kodları qalır, bütün kritik dəyərlər boş (`UNKNOWN` + əl ilə daxiletmə), səbəb auditdə (`document.ai`).
Seçim: `AI_PROVIDER=mock|pdf|llm`. Nəticə həmişə JSON sxem + mənbə validasiyasından keçir. Model nəticəsi qayda mühərrikinə birbaşa təsir etmir — yalnız strukturlaşdırılmış sahələr vasitəsilə.
