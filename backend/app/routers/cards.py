"""名片交换接口。"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import CardExchange, Task, User
from app.schemas.card_exchange import CardExchangeRead
from app.ws import manager

router = APIRouter(prefix="/cards", tags=["名片交换"])


def _to_read(exchange: CardExchange, user: User, task: Task, peer: User | None) -> CardExchangeRead:
    i_am_publisher = user.id == task.publisher_id
    i_agreed = exchange.publisher_agreed if i_am_publisher else exchange.receiver_agreed
    completed = exchange.publisher_agreed and exchange.receiver_agreed
    return CardExchangeRead(
        task_id=task.id,
        publisher_agreed=exchange.publisher_agreed,
        receiver_agreed=exchange.receiver_agreed,
        completed=completed,
        i_am_publisher=i_am_publisher,
        i_agreed=i_agreed,
        peer_name=(peer.nickname or peer.username) if peer else None,
        peer_wechat=(peer.wechat if peer and completed else None),
        peer_phone=(peer.phone if peer and completed else None),
    )


@router.get("/exchange/{task_id}", response_model=CardExchangeRead)
def get_exchange(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    if user.id not in (task.publisher_id, task.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有任务参与方才能查看")
    exchange = db.scalar(select(CardExchange).where(CardExchange.task_id == task_id))
    peer_id = task.publisher_id if user.id == task.receiver_id else task.receiver_id
    peer = db.get(User, peer_id)
    if exchange is None:
        exchange = CardExchange(task_id=task_id, publisher_agreed=False, receiver_agreed=False)
    return _to_read(exchange, user, task, peer)


@router.post("/exchange/{task_id}", response_model=CardExchangeRead)
async def do_exchange(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    if user.id not in (task.publisher_id, task.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有任务参与方才能交换名片")
    exchange = db.scalar(select(CardExchange).where(CardExchange.task_id == task_id))
    if exchange is None:
        exchange = CardExchange(task_id=task_id, publisher_agreed=False, receiver_agreed=False)
        db.add(exchange)
    if user.id == task.publisher_id:
        exchange.publisher_agreed = True
    else:
        exchange.receiver_agreed = True
    db.commit()
    db.refresh(exchange)

    peer_id = task.publisher_id if user.id == task.receiver_id else task.receiver_id
    peer = db.get(User, peer_id)
    completed = exchange.publisher_agreed and exchange.receiver_agreed

    # 实时推送给对方
    if completed:
        await manager.send_to_user(peer_id, {
            "type": "card_exchange_completed",
            "task_id": task_id,
            "task_title": task.title,
        })
    else:
        await manager.send_to_user(peer_id, {
            "type": "card_exchange_request",
            "task_id": task_id,
            "task_title": task.title,
            "from_name": user.nickname or user.username,
        })

    return _to_read(exchange, user, task, peer)
