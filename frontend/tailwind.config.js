/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: { colors: { paper: 'var(--paper)', panel: 'var(--panel)', ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)', accent: 'var(--accent)' }, fontFamily: { sans: ['Inter', 'Segoe UI', 'sans-serif'], display: ['Georgia', 'serif'] } } },
  plugins: [],
};
