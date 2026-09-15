"""用户与认证相关的 Pydantic 模型。"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    role: str = "receiver"
    nickname: str | None = None
    phone: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    role: str
    nickname: str | None = None
    phone: str | None = None
    wechat: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class RoleUpdate(BaseModel):
    role: str


class ProfileUpdate(BaseModel):
    nickname: str | None = None
    phone: str | None = None
    wechat: str | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=128)


class MyStats(BaseModel):
    earnings: float
    completed_count: int
    published_count: int
    review_count: int
    avg_rating: float | None = None
