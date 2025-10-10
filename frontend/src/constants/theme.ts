/**
 * TaskSparkle テーマ定数
 * 
 * アプリ全体で使用するカラー、スタイル、アニメーション定数を定義します。
 * 一箇所で管理することで、ブランドの一貫性を保ち、変更を容易にします。
 * 
 * テーマ: スターライト・ネイビー系
 * コンセプト: 夜空の星々のような落ち着いた輝き
 */

/**
 * ブランドカラー
 * TaskSparkleのスターライト・ネイビー系カラーパレット
 */
export const BRAND_COLORS = {
  // 基調色 (Dark Slate Blue)
  base: '#1F2937',
  // ブランドカラー (Indigo)
  brand: '#6366F1',
  // スパークルカラー (Light Violet)
  sparkle: '#C4B5FD',
  // 強調カラー (Amber)
  accent: '#FCD34D',
  // テキストカラー (Light Gray)
  text: '#D1D5DB',
  // 追加のカラーバリエーション
  colors: {
    // 基調色のバリエーション
    baseDark: '#111827',    // より濃い背景
    baseLight: '#374151',   // より明るい背景要素
    // ブランドカラーのバリエーション
    brandLight: '#818CF8',  // ホバー時など
    brandDark: '#4F46E5',   // アクティブ時など
    // テキストのバリエーション
    textDark: '#9CA3AF',    // 補助テキスト
    textLight: '#F3F4F6',   // 強調テキスト
  },
} as const

/**
 * グラデーションスタイル
 * インディゴ→バイオレットで星空の輝きを表現
 * 控えめなトーンで目が疲れにくい配色
 */
export const GRADIENTS = {
  // ブランドグラデーション (インディゴ → バイオレット) - 控えめに調整
  brand: 'bg-gradient-to-r from-indigo-700 to-indigo-600',
  brandHover: 'hover:from-indigo-600 hover:to-indigo-500',
  // テキストグラデーション - より控えめに
  text: 'bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent',
  // 背景グラデーション (微妙な輝き)
  background: 'bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900',
  // スパークルグラデーション (完了エフェクト用)
  sparkle: 'bg-gradient-to-r from-violet-300 to-amber-300',
} as const

/**
 * シャドウスタイル
 * スターライト効果を意識した微妙な影
 */
export const SHADOWS = {
  sm: 'shadow-sm shadow-indigo-500/10',
  md: 'shadow-md shadow-indigo-500/20',
  lg: 'shadow-lg shadow-indigo-500/30',
  hover: 'hover:shadow-xl hover:shadow-violet-500/30',
  glow: 'shadow-lg shadow-violet-400/50', // グロー効果
} as const

/**
 * ボーダースタイル
 * ダークテーマに合わせた控えめなボーダー
 */
export const BORDERS = {
  light: 'border border-gray-700',
  default: 'border border-gray-600',
  focus: 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
  accent: 'border border-violet-400',
} as const

/**
 * トランジション
 */
export const TRANSITIONS = {
  default: 'transition-all duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
} as const

/**
 * アニメーション
 * 星の瞬きやスターライトエフェクト
 */
export const ANIMATIONS = {
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  // カスタムアニメーション (CSS側で定義が必要)
  twinkle: 'animate-twinkle',      // 星の瞬き
  starlight: 'animate-starlight',  // 完了時のスターライト
} as const

/**
 * 優先度のスタイル定義
 * ダークテーマに適した色合いに調整
 */
export const PRIORITY_STYLES = {
  high: {
    bg: 'bg-red-900/30',
    text: 'text-red-300',
    border: 'border-red-800',
    borderLeft: 'border-red-500',
  },
  medium: {
    bg: 'bg-amber-900/30',
    text: 'text-amber-300',
    border: 'border-amber-800',
    borderLeft: 'border-amber-500',
  },
  low: {
    bg: 'bg-emerald-900/30',
    text: 'text-emerald-300',
    border: 'border-emerald-800',
    borderLeft: 'border-emerald-500',
  },
} as const

/**
 * 優先度のラベル
 */
export const PRIORITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低',
} as const
