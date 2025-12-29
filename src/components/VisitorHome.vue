<template>
  <div class="visitor-home">
    <!-- 侧边导航栏 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <div class="school-logo">
          <img src="./新希望特长学校logo.png" alt="Logo" />
          <h2 v-if="!isCollapsed">新希望特长学校</h2>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <el-icon>
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </button>
      </div>

      <!-- 访客信息 -->
      <div class="user-info" v-if="!isCollapsed">
        <div class="avatar">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="user-details">
          <h3>visitor</h3>
          <p class="role">访客</p>
        </div>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        class="nav-menu"
        :collapse="isCollapsed"
        @select="handleMenuSelect"
      >
        <el-menu-item index="visitor-dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu index="school-info">
          <template #title>
            <el-icon><School /></el-icon>
            <span>学校介绍</span>
          </template>
          <el-menu-item index="about-us">
            <el-icon><InfoFilled /></el-icon>
            <span>关于我们</span>
          </el-menu-item>
          <el-menu-item index="school-features">
            <el-icon><StarFilled /></el-icon>
            <span>学校特色</span>
          </el-menu-item>
          <el-menu-item index="facilities">
            <el-icon><OfficeBuilding /></el-icon>
            <span>教学设施</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="courses">
          <template #title>
            <el-icon><Reading /></el-icon>
            <span>课程展示</span>
          </template>
          <el-menu-item index="course-catalog">
            <el-icon><Document /></el-icon>
            <span>课程目录</span>
          </el-menu-item>
          <el-menu-item index="highlight-courses">
            <el-icon><Star /></el-icon>
            <span>精品课程</span>
          </el-menu-item>
          <el-menu-item index="teacher-team">
            <el-icon><User /></el-icon>
            <span>师资团队</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="achievements">
          <el-icon><Trophy /></el-icon>
          <span>学生成果</span>
        </el-menu-item>

        <el-menu-item index="campus-life">
          <el-icon><Picture /></el-icon>
          <span>校园生活</span>
        </el-menu-item>

        <el-sub-menu index="admissions">
          <template #title>
            <el-icon><EditPen /></el-icon>
            <span>招生信息</span>
          </template>
          <el-menu-item index="enrollment-policy">
            <el-icon><DocumentChecked /></el-icon>
            <span>招生政策</span>
          </el-menu-item>
          <el-menu-item index="apply-online">
            <el-icon><Position /></el-icon>
            <span>在线报名</span>
          </el-menu-item>
          <el-menu-item index="faq">
            <el-icon><QuestionFilled /></el-icon>
            <span>常见问题</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="contact">
          <el-icon><Phone /></el-icon>
          <span>联系我们</span>
        </el-menu-item>

        <!-- 退出系统菜单项 -->
        <el-menu-item index="logout" class="logout-menu-item" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出系统</span>
        </el-menu-item>
      </el-menu>

      <!-- 底部信息 -->
      <div class="sidebar-footer" v-if="!isCollapsed">
        <div class="contact-info">
          <p>
            <el-icon><Phone /></el-icon> 电话: 123456789
          </p>
          <p>
            <el-icon><Location /></el-icon> 地址: 日本东京
          </p>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="main-content" :class="{ 'content-expanded': isCollapsed }">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentModule }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPage }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="top-bar-actions">
          <el-button type="text" @click="showWelcomeMessage">
            <el-icon><Promotion /></el-icon>
            <span>欢迎</span>
          </el-button>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />

        <!-- 默认欢迎内容 -->
        <div v-if="showDefaultContent" class="welcome-content">
          <div class="welcome-card">
            <h1>欢迎来到新希望特长学校</h1>
            <p class="subtitle">发现潜能 · 成就未来 · 创造希望</p>

            <div class="welcome-grid">
              <div class="feature-card">
                <el-icon><School /></el-icon>
                <h3>优质教育</h3>
                <p>提供全方位、个性化的特长教育服务</p>
              </div>

              <div class="feature-card">
                <el-icon><User /></el-icon>
                <h3>专业师资</h3>
                <p>经验丰富的教师团队，关注每一位学生成长</p>
              </div>

              <div class="feature-card">
                <el-icon><Trophy /></el-icon>
                <h3>卓越成果</h3>
                <p>众多学生在各类竞赛中取得优异成绩</p>
              </div>

              <div class="feature-card">
                <el-icon><Calendar /></el-icon>
                <h3>丰富活动</h3>
                <p>多元化的校园生活和课外活动</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 欢迎对话框 -->
    <el-dialog
      title="欢迎访问新希望特长学校"
      v-model="showWelcomeDialog"
      width="500px"
      center
    >
      <div class="welcome-dialog-content">
        <el-icon size="60" color="#03a164"><School /></el-icon>
        <h3>感谢您的访问！</h3>
        <p>新希望特长学校致力于为学生提供优质的特长教育，培养全面发展的人才。</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showWelcomeDialog = false">稍后再说</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 退出确认对话框 -->
    <el-dialog title="确认退出" v-model="showLogoutDialog" width="400px" center>
      <div class="logout-dialog-content">
        <el-icon size="40" color="#e6a23c"><QuestionFilled /></el-icon>
        <h3>确定要退出系统吗？</h3>
        <p>退出后将返回到登录页面</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLogoutDialog = false">取消</el-button>
          <el-button type="warning" @click="confirmLogout">确认退出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  House,
  School,
  Reading,
  Trophy,
  Picture,
  EditPen,
  Phone,
  User,
  InfoFilled,
  StarFilled,
  OfficeBuilding,
  Document,
  Star,
  DocumentChecked,
  Position,
  QuestionFilled,
  Location,
  ChatDotRound,
  Link,
  VideoCamera,
  Promotion,
  Sunny,
  Moon,
  UserFilled,
  Fold,
  Expand,
  SwitchButton,
} from "@element-plus/icons-vue";

