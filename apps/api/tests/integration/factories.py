"""Minimal tenant graphs for constraint tests (demo data lives in fixtures/, loaded by B-09)."""

import itertools
from dataclasses import dataclass

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.models import Company, Customer, Membership, User

_seq = itertools.count(1)


@dataclass
class Tenant:
    company: Company
    user: User  # an operator of `company`
    customer: Customer


async def add(db: AsyncSession, *objs: object) -> None:
    db.add_all(objs)
    await db.flush()


async def add_fails(db: AsyncSession, *objs: object) -> None:
    with pytest.raises(IntegrityError):
        await add(db, *objs)


async def make_tenant(db: AsyncSession) -> Tenant:
    n = next(_seq)
    company = Company(name=f"Şirkət {n}", voen=f"{1_700_000_000 + n}")
    user = User(email=f"user{n}@tenant.test", full_name=f"İstifadəçi {n}", title="Operator")
    await add(db, company, user)
    customer = Customer(
        company_id=company.id, name=f"Müştəri {n}", external_id=f"C-{n}", voen="1402375611"
    )
    await add(db, customer, Membership(user_id=user.id, company_id=company.id, role="operator"))
    return Tenant(company, user, customer)
