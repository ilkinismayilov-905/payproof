# Demo ssenarisi — PayProof (real tətbiq)

Prototipin 13 addımlı bələdçisi (`docs/product/prototype/payproof-prototype.html`, `TOUR`) real tətbiq üçün. Müddət: **8–10 dəqiqə**. İki nəfər: **aparıcı** (veb, Aygün) və **təsdiqçi** (mobil və ya ikinci brauzer, Rəşad).

## Hazırlıq (demodan 15 dəqiqə əvvəl)

1. Stack: `make demo` → veb http://localhost:3000, API http://localhost:8000/docs. Mobil öz repo-sundan `:3001`-də, bu API-yə qoşulu (`NEXT_PUBLIC_API_URL=http://localhost:8000`).
2. `.env`-də `AI_PROVIDER=mock` — internet lazım deyil (bax: [Nə real, nə simulyasiyadır](#nə-real-nə-simulyasiyadır)).
3. Veb: `/login` → **Aygün Məmmədova** (operator). Mobil: **Rəşad Əliyev** (təsdiqçi).
4. Sağ yuxarı istifadəçi menyusu → **Demo məlumatlarını sıfırla** → **Bəli, sıfırla** (< 3 s). Sonra **mobildə səhifəni yeniləyin** — sıfırlama canlı hadisə göndərmir.
5. Yoxlama: İcmalda açıq problemli məbləğ **29.706,00 AZN** və **1.800,00 USD**; INV-1042 statusu **Yoxlama tələb edir**.

**Lokal və ya hosted?** Ssenari lokal `make demo` üçündür (`AI_PROVIDER=mock`, demo fayl seçimi açıq, internetsiz). Render-dəki hosted demo (`render.yaml`) real Claude çıxarışı ilə işləyir (`AI_PROVIDER=llm`) və demo fayl seçimi orada **söndürülüb** (`NEXT_PUBLIC_DEMO_FILES=0` — demo faylları AI-nin oxuya bilmədiyi yer tutuculardır). Hosted-də 7-ci addım üçün **real PDF-lər** hazırlayın: PO-381 yazılmış INV-1042 fakturası və TS-5531 imzalı təhvil aktı. Əks halda sahələr `UNKNOWN` qalacaq və paket bloklanacaq. Bu, səhv deyil, dürüst nəticədir, amma ssenarini pozur. Münsiflər qarşısında ən etibarlı yol lokal demodur.

Ehtiyat: mobil işləməsə, 9-cu addımı ikinci brauzer pəncərəsində (gizli rejim) vebdə Rəşad kimi edin — axın eynidir.

## Addımlar

| # | Kim · harada | Nə edirsən | Nə deyirsən | Gözlənilən nəticə |
|---|---|---|---|---|
| 1 | Aygün · **İcmal** | Təqdimat kartını göstər | B2B satıcının maliyyə komandası fakturanı müştəriyə göndərməzdən əvvəl sifariş və təhvil sənədi ilə tutuşdurur. Hər nəticə mənbə ilə göstərilir, qərarı insan verir. | — |
| 2 | Aygün · **İcmal** | KPI kartlarına bax, birinə bas | Paketlər statusa görə sayılır. Problemli məbləğ AZN və USD üzrə **ayrıca** — itki kimi təqdim olunmur. | Siyahı statusa görə filtrlənir |
| 3 | Aygün · **Faktura paketləri** | INV-1042 sətrinə bas | 12.000 AZN, B Mağazalar Şəbəkəsi. Müştəri PO və imzalı təhvil aktı tələb edir — fakturada PO yoxdur. | Paket detalı açılır |
| 4 | Aygün · INV-1042 | Sifariş banneri → **Bax və təsdiqlə** → PO-381 → **Seçilmiş sifarişlə əlaqəni təsdiqlə** | Alıcı və məhsul kodlarına görə PO-381 namizəddir. Oxşarlıq sübut deyil — əlaqəni insan təsdiqləyir. | Status **Düzəliş tələb edir**, paket v2 |
| 5 | Aygün · **Yoxlamalar** paneli | R-001 kartında **Mənbəyə bax**; R-001 və R-007 üçün **Tapşırıq yarat** | Qayda mühərriki deterministikdir: 2 bloklayan problem. Hər nəticənin altında mənbə sitatı var. | Sənəd səhifəsi vurğulanmış açılır; iki tapşırıq yaranır (Leyla, Elvin) |
| 6 | Aygün · **Tapşırıqlar** | Açıq tapşırıqları göstər, INV-1042-yə qayıt | Düzəliş məsul şəxsə gedir: mühasibat fakturanı, anbar imzalı aktı. "Həll edildi" düyməsi yoxdur. | — |
| 7 | Aygün · INV-1042 | **Sənəd yüklə**: Faktura → `INV-1042_v2_PO-381.pdf`; Təhvil → `TS-5531_imzali.pdf`. Sonra **İmzaya bax və təsdiqlə** → **İmzanın mövcudluğunu təsdiqləyirəm** | Yeni versiyalar — köhnəsi auditdə qalır. İmzanı əməkdaş vizual yoxlayır, bu hüquqi autentifikasiya deyil. | **Sənədlər və versiyalar**-da yeni versiyalar; paket versiyası artır |
| 8 | Aygün · INV-1042 | Yoxlamalar panelinə və **Təsdiqlə** düyməsinə bax | Bütün yoxlamalar keçdi. Tapşırıqları **sistem** bağladı — "düzəltdim" demək kifayət deyil. Operator təsdiqləyə bilmir. | Status **Təsdiq gözləyir**; **Təsdiqlə** bağlı, izahlı |
| 9 | Rəşad · mobil, INV-1042 | Sənədləri aç, təsdiq qeydini işarələ, **Təsdiqlə** | Rəhbər sənədlərə baxmadan təsdiq edə bilməz. (Aygünün ekranına bax: refresh-siz ≤ 2 s-də yenilənir.) | Aygündə toast + status dəyişir |
| 10 | Rəşad · nəticə | Nəticə ekranını göstər | "12.000,00 AZN-lik faktura paketi göndərilməyə hazırdır." Bu, ödəniş zəmanəti deyil — yalnız sənəd hazırlığıdır. | — |
| 11 | Aygün · INV-1042 | **İxrac et** → **İxrac et və manifesti yüklə**; sonra **Manifesti yenidən yüklə** | Manifestə yalnız seçilmiş sənədlər düşür; daxili AI izahları və audit xarici paketə düşmür. Göndərmə PayProof-dan kənardadır. | `PayProof_INV-1042_vN.zip`; təkrar yükləmə yeni hadisə yaratmır |
| 12 | Aygün · **Fəaliyyət tarixçəsi** / **Audit tarixçəsi** | `INV-1042` axtar | Hər addım — kim, nə vaxt, hansı versiyada — qeyd olunub. Təkrar təsdiq və ixrac yeni hadisə yaratmır. | Əlaqə, yükləmələr, imza, yoxlama, təsdiq, ixrac sətirləri |
| 13 | Aygün · INV-1047, sonra INV-1038 | Hər ikisini aç | Skanda oxunmayan PO "keçdi" sayılmır — paket bloklanır və insan yoxlamasına gedir. Düzgün paketdə problem uydurulmur. | INV-1047 **Yoxlama tələb edir** (R-001 naməlum); INV-1038 **Təsdiq gözləyir** |

Sonda: menyu → **Demo məlumatlarını sıfırla** (növbəti çıxış üçün).

## Tez-tez suallar (hazır cavablar)

- **"AI qərar verir?"** — Xeyr. Qaydalar deterministikdir; AI yalnız çıxarış, mənbə istinadı, əlaqə təklifi və izah verir. Naməlum nəticə heç vaxt "keçdi" sayılmır.
- **"Ödəniş təsdiqlənir?"** — Xeyr. "Paket göndərilməyə hazırdır" — ödənişi ləngidə biləcək sənəd problemlərinin həll olunduğu deməkdir.
- **"Sənəd dəyişsə?"** — Paket versiyası artır, köhnə təsdiq etibarsızlaşır (auditdə qalır), yoxlama təkrarlanır.

## Nə real, nə simulyasiyadır

| Real (işləyən kod) | Simulyasiya / demo üçün sadələşdirmə |
|---|---|
| Claude ilə sənəd çıxarışı (hosted demo): hər dəyər səhifə + sitatla, oxunmayan → `UNKNOWN` | |
| Qayda mühərriki R-001…R-009 (deterministik, `UNKNOWN ≠ PASS`), status və versiya məntiqi | Bütün məlumatlar **sintetikdir** (şirkətlər, VÖEN-lər, məbləğlər) |
| Sənəd yükləmə, saxlama (S3/MinIO), dublikat aşkarlanması (sha256), versiyalar | Çıxarış `AI_PROVIDER=mock`: demo faylları adından tanınır, nəticələr əvvəlcədən hazırlanıb (çıxarış mənbəyi `mock` kimi saxlanılır) |
| Sifariş uyğunlaşdırması və namizəd təklifi (qaydalara əsaslanır) | Lokal demoda AI çıxarışı mock-dur; real Claude çıxarışı (`AI_PROVIDER=llm`) hosted demoda işləyir (açar və internet tələb edir; 5 sənəddə 49/49 sahə — `docs/product/ai-extraction-eval.md`) |
| Təsdiq və ixrac (versiyaya bağlı, idempotent), zip + manifest | Giriş: demo istifadəçi seçimi (dev login, yalnız `ENV=dev`); real SSO yoxdur |
| Server tərəfli səlahiyyət, tenant izolyasiyası, append-only audit, CSV | İmza yoxlaması vizualdır — hüquqi/rəqəmsal imza autentifikasiyası yoxdur |
| Canlı yeniləmələr (SSE, ≤ 2 s), bildirişlər | Bank, e-poçt, ERP inteqrasiyası yoxdur; "göndərmə" PayProof-dan kənardadır |
| Rate limit, fayl limitləri | "Demonu sıfırla" yalnız dev mühitində var |

## İnternetsiz işləmə

- `AI_PROVIDER=mock` ilə backend xaricə heç bir sorğu göndərmir (xarici müştəri yalnız `extraction/llm.py`-dədir, `AI_PROVIDER=llm` olanda).
- Veb xarici şrift/CDN istifadə etmir. Yoxlama avtomatikdir: bütün e2e testləri (mock, real və compose stack) localhost-dan kənara gedən **istənilən** brauzer sorğusunda yıxılır (`apps/web/e2e/fixtures.ts`, `offlineGuard`).
- Docker image-ləri əvvəlcədən qurulmalıdır (`make demo` bir dəfə internetlə) — sonra stack internetsiz qalxır.

## Quru məşq (insan tərəfindən)

Qəbul meyarı: ssenari **iki nəfər** tərəfindən quru məşqdən keçməlidir. Bunu avtomatlaşdırmaq olmaz — doldurun:

| Tarix | Aparıcı (veb) | Təsdiqçi (mobil) | Müddət | Problemlər / qeydlər |
|---|---|---|---|---|
| | | | | |
