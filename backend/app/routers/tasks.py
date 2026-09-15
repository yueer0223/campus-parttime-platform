"""兼职任务接口：分页、审核、接单、评价与投诉。"""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import ComplaintStatus, NotificationType, Role, TaskStatus
from app.core.deps import get_current_user, get_optional_user, require_roles
from app.database import get_db
from app.models import Complaint, Review, Task, TaskFavorite, User
from app.schemas.complaint import ComplaintCreate, ComplaintRead
from app.schemas.pagination import Page
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.task import ApplyTask, ApproveApplication, TaskCreate, TaskRead, TaskUpdate
from app.services.notifications import notify

router = APIRouter(prefix="/tasks", tags=["兼职任务"])


def _to_read(task: Task) -> TaskRead:
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
        apply_count=1 if task.status == TaskStatus.APPLIED else 0,
        is_favorited=False,
        status=task.status,
        publisher_id=task.publisher_id,
        publisher_name=(task.publisher.nickname or task.publisher.username) if task.publisher else None,
        receiver_id=task.receiver_id,
        receiver_name=(task.receiver.nickname or task.receiver.username) if task.receiver else None,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _review_to_read(review: Review) -> ReviewRead:
    return ReviewRead(
        id=review.id,
        task_id=review.task_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=(review.reviewer.nickname or review.reviewer.username) if review.reviewer else None,
        reviewee_id=review.reviewee_id,
        rating=review.rating,
        content=review.content,
        created_at=review.created_at,
    )


def _complaint_to_read(complaint: Complaint) -> ComplaintRead:
    return ComplaintRead(
        id=complaint.id,
        task_id=complaint.task_id,
        task_title=complaint.task.title if complaint.task else None,
        complainant_id=complaint.complainant_id,
        complainant_name=(complaint.complainant.nickname or complaint.complainant.username) if complaint.complainant else None,
        reason=complaint.reason,
        detail=complaint.detail,
        status=complaint.status,
        handled_note=complaint.handled_note,
        created_at=complaint.created_at,
    )


def _get_task_or_404(task_id: int, db: Session) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    return task


