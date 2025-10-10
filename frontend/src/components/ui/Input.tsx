/**
 * 共通入力フィールドコンポーネント
 * 
 * TaskSparkleのブランドカラーを使用した統一された入力フィールドスタイルを提供します。
 */

import { BORDERS, TRANSITIONS } from '../../constants/theme'
import { cn } from '../../utils/styles'

/**
 * Inputコンポーネントのプロパティ
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** エラー状態 */
  hasError?: boolean
  /** 左側に表示するアイコン */
  icon?: React.ReactNode
}

/**
 * 共通入力フィールドコンポーネント
 * 
 * TaskSparkleのブランドスタイルに準拠した入力フィールドです。
 * 
 * @param hasError - エラー状態
 * @param icon - 左側に表示するアイコン
 * @param className - 追加のCSSクラス
 */
const Input = ({ hasError = false, icon, className = '', ...props }: InputProps) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dark">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'w-full px-4 py-2 rounded-lg',
          'bg-brand-base-light',
          'text-brand-text',
          'placeholder:text-brand-text-dark',
          BORDERS.default,
          BORDERS.focus,
          TRANSITIONS.default,
          'focus:outline-none focus:border-transparent',
          hasError && 'border-red-500 focus:ring-red-500',
          icon ? 'pl-10' : '',
          className
        )}
        {...props}
      />
    </div>
  )
}

export default Input
