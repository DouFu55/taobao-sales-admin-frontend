import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';
import axios from '../src/utils/require'


import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(TDesign);

app.config.globalProperties.$http = axios

app.mount('#app')
