from collections.abc import Callable

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.seed.fixtures import EXPECTED, uid
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


async def _link(
    client: httpx.AsyncClient, auth: Auth, user: str, po: str, version: int
) -> httpx.Response:
    order = next(
        c["order_id"]
        for c in (
            await client.get(f"/v1/packages/{uid('pkg_1042')}/match-candidates", headers=auth("u1"))
        ).json()["items"]
        if c["po_number"] == po
    )
    return await client.post(
        f"/v1/packages/{uid('pkg_1042')}/matches",
        headers=auth(user),
        json={"order_id": order, "expected_version": version},
    )


async def test_confirming_inv_1042_follows_the_golden_flow(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    [step] = [s for s in EXPECTED["flows"]["INV-1042"] if s["step"] == "confirm_link"]
    assert (await _link(client, auth, "u5", "PO-381", 1)).status_code == 403  # readonly
    r = await _link(client, auth, step["actor"], step["po_number"], 1)
    assert r.status_code == 200, r.text
    d = r.json()
    assert_matches("PackageDetail", d)
    assert (d["status"], d["version"]) == (step["status"], step["version"])
    assert d["summary"]["blocking"] == step["blockers"]
    assert d["link"]["confirmed"] and d["link"]["method"] == "human"
    assert d["link"]["candidates"] == []
    audit = (await client.get(f"/v1/packages/{uid('pkg_1042')}/audit", headers=auth("u1"))).json()
    actions = [e["action"] for e in audit["items"][:3]]
    assert actions[:2] == ["validation.run", "link.confirmed"]


async def test_stale_version_and_foreign_order_are_refused(
    client: httpx.AsyncClient, seeded: AsyncSession, auth: Auth
) -> None:
    assert (await _link(client, auth, "u1", "PO-381", 7)).json()["error"]["code"] == (
        "VERSION_CONFLICT"
    )
    r = await client.post(
        f"/v1/packages/{uid('pkg_1042')}/matches",
        headers=auth("u1"),
        json={"order_id": str(uid("PO-390")), "expected_version": 1},  # customer c2
    )
    assert r.status_code == 422
