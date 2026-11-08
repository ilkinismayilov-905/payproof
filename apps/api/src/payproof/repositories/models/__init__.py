"""All ORM models; importing this package registers every table on `Base.metadata`."""

from payproof.repositories.models.customers import Customer, RequirementSet
from payproof.repositories.models.documents import Document, DocumentVersion
from payproof.repositories.models.extraction import (
    DeliveryNote,
    DeliveryNoteLine,
    ExtractedInvoice,
    ExtractedInvoiceLine,
)
from payproof.repositories.models.fields import EvidenceRef, ExtractedField
from payproof.repositories.models.identity import Company, Membership, User
from payproof.repositories.models.orders import Order, OrderLine
from payproof.repositories.models.packages import InvoicePackage
from payproof.repositories.models.tasks import ResolutionTask
from payproof.repositories.models.validation import CheckResult, ValidationRun

__all__ = [
    "CheckResult",
    "Company",
    "Customer",
    "DeliveryNote",
    "DeliveryNoteLine",
    "Document",
    "DocumentVersion",
    "EvidenceRef",
    "ExtractedField",
    "ExtractedInvoice",
    "ExtractedInvoiceLine",
    "InvoicePackage",
    "Membership",
    "Order",
    "OrderLine",
    "RequirementSet",
    "ResolutionTask",
    "User",
    "ValidationRun",
]
