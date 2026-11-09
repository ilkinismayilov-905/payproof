import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from payproof.core.errors import NotFound, register_error_handlers
from payproof.core.i18n import Msg, locale_middleware, negotiate, pick, tr


@pytest.mark.parametrize(
    ("header", "want"),
    [
        (None, "az"),
        ("", "az"),
        ("az", "az"),
        ("en", "en"),
        ("EN-gb", "en"),
        ("en-US,en;q=0.9", "en"),
        ("az;q=0.5, en;q=0.8", "en"),
        ("en;q=0.5, az", "az"),
        ("ru, en;q=0.3", "en"),
        ("fr, de", "az"),
        ("*", "az"),
        ("en;q=0", "az"),
        ("en;q=abc", "az"),
    ],
)
def test_negotiate(header: str | None, want: str) -> None:
    assert negotiate(header) == want


def test_tr_defaults_to_az() -> None:
    m = Msg("Tapılmadı.", "Not found.")
    got = (tr(m), tr("plain"), str(m), pick("az", None))
    assert got == ("Tapılmadı.", "plain", "Tapılmadı.", "az")


class Body(BaseModel):
    qty: int


def _client() -> TestClient:
    app = FastAPI()
    app.middleware("http")(locale_middleware)
    register_error_handlers(app)

    @app.get("/missing")
    def missing() -> None:
        raise NotFound

    @app.post("/body")
    def body(b: Body) -> Body:
        return b

    @app.get("/stored")
    def stored() -> dict[str, str]:
        return {"old": pick("köhnə", None), "new": pick("yeni", "new")}

    return TestClient(app)


def test_errors_follow_accept_language() -> None:
    c = _client()
    az = c.get("/missing").json()["error"]["message"]
    en = c.get("/missing", headers={"Accept-Language": "en-GB,en;q=0.9"})
    assert (az, en.json()["error"]["message"]) == ("Tapılmadı.", "Not found.")
    assert "Accept-Language" in en.headers["vary"]
    bad = c.post("/body", json={"qty": "x"}, headers={"Accept-Language": "en"})
    assert bad.json()["error"]["message"] == "The request is invalid."
    nope = c.get("/nope", headers={"Accept-Language": "en"})
    assert nope.json()["error"]["message"] == "Not found."


def test_stored_pairs_fall_back_to_az() -> None:
    r = _client().get("/stored", headers={"Accept-Language": "en"})
    assert r.json() == {"old": "köhnə", "new": "new"}
