import logging
from enum import StrEnum
from typing import Any, ClassVar, cast

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

log = logging.getLogger(__name__)


class ErrorCode(StrEnum):
    """Mirror of `ErrorCode` in packages/contracts/openapi.yaml (checked by a test)."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    TASK_STATUS_NOT_ALLOWED = "TASK_STATUS_NOT_ALLOWED"
    INVOICE_REQUIRED = "INVOICE_REQUIRED"
    IDEMPOTENCY_KEY_REUSED = "IDEMPOTENCY_KEY_REUSED"
    UNAUTHENTICATED = "UNAUTHENTICATED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    VERSION_CONFLICT = "VERSION_CONFLICT"
    PACKAGE_NOT_READY = "PACKAGE_NOT_READY"
    PACKAGE_NOT_DELETABLE = "PACKAGE_NOT_DELETABLE"
    TASK_ALREADY_OPEN = "TASK_ALREADY_OPEN"
    DUPLICATE_FILE = "DUPLICATE_FILE"
    DUPLICATE_INVOICE = "DUPLICATE_INVOICE"
    IDEMPOTENCY_IN_PROGRESS = "IDEMPOTENCY_IN_PROGRESS"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class DomainError(Exception):
    """Base for expected errors; subclasses set status, code and an Azerbaijani UI message."""

    status_code: ClassVar[int] = 400
    code: ClassVar[ErrorCode] = ErrorCode.VALIDATION_ERROR
    message: str = "Sorğu yanlışdır."

    def __init__(self, message: str | None = None, details: dict[str, Any] | None = None):
        self.message = message or self.message
        self.details = details or {}
        super().__init__(self.message)


class Unauthenticated(DomainError):
    status_code = 401
    code = ErrorCode.UNAUTHENTICATED
    message = "Daxil olmaq tələb olunur."


class Forbidden(DomainError):
    status_code = 403
    code = ErrorCode.FORBIDDEN
    message = "Bu əməliyyat üçün icazəniz yoxdur."


class NotFound(DomainError):
    status_code = 404
    code = ErrorCode.NOT_FOUND
    message = "Tapılmadı."


_HTTP_DEFAULTS: dict[int, type[DomainError]] = {401: Unauthenticated, 403: Forbidden, 404: NotFound}


def error_response(
    status: int, code: ErrorCode, message: str, details: dict[str, Any] | None = None
) -> JSONResponse:
    body = {"error": {"code": code, "message": message, "details": details or {}}}
    return JSONResponse(body, status_code=status)


async def _domain(_: Request, exc: Exception) -> JSONResponse:
    err = cast(DomainError, exc)
    return error_response(err.status_code, err.code, err.message, err.details)


async def _validation(_: Request, exc: Exception) -> JSONResponse:
    errors = cast(RequestValidationError, exc).errors()
    # only loc + type: input values may contain document text
    fields = [{"loc": list(e["loc"]), "type": e["type"]} for e in errors]
    return error_response(400, ErrorCode.VALIDATION_ERROR, "Sorğu yanlışdır.", {"fields": fields})


async def _http(_: Request, exc: Exception) -> JSONResponse:
    status = cast(HTTPException, exc).status_code
    known = _HTTP_DEFAULTS.get(status)
    if known:
        return error_response(status, known.code, known.message)
    # shortcut: other framework 4xx (405...) -> VALIDATION_ERROR; new codes need /contract-change
    return error_response(status, ErrorCode.VALIDATION_ERROR, "Sorğu yanlışdır.")


async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
    log.exception("unhandled error", exc_info=exc)
    return error_response(500, ErrorCode.INTERNAL_ERROR, "Gözlənilməz xəta baş verdi.")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, _domain)
    app.add_exception_handler(RequestValidationError, _validation)
    app.add_exception_handler(HTTPException, _http)
    app.add_exception_handler(Exception, _unhandled)
