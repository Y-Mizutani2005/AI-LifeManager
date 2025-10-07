/**
 * Project Companion MVP - メインアプリケーション
 * 
 * AI対話でタスク管理ができる個人向けWebアプリ
 * 
 * コア機能:
 * ✅ AI対話でタスク作成（差別化ポイント）
 * ✅ AI相談機能（秘書のような体験）
 * ✅ 今日のタスク表示（最小限の価値提供）
 */
import { create } from 'zustand'
import ChatComponent from './components/ChatComponent'
import TaskListComponent from './components/TaskListComponent'
import { Sparkles } from 'lucide-react'

/**
 * タスクの型定義
 */
interface Task {
  id: string
  title: string
  status: 'todo' | 'done'
  priority: 'high' | 'medium' | 'low'
}

/**
 * グローバルステート管理（Zustand）
 * タスクの状態管理とlocalStorageへの永続化を行う
 */
const useStore = create<{
  tasks: Task[]
  addTask: (task: Omit<Task, 'id'>) => void
  toggleTask: (id: string) => void
  reorderTasks: (newTasks: Task[]) => void
  deleteTask: (id: string) => void
}>((set) => ({
  // localStorageからタスクを復元
  tasks: (JSON.parse(localStorage.getItem('tasks') || '[]') as any[]).map(t => ({
    ...t,
    status: t.status === 'done' ? 'done' : 'todo',
    priority: t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low'
  })),
  
  /**
   * 新しいタスクを追加する
   * @param task - 追加するタスク（idは自動生成）
   */
  addTask: (task) => set((state) => {
    const newTask = { ...task, id: crypto.randomUUID() }
    const newTasks = [...state.tasks, newTask]
    localStorage.setItem('tasks', JSON.stringify(newTasks))
    return { tasks: newTasks }
  }),
  
  /**
   * タスクの完了/未完了を切り替える
   * @param id - 切り替えるタスクのID
   */
  toggleTask: (id) => set((state) => {
    const newTasks = state.tasks.map(t =>
      t.id === id ? { ...t, status: (t.status === 'todo' ? 'done' : 'todo') as Task['status'] } : t
    )
    localStorage.setItem('tasks', JSON.stringify(newTasks))
    return { tasks: newTasks }
  }),
  
  /**
   * タスクの順序を並び替える
   * @param newTasks - 並び替え後のタスクリスト
   */
  reorderTasks: (newTasks) => set(() => {
    localStorage.setItem('tasks', JSON.stringify(newTasks))
    return { tasks: newTasks }
  }),
  
  /**
   * タスクを削除する
   * @param id - 削除するタスクのID
   */
  deleteTask: (id) => set((state) => {
    const newTasks = state.tasks.filter(t => t.id !== id)
    localStorage.setItem('tasks', JSON.stringify(newTasks))
    return { tasks: newTasks }
  })
}))

/**
 * メインアプリケーションコンポーネント
 */
export default function App() {
  const { tasks, addTask, toggleTask, reorderTasks, deleteTask } = useStore()

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Project Companion
              </h1>
              <p className="text-xs text-gray-600">
                💡 AI秘書があなたのタスク管理をサポート
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ - flex-1で残りの高さを使用 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* 左側: AIチャット（中央に配置、広めに） */}
          <div className="lg:col-span-2 h-full min-h-0">
            <ChatComponent 
              onTaskCreate={addTask} 
              onTaskDelete={deleteTask} 
              onTaskToggle={toggleTask}
              tasks={tasks} 
            />
          </div>

          {/* 右側: タスクリスト */}
          <div className="lg:col-span-1 h-full min-h-0">
            <TaskListComponent tasks={tasks} onToggleTask={toggleTask} onReorderTasks={reorderTasks} onDeleteTask={deleteTask} />
          </div>
        </div>
      </main>
    </div>
  )
}
