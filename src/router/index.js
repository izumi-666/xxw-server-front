import { createRouter, createWebHistory } from "vue-router";
import Login from "../Login.vue";
import QuestionManager from "../components/QuestionManager.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/upload", component: QuestionManager, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
// 全局前置守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");

  // 读取 meta.requiresAuth
  if (to.meta.requiresAuth && !token) {
    next("/login"); // 没登录就跳回登录页
  } else {
    next(); // 否则放行
  }
});

export default router;
