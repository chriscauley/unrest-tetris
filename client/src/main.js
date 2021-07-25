import { createApp } from 'vue'
import unrest from '@unrest/vue'
import form from '@unrest/vue-form'

import App from './App.vue'
import router from './router'
import store from './store'
import DebugForm from '@/components/DebugForm'
import NewGameForm from '@/components/NewGameForm'

import '@unrest/tailwind/dist.css'
import '@/styles/base.scss'

module.hot.addStatusHandler(() => window.location.reload())

createApp(App)
  .use(router)
  .use(unrest.plugin)
  .use(unrest.ui)
  .use(store)
  .use(form.plugin)
  .component('DebugForm', DebugForm)
  .component('NewGameForm', NewGameForm)
  .mount('#app')
