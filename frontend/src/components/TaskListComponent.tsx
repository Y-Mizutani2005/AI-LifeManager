import { CheckCircle2, Circle, Calendar, AlertCircle, GripVertical, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardHeader } from './ui'
import { GRADIENTS } from '../constants/theme'
import { getPriorityStyle, getPriorityLabel, getBorderStyle } from '../utils/styles'
import type { Task } from '../types'

/**
 * TaskListComponentのプロパティ
 */
interface TaskListComponentProps {
  tasks: Task[]
  onToggleTask: (id: string) => Promise<void>
  onReorderTasks: (tasks: Task[]) => void
  onDeleteTask: (id: string) => Promise<void>
}

/**
 * 今日のタスク表示コンポーネント
 * 
 * タスク一覧を見やすく表示し、完了/未完了の切り替えができます。
 * 優先度別に色分けされたバッジで視認性を向上させます。
 * ドラッグ&ドロップでタスクの順序を変更できます。
 * 
 * @param tasks - 表示するタスクのリスト
 * @param onToggleTask - タスクの完了/未完了を切り替えるコールバック関数
 * @param onReorderTasks - タスクの順序を変更するコールバック関数
 * @param onDeleteTask - タスクを削除するコールバック関数
 */
const TaskListComponent = ({ tasks, onToggleTask, onReorderTasks, onDeleteTask }: TaskListComponentProps) => {
  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /**
   * ドラッグ終了時の処理
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id)
      const newIndex = tasks.findIndex(task => task.id === over.id)
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      onReorderTasks(newTasks)
    }
  }
  // 今日のタスク（未完了のみ）をフィルタリング
  const todayTasks = tasks.filter(task => task.status === 'todo')
  const completedTasks = tasks.filter(task => task.status === 'done')

  /**
   * 優先度に応じたバッジスタイルを返す
   */
  const getPriorityBadgeClass = (priority: Task['priority']) => {
    const style = getPriorityStyle(priority)
    return `${style.bg} ${style.text} ${style.border}`
  }

  /**
   * タスクカードコンポーネント（ドラッグ&ドロップ対応）
   */
  const SortableTaskCard = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const isCompleted = task.status === 'done'
    const borderClass = `border-l-4 ${getBorderStyle(task.priority, isCompleted)}`

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group bg-brand-base-light rounded-lg shadow-md shadow-gray-900/20 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 p-4 border border-gray-800 ${borderClass} ${
          isCompleted ? 'bg-brand-base opacity-75' : ''
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex items-start gap-3">
          {/* ドラッグハンドル */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-brand-text-dark hover:text-brand-text transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* チェックボックス */}
          <button
            onClick={() => onToggleTask(task.id)}
            className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400 group-hover:text-amber-500 transition-colors" />
            )}
          </button>

          {/* タスク内容 */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-base font-medium ${
                task.status === 'done'
                  ? 'line-through text-gray-400'
                  : 'text-gray-800'
              }`}
            >
              {task.title}
            </p>
          </div>

          {/* 優先度バッジ */}
          <div
            className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Card variant="primary" className="flex flex-col h-full">
        {/* ヘッダー */}
        <CardHeader
          variant="primary"
          icon={<Calendar className="w-6 h-6" />}
          title="今日のタスク"
          subtitle={`未完了: ${todayTasks.length}件 | 完了: ${completedTasks.length}件`}
        />

        {/* タスクリスト */}
        <div className="flex-1 overflow-y-auto p-4 bg-brand-base-dark min-h-0">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-brand-text-dark">
              <AlertCircle className="w-16 h-16 mb-4 text-gray-600" />
              <p className="text-lg font-semibold mb-2">タスクがありません</p>
              <p className="text-sm text-center">
                左のチャットでAIに<br />
                タスクを作成してもらいましょう！
              </p>
            </div>
          ) : (
            <SortableContext
              items={tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {/* 未完了タスク */}
                {todayTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-600 px-2">
                      未完了のタスク
                    </h3>
                    {todayTasks.map(task => (
                      <SortableTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}

                {/* 完了タスク */}
                {completedTasks.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-semibold text-gray-600 px-2">
                      完了済み
                    </h3>
                    {completedTasks.map(task => (
                      <SortableTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            </SortableContext>
          )}
        </div>

        {/* フッター統計 */}
        {tasks.length > 0 && (
          <div className="bg-brand-base border-t border-gray-800 p-4 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text-dark">進捗状況</span>
              <span className="font-semibold text-brand-accent">
                {completedTasks.length} / {tasks.length} 完了
              </span>
            </div>
            <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`${GRADIENTS.brand} h-full transition-all duration-300`}
                style={{
                  width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </DndContext>
  )
}

export default TaskListComponent
