# 質問駆動型プランニング機能 実装計画書

## 🎯 目標
質問駆動型プランニング機能を実装し、以下のフローを実現する:
1. AIと対話的に「やりたいこと」を具体化
2. プロジェクト → マイルストーン → タスクの階層構造を構築
3. 期日ベースでToday's Tasksに自動ブレイクダウン

---

## 📊 現状の整理

### ✅ 実装済み機能
- タスクの一覧表示
- タスクの作成・削除・完了/未完了切り替え
- タスクの優先度設定
- AIチャット機能
- AIチャットからのタスク操作

### 🔧 現在のデータ構造
- **フラットなTaskのみ**
  - id, title, status, priority
  - プロジェクトやマイルストーンの概念なし
  - 期日、見積もり時間なし
  - 依存関係なし

---

## 🏗️ Phase 1: データ構造の拡張 (1-2日) 🚀

**目的**: プロジェクト・マイルストーン・タスクの階層構造を導入

### 1.1 バックエンド - データモデル定義

#### ✏️ `backend/app/models/schemas.py` 拡張

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ========================================
# Project関連
# ========================================

class ProjectContext(BaseModel):
    """プロジェクトのコンテキスト情報"""
    motivation: Optional[str] = None
    weeklyHours: Optional[float] = None
    constraints: List[str] = []
    resources: List[str] = []

class ProjectBase(BaseModel):
    """プロジェクトの基本情報"""
    title: str
    description: Optional[str] = None
    goal: str
    status: str = 'planning'  # planning, active, on_hold, completed, archived
    startDate: Optional[str] = None
    targetEndDate: Optional[str] = None
    tags: List[str] = []
    color: Optional[str] = None
    context: Optional[ProjectContext] = None

class ProjectCreate(ProjectBase):
    """プロジェクト作成リクエスト"""
    pass

class ProjectUpdate(BaseModel):
    """プロジェクト更新リクエスト"""
    title: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    targetEndDate: Optional[str] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None
    context: Optional[ProjectContext] = None

class Project(ProjectBase):
    """プロジェクトレスポンス"""
    id: str
    createdAt: str
    updatedAt: str
    actualEndDate: Optional[str] = None

# ========================================
# Milestone関連
# ========================================

class MilestoneBase(BaseModel):
    """マイルストーンの基本情報"""
    projectId: str
    title: str
    description: Optional[str] = None
    order: int
    dueDate: Optional[str] = None
    status: str = 'todo'  # todo, in_progress, done

class MilestoneCreate(MilestoneBase):
    """マイルストーン作成リクエスト"""
    pass

class MilestoneUpdate(BaseModel):
    """マイルストーン更新リクエスト"""
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    dueDate: Optional[str] = None
    status: Optional[str] = None

class Milestone(MilestoneBase):
    """マイルストーンレスポンス"""
    id: str
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None

# ========================================
# Task関連(既存を拡張)
# ========================================

class TaskBase(BaseModel):
    """タスクの基本情報"""
    projectId: str
    milestoneId: Optional[str] = None
    parentTaskId: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = 'todo'  # todo, in_progress, done, blocked
    priority: str = 'medium'  # high, medium, low
    dueDate: Optional[str] = None
    startDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    dependencies: List[str] = []
    blockedBy: List[str] = []
    tags: List[str] = []
    isToday: bool = False

class TaskCreate(TaskBase):
    """タスク作成リクエスト"""
    pass

class TaskUpdate(BaseModel):
    """タスク更新リクエスト"""
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
    """タスクレスポンス"""
    id: str
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None

# ========================================
# Planning Session関連
# ========================================

class PlanningSessionInfo(BaseModel):
    """プランニングセッションで収集した情報"""
    dreamTitle: Optional[str] = None
    purpose: Optional[str] = None
    deadline: Optional[str] = None
    weeklyHours: Optional[float] = None
    skills: List[str] = []
    constraints: List[str] = []
    existingResources: List[str] = []

class ProposedStructure(BaseModel):
    """AIが提案したプロジェクト構造"""
    project: ProjectCreate
    milestones: List[MilestoneCreate]
    tasks: List[TaskCreate]

class PlanningSession(BaseModel):
    """プランニングセッション"""
    id: str
    projectId: Optional[str] = None
    stage: str  # initial, clarifying, structuring, tasking, completed
    collectedInfo: PlanningSessionInfo
    proposedStructure: Optional[ProposedStructure] = None
    createdAt: str
    updatedAt: str

