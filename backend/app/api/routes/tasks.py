"""
タスク管理API

タスクのCRUD操作を提供するAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db, TaskModel
from app.models.schemas import Task, TaskCreate, TaskUpdate
from datetime import datetime
import uuid
import json


router = APIRouter()


@router.get("/api/tasks", response_model=List[Task])
def get_tasks(
    project_id: Optional[str] = None,
    milestone_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    タスクを取得
    
    Args:
        project_id: プロジェクトID(オプション)
        milestone_id: マイルストーンID(オプション)
        status: ステータスフィルター(オプション)
        
    Returns:
        List[Task]: タスクのリスト
    """
    query = db.query(TaskModel)
    
    if project_id:
        query = query.filter(TaskModel.project_id == project_id)
    if milestone_id:
        query = query.filter(TaskModel.milestone_id == milestone_id)
    if status:
        query = query.filter(TaskModel.status == status)
    
    tasks = query.all()
    return [model_to_schema(t) for t in tasks]


@router.get("/api/tasks/{task_id}", response_model=Task)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """
    特定のタスクを取得
    
    Args:
        task_id: タスクID
        
    Returns:
        Task: タスク情報
        
    Raises:
        HTTPException: タスクが見つからない場合
    """
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return model_to_schema(task)


@router.post("/api/tasks", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """
    新規タスクを作成
    
    Args:
        task: タスク作成情報
        
    Returns:
        Task: 作成されたタスク
    """
    now = datetime.now().isoformat()
    
    new_task = TaskModel(
        id=str(uuid.uuid4()),
        project_id=task.projectId,
        milestone_id=task.milestoneId,
        parent_task_id=task.parentTaskId,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.dueDate,
        start_date=task.startDate,
        estimated_hours=task.estimatedHours,
        actual_hours=task.actualHours,
        dependencies=json.dumps(task.dependencies),
        blocked_by=json.dumps(task.blockedBy),
        tags=json.dumps(task.tags),
        is_today=task.isToday,
        created_at=now,
        updated_at=now
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return model_to_schema(new_task)


@router.put("/api/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, updates: TaskUpdate, db: Session = Depends(get_db)):
    """
    タスクを更新
    
    Args:
        task_id: タスクID
        updates: 更新内容
        
    Returns:
        Task: 更新されたタスク
        
    Raises:
        HTTPException: タスクが見つからない場合
    """
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # 更新処理(Noneでないフィールドのみ)
    if updates.title is not None:
        task.title = updates.title
    if updates.description is not None:
        task.description = updates.description
    if updates.status is not None:
        task.status = updates.status
        # 完了状態になった場合、完了日時を記録
        if updates.status == 'done' and not task.completed_at:
            task.completed_at = datetime.now().isoformat()
        # 未完了に戻した場合、完了日時をクリア
        elif updates.status != 'done' and task.completed_at:
            task.completed_at = None
    if updates.priority is not None:
        task.priority = updates.priority
    if updates.dueDate is not None:
        task.due_date = updates.dueDate
    if updates.estimatedHours is not None:
        task.estimated_hours = updates.estimatedHours
    if updates.dependencies is not None:
        task.dependencies = json.dumps(updates.dependencies)
    if updates.tags is not None:
        task.tags = json.dumps(updates.tags)
    if updates.isToday is not None:
        task.is_today = updates.isToday
    
    task.updated_at = datetime.now().isoformat()
    
    db.commit()
    db.refresh(task)
    
    return model_to_schema(task)


@router.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """
    タスクを削除
    
    Args:
        task_id: タスクID
        
    Returns:
        dict: 削除成功メッセージ
        
    Raises:
        HTTPException: タスクが見つからない場合
    """
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"message": "Task deleted successfully"}


def model_to_schema(model: TaskModel) -> Task:
    """
    ORMモデルをPydanticスキーマに変換
    
    Args:
        model: TaskModelインスタンス
        
    Returns:
        Task: Pydanticスキーマ
    """
    return Task(
        id=model.id,
        projectId=model.project_id,
        milestoneId=model.milestone_id,
        parentTaskId=model.parent_task_id,
        title=model.title,
        description=model.description,
        status=model.status,
        priority=model.priority,
        dueDate=model.due_date,
        startDate=model.start_date,
        estimatedHours=model.estimated_hours,
        actualHours=model.actual_hours,
        dependencies=json.loads(model.dependencies) if model.dependencies else [],
        blockedBy=json.loads(model.blocked_by) if model.blocked_by else [],
        tags=json.loads(model.tags) if model.tags else [],
        isToday=model.is_today,
        createdAt=model.created_at,
        updatedAt=model.updated_at,
        completedAt=model.completed_at
    )
