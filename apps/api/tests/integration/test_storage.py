import uuid

import httpx

from payproof.storage.s3 import get_storage


async def test_put_get_and_signed_link() -> None:
    storage = get_storage()
    key = f"test/{uuid.uuid4()}/Faktura-ə.pdf"
    await storage.put(key, b"%PDF-1.4 demo", "application/pdf")
    assert await storage.get(key) == b"%PDF-1.4 demo"
    url, expires = storage.signed_url(key, "Faktura-ə.pdf")
    async with httpx.AsyncClient() as c:
        r = await c.get(url)
        assert r.status_code == 200 and r.content == b"%PDF-1.4 demo"
        assert "filename*=UTF-8''Faktura-%C9%99.pdf" in r.headers["content-disposition"]
        tampered = url.replace("X-Amz-Signature=", "X-Amz-Signature=0")
        assert (await c.get(tampered)).status_code == 403  # private: only the signed link works
        assert (await c.get(url.split("?")[0])).status_code == 403
    assert 290 <= (expires - expires.now(expires.tzinfo)).total_seconds() <= 300
