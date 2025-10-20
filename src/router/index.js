import { createRouter, createWebHistory } from "vue-router";
import Login from "../Login.vue";
import QuestionManager from "../components/QuestionManager.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/upload", component: QuestionManager },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
