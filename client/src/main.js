import { createApp } from 'vue'
import '@unrest/tailwind/dist.css'
import unrest from '@unrest/vue'
import form from '@unrest/vue-form'

import App from './App.vue'
import router from './router'
import store from './store'

createApp(App)
  .use(router)
  .use(unrest.ui)
  .use(store)
  .use(form.plugin)
  .mount('#app')
