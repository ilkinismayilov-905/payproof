import uvicorn
from fastapi import FastAPI

from payproof.api import health
from payproof.core.errors import register_error_handlers
from payproof.core.logging import configure_logging, correlation_id_middleware
from payproof.core.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(title="PayProof API", version="0.1.0")
    app.middleware("http")(correlation_id_middleware)
    register_error_handlers(app)
    app.include_router(health.router, prefix="/v1")
    return app


def run() -> None:
    dev = get_settings().env == "dev"
    # log_config=None keeps our JSON root handler instead of uvicorn's defaults
    uvicorn.run("payproof.main:create_app", factory=True, port=8000, reload=dev, log_config=None)
