import { useState, useRef, useEffect } from 'react'
import { Bot, User, Send } from 'lucide-react'
import type { Task, TaskCreate } from '../types'

/**
 * メッセージの型定義
 */
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * ChatComponentのプロパティ
 */
interface ChatComponentProps {
  onTaskCreate: (taskData: Partial<TaskCreate>) => Promise<void>
  onTaskDelete: (id: string) => Promise<void>
  onTaskToggle: (id: string) => Promise<void>
  onUpdatePriority: (taskId: string, priority: 'high' | 'medium' | 'low') => Promise<void>
  tasks: Task[]
  defaultProjectId?: string // デフォルトプロジェクトID
}

/**
 * AI対話チャットコンポーネント
 * 
 * ユーザーとAIアシスタントの対話を管理します。
 * タスク作成やプロジェクトの相談をAIに依頼できます。
 * 
 * @param onTaskCreate - タスク作成時のコールバック関数
 * @param onTaskDelete - タスク削除時のコールバック関数
 * @param onTaskToggle - タスク完了/未完了切り替え時のコールバック関数
 * @param onUpdatePriority - タスク優先度変更時のコールバック関数
 * @param tasks - 現在のタスクリスト
 * @param defaultProjectId - デフォルトプロジェクトID
 */
const ChatComponent = ({ onTaskCreate, onTaskDelete, onTaskToggle, onUpdatePriority, tasks, defaultProjectId = '' }: ChatComponentProps) => {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  /**
   * チャット履歴の最下部までスクロールする
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  /**
   * メッセージをAIに送信してレスポンスを受け取る
   */
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setChatHistory(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      // 会話履歴をバックエンドに送信（最新20件まで）
      const historyToSend = chatHistory.slice(-20).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // タスクを完全なTask型に変換(バックエンドのTask型に合わせる)
      const fullTasks = tasks.map(t => ({
        id: t.id,
        projectId: defaultProjectId, // デフォルトプロジェクトIDを使用
        milestoneId: undefined,
        parentTaskId: undefined,
        title: t.title,
        description: undefined,
        status: t.status,
        priority: t.priority,
        dueDate: undefined,
        startDate: undefined,
        estimatedHours: undefined,
        actualHours: undefined,
        dependencies: [],
        blockedBy: [],
        tags: [],
        isToday: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: undefined
      }))
      
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content, 
          tasks: fullTasks,
          history: historyToSend  // 会話履歴を追加
        })
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      // 開発環境でのみデバッグログを出力
      if (import.meta.env.DEV) {
        console.log('🔍 バックエンドレスポンス:', data.response)
      }

      // タスクアクションを抽出して処理
      let displayResponse = data.response
      
      // 構造化されたアクションJSONを検出して処理
      const actionsMatch = data.response.match(/\{\s*"__task_actions__"\s*:\s*\{[\s\S]*?\}\s*\}/)
      
      if (import.meta.env.DEV) {
        console.log('🔍 アクションマッチ結果:', actionsMatch)
      }
      
      if (actionsMatch) {
        try {
          if (import.meta.env.DEV) {
            console.log('🔍 抽出されたJSON文字列:', actionsMatch[0])
          }
          const actionsData = JSON.parse(actionsMatch[0])
          if (import.meta.env.DEV) {
            console.log('🔍 パース後のアクションデータ:', actionsData)
          }
          const taskActions = actionsData.__task_actions__
          
          if (import.meta.env.DEV) {
            console.log('📝 タスクアクション:', taskActions)
          }
          
          // タスク作成アクションを処理
          if (taskActions.create && Array.isArray(taskActions.create)) {
            console.log('✅ タスク作成アクション検出:', taskActions.create)
            for (const task of taskActions.create) {
              console.log('🔄 タスクを作成中:', task)
              await onTaskCreate({ ...task, status: 'todo' })
              console.log('✅ タスク作成完了:', task.title)
            }
          }
          
          // タスク削除アクションを処理
          if (taskActions.delete && Array.isArray(taskActions.delete)) {
            console.log('🗑️ タスク削除アクション検出:', taskActions.delete)
            for (const taskId of taskActions.delete) {
              console.log('🔄 タスクを削除中:', taskId)
              await onTaskDelete(taskId)
              console.log('✅ タスク削除完了:', taskId)
            }
          }
          
          // タスク完了アクションを処理
          if (taskActions.complete && Array.isArray(taskActions.complete)) {
            console.log('✔️ タスク完了アクション検出:', taskActions.complete)
            for (const taskId of taskActions.complete) {
              console.log('🔄 タスクを完了中:', taskId)
              await onTaskToggle(taskId)
              console.log('✅ タスク完了:', taskId)
            }
          }
          
          // タスク未完了アクションを処理
          if (taskActions.uncomplete && Array.isArray(taskActions.uncomplete)) {
            console.log('↩️ タスク未完了アクション検出:', taskActions.uncomplete)
            for (const taskId of taskActions.uncomplete) {
              console.log('🔄 タスクを未完了に戻し中:', taskId)
              await onTaskToggle(taskId)
              console.log('✅ タスク未完了化完了:', taskId)
            }
          }
          
          // タスク優先度変更アクションを処理
          if (taskActions.update_priority && Array.isArray(taskActions.update_priority)) {
            console.log('🔄 優先度変更アクション検出:', taskActions.update_priority)
            for (const update of taskActions.update_priority) {
              console.log('🔄 優先度を変更中:', update)
              await onUpdatePriority(update.task_id, update.priority)
              console.log('✅ 優先度変更完了:', update.task_id)
            }
          }
          
          // アクションJSONをレスポンスから除去して表示用テキストを作成
          displayResponse = data.response.replace(actionsMatch[0], '').trim()
        } catch (e) {
          console.error('アクションのパース中にエラーが発生しました:', e)
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: displayResponse,
        timestamp: new Date()
      }

      setChatHistory(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'エラーが発生しました。バックエンドサーバーが起動しているか確認してください。',
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
      console.error('チャット送信エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Enterキーでメッセージ送信（Shift+Enterで改行）
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ヘッダー */}
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center gap-3 flex-shrink-0 min-h-[64px]">
        <Bot className="w-6 h-6" />
        <div>
          <h2 className="text-xl font-bold">AI アシスタント</h2>
          <p className="text-sm text-blue-100">タスク作成やプロジェクトの相談ができます</p>
        </div>
      </div>

      {/* チャット履歴エリア */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 min-h-0">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">AIアシスタントへようこそ！</p>
            <div className="text-sm text-center space-y-1">
              <p>💡 例: 「明日までにログイン機能を作る」</p>
              <p>💡 例: 「今日のタスクを整理して」</p>
              <p>💡 例: 「データベース設計について相談したい」</p>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* アイコン */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                {/* メッセージバブル */}
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        )}

        {/* ローディングインジケーター */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          {/*
            テキストエリアで3行まで改行可能。4行目以降はスクロール。
            Enterで送信、Shift+Enterで改行。
          */}
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="メッセージを入力... (例: 明日までにログイン機能を作る)"
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none max-h-[120px] min-h-[48px] overflow-y-auto"
            style={{lineHeight: '1.5'}}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !message.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
          >
            <Send className="w-4 h-4" />
            送信
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatComponent
