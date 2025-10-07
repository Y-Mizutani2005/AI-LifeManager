"""
タスク管理プラグイン

AIがタスクの作成・削除・完了・未完了操作を行うためのSemantic Kernelプラグイン
"""

from semantic_kernel.functions import kernel_function


class TaskManagementPlugin:
    """
    タスク管理用のSemantic Kernelネイティブプラグイン
    
    AIがタスクの作成・削除・完了・未完了を行えるようにする機能を提供します。
    各関数呼び出しの結果は内部リストに蓄積され、後でまとめて取得できます。
    
    Attributes:
        tasks_to_create: 作成するタスクのリスト
        tasks_to_delete: 削除するタスクIDのリスト
        tasks_to_complete: 完了にするタスクIDのリスト
        tasks_to_uncomplete: 未完了に戻すタスクIDのリスト
    """
    
    def __init__(self):
        """プラグインを初期化"""
        self.tasks_to_create: list[dict] = []
        self.tasks_to_delete: list[str] = []
        self.tasks_to_complete: list[str] = []
        self.tasks_to_uncomplete: list[str] = []
    
    @kernel_function(
        name="create_task",
        description="新しいタスクを作成します。ユーザーがタスクを追加したい時に使用します。"
    )
    def create_task(self, title: str, priority: str = "medium") -> str:
        """
        新しいタスクを作成する
        
        Args:
            title: タスクのタイトル（具体的で簡潔に）
            priority: 優先度 ('high', 'medium', 'low')
        
        Returns:
            作成されたタスクの確認メッセージ
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
            削除確認のメッセージ
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
            完了確認のメッセージ
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
            未完了化の確認メッセージ
        """
        self.tasks_to_uncomplete.append(task_id)
        return f"タスクID: {task_id} を未完了状態に戻しました。"
    
    def get_actions(self) -> dict[str, list]:
        """
        実行するアクション（作成・削除・完了・未完了）を取得
        
        Returns:
            各操作のタスク情報を含む辞書
            - create: 作成するタスクのリスト
            - delete: 削除するタスクIDのリスト
            - complete: 完了にするタスクIDのリスト
            - uncomplete: 未完了に戻すタスクIDのリスト
        """
        return {
            "create": self.tasks_to_create.copy(),
            "delete": self.tasks_to_delete.copy(),
            "complete": self.tasks_to_complete.copy(),
            "uncomplete": self.tasks_to_uncomplete.copy()
        }
    
    def clear_actions(self):
        """
        アクションリストをクリア
        
        リクエスト処理後に呼び出して、次のリクエストのために状態をリセットします。
        """
        self.tasks_to_create.clear()
        self.tasks_to_delete.clear()
        self.tasks_to_complete.clear()
        self.tasks_to_uncomplete.clear()
