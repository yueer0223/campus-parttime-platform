"""任务收藏接口。"""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Task, TaskFavorite, User
from app.schemas.task import TaskRead

router = APIRouter(tags=["收藏"])


def _to_read(task: Task, is_favorited: bool = True) -> TaskRead:
    return TaskRead(
        id=task.id,
        title=task.title,
        description=task.description,
        category_id=task.category_id,
        category_name=task.category.name if task.category else None,
        reward=float(task.reward),
        reward_unit=task.reward_unit,
        price_type=task.price_type,
        duration=task.duration,
        deadline=task.deadline,
        offer_price=float(task.offer_price) if task.offer_price is not None else None,
        final_price=float(task.final_price) if task.final_price is not None else None,
        apply_count=1 if task.status == "applied" else 0,
        is_favorited=is_favorited,
        status=task.status,
        publisher_id=task.publisher_id,
        publisher_name=(task.publisher.nickname or task.publisher.username) if task.publisher else None,
        receiver_id=task.receiver_id,
        receiver_name=(task.receiver.nickname or task.receiver.username) if task.receiver else None,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/favorites", response_model=list[TaskRead])
def my_favorites(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = db.scalars(
        select(Task)
        .join(TaskFavorite, TaskFavorite.task_id == Task.id)
        .where(TaskFavorite.user_id == user.id)
        .order_by(TaskFavorite.created_at.desc())
    ).all()
    return [_to_read(t) for t in tasks]


@router.post("/tasks/{task_id}/favorite", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def favorite_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    exists = db.scalar(
        select(TaskFavorite).where(TaskFavorite.user_id == user.id, TaskFavorite.task_id == task_id)
    )
    if exists is None:
        db.add(TaskFavorite(user_id=user.id, task_id=task_id))
        db.commit()
    return _to_read(task)


@router.delete("/tasks/{task_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def unfavorite_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = db.scalar(
        select(TaskFavorite).where(TaskFavorite.user_id == user.id, TaskFavorite.task_id == task_id)
    )
    if favorite is not None:
        db.delete(favorite)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
