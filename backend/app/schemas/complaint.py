"""任务投诉的 Pydantic 模型。"""
from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=64)
    detail: str = Field(min_length=1, max_length=500)


class ComplaintHandle(BaseModel):
    status: str
    handled_note: str | None = None


class ComplaintRead(BaseModel):
    id: int
    task_id: int
    task_title: str | None = None
    complainant_id: int
    complainant_name: str | None = None
    reason: str
    detail: str
    status: str
    handled_note: str | None = None
    created_at: datetime
