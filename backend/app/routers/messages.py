"""站内私信接口。"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Message, Task, User
from app.schemas.message import ConversationRead, MessageCreate, MessageRead

router = APIRouter(prefix="/messages", tags=["私信"])


def _to_read(message: Message) -> MessageRead:
    return MessageRead(
        id=message.id,
        task_id=message.task_id,
        sender_id=message.sender_id,
        sender_name=(message.sender.nickname or message.sender.username) if message.sender else None,
        receiver_id=message.receiver_id,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
    )


@router.post("/task/{task_id}", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    task_id: int,
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    if user.id not in (task.publisher_id, task.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有任务参与方才能发消息")
    receiver_id = task.publisher_id if user.id == task.receiver_id else task.receiver_id
    if receiver_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务还没有接单者")
    message = Message(
        task_id=task_id,
        sender_id=user.id,
        receiver_id=receiver_id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _to_read(message)


@router.get("/task/{task_id}", response_model=list[MessageRead])
def get_messages(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    if user.id not in (task.publisher_id, task.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有任务参与方才能查看消息")
    peer_id = task.publisher_id if user.id == task.receiver_id else task.receiver_id
    if peer_id is None:
        return []
    messages = db.scalars(
        select(Message)
        .where(
            Message.task_id == task_id,
            or_(
                (Message.sender_id == user.id) & (Message.receiver_id == peer_id),
                (Message.sender_id == peer_id) & (Message.receiver_id == user.id),
            ),
        )
        .order_by(Message.created_at.asc())
    ).all()
    for message in messages:
        if message.receiver_id == user.id and not message.is_read:
            message.is_read = True
    db.commit()
    return [_to_read(m) for m in messages]


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    last_ids = db.scalars(
        select(func.max(Message.id))
        .where(or_(Message.sender_id == user.id, Message.receiver_id == user.id))
        .group_by(Message.task_id)
    ).all()
    if not last_ids:
        return []
    messages = db.scalars(select(Message).where(Message.id.in_(last_ids)).order_by(Message.created_at.desc())).all()
    conversations: list[ConversationRead] = []
    for m in messages:
        task = db.get(Task, m.task_id)
        peer_id = m.sender_id if m.receiver_id == user.id else m.receiver_id
        peer = db.get(User, peer_id)
        unread = db.scalar(
            select(func.count())
            .select_from(Message)
            .where(Message.task_id == m.task_id, Message.receiver_id == user.id, Message.is_read.is_(False))
        ) or 0
        conversations.append(ConversationRead(
            task_id=m.task_id,
            task_title=task.title if task else f"任务 {m.task_id}",
            peer_id=peer_id,
            peer_name=(peer.nickname or peer.username) if peer else "未知",
            last_message=m.content,
            unread_count=unread,
            updated_at=m.created_at,
        ))
    return conversations
