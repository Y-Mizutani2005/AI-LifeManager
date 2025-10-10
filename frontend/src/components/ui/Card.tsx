/**
 * 共通カードコンポーネント
 * 
 * TaskSparkleのブランドスタイルを使用した統一されたカードレイアウトを提供します。
 */

import { SHADOWS, TRANSITIONS, GRADIENTS, ANIMATIONS } from '../../constants/theme'
import { cn } from '../../utils/styles'

/**
 * カードのバリアント
 */
type CardVariant = 'default' | 'primary' | 'elevated'

/**
 * Cardコンポーネントのプロパティ
 */
interface CardProps {
  /** カードのバリアント */
  variant?: CardVariant
  /** 子要素 */
  children: React.ReactNode
  /** 追加のCSSクラス */
  className?: string
}

/**
 * CardHeaderコンポーネントのプロパティ
 */
interface CardHeaderProps {
  /** ヘッダーのバリアント */
  variant?: 'default' | 'primary'
  /** アイコン */
  icon?: React.ReactNode
  /** タイトル */
  title: string
  /** サブタイトル */
  subtitle?: string
  /** 追加のCSSクラス */
  className?: string
}

/**
 * バリアント別のスタイル
 * スターライト・ネイビーテーマに対応
 */
const variantStyles: Record<CardVariant, string> = {
  default: cn('bg-brand-base', SHADOWS.sm, 'border border-gray-800'),
  primary: cn('bg-brand-base', SHADOWS.md, 'border border-gray-800'),
  elevated: cn('bg-brand-base', SHADOWS.lg, 'border border-gray-800', 'hover:shadow-glow'),
}

/**
 * 共通カードコンポーネント
 * 
 * TaskSparkleのブランドスタイルに準拠したカードレイアウトです。
 * 
 * @param variant - カードのスタイルバリアント
 * @param children - カードの内容
 * @param className - 追加のCSSクラス
 */
export const Card = ({ variant = 'default', children, className = '' }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden',
        TRANSITIONS.default,
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * カードヘッダーコンポーネント
 * 
 * カードの上部に表示するヘッダーです。
 * 
 * @param variant - ヘッダーのスタイルバリアント
 * @param icon - ヘッダーに表示するアイコン
 * @param title - ヘッダーのタイトル
 * @param subtitle - ヘッダーのサブタイトル
 * @param className - 追加のCSSクラス
 */
export const CardHeader = ({
  variant = 'default',
  icon,
  title,
  subtitle,
  className = '',
}: CardHeaderProps) => {
  const isPrimary = variant === 'primary'

  return (
    <div
      className={cn(
        'p-4',
        isPrimary && cn(GRADIENTS.brand, 'text-brand-text-light border-b border-gray-800'),
        !isPrimary && 'bg-brand-base-light border-b border-gray-800',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <div className={cn(isPrimary && ANIMATIONS.twinkle, 'text-brand-sparkle')}>{icon}</div>}
        <div>
          <h2
            className={cn(
              'text-xl font-bold',
              isPrimary ? 'text-brand-text-light' : 'text-brand-text'
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                'text-xs',
                'text-brand-text-dark'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * カードボディコンポーネント
 * 
 * カードのメインコンテンツ領域です。
 * 
 * @param children - コンテンツ
 * @param className - 追加のCSSクラス
 */
export const CardBody = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={cn('p-4', className)}>{children}</div>
}
