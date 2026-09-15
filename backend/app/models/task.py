"""兼职任务模型。"""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    reward: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    reward_unit: Mapped[str] = mapped_column(String(16), nullable=False, default="元")
    price_type: Mapped[str] = mapped_column(String(20), nullable=False, default="fixed")
    duration: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    deadline: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    offer_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    final_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open", index=True)
    publisher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    category = relationship("Category", back_populates="tasks")
    publisher = relationship("User", foreign_keys=[publisher_id], back_populates="published_tasks")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="accepted_tasks")
