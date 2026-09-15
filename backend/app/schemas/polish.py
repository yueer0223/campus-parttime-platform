"""AI 润色接口的 Pydantic 模型。"""
from pydantic import BaseModel, Field


class PolishRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class PolishResponse(BaseModel):
    original_text: str
    polished_text: str
    provider: str
    model: str
