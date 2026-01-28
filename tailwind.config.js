/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors from PRD
        'timeline-bg': '#252526',
        'selection-bg': 'rgba(0, 127, 212, 0.2)',
        'selection-border': '#007fd4',
        'log-error': '#f48771', // soft red
        'log-warn': '#cca700', // dark yellow
        'log-info': '#75beff', // sky blue
        'log-time': '#4ec9b0', // cyan
      }
    },
  },
  plugins: [],
}
