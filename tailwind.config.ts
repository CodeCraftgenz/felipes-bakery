import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Paleta da marca Felipe's Bakery
        brand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4ddb2',
          300: '#ecc57f',
          400: '#e2a84a',
          500: '#C8933C', // Primary — Dourado Trigo
          600: '#8B5E1A', // Primary Dark — Caramelo
          700: '#6b4515',
          800: '#573812',
          900: '#472e11',
          950: '#2C1A0E', // Text Primary — Marrom Profundo
        },
        cream: {
          DEFAULT: '#FAF6EF', // bg-cream → cream-100
          50:  '#FEFCF8',
          100: '#FAF6EF', // Background principal
          200: '#F3EBD8',
          300: '#E8DDD0', // Border / Bege
          400: '#d4c5b0',
          500: '#c0a990',
        },
        terracotta: {
          500: '#C0552A', // Accent
          600: '#a3461f',
        },
        olive: {
          500: '#4A7C59', // Success
        },

        // Aliases semânticos (usados via CSS variables para shadcn/ui)
        border:    'hsl(var(--border))',
        input:     'hsl(var(--input))',
        ring:      'hsl(var(--ring))',
        background:'hsl(var(--background))',
        foreground:'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        serif:    ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.3s ease-out',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(44, 26, 14, 0.08)',
        'card-hover': '0 8px 24px 0 rgba(44, 26, 14, 0.12)',
      },
    },
  },
  plugins: [typography],
}

export default config
