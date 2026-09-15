"""用户管理接口（管理员）。"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import ALL_ROLES, Role
from app.core.deps import get_current_user, require_roles
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.constants import TaskStatus
from app.models import Review, Task, User
from app.schemas.user import MyStats, PasswordChange, ProfileUpdate, RoleUpdate, UserRead

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=list[UserRead])
def list_users(
    _: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    return db.scalars(select(User).order_by(User.id)).all()


@router.patch("/{user_id}/role", response_model=UserRead)
def change_role(
    user_id: int,
    payload: RoleUpdate,
    _: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    if payload.role not in ALL_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="非法角色")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.nickname is not None:
        user.nickname = payload.nickname
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.wechat is not None:
        user.wechat = payload.wechat
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/change-password")
def change_password(
    payload: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="原密码错误")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}


@router.get("/me/stats", response_model=MyStats)
def my_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    completed_tasks = db.scalars(
        select(Task).where(Task.receiver_id == user.id, Task.status == TaskStatus.COMPLETED)
    ).all()
    earnings = sum(float(t.final_price if t.final_price is not None else t.reward) for t in completed_tasks)
    published_count = db.scalar(
        select(func.count()).select_from(Task).where(Task.publisher_id == user.id)
    ) or 0
    reviews = db.scalars(select(Review).where(Review.reviewee_id == user.id)).all()
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    return MyStats(
        earnings=earnings,
        completed_count=len(completed_tasks),
        published_count=published_count,
        review_count=len(reviews),
        avg_rating=avg_rating,
    )
