# 質問駆動型プランニング機能 設計案

## 🎯 実現したいフロー

```
1. ユーザー: "Webアプリを作りたい"
   ↓
2. AI: 質問攻め（目的、期限、スキル、時間等）
   ↓
3. プロジェクト作成 + マイルストーン設定
   ↓
4. マイルストーン → タスク → サブタスクへブレイクダウン
   ↓
5. Today's Tasks に自動表示（期限ベース）
```

---

## 📊 必要なデータ構造の拡張

### 現状 vs 必要な構造

#### 【現状】フラットなタスクのみ
```typescript
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'done';
  priority: 'high' | 'medium' | 'low';
}
```

#### 【必要】階層構造 + 時間管理

```typescript
// 1. プロジェクト（最上位の夢・目標）
interface Project {
  id: string;
  title: string;                    // "個人ブログを作る"
  description?: string;             // プロジェクトの詳細
  goal: string;                     // "月間1000PVを達成する"
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: string;               // "2025-10-15"
  targetEndDate?: string;           // "2025-12-31"
  actualEndDate?: string;           // 実際の完了日
  tags: string[];                   // ["個人開発", "Web"]
  color?: string;                   // UI用の色分け
  createdAt: string;
  updatedAt: string;
  
  // AI質問駆動で収集した情報
  context?: {
    motivation: string;             // なぜやりたいか
    constraints: string[];          // 制約（時間、スキル等）
    resources: string[];            // 利用可能なリソース
    weeklyHours: number;            // 週の作業可能時間
  };
}

// 2. マイルストーン（中間目標）
interface Milestone {
  id: string;
  projectId: string;                // 親プロジェクト
  title: string;                    // "MVP完成"
  description?: string;
  order: number;                    // 順序（1, 2, 3...）
  dueDate?: string;                 // "2025-11-15"
  status: 'todo' | 'in_progress' | 'done';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. タスク（実行単位）
interface Task {
  id: string;
  projectId: string;                // 親プロジェクト
  milestoneId?: string;             // 親マイルストーン（任意）
  parentTaskId?: string;            // 親タスク（サブタスク用）
  
  title: string;                    // "ログイン機能の実装"
  description?: string;
  
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  
  // 時間管理
  dueDate?: string;                 // "2025-10-20"
  startDate?: string;               // "2025-10-18"
  estimatedHours?: number;          // 見積もり時間（2.5h等）
  actualHours?: number;             // 実績時間
  
  // 依存関係
  dependencies: string[];           // 依存する他タスクのID
  blockedBy?: string[];             // ブロックされているタスクID
  
  // メタ情報
  tags: string[];
  isToday: boolean;                 // Today's Tasksに表示するか（自動計算）
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// 4. サブタスク（Taskと同じ構造だが親子関係で表現）
// parentTaskId があるTaskがサブタスク
```

---

## 🏗️ データベース設計（LocalStorage → SQLite移行前提）

### テーブル構成

```sql
-- プロジェクトテーブル
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  status TEXT DEFAULT 'planning',
  start_date TEXT,
  target_end_date TEXT,
  actual_end_date TEXT,
  tags TEXT,  -- JSON配列
  color TEXT,
  context TEXT,  -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- マイルストーンテーブル
CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_num INTEGER,
  due_date TEXT,
  status TEXT DEFAULT 'todo',
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- タスクテーブル
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  milestone_id TEXT,
  parent_task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TEXT,
  start_date TEXT,
  estimated_hours REAL,
  actual_hours REAL,
  dependencies TEXT,  -- JSON配列
  blocked_by TEXT,    -- JSON配列
  tags TEXT,          -- JSON配列
  is_today INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### LocalStorageでの暫定実装（MVP段階）

```typescript
// store.ts に追加
interface AppState {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  
  // プロジェクト操作
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // マイルストーン操作
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  
  // タスク操作（既存を拡張）
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // 計算プロパティ
  getTodayTasks: () => Task[];
  getProjectTasks: (projectId: string) => Task[];
  getMilestoneTasks: (milestoneId: string) => Task[];
}
```

---

## 🤖 質問駆動型プランニングのAI設計

### 1. プランニングステート管理

```typescript
// プランニングセッションの状態管理
interface PlanningSession {
  id: string;
  projectId?: string;  // プロジェクトID（作成後に設定）
  stage: 'initial' | 'clarifying' | 'structuring' | 'tasking' | 'completed';
  
