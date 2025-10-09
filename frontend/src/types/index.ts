/**
 * アプリケーション全体で使用する型定義
 * 
 * バックエンドのPydanticスキーマと対応する型を定義
 * 将来的なAPI連携を見据えた構造
 */

// ========================================
// Project関連
// ========================================

/**
 * プロジェクトのコンテキスト情報
 */
export interface ProjectContext {
  /** プロジェクトに取り組む動機・目的 */
  motivation?: string
  /** 週あたりの作業可能時間 */
  weeklyHours?: number
  /** 制約事項のリスト */
  constraints?: string[]
  /** 利用可能なリソースのリスト */
  resources?: string[]
}

/**
 * プロジェクト情報
 */
export interface Project {
  /** プロジェクトの一意識別子 */
  id: string
  /** プロジェクトのタイトル */
  title: string
  /** プロジェクトの詳細説明 */
  description?: string
  /** プロジェクトの目標 */
  goal: string
  /** プロジェクトの状態 */
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  /** プロジェクト開始日 */
  startDate?: string
  /** 目標完了日 */
  targetEndDate?: string
  /** 実際の完了日 */
  actualEndDate?: string
  /** タグのリスト */
  tags: string[]
  /** UI表示用のカラーコード */
  color?: string
  /** プロジェクトのコンテキスト情報 */
  context?: ProjectContext
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}

/**
 * プロジェクト作成用の型
 */
export type ProjectCreate = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'actualEndDate'>

/**
 * プロジェクト更新用の型
 */
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>

// ========================================
// Milestone関連
// ========================================

/**
 * マイルストーン情報
 */
export interface Milestone {
  /** マイルストーンの一意識別子 */
  id: string
  /** 所属するプロジェクトのID */
  projectId: string
  /** マイルストーンのタイトル */
  title: string
  /** マイルストーンの詳細説明 */
  description?: string
  /** 表示順序 */
  order: number
  /** 期限 */
  dueDate?: string
  /** マイルストーンの状態 */
  status: 'todo' | 'in_progress' | 'done'
  /** 完了日時 */
  completedAt?: string
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}

/**
 * マイルストーン作成用の型
 */
export type MilestoneCreate = Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>

/**
 * マイルストーン更新用の型
 */
export type MilestoneUpdate = Partial<Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>>

// ========================================
// Task関連
// ========================================

/**
 * タスク情報(拡張版)
 */
export interface Task {
  /** タスクの一意識別子 */
  id: string
  /** 所属するプロジェクトのID */
  projectId: string
  /** 所属するマイルストーンのID(オプショナル) */
  milestoneId?: string
  /** 親タスクのID(サブタスクの場合) */
  parentTaskId?: string
  /** タスクのタイトル */
  title: string
  /** タスクの詳細説明 */
  description?: string
  /** タスクの状態 */
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  /** タスクの優先度 */
  priority: 'high' | 'medium' | 'low'
  /** 期限 */
  dueDate?: string
  /** 開始予定日 */
  startDate?: string
  /** 見積もり時間 */
  estimatedHours?: number
  /** 実際にかかった時間 */
  actualHours?: number
  /** 依存するタスクのIDリスト */
  dependencies: string[]
  /** ブロックしているタスクのIDリスト */
  blockedBy: string[]
  /** タグのリスト */
  tags: string[]
  /** 今日のタスクフラグ */
  isToday: boolean
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
  /** 完了日時 */
  completedAt?: string
}

/**
 * タスク作成用の型
 */
export type TaskCreate = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>

/**
 * タスク更新用の型
 */
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>>

// ========================================
// Planning Session関連
// ========================================

/**
 * プランニングセッションで収集した情報
 */
export interface PlanningSessionInfo {
  /** やりたいことのタイトル */
  dreamTitle?: string
  /** 目的・なぜやりたいのか */
  purpose?: string
  /** 希望する完了期限 */
  deadline?: string
  /** 週あたりの作業可能時間 */
  weeklyHours?: number
  /** 現在持っているスキル */
  skills?: string[]
  /** 制約事項 */
  constraints?: string[]
  /** 既存のリソース */
  existingResources?: string[]
}

/**
 * AIが提案したプロジェクト構造
 */
export interface ProposedStructure {
  /** 提案するプロジェクト */
  project: ProjectCreate
  /** 提案するマイルストーンのリスト */
  milestones: MilestoneCreate[]
  /** 提案するタスクのリスト */
  tasks: TaskCreate[]
}

/**
 * プランニングセッション
 */
export interface PlanningSession {
  /** セッションの一意識別子 */
  id: string
  /** 生成されたプロジェクトのID(確定後) */
  projectId?: string
  /** プランニングの進行段階 */
  stage: 'initial' | 'clarifying' | 'structuring' | 'tasking' | 'completed'
  /** 収集した情報 */
  collectedInfo: PlanningSessionInfo
  /** 提案された構造 */
  proposedStructure?: ProposedStructure
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}

// ========================================
// Chat関連(既存)
// ========================================

/**
 * チャットメッセージ
 */
export interface ChatMessage {
  /** メッセージの送信者 */
  role: 'user' | 'assistant'
  /** メッセージの内容 */
  content: string
}
