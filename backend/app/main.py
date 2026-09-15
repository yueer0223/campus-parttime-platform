"""FastAPI 应用入口。"""
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, cards, categories, complaints, favorites, messages, notifications, polish, stats, tasks, users
from app.ws import manager

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(polish.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(default="")):
    """实时推送通道：用 token 认证后保持连接。"""
    from app.core.security import decode_access_token
    from app.database import SessionLocal
    from app.models import User

    subject = decode_access_token(token)
    if subject is None:
        await websocket.close(code=1008)
        return
    db = SessionLocal()
    try:
        user = db.get(User, int(subject))
    finally:
        db.close()
    if user is None:
        await websocket.close(code=1008)
        return
    await manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)


@app.get("/health")
def health() -> dict:
    """健康检查，用于确认后端已启动。"""
    return {"status": "ok", "app": settings.app_name}
