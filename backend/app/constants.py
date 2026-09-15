"""全局常量：角色与任务状态。"""


class Role:
    ADMIN = "admin"
    PUBLISHER = "publisher"
    RECEIVER = "receiver"


ALL_ROLES = [Role.ADMIN, Role.PUBLISHER, Role.RECEIVER]


class TaskStatus:
    PENDING = "pending"
    OPEN = "open"
    APPLIED = "applied"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


ALL_TASK_STATUSES = [
    TaskStatus.PENDING,
    TaskStatus.OPEN,
    TaskStatus.APPLIED,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.CANCELLED,
    TaskStatus.REJECTED,
]


class PriceType:
    FIXED = "fixed"
    NEGOTIABLE = "negotiable"


class ComplaintStatus:
    PENDING = "pending"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class NotificationType:
    TASK_ACCEPTED = "task_accepted"
    TASK_COMPLETED = "task_completed"
    TASK_CANCELLED = "task_cancelled"
    TASK_APPROVED = "task_approved"
    TASK_REJECTED = "task_rejected"
    REVIEW_RECEIVED = "review_received"