class PlanningChatRequest(BaseModel):
    """プランニングチャットリクエスト"""
    sessionId: Optional[str] = None
    message: str
    history: List[ChatMessage] = []

class PlanningChatResponse(BaseModel):
    """プランニングチャットレスポンス"""
    sessionId: str
    response: str
    stage: str
    action: Optional[str] = None  # move_to_structuring, propose_structure, finalize
    proposedStructure: Optional[ProposedStructure] = None
```

#### 📝 実装タスク
- [ ] `schemas.py`に上記モデルを追加
- [ ] 既存のTask型を拡張版に置き換え
- [ ] インポート文の整理

---

### 1.2 バックエンド - データベーススキーマ

#### ✏️ `backend/app/core/database.py` 拡張 (SQLite使用)

```python
"""
データベース接続とテーブル定義
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from app.core.config import settings
import json

Base = declarative_base()

# ========================================
# プロジェクトテーブル
# ========================================

class ProjectModel(Base):
    """プロジェクトテーブル"""
    __tablename__ = 'projects'
    
    id = Column(String, primary_key=True)
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

# ========================================
# マイルストーンテーブル
# ========================================

class MilestoneModel(Base):
    """マイルストーンテーブル"""
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

# ========================================
# タスクテーブル
# ========================================

class TaskModel(Base):
    """タスクテーブル"""
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

# ========================================
# プランニングセッションテーブル
# ========================================

class PlanningSessionModel(Base):
    """プランニングセッションテーブル"""
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

# SQLiteエンジンの作成
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # SQLite用
)

# テーブル作成
Base.metadata.create_all(bind=engine)

# セッションファクトリー
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """データベースセッションを取得"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 📝 実装タスク
- [ ] テーブル定義を追加
- [ ] マイグレーション処理(既存タスクをデフォルトプロジェクトに移行)
- [ ] データベース初期化スクリプト作成

---

### 1.3 バックエンド - APIエンドポイント

#### ✏️ 新規ルートファイル作成

**`backend/app/api/routes/projects.py`**

```python
"""
プロジェクト管理API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db, ProjectModel
from app.models.schemas import Project, ProjectCreate, ProjectUpdate
from datetime import datetime
import uuid
import json

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[Project])
def get_projects(db: Session = Depends(get_db)):
    """全プロジェクトを取得"""
    projects = db.query(ProjectModel).all()
    return [model_to_schema(p) for p in projects]

@router.post("/", response_model=Project)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """新規プロジェクトを作成"""
    now = datetime.now().isoformat()
    new_project = ProjectModel(
        id=str(uuid.uuid4()),
        title=project.title,
        description=project.description,
        goal=project.goal,
        status=project.status,
        start_date=project.startDate,
        target_end_date=project.targetEndDate,
        tags=json.dumps(project.tags),
        color=project.color,
        context=json.dumps(project.context.dict()) if project.context else None,
        created_at=now,
        updated_at=now
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return model_to_schema(new_project)

@router.put("/{project_id}", response_model=Project)
def update_project(project_id: str, updates: ProjectUpdate, db: Session = Depends(get_db)):
    """プロジェクトを更新"""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 更新処理
    if updates.title is not None:
        project.title = updates.title
    if updates.description is not None:
        project.description = updates.description
    # ... 他のフィールドも同様
    
    project.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(project)
    return model_to_schema(project)

@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """プロジェクトを削除(カスケード)"""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

def model_to_schema(model: ProjectModel) -> Project:
    """ORMモデルをPydanticスキーマに変換"""
    return Project(
        id=model.id,
        title=model.title,
        description=model.description,
        goal=model.goal,
        status=model.status,
        startDate=model.start_date,
        targetEndDate=model.target_end_date,
        actualEndDate=model.actual_end_date,
        tags=json.loads(model.tags) if model.tags else [],
        color=model.color,
        context=json.loads(model.context) if model.context else None,
        createdAt=model.created_at,
        updatedAt=model.updated_at
    )
```

**`backend/app/api/routes/milestones.py`** - 同様に実装

**`backend/app/api/routes/planning.py`** - プランニングチャット用(Phase 3で実装)

#### 📝 実装タスク
- [ ] `projects.py` 作成
- [ ] `milestones.py` 作成
- [ ] 既存`tasks.py`を拡張(projectId, milestoneId対応)
- [ ] `app/main.py`にルート登録

---

### 1.4 フロントエンド - Zustandストア拡張

