# AI çıxarışı — real yoxlama

Tarix: 2026-11-09 · model `claude-sonnet-5-5` · prompt `b25-v1` · `apps/api/scripts/ai_eval.py` · sənədlər `apps/api/tests/fixtures/ai-eval/`

**Nəticə:** 49/49 sahə uyğun · ümumi xərc $0.0570

## Sahələr

| sənəd | sahə | gözlənilən | çıxarılan | səhifə | uyğun? |
|---|---|---|---|---|---|
| a_azn_invoice.pdf | po_ref | PO-336 | PO-336 | 1 | ✓ |
| a_azn_invoice.pdf | currency | AZN | AZN | — | ✓ |
| a_azn_invoice.pdf | total | 8600.00 | 8600 | 1 | ✓ |
| a_azn_invoice.pdf | ST-1 qty | 2000 | 2000 | 1 | ✓ |
| a_azn_invoice.pdf | ST-1 unit | ədəd | ədəd | — | ✓ |
| a_azn_invoice.pdf | ST-1 unit_price | 2.05 | 2.05 | 1 | ✓ |
| a_azn_invoice.pdf | MK-500 qty | 1500 | 1500 | 1 | ✓ |
| a_azn_invoice.pdf | MK-500 unit | ədəd | ədəd | — | ✓ |
| a_azn_invoice.pdf | MK-500 unit_price | 1.40 | 1.4 | 1 | ✓ |
| a_azn_invoice.pdf | CQ-250 qty | 300 | 300 | 1 | ✓ |
| a_azn_invoice.pdf | CQ-250 unit | qutu | qutu | — | ✓ |
| a_azn_invoice.pdf | CQ-250 unit_price | 8.00 | 8 | 1 | ✓ |
| b_usd_invoice.pdf | po_ref | PO-395 | PO-395 | 1 | ✓ |
| b_usd_invoice.pdf | currency | USD | USD | — | ✓ |
| b_usd_invoice.pdf | total | 1140.00 | 1140 | 1 | ✓ |
| b_usd_invoice.pdf | ZY-1L qty | 120 | 120 | 1 | ✓ |
| b_usd_invoice.pdf | ZY-1L unit | şüşə | şüşə | — | ✓ |
| b_usd_invoice.pdf | ZY-1L unit_price | 7.50 | 7.5 | 1 | ✓ |
| b_usd_invoice.pdf | KY-200 qty | 50 | 50 | 1 | ✓ |
| b_usd_invoice.pdf | KY-200 unit | ədəd | ədəd | — | ✓ |
| b_usd_invoice.pdf | KY-200 unit_price | 4.80 | 4.8 | 1 | ✓ |
| c_scanned_invoice.pdf | po_ref | PO-390 | PO-390 | 1 | ✓ |
| c_scanned_invoice.pdf | currency | AZN | AZN | — | ✓ |
| c_scanned_invoice.pdf | total | 2484.00 | 2484 | 1 | ✓ |
| c_scanned_invoice.pdf | MS-05 qty | 120 | 120 | 1 | ✓ |
| c_scanned_invoice.pdf | MS-05 unit | qutu | qutu | — | ✓ |
| c_scanned_invoice.pdf | MS-05 unit_price | 7.20 | 7.2 | 1 | ✓ |
| c_scanned_invoice.pdf | CQ-250 qty | 200 | 200 | 1 | ✓ |
| c_scanned_invoice.pdf | CQ-250 unit | qutu | qutu | — | ✓ |
| c_scanned_invoice.pdf | CQ-250 unit_price | 8.10 | 8.1 | 1 | ✓ |
| d_signed_delivery.pdf | note_number | TQ-2104 | TQ-2104 | — | ✓ |
| d_signed_delivery.pdf | po_ref | PO-390 | PO-390 | 1 | ✓ |
| d_signed_delivery.pdf | customer (VÖEN) | uyğun | uyğun | 1 | ✓ |
| d_signed_delivery.pdf | signed | True | True | 1 | ✓ |
| d_signed_delivery.pdf | delivery_date | 2026-11-04 | 2026-11-04 | — | ✓ |
| d_signed_delivery.pdf | MS-05 qty | 120 | 120 | 1 | ✓ |
| d_signed_delivery.pdf | CQ-250 qty | 200 | 200 | 1 | ✓ |
| e_two_page_invoice.pdf | po_ref | PO-383 | PO-383 | 1 | ✓ |
| e_two_page_invoice.pdf | currency | AZN | AZN | — | ✓ |
| e_two_page_invoice.pdf | total | 8072.00 | 8072 | 2 | ✓ |
| e_two_page_invoice.pdf | ST-1 qty | 2000 | 2000 | 1 | ✓ |
| e_two_page_invoice.pdf | ST-1 unit | ədəd | ədəd | — | ✓ |
| e_two_page_invoice.pdf | ST-1 unit_price | 2.05 | 2.05 | 1 | ✓ |
| e_two_page_invoice.pdf | MK-500 qty | 1500 | 1500 | 2 | ✓ |
| e_two_page_invoice.pdf | MK-500 unit | ədəd | ədəd | — | ✓ |
| e_two_page_invoice.pdf | MK-500 unit_price | 1.40 | 1.4 | 2 | ✓ |
| e_two_page_invoice.pdf | KY-200 qty | 520 | 520 | 2 | ✓ |
| e_two_page_invoice.pdf | KY-200 unit | ədəd | ədəd | — | ✓ |
| e_two_page_invoice.pdf | KY-200 unit_price | 3.60 | 3.6 | 2 | ✓ |

