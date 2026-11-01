"""initial_schema

Revision ID: 320cfdbf8aa7
Revises: 
Create Date: 2026-11-01 12:04:07.965398

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '320cfdbf8aa7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema safely using declarative metadata."""
    from app.database import Base
    import app.models  # noqa: F401
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    pass
