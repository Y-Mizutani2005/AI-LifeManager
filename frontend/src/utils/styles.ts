/**
 * スタイルユーティリティ関数
 * 
 * 条件付きスタイルの生成や、動的なクラス名の組み立てを行います。
 */

import { PRIORITY_STYLES, PRIORITY_LABELS } from '../constants/theme'
import type { Task } from '../types'

/**
 * クラス名を結合するユーティリティ
 * 
 * @param classes - 結合するクラス名の配列
 * @returns 結合されたクラス名文字列
 */
export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * 優先度に応じたスタイルを取得
 * 
 * @param priority - タスクの優先度
 * @returns 優先度に対応するスタイルクラス
 */
export const getPriorityStyle = (priority: Task['priority']) => {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
}

/**
 * 優先度のラベルを取得
 * 
 * @param priority - タスクの優先度
 * @returns 優先度の日本語ラベル
 */
export const getPriorityLabel = (priority: Task['priority']) => {
  return PRIORITY_LABELS[priority] || '-'
}

/**
 * 完了済みタスクのスタイルを取得
 * 
 * @param isCompleted - タスクが完了しているか
 * @returns 完了状態に応じたスタイルクラス
 */
export const getCompletedStyle = (isCompleted: boolean) => {
  return isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
}

/**
 * ボーダースタイルを取得（優先度と完了状態に基づく）
 * 
 * @param priority - タスクの優先度
 * @param isCompleted - タスクが完了しているか
 * @returns ボーダースタイルクラス
 */
export const getBorderStyle = (priority: Task['priority'], isCompleted: boolean) => {
  if (isCompleted) {
    return 'border-gray-300'
  }
  const styles = getPriorityStyle(priority)
  return styles.borderLeft
}