## Vaxt, tokenlər, xərc

| sənəd | vaxt, s | input | output (thinking daxil) | xərc | fallback |
|---|---|---|---|---|---|
| a_azn_invoice.pdf | 5.3 | 3189 | 507 | $0.0114 | — |
| b_usd_invoice.pdf | 3.3 | 3118 | 366 | $0.0099 | — |
| c_scanned_invoice.pdf | 2.2 | 2822 | 239 | $0.0080 | — |
| d_signed_delivery.pdf | 4.3 | 3430 | 292 | $0.0098 | — |
| e_two_page_invoice.pdf | 3.9 | 6391 | 511 | $0.0179 | — |

## Uyğunsuzluqlar

Yoxdur.

## Sənədlər

| fayl | nəyi yoxlayır |
|---|---|
| `a_azn_invoice.pdf` | AZN faktura, ə/ş/ı/ğ/ç/ö/ü, 3 sətir, Azərbaycan rəqəm formatı (`8.600,00`) |
| `b_usd_invoice.pdf` | USD faktura, ingilis rəqəm formatı (`1,140.00`), tarix `November 3, 2026 (03/11/2026)` |
| `c_scanned_invoice.pdf` | skan kimi: səhifə rastr şəkildir (mətn qatı yoxdur), 1,5° əyri, boz |
| `d_signed_delivery.pdf` | təhvil aktı, qəbul edənin sahəsində əl imzası xətti + dairəvi möhür |
| `e_two_page_invoice.pdf` | 2 səhifə: 1-ci sətir 1-ci səhifədə, qalanları və yekun 2-ci səhifədə |

Sənədlər `apps/api/scripts/make_ai_eval_docs.py` ilə yaradılır (fixtures-dakı demo adlar: A Distribusiya MMC, B Mağazalar Şəbəkəsi, C Restoran Qrupu, məhsul kodları, PO nömrələri); gözlənilən dəyərlər eyni mənbədən `expected.json`-a yazılır.

## Qeydlər və məhdudiyyətlər
- "çıxarılan" sütununda rəqəmlər normallaşdırılıb göstərilir (`8600.00` = `8600`); müqayisə `Decimal` dəyəri ilə aparılır.
- "səhifə" — modelin mənbə istinadı (evidence) səhifəsi; `currency`, `unit`, `note_number`, `delivery_date` üçün sxemdə ayrıca istinad yoxdur (—). Səhifə uyğun gəlməsə sətir ✕ sayılır.
- Faktura tarixi sxemdə yoxdur (domen istifadə etmir) — `b`-dəki fərqli tarix formatı yalnız təhvil aktının tarixi kimi yoxlanmayıb; təhvil tarixi (`04.11.2026` → `2026-11-04`) yoxlanıb.
- Sənədlər sintetikdir və təmizdir: real skan (kölgə, ləkə, əl yazısı, cırıq), çox sütunlu cədvəl, uzun (10+ səhifə) faktura və imzası olmayan akt bu yoxlamaya daxil deyil. Hər sənəd bir dəfə işlədilib — nəticənin sabitliyi (təkrarlarda fərq) ölçülməyib.
- Xərc `usage`-dən hesablanır (input + output, thinking output-a daxildir), qiymət cədvəli skriptdədir (`PRICES`). Skript işə düşməzdən əvvəl `count_tokens` ilə təxmin edir və $1-dən çoxdursa dayanır.
- Bu sənəddə açar və modelin xam cavabı yoxdur.
