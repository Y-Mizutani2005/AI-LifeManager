/**
 * 共通テキストエリアコンポーネント
 * 
 * TaskSparkleのブランドカラーを使用した統一されたテキストエリアスタイルを提供します。
 */

import { BORDERS, TRANSITIONS } from '../../constants/theme'
import { cn } from '../../utils/styles'

/**
 * TextAreaコンポーネントのプロパティ
 */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** エラー状態 */
  hasError?: boolean
}

/**
 * 共通テキストエリアコンポーネント
 * 
 * TaskSparkleのブランドスタイルに準拠したテキストエリアです。
 * 
 * @param hasError - エラー状態
 * @param className - 追加のCSSクラス
 */
const TextArea = ({ hasError = false, className = '', ...props }: TextAreaProps) => {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-2 rounded-lg resize-none',
        'bg-brand-base-light',
        'text-brand-text',
        'placeholder:text-brand-text-dark',
        BORDERS.default,
        BORDERS.focus,
        TRANSITIONS.default,
        'focus:outline-none focus:border-transparent',
        hasError && 'border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
}

export default TextArea
