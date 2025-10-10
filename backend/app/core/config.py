"""
アプリケーション設定

環境変数からの設定読み込みと管理
"""

import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# backendディレクトリの.envファイルを読み込み
# このファイルから見て ../../.env の位置
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class Settings(BaseSettings):
    """
    アプリケーション設定クラス
    
    環境変数から設定を読み込み、型安全な設定オブジェクトを提供
    """
    
    # アプリケーション設定
    app_name: str = "AI Project Companion"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # OpenAI設定
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    
    # データベース設定
    db_type: str = "sqlite"  # sqlite or postgresql
    db_host: str = ""
    db_port: str = "5432"
    db_user: str = ""
    db_password: str = ""
    db_name: str = "project_companion.db"
    
    # CORS設定
    cors_origins: list[str] = ["http://localhost:5173"]
    
    # AI設定
    ai_max_tokens: int = 2000
    ai_temperature: float = 0.7
    chat_history_limit: int = 5  # 保持する会話履歴の数
    
    @property
    def database_url(self) -> str:
        """
        データベース接続URLを生成
        
        SQLiteまたはPostgreSQLの接続URLを返す
        
        Returns:
            データベース接続URL
        """
        if self.db_type == "sqlite":
            # SQLiteの場合: backend/data/project_companion.db に保存
            db_dir = Path(__file__).parent.parent.parent / "data"
            db_dir.mkdir(exist_ok=True)
            db_path = db_dir / self.db_name
            return f"sqlite:///{db_path}"
        else:
            # PostgreSQLの場合
            return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        # 環境変数のプレフィックスを削除（DB_HOST -> db_host）
        env_prefix = ""


@lru_cache()
def get_settings() -> Settings:
    """
    設定のシングルトンインスタンスを取得
    
    Returns:
        Settings: アプリケーション設定オブジェクト
    """
    return Settings()


# グローバル設定インスタンス
settings = get_settings()
