/**
 * 共通ボタンコンポーネント
 * 
 * TaskSparkleのブランドカラーを使用した統一されたボタンスタイルを提供します。
 */

import { GRADIENTS, SHADOWS, TRANSITIONS } from '../../constants/theme'
import { cn } from '../../utils/styles'

/**
 * ボタンのバリアント
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/**
 * ボタンのサイズ
 */
type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Buttonコンポーネントのプロパティ
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンのバリアント */
  variant?: ButtonVariant
  /** ボタンのサイズ */
  size?: ButtonSize
  /** ローディング状態 */
  isLoading?: boolean
  /** アイコン（左側） */
  icon?: React.ReactNode
  /** アイコン（右側） */
  iconRight?: React.ReactNode
  /** 子要素 */
  children?: React.ReactNode
}

/**
 * バリアント別のスタイル
 * スターライト・ネイビーテーマに対応
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    GRADIENTS.brand,
    GRADIENTS.brandHover,
    'text-white',
    SHADOWS.md,
    SHADOWS.hover
  ),
  secondary: cn(
    'bg-brand-base-light',
    'text-brand-text',
    'border border-gray-600',
    'hover:bg-gray-600',
    'hover:border-brand-primary'
  ),
  ghost: cn(
    'text-brand-text',
    'hover:text-brand-sparkle',
    'hover:bg-brand-base-light'
  ),
  danger: cn(
    'bg-red-600',
    'text-white',
    'hover:bg-red-700',
    'shadow-md shadow-red-500/20'
  ),
}

/**
 * サイズ別のスタイル
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

/**
 * 共通ボタンコンポーネント
 * 
 * TaskSparkleのブランドスタイルに準拠したボタンです。
 * 
 * @param variant - ボタンのスタイルバリアント
 * @param size - ボタンのサイズ
 * @param isLoading - ローディング状態
 * @param icon - 左側に表示するアイコン
 * @param iconRight - 右側に表示するアイコン
 * @param children - ボタンのラベル
 * @param className - 追加のCSSクラス
 * @param disabled - 無効化状態
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'rounded-lg font-semibold flex items-center justify-center gap-2',
        TRANSITIONS.default,
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-brand-sparkle border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  )
}

export default Button
