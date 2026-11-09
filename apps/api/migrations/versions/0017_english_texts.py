"""english texts

Revision ID: 0017
Revises: 0016
Create Date: 2026-11-09 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0017"
down_revision: str | Sequence[str] | None = "0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # nullable: rows written before English existed are read in az until re-validated
    op.add_column("check_results", sa.Column("message_en", sa.Text(), nullable=True))
    op.add_column("notifications", sa.Column("text_en", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("notifications", "text_en")
    op.drop_column("check_results", "message_en")
