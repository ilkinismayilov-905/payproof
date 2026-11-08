import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.api.ratelimit import Limiter, RateLimited
from payproof.seed.fixtures import uid


def test_sliding_window(monkeypatch: pytest.MonkeyPatch) -> None:
    now = [100.0]
    monkeypatch.setattr("payproof.api.ratelimit.time.monotonic", lambda: now[0])
    limiter = Limiter()
    for _ in range(3):
        limiter.hit("upload:u1", limit=3, window=60)
    with pytest.raises(RateLimited) as blocked:
        limiter.hit("upload:u1", limit=3, window=60)
    assert blocked.value.details == {"retry_after": 60}
    assert blocked.value.headers == {"Retry-After": "60"}
    limiter.hit("upload:u2", limit=3, window=60)  # someone else is not affected
    now[0] += 61
    limiter.hit("upload:u1", limit=3, window=60)  # the window moved on


async def test_dev_login_answers_429_with_retry_after(
    client: httpx.AsyncClient, seeded: AsyncSession
) -> None:
    body = {"user_id": str(uid("u1"))}
    codes = [(await client.post("/v1/auth/dev-login", json=body)).status_code for _ in range(10)]
    assert codes == [200] * 10
    r = await client.post("/v1/auth/dev-login", json=body)
    assert r.status_code == 429 and r.json()["error"]["code"] == "RATE_LIMITED"
    assert int(r.headers["retry-after"]) > 0