  // 収集した情報
  collectedInfo: {
    dreamTitle?: string;          // "Webアプリを作りたい"
    purpose?: string;             // "収益化したい"
    deadline?: string;            // "3ヶ月後"
    weeklyHours?: number;         // 10時間
    skills?: string[];            // ["React", "Python"]
    constraints?: string[];       // ["平日は2時間しか取れない"]
    existingResources?: string[]; // ["デザインは友人に依頼できる"]
  };
  
  // AIが提案した構造
  proposedStructure?: {
    project: Partial<Project>;
    milestones: Partial<Milestone>[];
    tasks: Partial<Task>[];
  };
  
  createdAt: string;
  updatedAt: string;
}
```

### 2. AIプロンプト設計（段階別）

#### Stage 1: Initial（初回ヒアリング）

```python
INITIAL_PROMPT = """
ユーザーが新しいプロジェクトを始めようとしています。
あなたの役割は、質問を通じて夢を具体化することです。

【現在の情報】
- ユーザーの発言: "{user_message}"

【あなたのタスク】
1. ユーザーの「やりたいこと」を理解する
2. 次のステップに進むために必要な情報を1つだけ質問する
3. 質問は具体的で答えやすいものにする

【質問すべき項目（優先順）】
1. 何を作りたいか（明確でなければ）
2. なぜ作りたいか（目的・モチベーション）
3. いつまでに完成させたいか
4. 週にどれくらい時間を使えるか
5. 既に持っているスキル・リソース
6. 制約・懸念事項

【応答フォーマット】
自然な会話形式で質問してください。質問は1つだけ。
ユーザーが圧倒されないよう、フレンドリーに。

例: 「素晴らしいですね！🎉 いつ頃までに完成させたいですか？」
"""
```

#### Stage 2: Clarifying（詳細確認）

```python
CLARIFYING_PROMPT = """
【収集済み情報】
{collected_info}

【あなたのタスク】
まだ不明な情報を1つだけ質問するか、
十分な情報が集まったら次のステップ（プロジェクト構造化）を提案する。

【判断基準】
以下が揃っていれば構造化フェーズへ:
✅ やりたいこと（タイトル）
✅ 目的
✅ 期限 or 週の作業時間

【応答例】
- さらに質問: "週にどれくらいの時間を使えそうですか？"
- 次へ進む: "素晴らしい！十分な情報が集まりました。プロジェクトを具体化していきましょう。"

その後、以下のJSON構造を返す:
{
  "action": "move_to_structuring",
  "reason": "十分な情報が集まった"
}
"""
```

#### Stage 3: Structuring（構造化提案）

```python
STRUCTURING_PROMPT = """
【収集した情報】
{collected_info}

【あなたのタスク】
プロジェクト、マイルストーン、主要タスクを提案してください。

【提案の基準】
1. マイルストーンは3-5個程度（多すぎない）
2. 各マイルストーンは1-2週間で達成可能な粒度
3. 期限から逆算してスケジュールを提案
4. 週の作業時間を考慮して現実的に

【出力フォーマット】
まず自然言語で提案内容を説明し、その後JSON構造を返す:

```json
{
  "action": "propose_structure",
  "structure": {
    "project": {
      "title": "個人ブログの作成",
      "goal": "月間1000PV達成",
      "targetEndDate": "2025-12-31"
    },
    "milestones": [
      {
        "title": "要件定義・設計",
        "order": 1,
        "dueDate": "2025-10-31",
        "description": "機能要件とデザイン案を確定"
      },
      {
        "title": "フロントエンド実装",
        "order": 2,
        "dueDate": "2025-11-30"
      }
    ],
    "tasks": [
      {
        "milestoneId": "milestone-1-id",
        "title": "競合サイト分析",
        "priority": "high",
        "estimatedHours": 3,
        "dueDate": "2025-10-22"
      }
    ]
  }
}
```

【重要】
ユーザーに「この構造で進めますか？調整したい点はありますか？」と確認する。
"""
```

#### Stage 4: Tasking（タスク詳細化）

```python
TASKING_PROMPT = """
ユーザーが承認したプロジェクト構造:
{approved_structure}

【あなたのタスク】
各マイルストーンのタスクを詳細化し、Today's Tasksに表示すべきタスクを提案。

【タスク詳細化の基準】
1. 各タスクは2-4時間で完了できる粒度
2. 依存関係を明示（"Aの完了後にBを開始"）
3. 優先度を適切に設定
4. 今日・今週やるべきタスクを特定

【出力】
```json
{
  "action": "finalize_tasks",
  "tasks": [
    {
      "title": "技術スタック調査",
      "milestoneId": "m1",
      "priority": "high",
      "estimatedHours": 2,
      "dueDate": "2025-10-20",
      "isToday": true,
      "dependencies": []
    }
  ],
  "todayRecommendation": "今日は「技術スタック調査」から始めるのがおすすめです！"
}
```
"""
```

---

## 🎨 UI/UX の変更点

### 新しい画面構成

```
┌────────────────────────────────────────────────┐
│ Project Companion              [+ 新規プロジェクト] │
├─────────┬──────────────────────────────────────┤
│         │  💬 AI Planning Chat                 │
│ 📂 Projects │  ┌───────────────────────────┐   │
│  ▾ Blog  │  │ AI: 何を作りたいですか？   │   │
│    ✓ M1  │  │ User: Webアプリ           │   │
│    🔄 M2 │  │ AI: 素晴らしい！目的は？   │   │
│    ○ M3  │  └───────────────────────────┘   │
│  ▸ App   │  [メッセージ入力]                 │
│         │                                      │
├─────────┼──────────────────────────────────────┤
│ 📅 Today │  ✓ Done (2)  ☐ Todo (3)  🔥 High (1)│
│         │  ☐ 技術スタック調査 [2h] 🔴        │
│         │  ☐ 競合分析 [3h] 🟡                │
└─────────┴──────────────────────────────────────┘
```

### 新規画面フロー

1. **プロジェクト作成ボタン** → プランニングチャット起動
2. **AI質問駆動** でプロジェクト具体化
3. **構造提案** → ユーザー承認
4. **プロジェクトビュー** にマイルストーン・タスク表示
5. **Today's Tasks** に期限ベースで自動表示

---

## 📦 実装の優先順位

### Phase 1: データ構造拡張（1-2日）
- [ ] Project, Milestone, Task の型定義
- [ ] Zustand store の拡張
- [ ] LocalStorage の保存/読込
- [ ] 既存タスクのマイグレーション処理

### Phase 2: 基本CRUD UI（2-3日）
- [ ] プロジェクト一覧サイドバー
- [ ] プロジェクト作成フォーム（手動）
- [ ] マイルストーン表示・編集
- [ ] タスクへのプロジェクト/マイルストーン紐付け

### Phase 3: 質問駆動型プランニング（3-4日）
- [ ] プランニングセッション管理
- [ ] 段階別AIプロンプト実装
- [ ] 構造提案のUI
- [ ] ユーザー承認フロー
- [ ] プロジェクト自動生成

### Phase 4: Today's Tasks 自動化（1-2日）
- [ ] 期限ベースの自動フィルタリング
- [ ] 優先度ソート
- [ ] "今日やるべき" ロジック実装
  - 期限が今日
  - 期限が近い（3日以内）でhigh priority
  - ブロッカーになっているタスク

### Phase 5: 依存関係・ブロック管理（2-3日）
- [ ] タスク依存関係の設定UI
- [ ] ブロック状態の表示
- [ ] ガントチャート的なビュー（簡易版）

---

## 🔧 実装サンプルコード

### 1. 拡張データ型（store.ts）

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 型定義
interface Project {
  id: string
  title: string
  description?: string
  goal: string
  status: 'planning' | 'active' | 'on_hold' | 'completed'
  startDate?: string
  targetEndDate?: string
  tags: string[]
  color?: string
  createdAt: string
  updatedAt: string
  context?: {
    motivation?: string
    weeklyHours?: number
    constraints?: string[]
  }
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
  estimatedHours?: number
  dependencies: string[]
  tags: string[]
  isToday: boolean
  createdAt: string
  updatedAt: string
  completedAt?: string
}

interface AppState {
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  
  // Milestone actions
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMilestone: (id: string, updates: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  
  // Computed properties
  getTodayTasks: () => Task[]
  getProjectTasks: (projectId: string) => Task[]
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      milestones: [],
      tasks: [],
      
      addProject: (project) => set((state) => ({
        projects: [
          ...state.projects,
          {
            ...project,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        milestones: state.milestones.filter(m => m.projectId !== id),
        tasks: state.tasks.filter(t => t.projectId !== id),
      })),
      
      addMilestone: (milestone) => set((state) => ({
        milestones: [
          ...state.milestones,
          {
            ...milestone,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      })),
      
      updateMilestone: (id, updates) => set((state) => ({
        milestones: state.milestones.map(m => 
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        )
      })),
      
      deleteMilestone: (id) => set((state) => ({
        milestones: state.milestones.filter(m => m.id !== id),
        tasks: state.tasks.filter(t => t.milestoneId !== id),
      })),
      
      addTask: (task) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            ...task,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id && t.parentTaskId !== id),
      })),
      
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id) {
            const newStatus = t.status === 'done' ? 'todo' : 'done'
            return {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
          }
          return t
        })
      })),
      
      // Today's Tasks: 期限が今日 or 3日以内でhigh priority
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
          
          // 期限が今日
          if (dueDate.getTime() === today.getTime()) return true
          
          // 期限が過ぎている
          if (dueDate < today) return true
          
          // 3日以内 & high priority
          if (dueDate <= threeDaysLater && t.priority === 'high') return true
          
          return false
        }).sort((a, b) => {
          // 優先度でソート
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
      },
      
      getProjectTasks: (projectId) => {
        return get().tasks.filter(t => t.projectId === projectId)
      },
    }),
    {
      name: 'project-companion-storage',
    }
  )
)
```

