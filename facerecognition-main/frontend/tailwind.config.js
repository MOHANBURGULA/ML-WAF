/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          950: '#06090e',
          900: '#0b0f17',
          850: '#111723',
          800: '#161e2e',
          750: '#1c2638',
          700: '#233045',
          600: '#334461',
          500: '#4b6185',
          border: '#1e2d42',
          borderLight: '#e2e8f0',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        security: {
          safe: '#10b981',       // emerald-500
          safeBg: 'rgba(16, 185, 129, 0.1)',
          flagged: '#f59e0b',    // amber-500
          flaggedBg: 'rgba(245, 158, 11, 0.1)',
          blocked: '#ef4444',    // red-500
          blockedBg: 'rgba(239, 68, 68, 0.1)',
          purple: '#a855f7',     // purple-500 for zero-day/ML
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
