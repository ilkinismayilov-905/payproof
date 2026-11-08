"""`POST /v1/demo/reset` — back to the fixtures dataset. Mounted only with ENV=dev (main.py)."""

from fastapi import APIRouter, Response
from sqlalchemy.exc import DBAPIError

from payproof.api.deps import CurrentMember, Session
from payproof.seed.cli import reset, seed
from payproof.seed.files import store_demo_files
from payproof.storage.s3 import get_storage

dev_router = APIRouter(tags=["demo"])

_DEADLOCK = "40P01"
_ATTEMPTS = 3


@dev_router.post("/demo/reset", status_code=204)
async def reset_demo(session: Session, _: CurrentMember) -> Response:
    """Whole database: dev holds only the demo company.
    TRUNCATE takes its locks table by table, so a request still reading in another tab can
    deadlock it; Postgres then aborts one side, and the reset retries from a savepoint."""
    for attempt in range(1, _ATTEMPTS + 1):
        try:
            async with session.begin_nested():
                await reset(session)
            break
        except DBAPIError as e:
            if getattr(e.orig, "sqlstate", None) != _DEADLOCK or attempt == _ATTEMPTS:
                raise
    await seed(session)
    await store_demo_files(session, get_storage())
    await session.commit()
    return Response(status_code=204)
