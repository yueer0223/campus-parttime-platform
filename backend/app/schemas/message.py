"""站内私信的 Pydantic 模型。"""
from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class MessageRead(BaseModel):
    id: int
    task_id: int
    sender_id: int
    sender_name: str | None = None
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime


class ConversationRead(BaseModel):
    task_id: int
    task_title: str
    peer_id: int
    peer_name: str
    last_message: str
    unread_count: int
    updated_at: datetime
