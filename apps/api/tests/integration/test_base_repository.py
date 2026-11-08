import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass

import pytest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from payproof.repositories.base import BaseRepository, TenantContextMissing, bind_tenant
from payproof.repositories.orm import IdMixin, TenantEntity


class _TestBase(DeclarativeBase):
    """Own registry: test tables never reach the app metadata or migrations."""


class Company(IdMixin, _TestBase):
    __tablename__ = "companies"


class Widget(TenantEntity, _TestBase):
    __tablename__ = "widgets"
    name: Mapped[str] = mapped_column()


class WidgetRepository(BaseRepository[Widget]):
    model = Widget


@dataclass
class World:
    a: uuid.UUID
    b: uuid.UUID
    b_widget: uuid.UUID


@pytest.fixture
async def world(db: AsyncSession) -> AsyncIterator[World]:
    await db.run_sync(lambda s: _TestBase.metadata.create_all(s.connection()))  # rolled back
    a, b = Company(), Company()
    db.add_all([a, b])
    await db.flush()
    b_widget = Widget(name="b-1", company_id=b.id)
    db.add_all([Widget(name="a-1", company_id=a.id), b_widget])
    await db.flush()
    db.expunge_all()
    yield World(a.id, b.id, b_widget.id)


async def test_query_without_tenant_context_fails(db: AsyncSession, world: World) -> None:
    with pytest.raises(TenantContextMissing):
        await db.execute(select(Widget))


async def test_repository_requires_tenant_context(db: AsyncSession, world: World) -> None:
    with pytest.raises(TenantContextMissing):
        WidgetRepository(db)


async def test_any_orm_select_is_scoped_to_tenant(db: AsyncSession, world: World) -> None:
    bind_tenant(db, world.a)
    names = (await db.scalars(select(Widget.name))).all()
    assert names == ["a-1"]


async def test_other_tenant_object_is_not_found(db: AsyncSession, world: World) -> None:
    bind_tenant(db, world.a)
    assert await WidgetRepository(db).get(world.b_widget) is None


async def test_add_forces_session_tenant(db: AsyncSession, world: World) -> None:
    bind_tenant(db, world.a)
    widget = WidgetRepository(db).add(Widget(name="sneaky", company_id=world.b))
    await db.flush()
    assert widget.company_id == world.a


async def test_bulk_update_is_scoped_to_tenant(db: AsyncSession, world: World) -> None:
    bind_tenant(db, world.a)
    await db.execute(update(Widget).values(name="changed"))
    bind_tenant(db, world.b)
    db.expunge_all()
    assert (await db.scalars(select(Widget.name))).all() == ["b-1"]
