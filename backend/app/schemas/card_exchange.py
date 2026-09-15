"""名片交换的 Pydantic 模型。"""
from pydantic import BaseModel


class CardExchangeRead(BaseModel):
    task_id: int
    publisher_agreed: bool
    receiver_agreed: bool
    completed: bool
    i_am_publisher: bool
    i_agreed: bool
    peer_name: str | None = None
    peer_wechat: str | None = None
    peer_phone: str | None = None
