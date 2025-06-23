/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['Press Start 2P', 'cursive'],
      },
      colors: {
        // Pixel art inspired color palette
        pixel: {
          // Dark colors
          'black': '#0f0f0f',
          'dark-gray': '#1a1a1a',
          'gray': '#2d2d2d',
          'light-gray': '#404040',
          'base-gray': '#949494', // RGB(148, 148, 148)
          
          // Primary colors (8-bit style)
          'red': '#ff4444',
          'green': '#44ff44',
          'blue': '#4444ff',
          'yellow': '#ffff44',
          'magenta': '#ff44ff',
          'cyan': '#44ffff',
          
          // Game-specific colors
          'health': '#ff4444',
          'mana': '#4444ff',
          'energy': '#ffff44',
          'experience': '#44ff44',
          
          // UI colors
          'primary': '#00ff88',
          'secondary': '#ff8800',
          'accent': '#88ff00',
          'warning': '#ff4400',
          'success': '#00ff44',
          'error': '#ff0044',
        },
        // Keep existing gray colors for compatibility
        gray: {
          750: '#3f3f46',
          850: '#1f2028',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'blink': 'blink 1s ease-in-out infinite',
        'bounce-pixel': 'bounce 0.5s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        }
      },
      spacing: {
        'pixel': '2px',
        'pixel-2': '4px',
        'pixel-3': '6px',
        'pixel-4': '8px',
        'pixel-6': '12px',
        'pixel-8': '16px',
      },
      fontSize: {
        'pixel-xs': ['8px', '12px'],
        'pixel-sm': ['10px', '14px'],
        'pixel-base': ['12px', '16px'],
        'pixel-lg': ['14px', '20px'],
        'pixel-xl': ['16px', '24px'],
        'pixel-2xl': ['20px', '28px'],
        'pixel-3xl': ['24px', '32px'],
      }
    },
  },
  plugins: [],
};
