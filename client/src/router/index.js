import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../views/CalendarView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/MapView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/events/create',
    name: 'CreateEvent',
    component: () => import('../views/CreateEventView.vue'),
    meta: { requiresAuth: true, roles: ['organisateur', 'admin'] },
  },
  {
    path: '/events/:id',
    name: 'EventDetail',
    component: () => import('../views/EventDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/events/:id/edit',
    name: 'EditEvent',
    component: () => import('../views/EditEventView.vue'),
    meta: { requiresAuth: true, roles: ['organisateur', 'admin'] },
  },
  {
    path: '/events/:id/scan',
    name: 'ScanQR',
    component: () => import('../views/ScanQRView.vue'),
    meta: { requiresAuth: true, roles: ['organisateur', 'admin'] },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/my-data',
    name: 'MyData',
    component: () => import('../views/MyDataView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/PrivacyView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Route nécessite une authentification
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' })
  }

  // Route réservée aux invités (login/register)
  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Vérification des rôles
  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
