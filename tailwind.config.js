/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          // 设置默认字体为 'Inter'，与 Tailwind 的默认字体保持一致
          sans: ['Inter', 'system-ui', 'sans-serif'], 
        },
      },
    },
    plugins: [],
  }