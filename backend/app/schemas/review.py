"""任务评价的 Pydantic 模型。"""
from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    content: str = Field(min_length=1, max_length=500)


class ReviewRead(BaseModel):
    id: int
    task_id: int
    reviewer_id: int
    reviewer_name: str | None = None
    reviewee_id: int
    rating: int
    content: str
    created_at: datetime
