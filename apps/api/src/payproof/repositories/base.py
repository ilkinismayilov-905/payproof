import uuid

from sqlalchemy import Select, event, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import ORMExecuteState, Session, with_loader_criteria

from payproof.repositories.orm import TenantEntity, TenantMixin

TENANT_KEY = "payproof.company_id"


class TenantContextMissing(RuntimeError):
    """Programming error: tenant data was queried before `bind_tenant` (surfaces as 500)."""


def bind_tenant(session: AsyncSession, company_id: uuid.UUID) -> None:
    """Called once per request from the current membership (B-10), never from request input."""
    session.info[TENANT_KEY] = company_id


@event.listens_for(Session, "do_orm_execute")
def _scope_to_tenant(state: ORMExecuteState) -> None:
    # every ORM select/update/delete on a tenant table gets `company_id = :tenant`;
    # shortcut: raw SQL (`text()`, Core tables) is not covered — keep it out of repositories
    if not (state.is_select or state.is_update or state.is_delete):
        return
    if state.is_column_load or state.is_relationship_load:
        return  # the parent query already carries the criteria
    company_id = state.session.info.get(TENANT_KEY)
    if company_id is None:
        if any(issubclass(m.class_, TenantMixin) for m in state.all_mappers):
            raise TenantContextMissing("tenant table queried without bind_tenant()")
        return
    state.statement = state.statement.options(
        with_loader_criteria(
            TenantMixin, lambda cls: cls.company_id == company_id, include_aliases=True
        )
    )


class BaseRepository[M: TenantEntity]:
    model: type[M]  # set by the subclass: `model = Customer`

    def __init__(self, session: AsyncSession) -> None:
        if TENANT_KEY not in session.info:
            raise TenantContextMissing("repository created without bind_tenant()")
        self.session = session
        self.company_id: uuid.UUID = session.info[TENANT_KEY]

    def _select(self) -> Select[M]:
        return select(self.model)

    async def get(self, id_: uuid.UUID) -> M | None:
        """Other tenants' rows are invisible, so callers map `None` to NotFound (404)."""
        result = await self.session.execute(self._select().where(self.model.id == id_))
        return result.scalar_one_or_none()

    def add(self, obj: M) -> M:
        obj.company_id = self.company_id
        self.session.add(obj)
        return obj
