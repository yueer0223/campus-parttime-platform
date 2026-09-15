"""站内通知创建辅助。"""
from sqlalchemy.orm import Session

from app.models import Notification


def notify(
    db: Session,
    user_id: int,
    type_: str,
    content: str,
    task_id: int | None = None,
) -> None:
    """创建一条通知，不提交事务，由调用方统一 commit。"""
    db.add(
        Notification(
            user_id=user_id,
            type=type_,
            content=content,
            task_id=task_id,
        )
    )
