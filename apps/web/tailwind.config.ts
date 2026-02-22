import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface100: 'var(--surface-100)',
        surface200: 'var(--surface-200)',
        surface300: 'var(--surface-300)',
        surface400: 'var(--surface-400)',
        textPrimary: 'var(--white-alpha-90)',
        textSecondary: 'var(--white-alpha-60)',
        textMuted: 'var(--white-alpha-40)',
        success: 'var(--success)',
        info: 'var(--info-icon)',
      },
      borderRadius: {
        tokenSm: '4px',
        tokenMd: '8px',
        tokenLg: '12px',
        tokenXl: '16px',
        token2xl: '20px',
      },
      boxShadow: {
        card: '0 4px 32px rgba(0,0,0,0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
