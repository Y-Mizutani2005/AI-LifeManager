from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from semantic_kernel.contents import ChatHistory
from semantic_kernel.functions import kernel_function
from semantic_kernel.connectors.ai.open_ai.prompt_execution_settings.open_ai_prompt_execution_settings import (
    OpenAIChatPromptExecutionSettings,
)
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import traceback
import json
import re

load_dotenv()

# SQLAlchemy DB接続設定
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Project Companion API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Viteのデフォルトポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Semantic Kernel初期化
kernel = Kernel()

# OpenAI接続設定
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY が .env ファイルに設定されていません")

service_id = "chat"
kernel.add_service(
    OpenAIChatCompletion(
        service_id=service_id,
        ai_model_id="gpt-4o-mini",  # コスト効率重視
        api_key=api_key
    )
)

# リクエスト/レスポンスモデル
class Task(BaseModel):
    id: str
    title: str
    status: str
    priority: str

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    tasks: list[Task] = []
    history: list[ChatMessage] = []  # 会話履歴

class ChatResponse(BaseModel):
    response: str

# タスク管理用ネイティブプラグイン
class TaskManagementPlugin:
    """
    タスク管理用のSemantic Kernelネイティブプラグイン
    AIがタスクの作成・削除を行えるようにする
    """
    
    def __init__(self):
        self.tasks_to_create = []
        self.tasks_to_delete = []
        self.tasks_to_complete = []
        self.tasks_to_uncomplete = []
    
    @kernel_function(
        name="create_task",
        description="新しいタスクを作成します。ユーザーがタスクを追加したい時に使用します。"
    )
    def create_task(self, title: str, priority: str = "medium") -> str:
        """
        新しいタスクを作成する
        
        Args:
            title: タスクのタイトル
            priority: 優先度 (high/medium/low)
        
        Returns:
            作成されたタスクの情報
        """
        task = {
            "title": title,
            "priority": priority
        }
        self.tasks_to_create.append(task)
        return f"タスク「{title}」(優先度: {priority})を作成しました。"
    
    @kernel_function(
        name="delete_task",
        description="タスクを削除します。ユーザーがタスクを削除したい、完了したタスクを消したい時に使用します。"
    )
    def delete_task(self, task_id: str) -> str:
        """
        タスクを削除する
        
        Args:
            task_id: 削除するタスクのID
        
        Returns:
            削除結果のメッセージ
        """
        self.tasks_to_delete.append(task_id)
        return f"タスクID: {task_id} を削除リストに追加しました。"
    
    @kernel_function(
        name="complete_task",
        description="タスクを完了状態にします。ユーザーがタスクを完了した、終わった、できたと言った時に使用します。"
    )
    def complete_task(self, task_id: str) -> str:
        """
        タスクを完了状態にする
        
        Args:
            task_id: 完了するタスクのID
        
        Returns:
            完了結果のメッセージ
        """
        self.tasks_to_complete.append(task_id)
        return f"タスクID: {task_id} を完了状態にしました。"
    
    @kernel_function(
        name="uncomplete_task",
        description="完了済みのタスクを未完了状態に戻します。ユーザーがタスクを未完了に戻したい、やり直したい時に使用します。"
    )
    def uncomplete_task(self, task_id: str) -> str:
        """
        タスクを未完了状態に戻す
        
        Args:
            task_id: 未完了に戻すタスクのID
        
        Returns:
            未完了化の結果のメッセージ
        """
        self.tasks_to_uncomplete.append(task_id)
        return f"タスクID: {task_id} を未完了状態に戻しました。"
    
    def get_actions(self) -> dict:
        """
        実行するアクション（作成・削除・完了・未完了）を取得
        
        Returns:
            作成・削除・完了・未完了するタスクの情報
        """
        return {
            "create": self.tasks_to_create.copy(),
            "delete": self.tasks_to_delete.copy(),
            "complete": self.tasks_to_complete.copy(),
            "uncomplete": self.tasks_to_uncomplete.copy()
        }
    
    def clear_actions(self):
        """アクションをクリア"""
        self.tasks_to_create.clear()
        self.tasks_to_delete.clear()
        self.tasks_to_complete.clear()
        self.tasks_to_uncomplete.clear()

