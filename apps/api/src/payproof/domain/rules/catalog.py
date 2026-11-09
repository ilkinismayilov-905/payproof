"""Rule titles and problem categories; same text as @payproof/api-client i18n (az.ts, en.ts)."""

from payproof.domain.text import Msg

TITLES = {
    "R-001": Msg("Məcburi sifariş nömrəsi (PO)", "Mandatory purchase order number (PO)"),
    "R-002": Msg("PO təsdiqlənmiş sifarişə uyğundur", "PO matches an approved order"),
    "R-003": Msg("Tərəflərin uyğunluğu", "Parties match"),
    "R-004": Msg("Valyuta və vahid uyğunluğu", "Currency and unit match"),
    "R-005": Msg("Vahid qiymət uyğunluğu", "Unit price match"),
    "R-006": Msg("Miqdar uyğunluğu", "Quantity match"),
    "R-007": Msg("Məcburi təhvil sənədi", "Mandatory delivery note"),
    "R-008": Msg("İmza tələbi (insan yoxlaması)", "Signature requirement (human review)"),
    "R-009": Msg("Cəmlərin arifmetik uyğunluğu", "Totals add up"),
}

# dashboard "top issue": rules that share a fix are one problem category
CATEGORIES = {
    "R-001": Msg("PO istinadı", "PO reference"),
    "R-002": Msg("PO istinadı", "PO reference"),
    "R-003": Msg("Tərəf uyğunsuzluğu", "Party mismatch"),
    "R-004": Msg("Valyuta / vahid", "Currency / unit"),
    "R-005": Msg("Qiymət / miqdar", "Price / quantity"),
    "R-006": Msg("Qiymət / miqdar", "Price / quantity"),
    "R-007": Msg("Təhvil sənədi", "Delivery note"),
    "R-008": Msg("Təhvil sənədi", "Delivery note"),
    "R-009": Msg("Cəm fərqi", "Total difference"),
}
