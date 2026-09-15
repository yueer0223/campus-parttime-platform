"""AI 需求润色接口。"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.database import get_db
from app.models import AIPolishLog, User
from app.schemas.polish import PolishRequest, PolishResponse
from app.services.polish import get_provider

router = APIRouter(prefix="/polish", tags=["AI 润色"])


@router.post("", response_model=PolishResponse)
def polish(
    payload: PolishRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = get_provider()
    try:
        polished_text, provider_name, model = provider.polish(payload.text)
    except Exception as exc:
        db.add(
            AIPolishLog(
                user_id=user.id,
                original_text=payload.text,
                polished_text=None,
                provider="deepseek",
                model=settings.deepseek_model,
                status="failed",
                error_message=str(exc),
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI 润色服务调用失败：{exc}",
        )

    db.add(
        AIPolishLog(
            user_id=user.id,
            original_text=payload.text,
            polished_text=polished_text,
            provider=provider_name,
            model=model,
            status="success",
        )
    )
    db.commit()
    return PolishResponse(
        original_text=payload.text,
        polished_text=polished_text,
        provider=provider_name,
        model=model,
    )
