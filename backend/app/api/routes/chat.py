"""
チャットエンドポイント

AIアシスタントとのチャット機能を提供するAPIエンドポイント
"""

from fastapi import APIRouter, HTTPException
from semantic_kernel.contents import ChatHistory
from semantic_kernel.connectors.ai.open_ai.prompt_execution_settings.open_ai_prompt_execution_settings import (
    OpenAIChatPromptExecutionSettings,
)
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
import json
import traceback

from app.models.schemas import ChatRequest, ChatResponse
from app.core.ai import get_kernel
from app.core.config import settings
from app.plugins.task_management import TaskManagementPlugin
from app.prompts.system_prompts import TASK_ASSISTANT_PROMPT, get_task_context_prompt


router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    AIアシスタントとチャットする
    
    Args:
        req: チャットリクエスト（メッセージ、タスク、履歴を含む）
    
    Returns:
        ChatResponse: AIアシスタントからの応答
        
    Raises:
        HTTPException: AI処理エラーが発生した場合
    """
    print("=" * 50)
    print("🔵 チャットリクエストを受信しました")
    print(f"メッセージ: {req.message}")
    print(f"タスク数: {len(req.tasks)}")
    print("=" * 50)
    
    try:
        # Kernelを取得
        kernel = get_kernel()
        
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
            
            # タスクリストを生成（最大10件まで）
            task_list = ""
            if todo_tasks:
                task_list = "\n".join([
                    f"- ID: {t.id}, タイトル: {t.title}, 優先度: {t.priority}" 
                    for t in todo_tasks[:10]
                ])
            
            task_context = get_task_context_prompt(
                todo_count=len(todo_tasks),
                done_count=len(done_tasks),
                task_list=task_list
            )

        # ChatHistoryを作成
        chat_history = ChatHistory()
        chat_history.add_system_message(TASK_ASSISTANT_PROMPT + task_context)
        
        # 過去の会話履歴を追加（設定で指定された件数まで）
        for msg in req.history[-settings.chat_history_limit:]:
            if msg.role == "user":
                chat_history.add_user_message(msg.content)
            elif msg.role == "assistant":
                chat_history.add_assistant_message(msg.content)
        
        # 現在のユーザーメッセージを追加
        chat_history.add_user_message(req.message)

        print(f"🟢 AIにリクエスト送信中... (履歴: {len(req.history[-settings.chat_history_limit:])}件)")
        print(f"📜 会話履歴: {[f'{m.role}: {m.content[:30]}...' for m in req.history[-3:]]}")
        
        # 実行設定（関数呼び出しを自動で有効化）
        execution_settings = OpenAIChatPromptExecutionSettings(
            service_id="chat",
            max_tokens=settings.ai_max_tokens,
            temperature=settings.ai_temperature,
        )
        # 自動関数呼び出しを有効化
        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto(
            filters={"included_plugins": ["TaskManagement"]}
        )
        
        # チャット完了を実行
        chat_service = kernel.get_service("chat")
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
        print(f"📝 アクション: create={len(actions['create'])}, delete={len(actions['delete'])}, "
              f"complete={len(actions['complete'])}, uncomplete={len(actions['uncomplete'])}")
        
        # アクションがある場合は構造化されたJSONとして追加
        has_actions = any([
            actions["create"],
            actions["delete"],
            actions["complete"],
            actions["uncomplete"]
        ])
        
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
