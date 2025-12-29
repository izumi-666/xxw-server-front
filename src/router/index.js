import { createRouter, createWebHistory } from "vue-router";
import Login from "../Login.vue";
import QuestionManager from "../components/QuestionManager.vue";
import PaperManagement from "../components/PaperManagement.vue";
import ExamManagement from "../components/ExamManagement.vue"; //教师用
import ExamDashboard from "../components/ExamDashboard.vue"; //学生用
import TeacherHome from "../components/TeacherHome.vue";
import StudentHome from "../components/StudentHome.vue";
import VisitorHome from "../components/VisitorHome.vue";
import AccountManagement from "../components/AccountManagement.vue";
import TeacherDashboard from "../components/TeacherDashboard.vue";
import StudentDashboard from "../components/StudentDashboard.vue";
import HomeworkManagement from "../components/HomeworkManagement.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/student", 
    component: StudentHome,  
    meta: { requiresAuth: true },
    children: [
      {
        path: "studentdashboard",
        name: "student-dashboard",
        component: StudentDashboard,
        meta: { requiresAuth: true,
          breadcrumb: ["首页"]
         }
      },
      {
        path: "exammanagement",
        name: "student-exammanagement",
        component: ExamDashboard,
        meta: { requiresAuth: true,
          breadcrumb: ["考试中心"]
         }
      }
    ]},
  { path: "/visitor", component: VisitorHome,  meta: { requiresAuth: true },},
  {
    path: "/teacher",
    component: TeacherHome,
    meta: { requiresAuth: true },
    children: [
      {
        path: "teacherdashboard",
        name: "teacher-dashboard",
        component: TeacherDashboard,
        meta: { requiresAuth: true,
          breadcrumb: ["首页"]
         }
      },
      {
        path: "accountmanagement",
        name: "account-management",
        component: AccountManagement,
        meta: { requiresAuth: true,
          breadcrumb: ["学生管理", "账户管理"]
         }
      },
      {
        path: "exammanagement",
        name: "exam-management",
        component: ExamManagement,
        meta: { requiresAuth: true,
          breadcrumb: ["班级课堂", "考试中心"]
         }
      },
      {
        path: "upload",
        name: "question-bank",
        component: QuestionManager,
        meta: { requiresAuth: true,
          breadcrumb: ["教学管理", "题库录入"]
         }
      },
      {
        path: "paper",
        name: "paper-management",
        component: PaperManagement,
        meta: { requiresAuth: true,
           breadcrumb: ["教学管理", "试卷管理"]
        }
      },
       {
        path: "homework",
        name: "homework-management",
        component: HomeworkManagement,
        meta: { requiresAuth: true,
           breadcrumb: ["教学管理", "课堂作业"]
        }
      },
      {
      path: "paper/assemblequestion",
      name: "assemble-questions",
      component: () => import("../components/AssembleQuestions.vue"),
      meta: { requiresAuth: true,
           breadcrumb: ["教学管理", "试卷管理", "手动组卷"]
        }
    },
       {
      path: "paper/autoassemblequestion",
      name: "auto-assemble-questions",
      component: () => import("../components/AutoAssembleQuestions.vue"),
      meta: { requiresAuth: true,
           breadcrumb: ["教学管理", "试卷管理", "自动组卷"]
        }
    },
]}]

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
