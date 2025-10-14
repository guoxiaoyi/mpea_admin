import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const Login = () => import('../views/Login.vue')
const Layout = () => import('../views/Layout.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const PageList = () => import('../views/page/PageList.vue')
const PageForm = () => import('../views/page/PageForm.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/admin',
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
        { path: 'pages', name: 'pages', component: PageList, meta: { requiresAuth: true } },
        { path: 'pages/new', name: 'page-new', component: PageForm, meta: { requiresAuth: true } },
      ]
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && token) {
    next({ path: '/admin' })
  } else {
    next()
  }
})

export default router
