/**
 * TaskSparkle - メインアプリケーション
 * 
 * タスクに輝きを、未来にスピードを。
 * AI対話で楽しく進められる、次世代タスク管理アプリ
 * 
 * コア機能:
 * ✨ AI対話でタスク作成(差別化ポイント)
 * ✨ AI相談機能(秘書のような体験)
 * ✨ 今日のタスク表示(最小限の価値提供)
 * ✨ Projects/Todayビュー切替
 */
import { useEffect, useState } from 'react'
import ChatComponent from './components/ChatComponent'
import TaskListComponent from './components/TaskListComponent'
import TodayView from './components/TodayView'
import CreateProjectModal from './components/CreateProjectModal'
import { Button } from './components/ui'
import { Sparkles, Settings, Plus, User } from 'lucide-react'
import { useStore } from './store'
import { GRADIENTS } from './constants/theme'
import type { Task, TaskCreate, ProjectCreate, MilestoneCreate } from './types'

/**
 * ビューの種類
 */
type ViewType = 'projects' | 'today'

/**
 * メインアプリケーションコンポーネント
 */
export default function App() {
  // 新しいストアから必要な関数を取得
  const { 
    projects,
    addTask, 
    updateTask,
    deleteTask,
    toggleTask,
    getTodayTasks,
    addProject,
    addMilestone,
  } = useStore()

  const [defaultProjectId, setDefaultProjectId] = useState<string>('')
  const [currentView, setCurrentView] = useState<ViewType>('today')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  /**
   * 初回レンダリング時にデフォルトプロジェクトを確保
   */
  useEffect(() => {
    const initDefaultProject = async () => {
      // 既存のプロジェクトがあればそれを使用
      if (projects.length > 0) {
        setDefaultProjectId(projects[0].id)
        return
      }

      // なければデフォルトプロジェクトを作成
      const defaultProject = await addProject({
        userId: 'default-user',
        title: '個人タスク',
        goal: '日々のタスクを管理する',
        description: 'デフォルトのプロジェクト',
        status: 'active',
        tags: [],
      })
      setDefaultProjectId(defaultProject.id)
    }

    initDefaultProject()
  }, [projects.length, addProject])

  /**
   * 今日のタスクを取得
   */
  const todayTasks: Task[] = getTodayTasks()

  /**
   * タスク追加ハンドラ
   */
  const handleAddTask = async (taskData: Partial<TaskCreate>) => {
    console.log('🎯 handleAddTask 呼ばれました:', taskData)
    console.log('🎯 defaultProjectId:', defaultProjectId)
    
    if (!defaultProjectId) {
      console.error('❌ defaultProjectIdが設定されていません!')
      return
    }

    try {
      const newTask = await addTask({
        projectId: defaultProjectId,
        title: taskData.title || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        dependencies: [],
        blockedBy: [],
        tags: [],
        isToday: true,
      })
      console.log('✅ タスク追加成功:', newTask)
    } catch (error) {
      console.error('❌ タスク追加エラー:', error)
    }
  }

  /**
   * タスクの並び替え（現在は未実装）
   */
  const handleReorderTasks = (newTasks: Task[]) => {
    // TODO: 順序管理機能は将来実装
    console.log('タスクの並び替え:', newTasks)
  }

  /**
   * タスクの優先度を変更
   */
  const handleUpdatePriority = async (taskId: string, priority: 'high' | 'medium' | 'low') => {
    console.log('🎯 handleUpdatePriority 呼ばれました:', taskId, priority)
    try {
      await updateTask(taskId, { priority })
      console.log('✅ 優先度変更成功')
    } catch (error) {
      console.error('❌ 優先度変更エラー:', error)
    }
  }

  /**
   * タスク削除のラッパー
   */
  const handleDeleteTask = async (taskId: string) => {
    console.log('🎯 handleDeleteTask 呼ばれました:', taskId)
    try {
      await deleteTask(taskId)
      console.log('✅ タスク削除成功')
    } catch (error) {
      console.error('❌ タスク削除エラー:', error)
    }
  }

  /**
   * タスク完了切替のラッパー
   */
  const handleToggleTask = async (taskId: string) => {
    console.log('🎯 handleToggleTask 呼ばれました:', taskId)
    try {
      await toggleTask(taskId)
      console.log('✅ タスク切替成功')
    } catch (error) {
      console.error('❌ タスク切替エラー:', error)
    }
  }

  /**
   * プロジェクト作成ハンドラ
   */
  const handleCreateProject = async (
    projectData: Omit<ProjectCreate, 'userId'>,
    milestonesData: Omit<MilestoneCreate, 'projectId'>[],
    tasksData: Omit<TaskCreate, 'projectId' | 'createdAt' | 'updatedAt' | 'completedAt'>[]
  ) => {
    console.log('🎯 handleCreateProject 呼ばれました:', { projectData, milestonesData, tasksData })
    try {
      // 1. プロジェクト作成
      const newProject = await addProject({
        ...projectData,
        userId: 'default-user',
      })
      console.log('✅ プロジェクト作成成功:', newProject)
      
      // 2. マイルストーン作成
      const createdMilestones = []
      for (const milestoneData of milestonesData) {
        const milestone = await addMilestone({
          ...milestoneData,
          projectId: newProject.id,
        })
        createdMilestones.push(milestone)
        console.log('✅ マイルストーン作成成功:', milestone)
      }
      
      // 3. タスク作成
      for (const taskData of tasksData) {
        // マイルストーンIDがある場合、一時IDから実際のIDに変換
        let actualMilestoneId = taskData.milestoneId
        if (actualMilestoneId) {
          const milestoneIndex = milestonesData.findIndex(m => m === milestonesData[0]) // 簡易マッピング
          if (milestoneIndex >= 0 && createdMilestones[milestoneIndex]) {
            actualMilestoneId = createdMilestones[milestoneIndex].id
          }
        }
        
        const task = await addTask({
          ...taskData,
          projectId: newProject.id,
          milestoneId: actualMilestoneId,
          dependencies: [],
          blockedBy: [],
          tags: [],
          isToday: false,
        })
        console.log('✅ タスク作成成功:', task)
      }
      
      // 4. 作成したプロジェクトをデフォルトに設定
      setDefaultProjectId(newProject.id)
      
      // Projectsビューに切り替え(将来実装)
      // setCurrentView('projects')
    } catch (error) {
      console.error('❌ プロジェクト作成エラー:', error)
      throw error
    }
  }

  return (
    <div className={`h-screen flex flex-col ${GRADIENTS.background}`}>
      {/* ヘッダー */}
      <header className="bg-brand-base shadow-lg shadow-indigo-500/10 border-b border-gray-800 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between">
            {/* 左側: アプリ名とアイコン */}
            <div className="flex items-center gap-3">
              <div className={`${GRADIENTS.brand} p-2 rounded-lg shadow-glow-sm`}>
                <Sparkles className="w-6 h-6 text-white animate-twinkle" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${GRADIENTS.text}`}>
                  TaskSparkle
                </h1>
              </div>
            </div>
            
            {/* 中央: ビュー切替タブ */}
            <div className="flex gap-2 bg-brand-base-dark p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setCurrentView('today')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  currentView === 'today'
                    ? 'bg-brand-primary text-white shadow-md shadow-indigo-500/30'
                    : 'text-brand-text-dark hover:text-brand-text hover:bg-brand-base-light'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentView('projects')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  currentView === 'projects'
                    ? 'bg-brand-primary text-white shadow-md shadow-indigo-500/30'
                    : 'text-brand-text-dark hover:text-brand-text hover:bg-brand-base-light'
                }`}
              >
                Projects
              </button>
            </div>
            
            {/* 右側: アクション */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                新規プロジェクト
              </Button>
              <Button variant="ghost" size="md" className="p-2">
                <Settings className="w-5 h-5" />
              </Button>
              {/* ユーザーアイコン（ログイン時に表示） */}
              <div className="relative">
                <Button variant="ghost" size="md" className="p-2">
                  <User className="w-5 h-5" />
                </Button>
                {/* 将来的にドロップダウンメニューを実装 */}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ - flex-1で残りの高さを使用 */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full max-w-screen-2xl mx-auto">
          {/* メインビュー領域（左側） */}
          <div className="lg:col-span-2 h-full min-h-0">
            {currentView === 'today' ? (
              <TodayView
                tasks={todayTasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onUpdatePriority={handleUpdatePriority}
              />
            ) : (
              <TaskListComponent 
                tasks={todayTasks} 
                onToggleTask={handleToggleTask} 
                onReorderTasks={handleReorderTasks} 
                onDeleteTask={handleDeleteTask} 
              />
            )}
          </div>

          {/* チャット領域（右側・常時表示） */}
          <div className="lg:col-span-1 h-full min-h-0">
            <ChatComponent 
              onTaskCreate={handleAddTask} 
              onTaskDelete={handleDeleteTask} 
              onTaskToggle={handleToggleTask}
              onUpdatePriority={handleUpdatePriority}
              tasks={todayTasks}
              defaultProjectId={defaultProjectId}
            />
          </div>
        </div>
      </main>

      {/* プロジェクト作成モーダル */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}
