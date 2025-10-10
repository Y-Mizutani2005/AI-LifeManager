"""
マイルストーン管理API

マイルストーンのCRUD操作を提供するAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db, MilestoneModel
from app.models.schemas import Milestone, MilestoneCreate, MilestoneUpdate
from datetime import datetime
import uuid


router = APIRouter()


@router.get("/api/milestones", response_model=List[Milestone])
def get_milestones(project_id: str = None, db: Session = Depends(get_db)):
    """
    マイルストーンを取得
    
    Args:
        project_id: プロジェクトID(オプション、指定すると該当プロジェクトのみ)
        
    Returns:
        List[Milestone]: マイルストーンのリスト
    """
    query = db.query(MilestoneModel)
    
    if project_id:
        query = query.filter(MilestoneModel.project_id == project_id)
    
    milestones = query.order_by(MilestoneModel.order_num).all()
    return [model_to_schema(m) for m in milestones]


@router.get("/api/milestones/{milestone_id}", response_model=Milestone)
def get_milestone(milestone_id: str, db: Session = Depends(get_db)):
    """
    特定のマイルストーンを取得
    
    Args:
        milestone_id: マイルストーンID
        
    Returns:
        Milestone: マイルストーン情報
        
    Raises:
        HTTPException: マイルストーンが見つからない場合
    """
    milestone = db.query(MilestoneModel).filter(MilestoneModel.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return model_to_schema(milestone)


@router.post("/api/milestones", response_model=Milestone)
def create_milestone(milestone: MilestoneCreate, db: Session = Depends(get_db)):
    """
    新規マイルストーンを作成
    
    Args:
        milestone: マイルストーン作成情報
        
    Returns:
        Milestone: 作成されたマイルストーン
    """
    now = datetime.now().isoformat()
    
    new_milestone = MilestoneModel(
        id=str(uuid.uuid4()),
        project_id=milestone.projectId,
        title=milestone.title,
        description=milestone.description,
        order_num=milestone.order,
        due_date=milestone.dueDate,
        status=milestone.status,
        created_at=now,
        updated_at=now
    )
    
    db.add(new_milestone)
    db.commit()
    db.refresh(new_milestone)
    
    return model_to_schema(new_milestone)


@router.put("/api/milestones/{milestone_id}", response_model=Milestone)
def update_milestone(milestone_id: str, updates: MilestoneUpdate, db: Session = Depends(get_db)):
    """
    マイルストーンを更新
    
    Args:
        milestone_id: マイルストーンID
        updates: 更新内容
        
    Returns:
        Milestone: 更新されたマイルストーン
        
    Raises:
        HTTPException: マイルストーンが見つからない場合
    """
    milestone = db.query(MilestoneModel).filter(MilestoneModel.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # 更新処理(Noneでないフィールドのみ)
    if updates.title is not None:
        milestone.title = updates.title
    if updates.description is not None:
        milestone.description = updates.description
    if updates.order is not None:
        milestone.order_num = updates.order
    if updates.dueDate is not None:
        milestone.due_date = updates.dueDate
    if updates.status is not None:
        milestone.status = updates.status
        # 完了状態になった場合、完了日時を記録
        if updates.status == 'done' and not milestone.completed_at:
            milestone.completed_at = datetime.now().isoformat()
    
    milestone.updated_at = datetime.now().isoformat()
    
    db.commit()
    db.refresh(milestone)
    
    return model_to_schema(milestone)


@router.delete("/api/milestones/{milestone_id}")
def delete_milestone(milestone_id: str, db: Session = Depends(get_db)):
    """
    マイルストーンを削除
    
    関連するタスクのmilestone_idはNULLに設定されます
    
    Args:
        milestone_id: マイルストーンID
        
    Returns:
        dict: 削除成功メッセージ
        
    Raises:
        HTTPException: マイルストーンが見つからない場合
    """
    milestone = db.query(MilestoneModel).filter(MilestoneModel.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    db.delete(milestone)
    db.commit()
    
    return {"message": "Milestone deleted successfully"}


def model_to_schema(model: MilestoneModel) -> Milestone:
    """
    ORMモデルをPydanticスキーマに変換
    
    Args:
        model: MilestoneModelインスタンス
        
    Returns:
        Milestone: Pydanticスキーマ
    """
    return Milestone(
        id=model.id,
        projectId=model.project_id,
        title=model.title,
        description=model.description,
        order=model.order_num,
        dueDate=model.due_date,
        status=model.status,
        completedAt=model.completed_at,
        createdAt=model.created_at,
        updatedAt=model.updated_at
    )
