import uuid

from pydantic import BaseModel


class JobAccepted(BaseModel):
    job_id: uuid.UUID
    package_id: uuid.UUID
    document_id: uuid.UUID
    document_version_id: uuid.UUID
