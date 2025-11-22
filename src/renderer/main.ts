import { createApp } from 'vue'
import App from './App.vue'
// Element Plus will be auto-imported per-component via Vite plugins (unplugin),
// avoid importing the whole library and its full css here to reduce bundle size.
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)
app.mount('#app')
