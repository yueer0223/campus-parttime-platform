"""WebSocket 连接管理器。"""
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        bucket = self._connections.get(user_id)
        if bucket and websocket in bucket:
            bucket.remove(websocket)
        if bucket is not None and not bucket:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, data: dict) -> None:
        for websocket in list(self._connections.get(user_id, [])):
            try:
                await websocket.send_json(data)
            except Exception:
                self.disconnect(user_id, websocket)


manager = ConnectionManager()