### 2. プランニングチャットのAIプロンプト（backend/main.py）

```python
# プランニング段階に応じたプロンプト
PLANNING_PROMPTS = {
    "initial": """
あなたはプロジェクト企画の専門家です。
ユーザーの「やりたいこと」を質問を通じて具体化してください。

【現在の情報】
ユーザーの発言: {user_message}

【あなたのタスク】
1つだけ質問をして、次の情報を収集してください：
- 何を作りたいか（明確でなければ）
- なぜ作りたいか
- いつまでに完成させたいか
- 週にどれくらい時間を使えるか

質問は1つだけ。フレンドリーに。
""",
    
    "clarifying": """
【収集済み情報】
{collected_info}

まだ不明な情報があれば1つ質問するか、
十分な情報が集まったら以下のJSON形式で次のステップを提案してください：

```json
{{
  "action": "move_to_structuring",
  "message": "素晴らしい！プロジェクトを具体化していきましょう。"
}}
```
""",
    
    "structuring": """
【収集した情報】
{collected_info}

プロジェクト構造を提案してください。

【出力フォーマット】
まず自然言語で説明し、その後JSON構造を返してください：

```json
{{
  "action": "propose_structure",
  "structure": {{
    "project": {{
      "title": "...",
      "goal": "...",
      "targetEndDate": "YYYY-MM-DD"
    }},
    "milestones": [
      {{
        "title": "...",
        "order": 1,
        "dueDate": "YYYY-MM-DD"
      }}
    ],
    "tasks": [
      {{
        "milestoneId": "...",
        "title": "...",
        "priority": "high",
        "estimatedHours": 3
      }}
    ]
  }}
}}
```

マイルストーンは3-5個、現実的なスケジュールで。
最後に「この構造で進めますか？」と確認してください。
"""
}
```

---

## ✅ まとめ：次にやるべきこと

### 最優先（今週）
1. **データ構造を拡張** → Project, Milestone の追加
2. **手動でプロジェクト作成できるUI** → まずは基本操作を確認
3. **タスクをプロジェクトに紐付け** → 既存タスクの移行

### 次週以降
4. **プランニングチャット実装** → AI質問駆動
5. **Today's Tasks自動化** → 期限ベースフィルタ
6. **依存関係管理** → ブロッカー表示

**段階的に進めれば、2週間でプランニング機能が完成します！**

どこから始めますか？まず「拡張データ構造のコード」が必要なら、完全版を作成できます！