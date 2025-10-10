/**
 * Todayビュー - 今日のダッシュボード
 * 
 * 本日のタスク一覧、進捗サマリーを表示します。
 * プロジェクト横断で今日のタスクを管理できます。
 */
import { Calendar, CheckCircle2, Circle, TrendingUp, Trash2, FolderOpen } from 'lucide-react'
import { useStore } from '../store'
import type { Task } from '../types'

/**
 * TodayViewのプロパティ
 */
interface TodayViewProps {
  /** 表示するタスクのリスト */
  tasks: Task[]
  /** タスクの完了/未完了を切り替えるコールバック関数 */
  onToggleTask: (id: string) => Promise<void>
  /** タスクを削除するコールバック関数 */
  onDeleteTask: (id: string) => Promise<void>
  /** タスクの優先度を変更するコールバック関数 */
  onUpdatePriority: (taskId: string, priority: 'high' | 'medium' | 'low') => Promise<void>
}

/**
 * Todayビューコンポーネント
 * 
 * 今日のタスクをダッシュボード形式で表示します。
 * 進捗状況やAIからの提案も含まれます。
 * 
 * @param tasks - 表示するタスクのリスト
 * @param onToggleTask - タスクの完了/未完了を切り替えるコールバック関数
 * @param onDeleteTask - タスクを削除するコールバック関数
 * @param onUpdatePriority - タスクの優先度を変更するコールバック関数
 */
const TodayView = ({ tasks, onToggleTask, onDeleteTask }: TodayViewProps) => {
  // ストアからプロジェクト情報を取得
  const { projects } = useStore()
  
  // タスクを完了状態で分類
  const todoTasks = tasks.filter(task => task.status === 'todo' || task.status === 'in_progress')
  const completedTasks = tasks.filter(task => task.status === 'done')
  
  // 進捗率を計算
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0

  /**
   * タスクのプロジェクト名を取得
   */
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId)
    return project?.title || '未分類'
  }

  /**
   * プロジェクトの色を取得(なければデフォルトカラー)
   */
  const getProjectColor = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId)
    return project?.color || '#6B7280' // デフォルトはグレー
  }

  /**
   * 優先度に応じたスタイルを返す
   */
  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  /**
   * 優先度の日本語表示を返す
   */
  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return '-'
    }
  }

  /**
   * タスクカードコンポーネント
   */
  const TaskCard = ({ task }: { task: Task }) => {
    return (
      <div
        className={`group bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 p-3 border-l-4 ${
          task.status === 'done'
            ? 'border-gray-300 bg-gray-50'
            : task.priority === 'high'
            ? 'border-red-500'
            : task.priority === 'medium'
            ? 'border-yellow-500'
            : 'border-green-500'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* チェックボックス */}
          <button
            onClick={() => onToggleTask(task.id)}
            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            )}
          </button>

          {/* タスク内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-medium flex-1 min-w-0 truncate ${
                  task.status === 'done'
                    ? 'line-through text-gray-400'
                    : 'text-gray-800'
                }`}
              >
                {task.title}
              </p>
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 flex-shrink-0"
                style={{ 
                  backgroundColor: `${getProjectColor(task.projectId)}20`,
                  color: getProjectColor(task.projectId)
                }}
              >
                <FolderOpen className="w-3 h-3" />
                <span className="hidden sm:inline">{getProjectName(task.projectId)}</span>
              </span>
            </div>
            {task.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {task.description}
              </p>
            )}
          </div>

          {/* 優先度バッジ */}
          <div
            className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {getPriorityLabel(task.priority)}
          </div>
          
          {/* 削除ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`「${task.title}」を削除しますか?`)) {
                onDeleteTask(task.id)
              }
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
            title="タスクを削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Calendar className="w-7 h-7" />
          <div>
            <h2 className="text-xl font-bold">Today's Dashboard</h2>
            <p className="text-xs text-blue-100">
              {new Date().toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0 space-y-4">
        {/* 本日のタスク */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="text-base font-bold text-gray-900 mb-3">本日のタスク</h3>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1 text-sm">タスクがありません</p>
              <p className="text-xs text-gray-400">
                右のチャットでAIにタスクを作成してもらいましょう！
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 未完了タスク */}
              {todoTasks.length > 0 && (
                <div className="space-y-2">
                  {todoTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
              
              {/* 完了タスク */}
              {completedTasks.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-semibold text-gray-600 px-2">
                    完了済み
                  </h4>
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 進捗サマリー */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">進捗サマリー</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">未完了: <span className="font-semibold text-gray-900">{todoTasks.length}件</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span className="text-gray-600">完了: <span className="font-semibold text-gray-900">{completedTasks.length}件</span></span>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {completionRate}%
              </span>
            </div>
            
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodayView
