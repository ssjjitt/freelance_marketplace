/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        body: 'var(--app-body)',
        foreground: 'var(--app-text)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          deep: 'var(--color-primary-deep)',
          hover: 'var(--color-primary-hover)',
          muted: 'rgba(79, 209, 197, 0.12)',
          foreground: 'var(--app-body)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          muted: 'var(--color-danger-muted)',
          hover: 'var(--color-danger-hover)',
        },
        accent: {
          DEFAULT: 'var(--color-primary)',
          muted: 'rgba(255, 85, 91, 0.1)',
          hover: 'var(--color-primary-hover)',
        },
        secondary: 'rgb(255, 179, 71)',
        white: {
          DEFAULT: 'var(--app-text)',
          soft: 'var(--app-text-muted)',
          muted: 'var(--app-text-muted)',
        },
        placeholder: 'var(--app-placeholder)',
        error: 'var(--color-danger)',
        success: 'rgb(74, 222, 128)',
        surface: 'var(--app-card-bg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      scale: {
        102: '1.02',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        auth: 'var(--app-shadow-auth)',
        accent: '0 0 20px rgba(79, 209, 197, 0.12)',
      },
    },
  },
  plugins: [],
}