export default {
  name: "VisitorHome",

  components: {
    House,
    School,
    Reading,
    Trophy,
    Picture,
    EditPen,
    Phone,
    User,
    InfoFilled,
    StarFilled,
    OfficeBuilding,
    Document,
    Star,
    DocumentChecked,
    Position,
    QuestionFilled,
    Location,
    ChatDotRound,
    Link,
    VideoCamera,
    Promotion,
    Sunny,
    Moon,
    UserFilled,
    Fold,
    Expand,
    SwitchButton,
  },

  data() {
    return {
      isCollapsed: false,
      activeMenu: "visitor-dashboard",
      currentModule: "首页",
      currentPage: "欢迎",
      showWelcomeDialog: false,
      showLogoutDialog: false,
      showDefaultContent: true,
      isDarkTheme: false,

      // 模拟访客数据
      visitorStats: {
        pageViews: 1284,
        todayVisitors: 56,
      },
    };
  },

  mounted() {
    this.initRoute();
    // 首次访问显示欢迎对话框
    if (!localStorage.getItem("visitorVisited")) {
      setTimeout(() => {
        this.showWelcomeDialog = true;
        localStorage.setItem("visitorVisited", "true");
      }, 1000);
    }
  },

  methods: {
    initRoute() {
      if (this.$route.name) {
        this.activeMenu = this.$route.name;
        this.showDefaultContent = false;
      }
    },

    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },

    handleMenuSelect(index) {
      this.activeMenu = index;
      this.showDefaultContent = false;

      const routes = {
        "visitor-dashboard": {
          module: "首页",
          page: "欢迎",
          showDefault: true,
        },
        // // 学校介绍
        // "about-us": {
        //   path: "/visitor/about",
        //   module: "学校介绍",
        //   page: "关于我们",
        // },
        // "school-features": {
        //   path: "/visitor/features",
        //   module: "学校介绍",
        //   page: "学校特色",
        // },
        // facilities: {
        //   path: "/visitor/facilities",
        //   module: "学校介绍",
        //   page: "教学设施",
        // },
        // // 课程展示
        // "course-catalog": {
        //   path: "/visitor/courses",
        //   module: "课程展示",
        //   page: "课程目录",
        // },
        // "highlight-courses": {
        //   path: "/visitor/highlight-courses",
        //   module: "课程展示",
        //   page: "精品课程",
        // },
        // "teacher-team": {
        //   path: "/visitor/teachers",
        //   module: "课程展示",
        //   page: "师资团队",
        // },
        // // 其他页面
        // achievements: {
        //   path: "/visitor/achievements",
        //   module: "学生成果",
        //   page: "荣誉展示",
        // },
        // "campus-life": {
        //   path: "/visitor/campus",
        //   module: "校园生活",
        //   page: "活动照片",
        // },
        // // 招生信息
        // "enrollment-policy": {
        //   path: "/visitor/enrollment",
        //   module: "招生信息",
        //   page: "招生政策",
        // },
        // "apply-online": {
        //   path: "/visitor/apply",
        //   module: "招生信息",
        //   page: "在线报名",
        // },
        // faq: {
        //   path: "/visitor/faq",
        //   module: "招生信息",
        //   page: "常见问题",
        // },
        // contact: {
        //   path: "/visitor/contact",
        //   module: "联系我们",
        //   page: "联系方式",
        // },
      };

      if (routes[index]) {
        this.currentModule = routes[index].module;
        this.currentPage = routes[index].page;

        if (routes[index].showDefault) {
          this.showDefaultContent = true;
        } else if (routes[index].path) {
          this.$router.push(routes[index].path);
        }
      }
    },

    goToLogin() {
      this.$router.push("/login");
    },

    showWelcomeMessage() {
      this.$message({
        message: "欢迎访问新希望特长学校官方网站！",
        type: "info",
        duration: 3000,
      });
    },

    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      if (this.isDarkTheme) {
        document.documentElement.style.setProperty("--bg-color", "#1a1a1a");
        document.documentElement.style.setProperty("--text-color", "#ffffff");
      } else {
        document.documentElement.style.setProperty("--bg-color", "#f2f6fc");
        document.documentElement.style.setProperty("--text-color", "#303133");
      }
    },

    // 退出系统处理
    handleLogout() {
      this.showLogoutDialog = true;
    },

    // 确认退出
    confirmLogout() {
      // 清除访客访问记录
      localStorage.clear();

      // 显示退出提示
      this.$message({
        message: "已退出系统，返回登录页面",
        type: "warning",
        duration: 1500,
      });

      // 关闭对话框
      this.showLogoutDialog = false;

      // 延迟跳转到登录页面
      setTimeout(() => {
        this.$router.push("/login");
      }, 1000);
    },
  },
};
</script>

