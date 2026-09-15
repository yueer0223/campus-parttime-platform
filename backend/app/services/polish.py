"""AI 需求润色服务：无 API Key 时降级为规则版 mock。"""
from abc import ABC, abstractmethod

import httpx

from app.config import settings

SYSTEM_PROMPT = (
    "你是一名校园兼职平台的文案助手。请把用户提供的兼职需求润色成一段"
    "清晰、规范、有吸引力的需求描述，突出工作内容、时间、地点、报酬和"
    "要求，语言简洁，不要添加与原文无关的信息，直接输出润色后的正文。"
)


class PolishProvider(ABC):
    @abstractmethod
    def polish(self, text: str) -> tuple[str, str, str]:
        """返回 (润色文本, 供应商, 模型)。"""


class MockPolishProvider(PolishProvider):
    """无 Key 时的本地降级实现，保证演示链路可跑通。"""

    def polish(self, text: str) -> tuple[str, str, str]:
        cleaned = text.strip()
        polished = (
            f"{cleaned}\n\n"
            "（润色说明：请补充明确的工作时间、地点、报酬与联系/接单要求，"
            "便于同学快速判断是否适合。）"
        )
        return polished, "mock", "rule-based"


class DeepSeekPolishProvider(PolishProvider):
    """调用 DeepSeek 官方接口进行润色。"""

    def polish(self, text: str) -> tuple[str, str, str]:
        url = f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.deepseek_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.deepseek_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            "temperature": 0.7,
            "stream": False,
        }
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        polished = data["choices"][0]["message"]["content"].strip()
        return polished, "deepseek", settings.deepseek_model


def get_provider() -> PolishProvider:
    if settings.deepseek_api_key:
        return DeepSeekPolishProvider()
    return MockPolishProvider()
