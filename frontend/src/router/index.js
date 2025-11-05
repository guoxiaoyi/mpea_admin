import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const Login = () => import('../views/Login.vue')
const Layout = () => import('../views/Layout.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const PageList = () => import('../views/page/PageList.vue')
const PageForm = () => import('../views/page/PageForm.vue')
const QwenImage = () => import('../views/ai/QwenImage.vue')
const CaseList = () => import('../views/case/CaseList.vue')
const CaseForm = () => import('../views/case/CaseForm.vue')
const LecturerList = () => import('../views/lecturer/LecturerList.vue')
const LecturerForm = () => import('../views/lecturer/LecturerForm.vue')

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
        { path: 'pages/:id', name: 'page-edit', component: PageForm, meta: { requiresAuth: true } },
        { path: 'cases', name: 'cases', component: CaseList, meta: { requiresAuth: true } },
        { path: 'cases/new', name: 'case-new', component: CaseForm, meta: { requiresAuth: true } },
        { path: 'cases/:id', name: 'case-edit', component: CaseForm, meta: { requiresAuth: true } },
        { path: 'lecturers', name: 'lecturers', component: LecturerList, meta: { requiresAuth: true } },
        { path: 'lecturers/new', name: 'lecturer-new', component: LecturerForm, meta: { requiresAuth: true } },
        { path: 'lecturers/:id', name: 'lecturer-edit', component: LecturerForm, meta: { requiresAuth: true } },
        { path: 'ai-images', name: 'ai-images', component: QwenImage, meta: { requiresAuth: true } },
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