<style scoped>
.visitor-home {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-color, #f2f6fc);
  color: var(--text-color, #303133);
  transition: background-color 0.3s, color 0.3s;
}

/* ===================== 侧边栏 ===================== */
.sidebar {
  width: 250px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  z-index: 100;
}
/* 隐藏导航栏的滚动条 */
.sidebar::-webkit-scrollbar {
  display: none;
}
.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.school-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.school-logo img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.school-logo h2 {
  font-size: 16px;
  margin: 0;
  color: #1f2937;
  white-space: nowrap;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #3b82f6;
  transition: color 0.3s;
  padding: 5px;
  border-radius: 4px;
}

.collapse-btn:hover {
  background-color: #f3f4f6;
}

.sidebar-collapsed .sidebar-header {
  justify-content: center;
}

/* ===================== 用户信息 ===================== */
.user-info {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.avatar {
  width: 50px;
  height: 50px;
  background: #f0f9ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ee9025;
  font-size: 22px;
  flex-shrink: 0;
}

.user-details h3 {
  margin: 0 0 3px 0;
  font-size: 16px;
  color: #ee9025;
  font-weight: 600;
}

.user-details .role {
  margin: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #f0f9ff;
  color: #ee9025;
  display: inline-block;
}

/* ===================== 菜单 ===================== */
.nav-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
  padding: 10px 8px;
}

.nav-menu:not(.el-menu--collapse) {
  width: 100%;
}

.nav-menu .el-menu-item,
.nav-menu .el-submenu__title {
  height: 48px;
  line-height: 48px;
  color: #4b5563;
  font-weight: 500;
  display: flex;
  align-items: center;
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.25s;
  padding: 0 12px;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-submenu__title:hover {
  background-color: #eff6ff;
  color: #2563eb;
}

.nav-menu .el-menu-item.is-active {
  background-color: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

.nav-menu .el-icon {
  margin-right: 10px;
  color: inherit;
  flex-shrink: 0;
}


/* 退出菜单项样式 */
.logout-menu-item {
  background-color: #fef6e6 !important;
  color: #e6a23c !important;
  margin-top: 10px !important;
  border: 1px solid #fdf0d7 !important;
  font-weight: 600 !important;
}

.logout-menu-item:hover {
  background-color: #fdf4dc !important;
  color: #e6a23c !important;
}

.logout-menu-item .el-icon {
  color: #e6a23c !important;
}

/* ===================== 底部信息 ===================== */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.contact-info p {
  margin: 8px 0;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ===================== 主内容区 ===================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s;
}

.content-expanded {
  margin-left: 0;
}

.top-bar {
  height: 60px;
  background: #ffffff;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s;
}

.breadcrumb {
  font-size: 14px;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}


/* ===================== 页面内容 ===================== */
.page-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  transition: all 0.3s;
}

/* 欢迎内容样式 */
.welcome-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.welcome-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s;
}

.welcome-card h1 {
  color: #1f2937;
  font-size: 36px;
  margin-bottom: 10px;
  font-weight: 700;
}

.subtitle {
  color: #6b7280;
  font-size: 18px;
  margin-bottom: 40px;
  font-weight: 400;
}

.welcome-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin: 40px 0;
}

