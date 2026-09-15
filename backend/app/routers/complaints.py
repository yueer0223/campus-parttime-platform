"""投诉管理接口（管理员）。"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ComplaintStatus, Role
from app.core.deps import require_roles
from app.database import get_db
from app.models import Complaint, User
from app.schemas.complaint import ComplaintHandle, ComplaintRead

router = APIRouter(prefix="/complaints", tags=["投诉"])


def _to_read(complaint: Complaint) -> ComplaintRead:
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


@router.get("", response_model=list[ComplaintRead])
def list_complaints(
    _: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    return [_to_read(c) for c in db.scalars(select(Complaint).order_by(Complaint.created_at.desc())).all()]


@router.patch("/{complaint_id}", response_model=ComplaintRead)
def handle_complaint(
    complaint_id: int,
    payload: ComplaintHandle,
    _: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    if payload.status not in (ComplaintStatus.RESOLVED, ComplaintStatus.DISMISSED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="非法处理状态")
    complaint = db.get(Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="投诉不存在")
    complaint.status = payload.status
    complaint.handled_note = payload.handled_note
    db.commit()
    db.refresh(complaint)
    return _to_read(complaint)
