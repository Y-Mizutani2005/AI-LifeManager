/**
 * Zustand ストア - LocalStorage版
 * 
 * プロジェクト・マイルストーン・タスクの状態管理
 * 将来的にAPI連携に切り替える際も、このインターフェースは維持
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  Milestone,
  MilestoneCreate,
  MilestoneUpdate,
  Task,
  TaskCreate,
  TaskUpdate,
} from '../types'

// ========================================
// ユーティリティ関数
// ========================================

/**
 * UUIDv4を生成
 */
const generateId = (): string => {
  return crypto.randomUUID()
}

/**
 * 現在時刻のISO文字列を取得
 */
const now = (): string => {
  return new Date().toISOString()
}

// ========================================
// ストアの型定義
// ========================================

interface AppState {
  // ========================================
  // データ
  // ========================================
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]

  // ========================================
  // プロジェクト操作
  // ========================================
  
  /**
   * 全プロジェクトを取得
   */
  fetchProjects: () => Promise<void>
  
  /**
   * 新規プロジェクトを作成
   * @param project - プロジェクト作成情報
   */
  addProject: (project: ProjectCreate) => Promise<Project>
  
  /**
   * プロジェクトを更新
   * @param id - プロジェクトID
   * @param updates - 更新内容
   */
  updateProject: (id: string, updates: ProjectUpdate) => Promise<void>
  
  /**
   * プロジェクトを削除(カスケード)
   * @param id - プロジェクトID
   */
  deleteProject: (id: string) => Promise<void>

  // ========================================
  // マイルストーン操作
  // ========================================
  
  /**
   * プロジェクトのマイルストーンを取得
   * @param projectId - プロジェクトID
   */
  fetchMilestones: (projectId: string) => Promise<Milestone[]>
  
  /**
   * 新規マイルストーンを作成
   * @param milestone - マイルストーン作成情報
   */
  addMilestone: (milestone: MilestoneCreate) => Promise<Milestone>
  
  /**
   * マイルストーンを更新
   * @param id - マイルストーンID
   * @param updates - 更新内容
   */
  updateMilestone: (id: string, updates: MilestoneUpdate) => Promise<void>
  
  /**
   * マイルストーンを削除
   * @param id - マイルストーンID
   */
  deleteMilestone: (id: string) => Promise<void>

  // ========================================
  // タスク操作
  // ========================================
  
  /**
   * タスクを取得(プロジェクトIDでフィルタ可能)
   * @param projectId - プロジェクトID(オプショナル)
   */
  fetchTasks: (projectId?: string) => Promise<Task[]>
  
  /**
   * 新規タスクを作成
   * @param task - タスク作成情報
   */
  addTask: (task: TaskCreate) => Promise<Task>
  
  /**
   * タスクを更新
   * @param id - タスクID
   * @param updates - 更新内容
   */
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>
  
  /**
   * タスクを削除
   * @param id - タスクID
   */
  deleteTask: (id: string) => Promise<void>
  
  /**
   * タスクの完了/未完了を切り替え
   * @param id - タスクID
   */
  toggleTask: (id: string) => Promise<void>

  // ========================================
  // 計算プロパティ(セレクター)
  // ========================================
  
  /**
   * 今日のタスクを取得
   * 期限が今日または過去、もしくは3日以内かつ高優先度のタスク
   */
  getTodayTasks: () => Task[]
  
  /**
   * 特定プロジェクトのタスクを取得
   * @param projectId - プロジェクトID
   */
  getProjectTasks: (projectId: string) => Task[]
  
  /**
   * 特定マイルストーンのタスクを取得
   * @param milestoneId - マイルストーンID
   */
  getMilestoneTasks: (milestoneId: string) => Task[]
  
  /**
   * プロジェクトの進捗率を計算
   * @param projectId - プロジェクトID
   */
  getProjectProgress: (projectId: string) => number
}

