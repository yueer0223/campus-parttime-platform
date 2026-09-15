"""数据看板聚合接口（管理员）。"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import Role, TaskStatus
from app.core.deps import require_roles
from app.database import get_db
from app.models import Category, Task, User
from app.schemas.stats import CategoryCount, DailyCount, DashboardStats, StatusCount

router = APIRouter(prefix="/stats", tags=["数据看板"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    _: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    total_tasks = db.scalar(select(func.count()).select_from(Task)) or 0
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    open_tasks = (
        db.scalar(select(func.count()).select_from(Task).where(Task.status == TaskStatus.OPEN)) or 0
    )
    in_progress_tasks = (
        db.scalar(select(func.count()).select_from(Task).where(Task.status == TaskStatus.IN_PROGRESS)) or 0
    )
    completed_tasks = (
        db.scalar(select(func.count()).select_from(Task).where(Task.status == TaskStatus.COMPLETED)) or 0
    )

    status_rows = db.execute(select(Task.status, func.count()).group_by(Task.status)).all()
    status_distribution = [StatusCount(status=s, count=c) for s, c in status_rows]

    category_rows = db.execute(
        select(Category.name, func.count(Task.id))
        .outerjoin(Task, Task.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.id)
    ).all()
    category_distribution = [CategoryCount(name=name, count=c) for name, c in category_rows]
    uncategorized = (
        db.scalar(select(func.count()).select_from(Task).where(Task.category_id.is_(None))) or 0
    )
    if uncategorized:
        category_distribution.append(CategoryCount(name="未分类", count=uncategorized))

    top_categories = sorted(category_distribution, key=lambda x: x.count, reverse=True)[:5]
    completion_rate = round(completed_tasks / total_tasks, 3) if total_tasks else 0.0

    since = datetime.now() - timedelta(days=13)
    daily_rows = db.execute(
        select(func.date(Task.created_at), func.count())
        .where(Task.created_at >= since)
        .group_by(func.date(Task.created_at))
    ).all()
    daily_map = {str(day): count for day, count in daily_rows}
    daily_trend = []
    for offset in range(14):
        day = (since + timedelta(days=offset)).date().isoformat()
        daily_trend.append(DailyCount(date=day, count=daily_map.get(day, 0)))

    return DashboardStats(
        total_tasks=total_tasks,
        total_users=total_users,
        open_tasks=open_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_tasks=completed_tasks,
        completion_rate=completion_rate,
        status_distribution=status_distribution,
        category_distribution=category_distribution,
        top_categories=top_categories,
        daily_trend=daily_trend,
    )
