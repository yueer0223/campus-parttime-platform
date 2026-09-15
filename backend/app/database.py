"""数据库引擎、会话工厂与 ORM 基类。"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)


class Base(DeclarativeBase):
    """所有 ORM 模型共用的声明式基类。"""


def get_db():
    """FastAPI 依赖：提供数据库会话并确保关闭。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
