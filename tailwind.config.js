/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          base: '#0a0e12',
          surface: '#0f1519',
          elevated: '#161e25',
          overlay: '#1e2830',
        },
        border: {
          subtle: '#1e2d3a',
          DEFAULT: '#2a3d4f',
        },
        // Q'd Up brand colors
        brand: {
          orange: '#E87722',
          'orange-light': '#F08D40',
          'orange-dark': '#C9621A',
          blue: '#4D7FA3',
          'blue-light': '#6495B8',
          'blue-dark': '#2D5F7E',
          navy: '#1E3D5A',
        },
        // Map amber to brand orange for consistency
        amber: {
          400: '#F08D40',
          500: '#E87722',
          600: '#C9621A',
        },
        status: {
          notstarted: '#2a3d4f',
          inprogress: '#1a4a6e',
          inreview: '#C9621A',
          approved: '#4D7FA3',
          done: '#16a34a',
          blocked: '#dc2626',
          scheduled: '#0e6680',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-up': 'slideUp 0.15s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