#### ✏️ `frontend/src/store/store.ts` (新規作成または拡張)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ========================================
// 型定義
// ========================================

interface ProjectContext {
  motivation?: string
  weeklyHours?: number
  constraints?: string[]
  resources?: string[]
}

interface Project {
  id: string
  title: string
  description?: string
  goal: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  startDate?: string
  targetEndDate?: string
  actualEndDate?: string
  tags: string[]
  color?: string
  context?: ProjectContext
  createdAt: string
  updatedAt: string
}

interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  order: number
  dueDate?: string
  status: 'todo' | 'in_progress' | 'done'
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface Task {
  id: string
  projectId: string
  milestoneId?: string
  parentTaskId?: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  startDate?: string
  estimatedHours?: number
  actualHours?: number
  dependencies: string[]
  blockedBy: string[]
  tags: string[]
  isToday: boolean
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// ========================================
// ストア定義
// ========================================

interface AppState {
  // データ
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
  
  // プロジェクト操作
  fetchProjects: () => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  
  // マイルストーン操作
  fetchMilestones: (projectId: string) => Promise<void>
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>
  deleteMilestone: (id: string) => Promise<void>
  
  // タスク操作
  fetchTasks: (projectId?: string) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  
  // 計算プロパティ
  getTodayTasks: () => Task[]
  getProjectTasks: (projectId: string) => Task[]
  getMilestoneTasks: (milestoneId: string) => Task[]
}

const API_BASE = 'http://localhost:8000'

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      milestones: [],
      tasks: [],
      
      // ========================================
      // プロジェクト操作
      // ========================================
      
      fetchProjects: async () => {
        const res = await fetch(`${API_BASE}/projects`)
        const projects = await res.json()
        set({ projects })
      },
      
      addProject: async (project) => {
        const res = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project)
        })
        const newProject = await res.json()
        set((state) => ({ projects: [...state.projects, newProject] }))
      },
      
      updateProject: async (id, updates) => {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        const updatedProject = await res.json()
        set((state) => ({
          projects: state.projects.map(p => p.id === id ? updatedProject : p)
        }))
      },
      
      deleteProject: async (id) => {
        await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' })
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          milestones: state.milestones.filter(m => m.projectId !== id),
          tasks: state.tasks.filter(t => t.projectId !== id)
        }))
      },
      
      // ========================================
      // タスク操作(今日のタスク計算含む)
      // ========================================
      
      getTodayTasks: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const threeDaysLater = new Date(today)
        threeDaysLater.setDate(threeDaysLater.getDate() + 3)
        
        return get().tasks.filter(t => {
          if (t.status === 'done') return false
          if (!t.dueDate) return false
          
          const dueDate = new Date(t.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          
          // 期限が今日 or 過去 or 3日以内&high priority
          if (dueDate <= today) return true
          if (dueDate <= threeDaysLater && t.priority === 'high') return true
          
          return false
        }).sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
      },
      
      getProjectTasks: (projectId) => {
        return get().tasks.filter(t => t.projectId === projectId)
      },
      
      getMilestoneTasks: (milestoneId) => {
        return get().tasks.filter(t => t.milestoneId === milestoneId)
      },
      
      // ... その他の実装
    }),
    {
      name: 'project-companion-storage',
    }
  )
)
```

#### 📝 実装タスク
- [ ] `store.ts` 作成
- [ ] 型定義追加
- [ ] API連携関数実装
- [ ] 計算プロパティ実装

---

### 1.5 マイグレーション処理

既存のタスクを「デフォルトプロジェクト」に移行する処理

#### ✏️ `backend/app/core/migration.py` (新規作成)

```python
"""
既存データのマイグレーション
"""

from sqlalchemy.orm import Session
from app.core.database import ProjectModel, TaskModel, get_db
from datetime import datetime
import uuid

def migrate_existing_tasks(db: Session):
    """
    既存のタスクをデフォルトプロジェクトに紐付ける
    """
    # デフォルトプロジェクトが存在するか確認
    default_project = db.query(ProjectModel).filter(
        ProjectModel.title == "既存タスク"
    ).first()
    
    if not default_project:
        # デフォルトプロジェクト作成
        now = datetime.now().isoformat()
        default_project = ProjectModel(
            id=str(uuid.uuid4()),
            title="既存タスク",
            description="以前作成されたタスクをまとめたプロジェクト",
            goal="既存タスクの整理",
            status="active",
            created_at=now,
            updated_at=now,
            tags="[]"
        )
        db.add(default_project)
        db.commit()
    
    # project_idがNullのタスクを更新
    orphan_tasks = db.query(TaskModel).filter(
        TaskModel.project_id == None
    ).all()
    
    for task in orphan_tasks:
        task.project_id = default_project.id
    
    db.commit()
    print(f"✅ {len(orphan_tasks)}件のタスクをデフォルトプロジェクトに移行しました")
