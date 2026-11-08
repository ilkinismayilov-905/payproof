"""Minimal tenant graphs for constraint tests (demo data lives in fixtures/, loaded by B-09)."""

import datetime as dt
import itertools
from dataclasses import dataclass

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.models import Company, Customer, InvoicePackage, Membership, User

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
    """Expect a constraint error; the savepoint keeps the session usable for more checks."""
    with pytest.raises(IntegrityError):
        async with db.begin_nested():
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


def package(t: Tenant, number: str = "INV-1042", /, **over: object) -> InvoicePackage:
    fields: dict[str, object] = {
        "customer_id": t.customer.id,
        "invoice_number": number,
        "currency": "AZN",
        "invoice_date": dt.date(2026, 11, 3),
        "owner_id": t.user.id,
    }
    fields.update(over)
    return InvoicePackage(company_id=t.company.id, **fields)
