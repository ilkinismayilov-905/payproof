"""Response language from `Accept-Language` (az | en, default az)."""

from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from typing import Literal

from fastapi import Request, Response

from payproof.domain.text import Msg

__all__ = ["Locale", "Msg", "locale", "locale_middleware", "negotiate", "pick", "tr"]

Locale = Literal["az", "en"]
_locale: ContextVar[Locale] = ContextVar("locale", default="az")


def negotiate(header: str | None) -> Locale:
    """Highest-q supported language (`en-GB` counts as `en`); ties keep header order; else az."""
    best: Locale = "az"
    best_q = 0.0
    for part in (header or "").split(","):
        tag, *params = (p.strip() for p in part.split(";"))
        q = 1.0
        for p in params:
            key, _, value = p.partition("=")
            if key.strip().lower() == "q":
                try:
                    q = float(value)
                except ValueError:
                    q = 0.0
        lang = tag.lower().split("-", 1)[0]
        if lang in ("az", "en") and q > best_q:
            best, best_q = ("en" if lang == "en" else "az"), q
    return best


def locale() -> Locale:
    return _locale.get()


def tr(value: str | Msg) -> str:
    """The text in the request language; a plain str is the same in every language."""
    if isinstance(value, Msg):
        return value.en if _locale.get() == "en" else value.az
    return value


def pick(az: str, en: str | None) -> str:
    """A stored az/en pair; rows written before English existed fall back to az."""
    return tr(Msg(az, en or az))


async def locale_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    token = _locale.set(negotiate(request.headers.get("accept-language")))
    try:
        response = await call_next(request)
    finally:
        _locale.reset(token)
    response.headers.append("Vary", "Accept-Language")
    return response
