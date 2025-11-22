import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'

export default defineConfig(({ command, mode }) => ({
  root: path.resolve(__dirname, 'src', 'renderer'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist', 'renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src', 'renderer', 'index.html'),
    },
  },
  plugins: [vue()],
}))
