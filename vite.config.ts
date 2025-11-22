import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
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
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      resolvers: [ElementPlusResolver()],
      dts: path.resolve(__dirname, 'src', 'renderer', 'auto-imports.d.ts'),
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
      dts: path.resolve(__dirname, 'src', 'renderer', 'components.d.ts'),
    }),
  ],
}))
