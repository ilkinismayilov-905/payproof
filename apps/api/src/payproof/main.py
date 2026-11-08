import uvicorn
from fastapi import FastAPI

from payproof.api import auth, health, packages
from payproof.core.errors import register_error_handlers
from payproof.core.logging import configure_logging, correlation_id_middleware
from payproof.core.settings import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(title="PayProof API", version="0.1.0")
    app.middleware("http")(correlation_id_middleware)
    register_error_handlers(app)
    app.include_router(health.router, prefix="/v1")
    if settings.env == "dev":  # demo login does not exist outside dev, not even as a 403
        app.include_router(auth.dev_router, prefix="/v1")
    app.include_router(auth.router, prefix="/v1")
    app.include_router(packages.router, prefix="/v1")
    return app


def run() -> None:
    dev = get_settings().env == "dev"
    # log_config=None keeps our JSON root handler instead of uvicorn's defaults
    # access_log=False: uvicorn's line has the query string and no correlation id; ours has neither
    # problem (core/logging.py)
    uvicorn.run(
        "payproof.main:create_app",
        factory=True,
        port=8000,
        reload=dev,
        log_config=None,
        access_log=False,
    )
