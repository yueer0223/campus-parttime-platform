"""兼职任务的 Pydantic 模型。"""
from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=128)
    description: str = Field(min_length=1)
    category_id: int | None = None
    reward: float = 0.0
    reward_unit: str = "元"
    price_type: str = "fixed"
    duration: str | None = None
    deadline: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    reward: float | None = None
    reward_unit: str | None = None
    price_type: str | None = None
    duration: str | None = None
    deadline: str | None = None


class TaskRead(BaseModel):
    id: int
    title: str
    description: str
    category_id: int | None = None
    category_name: str | None = None
    reward: float
    reward_unit: str
    price_type: str
    duration: str | None = None
    deadline: str | None = None
    offer_price: float | None = None
    final_price: float | None = None
    apply_count: int = 0
    is_favorited: bool = False
    status: str
    publisher_id: int
    publisher_name: str | None = None
    receiver_id: int | None = None
    receiver_name: str | None = None
    created_at: datetime
    updated_at: datetime


class ApplyTask(BaseModel):
    offer_price: float | None = None


class ApproveApplication(BaseModel):
    final_price: float | None = None
