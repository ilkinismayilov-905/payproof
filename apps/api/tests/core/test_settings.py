import pytest
from pydantic import ValidationError

from payproof.core.settings import Settings


def test_loads_ci_environment() -> None:
    s = Settings(_env_file=None)
    assert s.env == "test"
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert s.ai_provider == "mock"
    assert s.s3_bucket == "payproof-docs"


def test_secret_is_not_printed() -> None:
    s = Settings(_env_file=None)
    assert "test-only" not in repr(s)


def test_missing_jwt_secret_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_unknown_env_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "staging-ish")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_env_files_resolve_independent_of_cwd() -> None:
    files = Settings.model_config["env_file"]
    assert isinstance(files, tuple)
    assert [p.name for p in files] == [".env", ".env"]
    assert (files[0].parent / "apps/api/pyproject.toml").exists()
