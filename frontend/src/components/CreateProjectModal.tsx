/**
 * プロジェクト作成モーダル
 * 
 * 新規プロジェクトを作成するためのモーダルダイアログ
 * 必須項目: プロジェクト名、目標、期限、カラー
 * 任意項目: 説明、タグ、マイルストーン、タスク
 */
import { useState } from 'react'
import { X, FolderPlus, Calendar, Target, FileText, Tag, Milestone as MilestoneIcon, CheckSquare, Plus, Trash2 } from 'lucide-react'
import type { ProjectCreate, MilestoneCreate, TaskCreate } from '../types'

/**
 * プロジェクトカラーパレット
 */
const PROJECT_COLORS = [
  { name: 'ブルー', value: '#3B82F6' },
  { name: 'パープル', value: '#8B5CF6' },
  { name: 'グリーン', value: '#10B981' },
  { name: 'イエロー', value: '#F59E0B' },
  { name: 'レッド', value: '#EF4444' },
  { name: 'ピンク', value: '#EC4899' },
  { name: 'グレー', value: '#6B7280' },
]

/**
 * マイルストーンの入力データ型
 */
interface MilestoneInput {
  id: string // 一時ID(フロントエンド用)
  title: string
  description?: string
  dueDate?: string
  order: number
}

/**
 * タスクの入力データ型
 */
interface TaskInput {
  id: string // 一時ID(フロントエンド用)
  milestoneId?: string // マイルストーンの一時ID
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

/**
 * CreateProjectModalのプロパティ
 */
interface CreateProjectModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** モーダルを閉じるコールバック関数 */
  onClose: () => void
  /** プロジェクト作成時のコールバック関数 */
  onCreate: (
    project: Omit<ProjectCreate, 'userId'>,
    milestones: Omit<MilestoneCreate, 'projectId'>[],
    tasks: Omit<TaskCreate, 'projectId' | 'createdAt' | 'updatedAt' | 'completedAt'>[]
  ) => Promise<void>
}

/**
 * プロジェクト作成モーダルコンポーネント
 * 
 * フォームでプロジェクト情報を入力し、新規プロジェクトを作成します。
 * 
 * @param isOpen - モーダルの表示状態
 * @param onClose - モーダルを閉じるコールバック関数
 * @param onCreate - プロジェクト作成時のコールバック関数
 */
