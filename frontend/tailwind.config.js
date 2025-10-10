// Tailwind CSS v4 設定
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TaskSparkle スターライト・ネイビー系カラーパレット
        brand: {
          base: '#1F2937',
          'base-dark': '#111827',
          'base-light': '#374151',
          primary: '#6366F1',
          'primary-light': '#818CF8',
          'primary-dark': '#4F46E5',
          sparkle: '#C4B5FD',
          accent: '#FCD34D',
          text: '#D1D5DB',
          'text-dark': '#9CA3AF',
          'text-light': '#F3F4F6',
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(196, 181, 253, 0.5)',
        'glow-sm': '0 0 10px rgba(196, 181, 253, 0.3)',
        'glow-lg': '0 0 30px rgba(196, 181, 253, 0.6)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        starlight: {
          '0%': { 
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': { 
            transform: 'scale(1.2)',
            opacity: '0.8',
            filter: 'brightness(1.5)',
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        twinkle: 'twinkle 2s ease-in-out infinite',
        starlight: 'starlight 0.6s ease-in-out',
      },
    },
  },
}
