"""
プロジェクト管理API

プロジェクトのCRUD操作を提供するAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db, ProjectModel
from app.models.schemas import Project, ProjectCreate, ProjectUpdate
from datetime import datetime
import uuid
import json


router = APIRouter()


@router.get("/api/projects", response_model=List[Project])
def get_projects(user_id: str = "default_user", db: Session = Depends(get_db)):
    """
    全プロジェクトを取得
    
    Args:
        user_id: ユーザーID(デフォルト: "default_user")
    
    Returns:
        List[Project]: プロジェクトのリスト
    """
    projects = db.query(ProjectModel).filter(ProjectModel.user_id == user_id).all()
    return [model_to_schema(p) for p in projects]


@router.get("/api/projects/{project_id}", response_model=Project)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """
    特定のプロジェクトを取得
    
    Args:
        project_id: プロジェクトID
        
    Returns:
        Project: プロジェクト情報
        
    Raises:
        HTTPException: プロジェクトが見つからない場合
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return model_to_schema(project)


@router.post("/api/projects", response_model=Project)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """
    新規プロジェクトを作成
    
    Args:
        project: プロジェクト作成情報
        
    Returns:
        Project: 作成されたプロジェクト
    """
    now = datetime.now().isoformat()
    
    # コンテキストをJSON文字列に変換
    context_json = None
    if project.context:
        context_json = json.dumps({
            "motivation": project.context.motivation,
            "weeklyHours": project.context.weeklyHours,
            "constraints": project.context.constraints,
            "resources": project.context.resources
        })
    
    new_project = ProjectModel(
        id=str(uuid.uuid4()),
        user_id=project.userId,  # リクエストから取得(デフォルトは"default_user")
        title=project.title,
        description=project.description,
        goal=project.goal,
        status=project.status,
        start_date=project.startDate,
        target_end_date=project.targetEndDate,
        tags=json.dumps(project.tags),
        color=project.color,
        context=context_json,
        created_at=now,
        updated_at=now
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return model_to_schema(new_project)


@router.put("/api/projects/{project_id}", response_model=Project)
def update_project(project_id: str, updates: ProjectUpdate, db: Session = Depends(get_db)):
    """
    プロジェクトを更新
    
    Args:
        project_id: プロジェクトID
        updates: 更新内容
        
    Returns:
        Project: 更新されたプロジェクト
        
    Raises:
        HTTPException: プロジェクトが見つからない場合
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 更新処理(Noneでないフィールドのみ)
    if updates.title is not None:
        project.title = updates.title
    if updates.description is not None:
        project.description = updates.description
    if updates.goal is not None:
        project.goal = updates.goal
    if updates.status is not None:
        project.status = updates.status
    if updates.targetEndDate is not None:
        project.target_end_date = updates.targetEndDate
    if updates.tags is not None:
        project.tags = json.dumps(updates.tags)
    if updates.color is not None:
        project.color = updates.color
    if updates.context is not None:
        project.context = json.dumps({
            "motivation": updates.context.motivation,
            "weeklyHours": updates.context.weeklyHours,
            "constraints": updates.context.constraints,
            "resources": updates.context.resources
        })
    
    project.updated_at = datetime.now().isoformat()
    
    db.commit()
    db.refresh(project)
    
    return model_to_schema(project)


@router.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """
    プロジェクトを削除(カスケード削除)
    
    関連するマイルストーンとタスクも自動的に削除されます
    
    Args:
        project_id: プロジェクトID
        
    Returns:
        dict: 削除成功メッセージ
        
    Raises:
        HTTPException: プロジェクトが見つからない場合
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}


def model_to_schema(model: ProjectModel) -> Project:
    """
    ORMモデルをPydanticスキーマに変換
    
    Args:
        model: ProjectModelインスタンス
        
    Returns:
        Project: Pydanticスキーマ
    """
    # コンテキストをパース
    context = None
    if model.context:
        try:
            context_data = json.loads(model.context)
            from app.models.schemas import ProjectContext
            context = ProjectContext(**context_data)
        except (json.JSONDecodeError, TypeError):
            pass
    
    return Project(
        id=model.id,
        userId=model.user_id,
        title=model.title,
        description=model.description,
        goal=model.goal,
        status=model.status,
        startDate=model.start_date,
        targetEndDate=model.target_end_date,
        actualEndDate=model.actual_end_date,
        tags=json.loads(model.tags) if model.tags else [],
        color=model.color,
        context=context,
        createdAt=model.created_at,
        updatedAt=model.updated_at
    )
