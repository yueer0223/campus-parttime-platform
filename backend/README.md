# 校园兼职信息网 - 后端

技术栈：FastAPI + SQLAlchemy 2.0 + SQLite + Pydantic v2 + JWT（阶段二启用）。

## 目录结构

```
backend/
├── app/
│   ├── main.py          # 应用入口（当前仅健康检查）
│   ├── config.py        # 配置
│   ├── database.py      # 引擎 / 会话 / Base
│   ├── core/            # 安全与鉴权工具
│   ├── models/          # ORM 模型
│   ├── schemas/         # Pydantic 模型（阶段二）
│   └── routers/         # API 路由（阶段二）
└── scripts/
    └── init_db.py       # 建表 + 种子数据
```

## 本地运行

依赖已安装在 `.venv`（Python 3.12.14），日常启动：

```bash
cd backend
./.venv/bin/uvicorn app.main:app --reload
```

如需重建虚拟环境（使用 uv 安装的独立 Python 3.12）：

```bash
cd backend
/opt/homebrew/python-standalone/cpython-3.12.14-macos-aarch64-none/bin/python3.12 -m venv --clear .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/python scripts/init_db.py
```

启动后访问 http://127.0.0.1:8000/health 可查看健康检查。

## 默认账号（仅用于本地开发）

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | 管理员 |
| publisher | 123456 | 发布者 |
| receiver | 123456 | 接单者 |

## 主要接口

统一前缀 `/api`，除登录/注册/任务浏览外均需 Bearer Token。

| 模块 | 接口 |
| --- | --- |
| 认证 | `POST /auth/register`、`POST /auth/login`、`GET /auth/me` |
| 分类 | `GET /categories` |
| 任务 | `GET/POST /tasks`、`GET/PUT/DELETE /tasks/{id}`、`POST /tasks/{id}/accept|complete|cancel` |
| 我的任务 | `GET /tasks/mine/published`、`GET /tasks/mine/accepted` |
| AI 润色 | `POST /polish` |
| 用户管理 | `GET /users`、`PATCH /users/{id}/role`（管理员） |
| 数据看板 | `GET /stats/dashboard`（管理员） |

## 接入 DeepSeek

复制 `.env.example` 为 `.env`，填入 `DEEPSEEK_API_KEY` 后即自动从本地 mock 切换为真实调用：

```bash
cd backend
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY=sk-xxx
```

未配置 Key 时，`POST /api/polish` 会使用规则版 mock，保证前端联调不依赖网络与付费。
