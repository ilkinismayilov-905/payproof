#!/bin/sh
# Hosted start (Render dockerCommand): migrate, seed the demo once (no-op after), then serve.
# A script, not `sh -c "..."`: Render passes dockerCommand quotes through literally.
set -e
alembic upgrade head
payproof-seed
exec payproof-api
