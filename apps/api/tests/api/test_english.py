"""`Accept-Language: en` turns server texts English; stored audit stays Azerbaijani."""

import uuid
from collections.abc import Callable

import httpx
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.base import bind_tenant
from payproof.repositories.models import CheckResult
from payproof.seed.fixtures import uid
from payproof.seed.identity import COMPANY_ID

Auth = Callable[[str], dict[str, str]]
EN = {"Accept-Language": "en-GB,en;q=0.9"}


async def test_package_detail_in_english(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    r = await client.get(f"/v1/packages/{uid('pkg_1042')}", headers=auth("u1") | EN)
    d = r.json()
    r001 = d["checks"][0]
    assert (r001["title"], r001["message"]) == (
        "Mandatory purchase order number (PO)",
        "The customer rule requires an order number on the invoice, but the invoice shows no PO.",
    )
    assert [row["label"] for row in d["comparison"]["rows"]][:3] == [
        "Order No. (PO)",
        "Buyer",
        "Currency",
    ]
    assert d["comparison"]["rows"][-1]["group"] == "Totals"
    [candidate] = d["link"]["candidates"]
    assert candidate["reason"].startswith("Buyer, both product codes (")
    assert d["fields"][0]["label"] == "Order No. (PO)"
    assert "Accept-Language" in r.headers["vary"]


async def test_old_check_rows_fall_back_to_az(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    bind_tenant(seeded, COMPANY_ID)
    await seeded.execute(update(CheckResult).values(message_en=None))
    r = await client.get(f"/v1/packages/{uid('pkg_1042')}", headers=auth("u1") | EN)
    assert r.json()["checks"][0]["message"].startswith("Müştəri qaydası")


async def test_errors_and_notifications_in_english(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    r = await client.get(f"/v1/packages/{uuid.uuid4()}", headers=auth("u1") | EN)
    assert (r.status_code, r.json()["error"]["message"]) == (404, "Not found.")
    page = (await client.get("/v1/notifications", headers=auth("u2") | EN)).json()
    assert "INV-1038 is waiting for your approval · 4,860.00 AZN" in [
        n["text"] for n in page["items"]
    ]
    az = (await client.get("/v1/notifications", headers=auth("u2"))).json()
    assert "INV-1038 təsdiqinizi gözləyir · 4.860,00 AZN" in [n["text"] for n in az["items"]]
