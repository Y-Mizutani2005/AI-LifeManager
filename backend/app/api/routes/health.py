"""
ヘルスチェックエンドポイント

アプリケーションとデータベースの状態を確認するAPIエンドポイント
"""

from fastapi import APIRouter
from app.core.database import engine
from app.core.config import settings


router = APIRouter()


@router.get("/health")
async def health():
    """
    アプリケーションのヘルスチェック
    
    データベース接続とOpenAI設定の状態を確認します。
    
    Returns:
        ヘルスチェック結果を含む辞書
        - status: アプリケーション全体の状態
        - openai_configured: OpenAI APIキーが設定されているか
        - db_status: データベース接続の状態
    """
    # DB接続確認
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "openai_configured": bool(settings.openai_api_key),
        "db_status": db_status,
        "app_name": settings.app_name,
        "version": settings.app_version,
    }