@router.get("", response_model=Page[TaskRead])
def list_tasks(
    page: int = 1,
    page_size: int = 12,
    status_filter: str | None = None,
    category_id: int | None = None,
    keyword: str | None = None,
    sort: str = "latest",
    min_reward: float | None = None,
    max_reward: float | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)

    stmt = select(Task)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    else:
        stmt = stmt.where(
            Task.status.in_([
                TaskStatus.OPEN,
                TaskStatus.APPLIED,
                TaskStatus.IN_PROGRESS,
                TaskStatus.COMPLETED,
                TaskStatus.CANCELLED,
            ])
        )
    if category_id:
        stmt = stmt.where(Task.category_id == category_id)
    if keyword:
        stmt = stmt.where(Task.title.contains(keyword) | Task.description.contains(keyword))
    if min_reward is not None:
        stmt = stmt.where(Task.reward >= min_reward)
    if max_reward is not None:
        stmt = stmt.where(Task.reward <= max_reward)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = Task.reward.desc() if sort == "reward_desc" else Task.created_at.desc()
    items = db.scalars(
        stmt.order_by(order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    favorited_ids: set[int] = set()
    if user and items:
        favorited_ids = set(
            db.scalars(
                select(TaskFavorite.task_id).where(
                    TaskFavorite.user_id == user.id,
                    TaskFavorite.task_id.in_([t.id for t in items]),
                )
            ).all()
        )

    result = []
    for t in items:
        item = _to_read(t)
        item.is_favorited = t.id in favorited_ids
        result.append(item)

    return Page(
        items=result,
        total=total,
        page=page,
        page_size=page_size,
        has_more=page * page_size < total,
    )


@router.get("/mine/published", response_model=list[TaskRead])
def my_published(
    user: User = Depends(require_roles(Role.PUBLISHER, Role.ADMIN)),
    db: Session = Depends(get_db),
):
    stmt = select(Task).where(Task.publisher_id == user.id).order_by(Task.created_at.desc())
    return [_to_read(t) for t in db.scalars(stmt).all()]


@router.get("/admin/pending", response_model=list[TaskRead])
def admin_pending_tasks(
    user: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    stmt = select(Task).where(Task.status == TaskStatus.PENDING).order_by(Task.created_at.desc())
    return [_to_read(t) for t in db.scalars(stmt).all()]


@router.get("/mine/accepted", response_model=list[TaskRead])
def my_accepted(
    user: User = Depends(require_roles(Role.RECEIVER)),
    db: Session = Depends(get_db),
):
    stmt = select(Task).where(Task.receiver_id == user.id).order_by(Task.created_at.desc())
    return [_to_read(t) for t in db.scalars(stmt).all()]


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    user: User = Depends(require_roles(Role.PUBLISHER, Role.ADMIN)),
    db: Session = Depends(get_db),
):
    task = Task(
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        reward=payload.reward,
        reward_unit=payload.reward_unit,
        price_type=payload.price_type,
        duration=payload.duration,
        deadline=payload.deadline,
        status=TaskStatus.PENDING,
        publisher_id=user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return _to_read(_get_task_or_404(task_id, db))


@router.put("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if user.role != Role.ADMIN and task.publisher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只能编辑自己发布的任务")
    if task.status not in (TaskStatus.PENDING, TaskStatus.OPEN):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务已被接单或结束，无法编辑")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if user.role != Role.ADMIN and task.publisher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只能删除自己发布的任务")
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{task_id}/approve", response_model=TaskRead)
def approve_task(
    task_id: int,
    user: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务不在待审核状态")
    task.status = TaskStatus.OPEN
    notify(db, task.publisher_id, NotificationType.TASK_APPROVED, f"你发布的任务「{task.title}」已审核通过", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/reject", response_model=TaskRead)
def reject_task(
    task_id: int,
    user: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务不在待审核状态")
    task.status = TaskStatus.REJECTED
    notify(db, task.publisher_id, NotificationType.TASK_REJECTED, f"你发布的任务「{task.title}」未通过审核", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/apply", response_model=TaskRead)
def apply_task(
    task_id: int,
    payload: ApplyTask,
    user: User = Depends(require_roles(Role.RECEIVER)),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.OPEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该任务当前不可申请")
    if task.publisher_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能申请自己发布的任务")
    task.receiver_id = user.id
    task.offer_price = payload.offer_price
    task.status = TaskStatus.APPLIED
    notify(db, task.publisher_id, NotificationType.TASK_ACCEPTED, f"有人申请了你的任务「{task.title}」，请尽快确认", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/approve-application", response_model=TaskRead)
def approve_application(
    task_id: int,
    payload: ApproveApplication,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.APPLIED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务没有待确认的申请")
    if user.role != Role.ADMIN and user.id != task.publisher_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有发布者才能确认申请")
    if payload.final_price is not None:
        task.final_price = payload.final_price
    task.status = TaskStatus.IN_PROGRESS
    if task.receiver_id:
        notify(db, task.receiver_id, NotificationType.TASK_APPROVED, f"你的申请已通过，任务「{task.title}」开始进行", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/reject-application", response_model=TaskRead)
def reject_application(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.APPLIED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务没有待确认的申请")
    if user.role != Role.ADMIN and user.id != task.publisher_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有发布者才能拒绝申请")
    rejected_receiver = task.receiver_id
    task.receiver_id = None
    task.offer_price = None
    task.status = TaskStatus.OPEN
    if rejected_receiver:
        notify(db, rejected_receiver, NotificationType.TASK_REJECTED, f"你对任务「{task.title}」的申请未被通过", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/complete", response_model=TaskRead)
def complete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.IN_PROGRESS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务尚未开始，无法完成")
    if user.role != Role.ADMIN and user.id not in (task.publisher_id, task.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="没有权限完成该任务")
    task.status = TaskStatus.COMPLETED
    other_id = task.receiver_id if user.id == task.publisher_id else task.publisher_id
    if other_id:
        notify(db, other_id, NotificationType.TASK_COMPLETED, f"任务「{task.title}」已完成", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/cancel", response_model=TaskRead)
def cancel_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status not in (TaskStatus.OPEN, TaskStatus.IN_PROGRESS):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该任务当前无法取消")
    if user.role != Role.ADMIN and task.publisher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="没有权限取消该任务")
    task.status = TaskStatus.CANCELLED
    if task.receiver_id and task.receiver_id != user.id:
        notify(db, task.receiver_id, NotificationType.TASK_CANCELLED, f"任务「{task.title}」已被取消", task.id)
    db.commit()
    db.refresh(task)
    return _to_read(task)


@router.post("/{task_id}/review", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def review_task(
    task_id: int,
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(task_id, db)
    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务完成后才能评价")
    if user.id == task.publisher_id and task.receiver_id:
        reviewee_id = task.receiver_id
    elif user.id == task.receiver_id:
        reviewee_id = task.publisher_id
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有任务参与方才能评价")
    exists = db.scalar(select(Review).where(Review.task_id == task_id, Review.reviewer_id == user.id))
    if exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="你已评价过该任务")
    review = Review(
        task_id=task_id,
        reviewer_id=user.id,
        reviewee_id=reviewee_id,
        rating=payload.rating,
        content=payload.content,
    )
    db.add(review)
    notify(db, reviewee_id, NotificationType.REVIEW_RECEIVED, f"你收到一条关于「{task.title}」的评价", task.id)
    db.commit()
    db.refresh(review)
    return _review_to_read(review)


@router.post("/{task_id}/complaint", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def complain_task(
    task_id: int,
    payload: ComplaintCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_task_or_404(task_id, db)
    complaint = Complaint(
        task_id=task_id,
        complainant_id=user.id,
        reason=payload.reason,
        detail=payload.detail,
        status=ComplaintStatus.PENDING,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return _complaint_to_read(complaint)
