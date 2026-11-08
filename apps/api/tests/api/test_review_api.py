from collections.abc import Callable

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.seed.fixtures import uid
from tests.api.test_contract import assert_matches
from tests.integration.factories import make_tenant, package

Auth = Callable[[str], dict[str, str]]


async def test_inv_1048_has_two_candidates_and_no_automatic_choice(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    r = await client.get(f"/v1/packages/{uid('pkg_1048')}/match-candidates", headers=auth("u5"))
    assert r.status_code == 200
    items = r.json()["items"]
    assert [c["po_number"] for c in items] == ["PO-383", "PO-384"]
    assert_matches("MatchCandidate", items[0])
    detail = (await client.get(f"/v1/packages/{uid('pkg_1048')}", headers=auth("u5"))).json()
    assert detail["link"]["confirmed"] is False and detail["link"]["order_id"] is None
    assert [c["po_number"] for c in detail["link"]["candidates"]] == ["PO-383", "PO-384"]


async def test_other_company_package_is_not_found(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    foreign = package(await make_tenant(seeded), "INV-X")
    seeded.add(foreign)
    await seeded.flush()
    r = await client.get(f"/v1/packages/{foreign.id}/match-candidates", headers=auth("u1"))
    assert r.status_code == 404
