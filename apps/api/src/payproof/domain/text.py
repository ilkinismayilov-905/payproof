"""User-facing text in both UI languages. Lives in domain (stdlib only) so rules can build it;
`payproof.core.i18n` picks the language per request."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Msg:
    az: str
    en: str

    def __str__(self) -> str:
        return self.az  # Azerbaijani is the default language
