"""
データベース接続設定

SQLAlchemyを使用したデータベース接続の管理
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings


# データベースエンジンの作成
engine = create_engine(settings.database_url)

# セッションファクトリーの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    データベースセッションを取得する依存性注入関数
    
    Yields:
        Session: SQLAlchemyデータベースセッション
        
    Example:
        ```python
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
        ```
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
