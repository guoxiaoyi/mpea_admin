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
const CertificateList = () => import('../views/certificate/CertificateList.vue')
const CertificateSearch = () => import('../views/certificate/CertificateSearch.vue')
const PartnerList = () => import('../views/partner/PartnerList.vue')
const PartnerForm = () => import('../views/partner/PartnerForm.vue')
const KindergartenList = () => import('../views/kindergarten/KindergartenList.vue')
const KindergartenForm = () => import('../views/kindergarten/KindergartenForm.vue')
const MapContinentList = () => import('../views/map/ContinentList.vue')
const MapContinentForm = () => import('../views/map/ContinentForm.vue')
const MapMarkerList = () => import('../views/map/MarkerList.vue')
const MapMarkerForm = () => import('../views/map/MarkerForm.vue')

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
        { path: 'certificates', name: 'certificates', component: CertificateList, meta: { requiresAuth: true } },
        { path: 'partners', name: 'partners', component: PartnerList, meta: { requiresAuth: true } },
        { path: 'partners/new', name: 'partner-new', component: PartnerForm, meta: { requiresAuth: true } },
        { path: 'partners/:id', name: 'partner-edit', component: PartnerForm, meta: { requiresAuth: true } },
        { path: 'kindergartens', name: 'kindergartens', component: KindergartenList, meta: { requiresAuth: true } },
        { path: 'kindergartens/new', name: 'kindergarten-new', component: KindergartenForm, meta: { requiresAuth: true } },
        { path: 'kindergartens/:id', name: 'kindergarten-edit', component: KindergartenForm, meta: { requiresAuth: true } },
        { path: 'map/continents', name: 'map-continents', component: MapContinentList, meta: { requiresAuth: true } },
        { path: 'map/continents/new', name: 'map-continent-new', component: MapContinentForm, meta: { requiresAuth: true } },
        { path: 'map/continents/:id', name: 'map-continent-edit', component: MapContinentForm, meta: { requiresAuth: true } },
        { path: 'map/markers', name: 'map-markers', component: MapMarkerList, meta: { requiresAuth: true } },
        { path: 'map/markers/new', name: 'map-marker-new', component: MapMarkerForm, meta: { requiresAuth: true } },
        { path: 'map/markers/:id', name: 'map-marker-edit', component: MapMarkerForm, meta: { requiresAuth: true } },
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
    {
      path: '/certificate',
      name: 'certificate-search',
      component: CertificateSearch,
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
