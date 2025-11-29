import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  
  // 解决 ESLint 的报错，确保使用 .jsx 文件
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})