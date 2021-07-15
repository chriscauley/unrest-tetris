import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/Home'

const routes = [{ component: Home, path: '/' }]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
