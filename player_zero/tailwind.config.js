/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Touch-specific breakpoints
      'touch': {'raw': '(hover: none)'},
      'no-touch': {'raw': '(hover: hover)'},
      // Orientation breakpoints
      'portrait': {'raw': '(orientation: portrait)'},
      'landscape': {'raw': '(orientation: landscape)'},
    },
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
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        }
      },
      spacing: {
        'pixel': '2px',
        'pixel-2': '4px',
        'pixel-3': '6px',
        'pixel-4': '8px',
        'pixel-6': '10px',
        'pixel-8': '12px',
        // Mobile-specific spacing
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Touch-friendly sizes - slightly increased
        'touch-target': '42px',
        'touch-target-sm': '36px',
        'touch-target-lg': '50px',
      },
      fontSize: {
        // Balanced responsive pixel font sizes - slightly increased for readability
        'pixel-xs': ['clamp(8px, 1.5vw, 10px)', { lineHeight: '1.3' }],
        'pixel-sm': ['clamp(10px, 2vw, 12px)', { lineHeight: '1.3' }],
        'pixel-base': ['clamp(12px, 2.5vw, 14px)', { lineHeight: '1.4' }],
        'pixel-lg': ['clamp(14px, 3vw, 16px)', { lineHeight: '1.4' }],
        'pixel-xl': ['clamp(16px, 3.5vw, 18px)', { lineHeight: '1.5' }],
        'pixel-2xl': ['clamp(18px, 4vw, 20px)', { lineHeight: '1.5' }],
        'pixel-3xl': ['clamp(20px, 4.5vw, 24px)', { lineHeight: '1.5' }],
      },
      minHeight: {
        'touch': '44px',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxWidth: {
        'mobile': '390px',
        'tablet': '768px',
      },
      zIndex: {
        'modal': '1000',
        'toast': '1010',
        'tooltip': '1020',
      }
    },
  },
  plugins: [],
};
