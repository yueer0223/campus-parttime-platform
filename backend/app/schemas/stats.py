"""数据看板聚合结果的 Pydantic 模型。"""
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class CategoryCount(BaseModel):
    name: str
    count: int


class DailyCount(BaseModel):
    date: str
    count: int


class DashboardStats(BaseModel):
    total_tasks: int
    total_users: int
    open_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    completion_rate: float
    status_distribution: list[StatusCount]
    category_distribution: list[CategoryCount]
    top_categories: list[CategoryCount]
    daily_trend: list[DailyCount]
