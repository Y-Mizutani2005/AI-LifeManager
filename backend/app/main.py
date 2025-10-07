"""
AI Project Companion - メインアプリケーション

個人開発者向けのタスク管理AIアシスタントのバックエンドAPI
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.ai import initialize_kernel
from app.api.routes import chat_router, health_router


# FastAPIアプリケーションの作成
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered project management companion API"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """
    アプリケーション起動時の初期化処理
    
    Semantic Kernelの初期化などを実行します。
    """
    print("=" * 50)
    print(f"🚀 {settings.app_name} v{settings.app_version} を起動中...")
    print("=" * 50)
    
    # Semantic Kernelの初期化
    try:
        initialize_kernel()
        print("✅ Semantic Kernel を初期化しました")
    except Exception as e:
        print(f"❌ Semantic Kernel の初期化に失敗: {e}")
        raise
    
    print(f"✅ OpenAI モデル: {settings.openai_model}")
    print(f"✅ データベース: {settings.db_host}:{settings.db_port}/{settings.db_name}")
    print(f"✅ CORS Origins: {settings.cors_origins}")
    print("=" * 50)
    print("🎉 アプリケーションの起動が完了しました!")
    print("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """
    アプリケーション終了時のクリーンアップ処理
    """
    print("=" * 50)
    print("👋 アプリケーションを終了します...")
    print("=" * 50)


# ルーターの登録
app.include_router(chat_router, tags=["chat"])
app.include_router(health_router, tags=["health"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
