"""
Pydanticスキーマ定義

API リクエスト/レスポンスで使用するデータモデルを定義
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ========================================
# Project関連
# ========================================

class ProjectContext(BaseModel):
    """
    プロジェクトのコンテキスト情報
    
    プランニング時に収集したプロジェクトの背景情報を保存
    
    Attributes:
        motivation: プロジェクトに取り組む動機・目的
        weeklyHours: 週あたりの作業可能時間
        constraints: 制約事項のリスト
        resources: 利用可能なリソースのリスト
    """
    motivation: Optional[str] = None
    weeklyHours: Optional[float] = None
    constraints: List[str] = []
    resources: List[str] = []


class ProjectBase(BaseModel):
    """
    プロジェクトの基本情報
    
    プロジェクトの核となる情報を定義
    
    Attributes:
        title: プロジェクトのタイトル
        description: プロジェクトの詳細説明
        goal: プロジェクトの目標
        status: プロジェクトの状態 ('planning', 'active', 'on_hold', 'completed', 'archived')
        startDate: プロジェクト開始日
        targetEndDate: 目標完了日
        tags: タグのリスト
        color: UI表示用のカラーコード
        context: プロジェクトのコンテキスト情報
    """
    title: str
    description: Optional[str] = None
    goal: str
    status: str = 'planning'
    startDate: Optional[str] = None
    targetEndDate: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None
    context: Optional[ProjectContext] = None


class ProjectCreate(ProjectBase):
    """
    プロジェクト作成リクエスト
    
    新規プロジェクトを作成する際のリクエストボディ
    """
    pass


class ProjectUpdate(BaseModel):
    """
    プロジェクト更新リクエスト
    
    プロジェクトを更新する際のリクエストボディ
    全てのフィールドがオプショナル
    """
    title: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    targetEndDate: Optional[str] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None
    context: Optional[ProjectContext] = None


class Project(ProjectBase):
    """
    プロジェクトレスポンス
    
    API レスポンスで返却されるプロジェクト情報
    
    Attributes:
        id: プロジェクトの一意識別子
        createdAt: 作成日時
        updatedAt: 更新日時
        actualEndDate: 実際の完了日
    """
    id: str
    createdAt: str
    updatedAt: str
    actualEndDate: Optional[str] = None


# ========================================
# Milestone関連
# ========================================

class MilestoneBase(BaseModel):
    """
    マイルストーンの基本情報
    
    プロジェクトを構成する中間目標
    
    Attributes:
        projectId: 所属するプロジェクトのID
        title: マイルストーンのタイトル
        description: マイルストーンの詳細説明
        order: 表示順序
        dueDate: 期限
        status: マイルストーンの状態 ('todo', 'in_progress', 'done')
    """
    projectId: str
    title: str
    description: Optional[str] = None
    order: int
    dueDate: Optional[str] = None
    status: str = 'todo'


class MilestoneCreate(MilestoneBase):
    """
    マイルストーン作成リクエスト
    
    新規マイルストーンを作成する際のリクエストボディ
    """
    pass


class MilestoneUpdate(BaseModel):
    """
    マイルストーン更新リクエスト
    
    マイルストーンを更新する際のリクエストボディ
    全てのフィールドがオプショナル
    """
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    dueDate: Optional[str] = None
    status: Optional[str] = None


class Milestone(MilestoneBase):
    """
    マイルストーンレスポンス
    
    API レスポンスで返却されるマイルストーン情報
    
    Attributes:
        id: マイルストーンの一意識別子
        createdAt: 作成日時
        updatedAt: 更新日時
        completedAt: 完了日時
    """
    id: str
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None


# ========================================
# Task関連(拡張版)
# ========================================

class TaskBase(BaseModel):
    """
    タスクの基本情報(拡張版)
    
    プロジェクトやマイルストーンに紐づく具体的な作業単位
    
    Attributes:
        projectId: 所属するプロジェクトのID
        milestoneId: 所属するマイルストーンのID(オプショナル)
        parentTaskId: 親タスクのID(サブタスクの場合)
        title: タスクのタイトル
        description: タスクの詳細説明
        status: タスクの状態 ('todo', 'in_progress', 'done', 'blocked')
        priority: タスクの優先度 ('high', 'medium', 'low')
        dueDate: 期限
        startDate: 開始予定日
        estimatedHours: 見積もり時間
        actualHours: 実際にかかった時間
        dependencies: 依存するタスクのIDリスト
        blockedBy: ブロックしているタスクのIDリスト
        tags: タグのリスト
        isToday: 今日のタスクフラグ
    """
    projectId: str
    milestoneId: Optional[str] = None
    parentTaskId: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = 'todo'
    priority: str = 'medium'
    dueDate: Optional[str] = None
    startDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    dependencies: List[str] = []
    blockedBy: List[str] = []
    tags: List[str] = []
    isToday: bool = False


class TaskCreate(TaskBase):
    """
    タスク作成リクエスト
    
    新規タスクを作成する際のリクエストボディ
    """
    pass


class TaskUpdate(BaseModel):
    """
    タスク更新リクエスト
    
    タスクを更新する際のリクエストボディ
    全てのフィールドがオプショナル
    """
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    dependencies: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    isToday: Optional[bool] = None


class Task(TaskBase):
    """
    タスクレスポンス
    
    API レスポンスで返却されるタスク情報
    
    Attributes:
        id: タスクの一意識別子
        createdAt: 作成日時
        updatedAt: 更新日時
        completedAt: 完了日時
    """
    id: str
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None


# ========================================
# 既存のチャット関連(互換性維持)
# ========================================

class ChatMessage(BaseModel):
    """
    チャットメッセージを表すモデル
    
    Attributes:
        role: メッセージの送信者 ('user' or 'assistant')
        content: メッセージの内容
    """
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    """
    チャットAPIへのリクエストモデル
    
    Attributes:
        message: ユーザーからの新しいメッセージ
        tasks: 現在のタスクリスト(完全なTask型)
        history: 過去の会話履歴
    """
    message: str
    tasks: list[Task] = []
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    """
    チャットAPIからのレスポンスモデル
    
    Attributes:
        response: AIアシスタントからの応答メッセージ
    """
    response: str


# ========================================
# Planning Session関連
# ========================================

class PlanningSessionInfo(BaseModel):
    """
    プランニングセッションで収集した情報
    
    質問駆動型プランニング中にユーザーから引き出した情報を保存
    
    Attributes:
        dreamTitle: やりたいことのタイトル
        purpose: 目的・なぜやりたいのか
        deadline: 希望する完了期限
        weeklyHours: 週あたりの作業可能時間
        skills: 現在持っているスキル
        constraints: 制約事項
        existingResources: 既存のリソース
    """
    dreamTitle: Optional[str] = None
    purpose: Optional[str] = None
    deadline: Optional[str] = None
    weeklyHours: Optional[float] = None
    skills: List[str] = []
    constraints: List[str] = []
    existingResources: List[str] = []


class ProposedStructure(BaseModel):
    """
    AIが提案したプロジェクト構造
    
    プランニングセッション中にAIが生成した
    プロジェクト・マイルストーン・タスクの全体構造
    
    Attributes:
        project: 提案するプロジェクト
        milestones: 提案するマイルストーンのリスト
        tasks: 提案するタスクのリスト
    """
    project: ProjectCreate
    milestones: List[MilestoneCreate]
    tasks: List[TaskCreate]


class PlanningSession(BaseModel):
    """
    プランニングセッション
    
    質問駆動型プランニングのセッション状態を管理
    
    Attributes:
        id: セッションの一意識別子
        projectId: 生成されたプロジェクトのID(確定後)
        stage: プランニングの進行段階
        collectedInfo: 収集した情報
        proposedStructure: 提案された構造
        createdAt: 作成日時
        updatedAt: 更新日時
    """
    id: str
    projectId: Optional[str] = None
    stage: str  # initial, clarifying, structuring, tasking, completed
    collectedInfo: PlanningSessionInfo
    proposedStructure: Optional[ProposedStructure] = None
    createdAt: str
    updatedAt: str


class PlanningChatRequest(BaseModel):
    """
    プランニングチャットリクエスト
    
    質問駆動型プランニング用のチャットリクエスト
    
    Attributes:
        sessionId: セッションID(継続の場合)
        message: ユーザーからのメッセージ
        history: 会話履歴
    """
    sessionId: Optional[str] = None
    message: str
    history: List[ChatMessage] = []


class PlanningChatResponse(BaseModel):
    """
    プランニングチャットレスポンス
    
    質問駆動型プランニング用のチャットレスポンス
    
    Attributes:
        sessionId: セッションID
        response: AIからの応答
        stage: 現在のステージ
        action: 次に実行すべきアクション
        proposedStructure: 提案された構造(構造化ステージの場合)
    """
    sessionId: str
    response: str
    stage: str
    action: Optional[str] = None  # move_to_structuring, propose_structure, finalize
    proposedStructure: Optional[ProposedStructure] = None