// ========================================
// ストア実装
// ========================================

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ========================================
      // 初期状態
      // ========================================
      projects: [],
      milestones: [],
      tasks: [],

      // ========================================
      // プロジェクト操作
      // ========================================

      fetchProjects: async () => {
        // LocalStorageから読み込み(persistミドルウェアが自動処理)
        // 将来的にはAPI呼び出しに置き換え
        return Promise.resolve()
      },

      addProject: async (project) => {
        const newProject: Project = {
          ...project,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        }
        
        set((state) => ({
          projects: [...state.projects, newProject],
        }))
        
        return newProject
      },

      updateProject: async (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: now() }
              : p
          ),
        }))
      },

      deleteProject: async (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          // カスケード削除: 関連するマイルストーンとタスクも削除
          milestones: state.milestones.filter((m) => m.projectId !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
        }))
      },

      // ========================================
      // マイルストーン操作
      // ========================================

      fetchMilestones: async (projectId) => {
        const milestones = get().milestones.filter(
          (m) => m.projectId === projectId
        )
        return Promise.resolve(milestones)
      },

      addMilestone: async (milestone) => {
        const newMilestone: Milestone = {
          ...milestone,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        }
        
        set((state) => ({
          milestones: [...state.milestones, newMilestone],
        }))
        
        return newMilestone
      },

      updateMilestone: async (id, updates) => {
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id
              ? { ...m, ...updates, updatedAt: now() }
              : m
          ),
        }))
      },

      deleteMilestone: async (id) => {
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
          // マイルストーンに紐づくタスクのmilestoneIdをクリア
          tasks: state.tasks.map((t) =>
            t.milestoneId === id
              ? { ...t, milestoneId: undefined }
              : t
          ),
        }))
      },

      // ========================================
      // タスク操作
      // ========================================

      fetchTasks: async (projectId) => {
        const tasks = projectId
          ? get().tasks.filter((t) => t.projectId === projectId)
          : get().tasks
        return Promise.resolve(tasks)
      },

      addTask: async (task) => {
        console.log('📦 [Store] addTask 呼ばれました:', task)
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        }
        
        console.log('📦 [Store] 新しいタスク:', newTask)
        
        set((state) => {
          const newTasks = [...state.tasks, newTask]
          console.log('📦 [Store] タスクを追加:', {
            before: state.tasks.length,
            after: newTasks.length,
            newTask: newTask
          })
          return {
            tasks: newTasks,
          }
        })
        
        // setの後に現在の状態を確認
        const currentState = get()
        console.log('📦 [Store] 現在のタスク数:', currentState.tasks.length)
        console.log('📦 [Store] 現在のタスク一覧:', currentState.tasks)
        
        return newTask
      },

      updateTask: async (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: now() }
              : t
          ),
        }))
      },

      deleteTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
      },

      toggleTask: async (id) => {
        console.log('📦 [Store] toggleTask 呼ばれました:', id)
        set((state) => {
          const updatedTasks = state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: (t.status === 'done' ? 'todo' : 'done') as Task['status'],
                  completedAt: t.status === 'done' ? undefined : now(),
                  updatedAt: now(),
                }
              : t
          )
          console.log('📦 [Store] タスク切替完了:', {
            taskId: id,
            tasksCount: updatedTasks.length
          })
          return {
            tasks: updatedTasks,
          }
        })
      },

      // ========================================
      // 計算プロパティ(セレクター)
      // ========================================

      getTodayTasks: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const threeDaysLater = new Date(today)
        threeDaysLater.setDate(threeDaysLater.getDate() + 3)

        return get()
          .tasks.filter((t) => {
            // isTodayフラグが立っているタスクは完了状態に関わらず表示
            if (t.isToday) return true
            
            // 完了タスクは除外(isTodayフラグがない場合のみ)
            if (t.status === 'done') return false
            
            // 期限がないタスクは表示しない
            if (!t.dueDate) return false

            const dueDate = new Date(t.dueDate)
            dueDate.setHours(0, 0, 0, 0)

            // 期限が今日または過去
            if (dueDate <= today) return true

            // 3日以内かつ高優先度
            if (dueDate <= threeDaysLater && t.priority === 'high') return true

            return false
          })
          .sort((a, b) => {
            // 優先度でソート
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
            
            if (priorityDiff !== 0) return priorityDiff
            
            // 優先度が同じなら期限でソート
            if (!a.dueDate) return 1
            if (!b.dueDate) return -1
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          })
      },

      getProjectTasks: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId)
      },

      getMilestoneTasks: (milestoneId) => {
        return get().tasks.filter((t) => t.milestoneId === milestoneId)
      },

      getProjectProgress: (projectId) => {
        const projectTasks = get().tasks.filter((t) => t.projectId === projectId)
        if (projectTasks.length === 0) return 0
        
        const completedTasks = projectTasks.filter((t) => t.status === 'done')
        return Math.round((completedTasks.length / projectTasks.length) * 100)
      },
    }),
    {
      name: 'project-companion-storage', // LocalStorageのキー名
      storage: createJSONStorage(() => localStorage),
    }
  )
)
