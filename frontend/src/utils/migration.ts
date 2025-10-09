/**
 * データマイグレーション処理
 * 
 * 既存のタスクデータをプロジェクト構造に移行
 */

import type { Project, Task } from '../types'
import { useStore } from '../store'

/**
 * 既存タスクをデフォルトプロジェクトに移行
 * 
 * LocalStorageに保存されている旧形式のタスクを
 * 新しいプロジェクト構造に移行します
 */
export const migrateExistingTasks = async (): Promise<void> => {
  const store = useStore.getState()
  
  // 既にプロジェクトが存在する場合はスキップ
  if (store.projects.length > 0) {
    console.log('✅ プロジェクトが既に存在します。マイグレーションをスキップします。')
    return
  }

  // 旧形式のタスクを取得
  const oldTasksJson = localStorage.getItem('tasks')
  if (!oldTasksJson) {
    console.log('ℹ️ 旧形式のタスクが見つかりません。')
    return
  }

  try {
    const oldTasks = JSON.parse(oldTasksJson) as Array<{
      id: string
      title: string
      status: string
      priority: string
    }>

    if (oldTasks.length === 0) {
      console.log('ℹ️ 移行するタスクがありません。')
      return
    }

    console.log(`📦 ${oldTasks.length}件の既存タスクを移行します...`)

    // デフォルトプロジェクトを作成
    const defaultProject = await store.addProject({
      title: '既存タスク',
      goal: '以前作成されたタスクを整理する',
      description: 'プロジェクト機能導入前に作成されたタスクをまとめたプロジェクト',
      status: 'active',
      tags: ['移行済み'],
      color: '#6B7280', // グレー
    })

    // 各タスクを新形式に変換して追加
    for (const oldTask of oldTasks) {
      await store.addTask({
        projectId: defaultProject.id,
        title: oldTask.title,
        status: oldTask.status as 'todo' | 'done',
        priority: oldTask.priority as 'high' | 'medium' | 'low',
        dependencies: [],
        blockedBy: [],
        tags: [],
        isToday: false,
      })
    }

    console.log(`✅ ${oldTasks.length}件のタスクを「${defaultProject.title}」プロジェクトに移行しました!`)

    // 旧データを削除(バックアップとして残すオプションもあり)
    localStorage.removeItem('tasks')
    console.log('🗑️ 旧形式のタスクデータを削除しました。')

  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error)
  }
}

/**
 * 初回起動時のセットアップ
 * 
 * アプリケーション起動時に一度だけ実行
 */
export const initializeApp = async (): Promise<void> => {
  console.log('🚀 アプリケーションを初期化しています...')
  
  // マイグレーション実行
  await migrateExistingTasks()
  
  console.log('✅ 初期化完了!')
}
