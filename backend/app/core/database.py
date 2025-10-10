"""
データベース接続設定とテーブル定義

SQLAlchemyを使用したデータベース接続の管理
プロジェクト、マイルストーン、タスクのテーブル定義
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator
from app.core.config import settings

# ベースクラスの作成
Base = declarative_base()

# ========================================
# テーブル定義
# ========================================

class ProjectModel(Base):
    """
    プロジェクトテーブル
    
    プロジェクト全体の情報を管理するテーブル
    
    Attributes:
        id: プロジェクトの一意識別子
        user_id: プロジェクトの所有者ID(将来のマルチユーザー対応用)
        title: プロジェクトのタイトル
        description: プロジェクトの詳細説明
        goal: プロジェクトの目標
        status: プロジェクトの状態 (planning, active, on_hold, completed, archived)
        start_date: プロジェクト開始日
        target_end_date: 目標完了日
        actual_end_date: 実際の完了日
        tags: タグのJSON配列
        color: UI表示用のカラーコード
        context: プロジェクトのコンテキスト情報(JSON)
        created_at: 作成日時
        updated_at: 更新日時
    """
    __tablename__ = 'projects'
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, default='default_user')  # マルチユーザー対応用
    title = Column(String, nullable=False)
    description = Column(Text)
    goal = Column(String, nullable=False)
    status = Column(String, default='planning')
    start_date = Column(String)
    target_end_date = Column(String)
    actual_end_date = Column(String)
    tags = Column(Text)  # JSON配列として保存
    color = Column(String)
    context = Column(Text)  # JSON
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class MilestoneModel(Base):
    """
    マイルストーンテーブル
    
    プロジェクトの中間目標を管理するテーブル
    
    Attributes:
        id: マイルストーンの一意識別子
        project_id: 所属するプロジェクトのID
        title: マイルストーンのタイトル
        description: マイルストーンの詳細説明
        order_num: 表示順序
        due_date: 期限
        status: マイルストーンの状態 (todo, in_progress, done)
        completed_at: 完了日時
        created_at: 作成日時
        updated_at: 更新日時
    """
    __tablename__ = 'milestones'
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    order_num = Column(Integer)
    due_date = Column(String)
    status = Column(String, default='todo')
    completed_at = Column(String)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class TaskModel(Base):
    """
    タスクテーブル
    
    具体的な作業単位を管理するテーブル
    
    Attributes:
        id: タスクの一意識別子
        project_id: 所属するプロジェクトのID
        milestone_id: 所属するマイルストーンのID(オプショナル)
        parent_task_id: 親タスクのID(サブタスクの場合)
        title: タスクのタイトル
        description: タスクの詳細説明
        status: タスクの状態 (todo, in_progress, done, blocked)
        priority: タスクの優先度 (high, medium, low)
        due_date: 期限
        start_date: 開始予定日
        estimated_hours: 見積もり時間
        actual_hours: 実際にかかった時間
        dependencies: 依存するタスクのIDリスト(JSON)
        blocked_by: ブロックしているタスクのIDリスト(JSON)
        tags: タグのJSON配列
        is_today: 今日のタスクフラグ
        created_at: 作成日時
        updated_at: 更新日時
        completed_at: 完了日時
    """
    __tablename__ = 'tasks'
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    milestone_id = Column(String, ForeignKey('milestones.id', ondelete='SET NULL'))
    parent_task_id = Column(String, ForeignKey('tasks.id', ondelete='CASCADE'))
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default='todo')
    priority = Column(String, default='medium')
    due_date = Column(String)
    start_date = Column(String)
    estimated_hours = Column(Float)
    actual_hours = Column(Float)
    dependencies = Column(Text)  # JSON配列
    blocked_by = Column(Text)  # JSON配列
    tags = Column(Text)  # JSON配列
    is_today = Column(Boolean, default=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)
    completed_at = Column(String)


class PlanningSessionModel(Base):
    """
    プランニングセッションテーブル
    
    質問駆動型プランニングのセッション状態を管理
    
    Attributes:
        id: セッションの一意識別子
        project_id: 生成されたプロジェクトのID(確定後)
        stage: プランニングの進行段階
        collected_info: 収集した情報(JSON)
        proposed_structure: 提案された構造(JSON)
        created_at: 作成日時
        updated_at: 更新日時
    """
    __tablename__ = 'planning_sessions'
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('projects.id', ondelete='SET NULL'))
    stage = Column(String, default='initial')
    collected_info = Column(Text)  # JSON
    proposed_structure = Column(Text)  # JSON
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


# ========================================
# データベースセットアップ
# ========================================

# データベースエンジンの作成
# SQLiteの場合、check_same_threadをFalseに設定
connect_args = {"check_same_thread": False} if settings.db_type == "sqlite" else {}
engine = create_engine(settings.database_url, connect_args=connect_args)

# テーブルを作成(既に存在する場合はスキップ)
Base.metadata.create_all(bind=engine)

# セッションファクトリーの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
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
