"""
Pydanticスキーマ定義

API リクエスト/レスポンスで使用するデータモデルを定義
"""

from pydantic import BaseModel


class Task(BaseModel):
    """
    タスク情報を表すモデル
    
    Attributes:
        id: タスクの一意識別子
        title: タスクのタイトル
        status: タスクの状態 ('todo' or 'done')
        priority: タスクの優先度 ('high', 'medium', 'low')
    """
    id: str
    title: str
    status: str
    priority: str


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
        tasks: 現在のタスクリスト
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