const CreateProjectModal = ({ isOpen, onClose, onCreate }: CreateProjectModalProps) => {
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetEndDate, setTargetEndDate] = useState('')
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0].value)
  const [customColor, setCustomColor] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [milestones, setMilestones] = useState<MilestoneInput[]>([])
  const [tasks, setTasks] = useState<TaskInput[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * フォームをリセット
   */
  const resetForm = () => {
    setTitle('')
    setGoal('')
    setDescription('')
    setStartDate('')
    setTargetEndDate('')
    setSelectedColor(PROJECT_COLORS[0].value)
    setCustomColor('')
    setTagInput('')
    setTags([])
    setMilestones([])
    setTasks([])
  }

  /**
   * 一意のIDを生成
   */
  const generateTempId = () => `temp-${Date.now()}-${Math.random()}`

  /**
   * マイルストーンを追加
   */
  const addMilestone = () => {
    const newMilestone: MilestoneInput = {
      id: generateTempId(),
      title: '',
      description: '',
      dueDate: '',
      order: milestones.length,
    }
    setMilestones([...milestones, newMilestone])
  }

  /**
   * マイルストーンを更新
   */
  const updateMilestone = (id: string, updates: Partial<MilestoneInput>) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  /**
   * マイルストーンを削除
   */
  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id))
    // マイルストーンに紐づくタスクも削除
    setTasks(tasks.filter(t => t.milestoneId !== id))
  }

  /**
   * タスクを追加
   */
  const addTask = (milestoneId?: string) => {
    const newTask: TaskInput = {
      id: generateTempId(),
      milestoneId,
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    }
    setTasks([...tasks, newTask])
  }

  /**
   * タスクを更新
   */
  const updateTask = (id: string, updates: Partial<TaskInput>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  /**
   * タスクを削除
   */
  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  /**
   * タグを追加
   */
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  /**
   * タグを削除
   */
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  /**
   * タグ入力でEnterキー押下時の処理
   */
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // 入力が空でBackspaceを押したら最後のタグを削除
      removeTag(tags[tags.length - 1])
    }
  }

  /**
   * フォーム送信
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !goal.trim() || !startDate || !targetEndDate) {
      alert('必須項目をすべて入力してください')
      return
    }

    setIsSubmitting(true)

    try {
      const projectData: Omit<ProjectCreate, 'userId'> = {
        title: title.trim(),
        goal: goal.trim(),
        description: description.trim() || undefined,
        status: 'active',
        startDate,
        targetEndDate,
        tags,
        color: customColor || selectedColor,
      }

      // マイルストーンデータを変換
      const milestonesData: Omit<MilestoneCreate, 'projectId'>[] = milestones
        .filter(m => m.title.trim())
        .map(m => ({
          title: m.title.trim(),
          description: m.description?.trim() || undefined,
          order: m.order,
          dueDate: m.dueDate || undefined,
          status: 'todo' as const,
        }))

      // タスクデータを変換
      const tasksData: Omit<TaskCreate, 'projectId' | 'createdAt' | 'updatedAt' | 'completedAt'>[] = tasks
        .filter(t => t.title.trim())
        .map(t => ({
          milestoneId: t.milestoneId,
          title: t.title.trim(),
          description: t.description?.trim() || undefined,
          status: 'todo' as const,
          priority: t.priority,
          dueDate: t.dueDate || undefined,
          dependencies: [],
          blockedBy: [],
          tags: [],
          isToday: false,
        }))

      await onCreate(projectData, milestonesData, tasksData)
      resetForm()
      onClose()
    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
      alert('プロジェクトの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * モーダルを閉じる
   */
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderPlus className="w-6 h-6" />
            <h2 className="text-xl font-bold">新規プロジェクト作成</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* プロジェクト名 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FolderPlus className="w-4 h-4" />
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: Webアプリ開発"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 目標・ゴール */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Target className="w-4 h-4" />
              目標・ゴール <span className="text-red-500">*</span>
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例: ユーザー管理機能を持つWebアプリケーションを完成させる"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              説明 (任意)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="プロジェクトの詳細な説明..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* 期限 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                目標完了日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* カラー選択 */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              カラー <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color.value)
                    setCustomColor('')
                  }}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    selectedColor === color.value && !customColor
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor || selectedColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    setSelectedColor('')
                  }}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                  title="カスタムカラー"
                />
                {customColor && (
                  <span className="text-xs text-gray-500">カスタム</span>
                )}
              </div>
            </div>
          </div>

          {/* タグ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              タグ (任意)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="タグを入力してEnter (例: 仕事, 緊急)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* マイルストーン */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <MilestoneIcon className="w-4 h-4" />
              マイルストーン (任意)
            </label>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                        placeholder={`マイルストーン ${index + 1} のタイトル`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                        placeholder="説明 (任意)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        rows={2}
                      />
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(milestone.id, { dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      
                      {/* マイルストーン配下のタスク */}
                      <div className="pl-4 border-l-2 border-gray-300 space-y-2">
                        {tasks.filter(t => t.milestoneId === milestone.id).map((task) => (
                          <div key={task.id} className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                placeholder="タスク名"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={task.priority}
                                  onChange={(e) => updateTask(task.id, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="high">高優先度</option>
                                  <option value="medium">中優先度</option>
                                  <option value="low">低優先度</option>
                                </select>
                                <input
                                  type="date"
                                  value={task.dueDate}
                                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTask(task.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTask(milestone.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          タスクを追加
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestone.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addMilestone}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                マイルストーンを追加
              </button>
            </div>
          </div>

          {/* プロジェクト直下のタスク */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <CheckSquare className="w-4 h-4" />
              プロジェクト直下のタスク (任意)
            </label>
            <div className="space-y-2">
              {tasks.filter(t => !t.milestoneId).map((task) => (
                <div key={task.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                      placeholder="タスク名"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(task.id, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="high">高優先度</option>
                        <option value="medium">中優先度</option>
                        <option value="low">低優先度</option>
                      </select>
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addTask()}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                タスクを追加
              </button>
            </div>
          </div>
        </form>

        {/* フッター */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                プロジェクトを作成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateProjectModal
