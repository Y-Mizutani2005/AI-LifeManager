"""
コア機能モジュール

アプリケーションの核となる設定や初期化処理を管理
"""

from app.core.config import settings
from app.core.database import engine, SessionLocal, get_db
from app.core.ai import get_kernel, initialize_kernel

__all__ = [
    "settings",
    "engine",
    "SessionLocal",
    "get_db",
    "get_kernel",
    "initialize_kernel",
]
