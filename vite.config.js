import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',  //资源路径用相对路径
  server: {
    proxy: {
      '/api': 'http://192.168.50.39:5080' // 简写形式
    }
  }
})
