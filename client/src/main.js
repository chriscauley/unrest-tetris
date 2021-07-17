import { createApp } from 'vue'
import '@unrest/tailwind/dist.css'
import unrest from '@unrest/vue'
import form from '@unrest/vue-form'

import App from './App.vue'
import router from './router'
import store from './store'
import DebugForm from '@/components/DebugForm'
import NewGameForm from '@/components/NewGameForm'

createApp(App)
  .use(router)
  .use(unrest.ui)
  .use(store)
  .use(form.plugin)
  .component('DebugForm', DebugForm)
  .component('NewGameForm', NewGameForm)
  .mount('#app')
