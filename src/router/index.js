import { createRouter, createWebHistory } from "vue-router";
import Login from "../Login.vue";
import QuestionManager from "../components/QuestionManager.vue";
import PaperManagement from "../components/PaperManagement.vue";
import ExamManagement from "../components/ExamManagement.vue"; //考试管理(教师用)
import KnowledgePointManagement from "../components/KnowledgePointManagement.vue";//知识点管理
import AssessExam from "../components/AssessExam.vue"; //批改考试
import ExamDashboard from "../components/ExamDashboard.vue"; //学生用
import TakeExam from "../components/TakeExam.vue"; //学生参加考试
import StudentViewResults from "../components/StudentViewResults.vue"; //学生查看考试结果
import StudentMistakesBook from "../components/StudentMistakesBook.vue"; //学生错题本
import SelfAssessment from "../components/SelfAssessment.vue"; //学生自我评测
import SelfTakeExam from "../components/SelfTakeExam.vue"; 
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
  {
    path: "/student",
    component: StudentHome,
    meta: { requiresAuth: true },
    children: [
      {
        path: "studentdashboard",
        name: "student-dashboard",
        component: StudentDashboard,
        meta: {
          requiresAuth: true,
          breadcrumb: ["首页"]
        }
      },
      {
        path: "exammanagement",
        name: "student-exammanagement",
        component: ExamDashboard,
        meta: {
          requiresAuth: true,
          breadcrumb: ["考试中心"]
        }
      },
      {
        path: "exammanagement/studentviewresults",
        name: "student-view-results",
        component: StudentViewResults,
        meta: {
          requiresAuth: true,
          breadcrumb: ["考试中心", "成绩预览"]
        }
      },
      {
        path: "exammanagement/take",
        name: "take-exam",
        component: TakeExam,
        meta: {
          requiresAuth: true,
          breadcrumb: ["考试中心", "参加考试"]
        }
      },
      {
        path: "mistakesbook",
        name: "student-mistakes-book",
        component: StudentMistakesBook,
        meta: {
          requiresAuth: true,
          breadcrumb: ["自主学习", "错题本"]
        }
      },
      {
        path: "selfassessment",
        name: "self-assessment",
        component: SelfAssessment,
        meta: {
          requiresAuth: true,
          breadcrumb: ["自主学习", "自我评测"]
        }
      },
      {
        path: "selfassessment/selfassessment",
        name: "self-take-exam",
        component: SelfTakeExam,
        meta: {
          requiresAuth: true,
          breadcrumb: ["自主学习", "自我评测" , "评测考试"]
        }
      },
    ]
  },
  { path: "/visitor", component: VisitorHome, meta: { requiresAuth: true }, },
  {
    path: "/teacher",
    component: TeacherHome,
    meta: { requiresAuth: true },
    children: [
      {
        path: "teacherdashboard",
        name: "teacher-dashboard",
        component: TeacherDashboard,
        meta: {
          requiresAuth: true,
          breadcrumb: ["首页"]
        }
      },
      {
        path: "accountmanagement",
        name: "account-management",
        component: AccountManagement,
        meta: {
          requiresAuth: true,
          breadcrumb: ["学生管理", "账户管理"]
        }
      },
      {
        path: "exammanagement",
        name: "exam-management",
        component: ExamManagement,
        meta: {
          requiresAuth: true,
          breadcrumb: ["班级课堂", "考试中心"]
        }
      },
      {
        path: "exammanagement/assessexam",
        name: "assess-exam",
        component: AssessExam,
        meta: {
          requiresAuth: true,
          breadcrumb: ["班级课堂", "考试中心", "批改考试"]
        }
      },
      {
        path: "knowledgepointmanagement",
        name: "knowledge-point-management",
        component: KnowledgePointManagement,
        meta: {
          requiresAuth: true,
          breadcrumb: ["教学管理", "知识点管理"]
        }
      },
      {
        path: "upload",
        name: "question-bank",
        component: QuestionManager,
        meta: {
          requiresAuth: true,
          breadcrumb: ["教学管理", "题库录入"]
        }
      },
      {
        path: "paper",
        name: "paper-management",
        component: PaperManagement,
        meta: {
          requiresAuth: true,
          breadcrumb: ["教学管理", "试卷管理"]
        }
      },
      {
        path: "homework",
        name: "homework-management",
        component: HomeworkManagement,
        meta: {
          requiresAuth: true,
          breadcrumb: ["教学管理", "课堂作业"]
        }
      },
      {
        path: "paper/assemblequestion",
        name: "assemble-questions",
        component: () => import("../components/AssembleQuestions.vue"),
        meta: {
          requiresAuth: true,
          breadcrumb: ["教学管理", "试卷管理", "手动组卷"]
        }
      },
      {
        path: "paper/autoassemblequestion",
        name: "auto-assemble-questions",
        component: () => import("../components/AutoAssembleQuestions.vue"),
        meta: {
          requiresAuth: true,
          breadcrumb: ["教学管理", "试卷管理", "自动组卷"]
        }
      },
    ]
  }]

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
