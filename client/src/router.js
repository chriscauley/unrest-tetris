import { createRouter, createWebHashHistory } from 'vue-router'
import unrest from '@unrest/vue'

import views from '@/views'

const routes = unrest.loadViews(views)

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
