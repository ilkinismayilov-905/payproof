"""All ORM models; importing this package registers every table on `Base.metadata`."""

from payproof.repositories.models.customers import Customer, RequirementSet
from payproof.repositories.models.documents import Document, DocumentVersion
from payproof.repositories.models.identity import Company, Membership, User
from payproof.repositories.models.orders import Order, OrderLine
from payproof.repositories.models.packages import InvoicePackage

__all__ = [
    "Company",
    "Customer",
    "Document",
    "DocumentVersion",
    "InvoicePackage",
    "Membership",
    "Order",
    "OrderLine",
    "RequirementSet",
    "User",
]
