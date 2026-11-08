import os

# CI provides these; locally fall back to non-secret test values (no .env needed).
os.environ.setdefault("ENV", "test")
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://payproof:payproof@localhost:5432/payproof"
)
os.environ.setdefault("JWT_SECRET", "test-only-not-a-secret")
os.environ.setdefault("S3_ENDPOINT_URL", "http://localhost:9000")
os.environ.setdefault("S3_ACCESS_KEY", "payproof")
os.environ.setdefault("S3_SECRET_KEY", "payproof-secret")
os.environ.setdefault("S3_BUCKET", "payproof-docs")
os.environ.setdefault("AI_PROVIDER", "mock")