.feature-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
  height: 100%;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #03a164;
}

.feature-card .el-icon {
  font-size: 40px;
  color: #03a164;
  margin-bottom: 16px;
  transition: color 0.3s;
}

.feature-card h3 {
  color: #1f2937;
  margin: 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.feature-card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  flex-wrap: wrap;
}

/* 欢迎对话框样式 */
.welcome-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.welcome-dialog-content h3 {
  margin: 20px 0 10px;
  color: #1f2937;
  font-weight: 600;
}

.welcome-dialog-content p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 10px;
}

/* 退出对话框样式 */
.logout-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.logout-dialog-content h3 {
  margin: 15px 0 10px;
  color: #e6a23c;
  font-weight: 600;
}

.logout-dialog-content p {
  color: #909399;
  line-height: 1.6;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .top-bar-actions {
    gap: 8px;
  }

  .top-bar-actions .logout-btn span {
    display: none;
  }

  .top-bar-actions .logout-btn .el-icon{
    margin-right: 0;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  .main-content {
    width: 100%;
  }

  .welcome-card {
    padding: 20px;
  }

  .welcome-card h1 {
    font-size: 28px;
  }

  .subtitle {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .top-bar {
    padding: 0 10px;
  }

  .page-content {
    padding: 10px;
  }

  .welcome-content {
    padding: 20px 10px;
  }

  .feature-card {
    padding: 16px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-card,
.feature-card,
.dialog-content {
  animation: fadeIn 0.5s ease-out;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .visitor-home:not(.light-theme) {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
  }

  .visitor-home:not(.light-theme) .sidebar,
  .visitor-home:not(.light-theme) .top-bar,
  .visitor-home:not(.light-theme) .welcome-card,
  .visitor-home:not(.light-theme) .feature-card {
    background-color: #2d2d2d;
    color: #ffffff;
    border-color: #404040;
  }

  .visitor-home:not(.light-theme) .feature-card {
    background-color: #363636;
  }

  .visitor-home:not(.light-theme) .welcome-card h1,
  .visitor-home:not(.light-theme) .feature-card h3,
  .visitor-home:not(.light-theme) .welcome-dialog-content h3 {
    color: #ffffff;
  }

  .visitor-home:not(.light-theme) .subtitle,
  .visitor-home:not(.light-theme) .feature-card p,
  .visitor-home:not(.light-theme) .welcome-dialog-content p {
    color: #b0b0b0;
  }
}
</style>
