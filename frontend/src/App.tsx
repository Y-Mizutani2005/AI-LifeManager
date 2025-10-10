/**
 * Project Companion - メインアプリケーション
 * 
 * AI対話でタスク管理ができる個人向けWebアプリ
 * 
 * コア機能:
 * ✅ AI対話でタスク作成(差別化ポイント)
 * ✅ AI相談機能(秘書のような体験)
 * ✅ 今日のタスク表示(最小限の価値提供)
 * ✅ Projects/Todayビュー切替
 */
import { useEffect, useState } from 'react'
import ChatComponent from './components/ChatComponent'
import TaskListComponent from './components/TaskListComponent'
import TodayView from './components/TodayView'
import { Sparkles, Settings, Plus } from 'lucide-react'
import { useStore } from './store'
import type { Task, TaskCreate } from './types'

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
    addProject 
  } = useStore()

  const [defaultProjectId, setDefaultProjectId] = useState<string>('')
  const [currentView, setCurrentView] = useState<ViewType>('today')

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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 左側: アプリ名とアイコン */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Project Companion
                </h1>
                <p className="text-xs text-gray-600">
                  💡 AI秘書があなたのプロジェクト管理をサポート
                </p>
              </div>
            </div>
            
            {/* 中央: ビュー切替タブ */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('today')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  currentView === 'today'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentView('projects')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  currentView === 'projects'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects
              </button>
            </div>
            
            {/* 右側: アクション */}
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold shadow-sm">
                <Plus className="w-4 h-4" />
                新規プロジェクト
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ - flex-1で残りの高さを使用 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
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
    </div>
  )
}
