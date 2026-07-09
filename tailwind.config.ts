import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        finora: {
          primary: '#8B3FB8',
          secondary: '#A855F7',
          dark: '#6B21A8',
          light: '#C084FC',
          gray: '#64748B',
        },
        finoradark: {
          bg: '#0a0714',
          card: '#120e20',
          card2: '#1a1530',
          border: '#2a2350',
          glow: '#8b7bf5',
          text: '#f0edff',
          textmuted: '#8b83b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
