import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/ReportDashboardView.vue'),
    },
    {
      path: '/sales/item-detail',
      name: 'item-detail',
      component: () => import('../views/SalesItemDetailView.vue'),
    },
    {
      path: '/product/costs',
      name: 'product-costs',
      component: () => import('../views/ProductCostManagement.vue'),
    },
    {
      path:'/promotion/management',
      name:'promotion-management',
      component: () => import('../views/PromotionManagementView.vue'),
    },
    {
      path: '/other-expense',
      name: 'other-expense',
      component: () => import('../views/OtherExpenseView.vue'),
    },
  ],
})

export default router