```

#### 📝 実装タスク
- [ ] マイグレーションスクリプト作成
- [ ] アプリ起動時に自動実行

---

## 🏗️ Phase 2: 基本UI実装 (2-3日)

**目的**: プロジェクトとマイルストーンを手動で作成・管理できるUIを構築

### 2.1 プロジェクト一覧サイドバー

#### ✏️ `frontend/src/components/ProjectSidebar.tsx` (新規作成)

### 2.2 プロジェクト作成フォーム

#### ✏️ `frontend/src/components/ProjectForm.tsx` (新規作成)

簡単なモーダルフォーム実装

### 2.3 Today's Tasks 表示

#### ✏️ `frontend/src/components/TodayTasks.tsx` (新規作成)

計算プロパティ`getTodayTasks()`を使用してフィルタリング

#### 📝 実装タスク
- [ ] `ProjectSidebar.tsx` 作成
- [ ] `ProjectForm.tsx` 作成
- [ ] `MilestoneView.tsx` 作成
- [ ] `TodayTasks.tsx` 作成
- [ ] 既存`TaskListComponent.tsx`を拡張

---

## 🤖 Phase 3: AIプランニング機能 (3-4日)

**目的**: AI質問駆動でプロジェクトを自動生成

### 3.1 プランニングチャットUI

#### ✏️ `frontend/src/components/PlanningChat.tsx` (新規作成)

専用のチャットコンポーネント

### 3.2 AIプロンプト実装

#### ✏️ `backend/app/api/routes/planning.py` (新規作成)

```python
"""
質問駆動型プランニングAPI
"""

```

#### ✏️ `backend/app/prompts/planning_prompts.py` (新規作成)

Dev.mdに記載のプロンプトを実装

#### 📝 実装タスク
- [ ] `planning.py` API実装
- [ ] `planning_prompts.py` プロンプト定義
- [ ] `PlanningChat.tsx` UI実装
- [ ] JSON抽出ロジック実装
- [ ] プロジェクト自動生成フロー

---

## 📅 Phase 4: Today's Tasks自動化 (1-2日)

**目的**: 期限ベースで自動的にToday's Tasksを計算

### 4.1 自動計算ロジック実装

既にZustandストアに`getTodayTasks()`として実装済み

### 4.2 UI改善

- [ ] Today's Tasksセクションのデザイン改善
- [ ] 期限超過タスクの警告表示
- [ ] 優先度によるソート・フィルター

---

## ✅ チェックリスト

### Phase 1 (1-2日)
- [ ] `schemas.py` 拡張
- [ ] `database.py` テーブル定義
- [ ] `projects.py` API実装
- [ ] `milestones.py` API実装
- [ ] `tasks.py` 拡張
- [ ] Zustandストア実装
- [ ] マイグレーション処理

### Phase 2 (2-3日)
- [ ] `ProjectSidebar.tsx`
- [ ] `ProjectForm.tsx`
- [ ] `MilestoneView.tsx`
- [ ] `TodayTasks.tsx`
- [ ] 既存UI統合

### Phase 3 (3-4日)
- [ ] `planning.py` API
- [ ] `planning_prompts.py`
- [ ] `PlanningChat.tsx`
- [ ] プロジェクト自動生成

### Phase 4 (1-2日)
- [ ] Today's Tasksロジック
- [ ] UI改善

---

## 🚀 次のステップ

**推奨順序**:
1. **今すぐ**: Phase 1のデータ構造拡張から開始
2. **明日**: 基本APIとストア実装
3. **今週末**: Phase 2のUI実装
4. **来週**: Phase 3のAIプランニング

**まずPhase 1の`schemas.py`拡張から始めましょう!**

---

## 💡 Tips
- SQLiteは軽量で導入が簡単です
- LocalStorageとの併用も可能(オフライン対応)
- マイグレーションは慎重に(バックアップ推奨)
- UIはコンポーネント単位で小さく作ると管理しやすいです

頑張ってください!段階的に進めれば2週間で完成できます! 🎉