# システムプロンプト
SYSTEM_PROMPT = """あなたは個人開発者向けのタスク管理AIアシスタントです。
ユーザーの発言からタスクを抽出し、適切に管理をサポートしてください。

【利用可能な関数】
- create_task(title: str, priority: str): 新しいタスクを作成します
- delete_task(task_id: str): タスクを削除します
- complete_task(task_id: str): タスクを完了状態にします
- uncomplete_task(task_id: str): タスクを未完了状態に戻します

【重要なルール】
1. タスク作成が必要な場合は、create_task関数を呼び出してください。
   - title: タスクの内容を簡潔に（例: "ログイン機能の実装"）
   - priority: "high", "medium", "low" のいずれか

2. タスク削除が必要な場合は、delete_task関数を呼び出してください。
   - 「〇〇のタスクを削除して」「〇〇を消して」などの指示に対応

3. タスク完了の操作:
   - 「〇〇を完了にして」「〇〇終わった」「〇〇できた」→ complete_task関数を呼び出す
   - タスクリストから該当するタスクのIDを特定

4. タスクを未完了に戻す操作:
   - 「〇〇を未完了にして」「〇〇をやり直す」→ uncomplete_task関数を呼び出す

5. 関数呼び出し後は、ユーザーにフレンドリーな確認メッセージを返してください。
   - 例: "「ログイン機能の実装」を完了にしました!お疲れ様です!🎉"

6. タスク作成・削除以外の質問（「何から始めるべき?」「この見積もりは妥当?」など）には、
   自然な会話で親身にアドバイスしてください。

7. タスクを分解して、と言われた際は、具体的なステップに分けて提案してください。

8. タスクを複数追加・削除・完了・未完了する際は、プラグインを一回ずつ呼び出してください。

8. 優先度の判断基準：
   - high: 期限が近い、重要度が高い、ブロッカーになる
   - medium: 通常のタスク
   - low: いつでもできる、優先度が低い

9. 簡潔で具体的なタスク名を提案してください。

10. フレンドリーで励ましのある口調で応答してください。"""

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    print("=" * 50)
    print("🔵 チャットリクエストを受信しました")
    print(f"メッセージ: {req.message}")
    print(f"タスク数: {len(req.tasks)}")
    print("=" * 50)
    
    try:
        # タスク管理プラグインの初期化
        task_plugin = TaskManagementPlugin()
        
        # 既存のプラグインを削除してから追加（重複を防ぐ）
        plugin_name = "TaskManagement"
        if plugin_name in kernel.plugins:
            kernel.plugins.pop(plugin_name)
        
        kernel.add_plugin(task_plugin, plugin_name=plugin_name)
        
        # 現在のタスク状況を文脈に追加
        task_context = ""
        if req.tasks:
            todo_tasks = [t for t in req.tasks if t.status == "todo"]
            done_tasks = [t for t in req.tasks if t.status == "done"]
            task_context = f"\n\n【現在のタスク状況】\n未完了: {len(todo_tasks)}件\n完了: {len(done_tasks)}件"
            
            if todo_tasks:
                task_list = "\n".join([f"- ID: {t.id}, タイトル: {t.title}, 優先度: {t.priority}" for t in todo_tasks[:10]])
                task_context += f"\n\n未完了タスク:\n{task_list}"

        # ChatHistoryを作成
        chat_history = ChatHistory()
        chat_history.add_system_message(SYSTEM_PROMPT + task_context)
        
        # 過去の会話履歴を追加（最新5件まで - トークン節約）
        for msg in req.history[-5:]:
            if msg.role == "user":
                chat_history.add_user_message(msg.content)
            elif msg.role == "assistant":
                chat_history.add_assistant_message(msg.content)
        
        # 現在のユーザーメッセージを追加
        chat_history.add_user_message(req.message)

        print(f"🟢 AIにリクエスト送信中... (履歴: {len(req.history[-5:])}件)")
        print(f"📜 会話履歴: {[f'{m.role}: {m.content[:30]}...' for m in req.history[-3:]]}")
        
        # 実行設定（関数呼び出しを自動で有効化）
        execution_settings = OpenAIChatPromptExecutionSettings(
            service_id=service_id,
            max_tokens=2000,
            temperature=0.7,
        )
        # 自動関数呼び出しを有効化
        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto(
            filters={"included_plugins": ["TaskManagement"]}
        )
        
        # チャット完了を実行
        chat_service = kernel.get_service(service_id)
        response = await chat_service.get_chat_message_contents(
            chat_history=chat_history,
            settings=execution_settings,
            kernel=kernel,
        )
        
        # レスポンステキストを取得
        response_text = str(response[0].content) if response else "応答がありませんでした。"
        
        print(f"🟢 AIからレスポンス受信: {response_text[:100]}...")
        
        # プラグインからアクションを取得
        actions = task_plugin.get_actions()
        print(f"📝 アクション: create={len(actions['create'])}, delete={len(actions['delete'])}, complete={len(actions['complete'])}, uncomplete={len(actions['uncomplete'])}")
        
        # アクションがある場合は構造化されたJSONとして追加
        has_actions = any([actions["create"], actions["delete"], actions["complete"], actions["uncomplete"]])
        
        if has_actions:
            actions_json = {
                "__task_actions__": {
                    "create": actions["create"],
                    "delete": actions["delete"],
                    "complete": actions["complete"],
                    "uncomplete": actions["uncomplete"]
                }
            }
            response_text += f"\n\n{json.dumps(actions_json)}"
        
        # プラグインをクリーンアップ
        task_plugin.clear_actions()
        print("=" * 50)

        return ChatResponse(response=response_text)

    except Exception as e:
        # 詳細なエラー情報をログに出力
        print("🔴 エラーが発生しました!")
        print(f"エラー詳細: {str(e)}")
        print(f"エラータイプ: {type(e).__name__}")
        print(f"トレースバック:\n{traceback.format_exc()}")
        print("=" * 50)
        raise HTTPException(status_code=500, detail=f"AI処理エラー: {str(e)}")

@app.get("/health")
async def health():
    # DB接続確認
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "db_status": db_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)