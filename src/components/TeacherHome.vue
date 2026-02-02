<template>
  <div class="teacher-home">
    <!-- 侧边导航栏 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <div class="school-logo">
          <img src="./新希望特长学校logo.png" alt="学校Logo" />
          <h2 v-if="!isCollapsed">新希望特长学校</h2>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <el-icon>
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </button>
      </div>

      <!-- 用户信息 -->
      <div class="user-info" v-if="!isCollapsed">
        <div class="avatar">
          <el-icon><User /></el-icon>
        </div>
        <div class="user-details">
          <h3>{{ userName }}</h3>
          <p class="role">教师</p>
        </div>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        class="nav-menu"
        :collapse="isCollapsed"
        @select="handleMenuSelect"
      >
        <el-menu-item index="dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu index="analysis">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>学情分析</span>
          </template>
          <el-menu-item index="overall">整体分析</el-menu-item>
          <el-menu-item index="student-analysis">学生分析</el-menu-item>
          <el-menu-item index="score-trend">成绩趋势</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="students">
          <template #title>
            <el-icon><User /></el-icon>
            <span>学生管理</span>
          </template>
          <el-menu-item index="student-list">班级学情</el-menu-item>
          <el-menu-item index="student-info">学生学情</el-menu-item>
          <el-menu-item index="account-management">账户管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="classroom">
          <template #title>
            <el-icon><School /></el-icon>
            <span>班级课堂</span>
          </template>
          <el-menu-item index="class-schedule">课程表</el-menu-item>
          <el-menu-item index="live-class">在线课堂</el-menu-item>
          <el-menu-item index="exam-management">考试中心</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="teaching">
          <template #title>
            <el-icon><Notebook /></el-icon>
            <span>教学管理</span>
          </template>
          <el-menu-item index="course-materials">教学总览</el-menu-item>
          <el-menu-item index="homework-management">课堂作业</el-menu-item>
          <el-menu-item index="paper-management">试卷管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="question-bank">
          <el-icon><Collection /></el-icon>
          <span>题库录入</span>
        </el-menu-item>

        <el-menu-item 
      v-if="shouldShowReviewMenu()"
      index="question-review"
    >
      <el-icon><Checked /></el-icon>
      <span>审核题目</span>
    </el-menu-item>

        <el-menu-item index="knowledgepoint-management">
          <el-icon><Document /></el-icon>
          <span>知识点管理</span>
        </el-menu-item>

        <el-menu-item index="settings">
          <el-icon><Setting /></el-icon>
          <span>个人设置</span>
        </el-menu-item>
      </el-menu>

      <!-- 底部操作 -->
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span v-if="!isCollapsed">退出登录</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" :class="{ 'content-expanded': isCollapsed }">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, idx) in breadcrumbs" :key="idx">
              {{ item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="top-bar-actions">
          <!-- <el-button type="text" @click="showNotifications">
            <el-icon><Bell /></el-icon>
            <span class="badge" v-if="notificationCount > 0">{{
              notificationCount
            }}</span>
          </el-button> -->

          <el-dropdown @command="handleUserCommand">
            <span class="user-dropdown">
              {{ userName }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </div>

    <!-- 通知面板 -->
    <el-drawer title="通知" v-model="showNotificationDrawer" direction="rtl" size="300px">
      <div class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.message }}</p>
            <span class="time">{{ notification.time }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
export default {
  name: "TeacherHome",

  data() {
    return {
      isCollapsed: false,
      activeMenu: "dashboard",
      breadcrumbs: [],
      currentModule: "首页",
      currentPage: "仪表板",
      userName: localStorage.getItem("userName") || "教师",
      // notificationCount: 3,
      showNotificationDrawer: false,
      userPermissions: [],

      notifications: [
      ],
    };
  },

  mounted() {

    this.initRoute();
    this.loadUserPermissions();
  },

  methods: {
      // 加载用户权限
  loadUserPermissions() {
    const permissionsStr = localStorage.getItem("userPermissions");
    if (permissionsStr) {
      try {
        this.userPermissions = JSON.parse(permissionsStr);
      } catch (e) {
        console.error("解析用户权限失败", e);
        this.userPermissions = [];
      }
    }
  },
  
  // 检查是否显示审核题目菜单
  shouldShowReviewMenu() {
    // 检查是否是 ROLE_ROOT 或 ROLE_ADMINISTRATOR
    return this.userPermissions.some(permission => 
      permission === "ROLE_ROOT" || permission === "ROLE_ADMINISTRATOR"
    );
  },

    initRoute() {
      if (this.$route.name) this.activeMenu = this.$route.name;
    },

    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },

    handleMenuSelect(index) {
      this.activeMenu = index;

      const routes = {
        dashboard: { path: "/teacher/teacherdashboard", module: "首页", page: "仪表板" },
        overall: 
        {
          // path: "/teacher/analysis/overall",
          module: "学情分析",
          page: "整体分析",
        },
         "exam-management": {
          path: "/teacher/exammanagement",
          module: "班级课堂",
          page: "考试中心",
        },
        "homework-management": {
          path: "/teacher/homework",
          module: "教学管理",
          page: "课堂作业",
        },
        "account-management": {
          path: "/teacher/accountmanagement",
          module: "学生管理",
          page: "学生列表",
        },
        "class-schedule": {
          // path: "/teacher/classroom/schedule",
          module: "班级课堂",
          page: "课程表",
        },
        "course-materials": {
          // path: "/teacher",
          module: "教学管理",
          page: "课程资料",
        },
        "paper-management": {
          path: "/teacher/paper",
          module: "教学管理",
          page: "试卷管理",
        },
        "question-bank": {
          path: "/teacher/upload",
          module: "题库录入",
          page: "题库管理",
        },
        "question-review": {
        path: "/teacher/review",
        module: "题库审核",
        page: "题目审核",
      },
        // settings: { path: "/teacher/settings", module: "个人设置", page: "账户设置" },
        "knowledgepoint-management": {
          path: "/teacher/knowledgepointmanagement",
          module: "知识点管理",
          page: "知识点管理",
        },
      };

      if (routes[index]) {
        this.currentModule = routes[index].module;
        this.currentPage = routes[index].page;
        this.$router.push(routes[index].path);
      }
    },

    showNotifications() {
      this.showNotificationDrawer = true;
      // this.notificationCount = 0;
    },

    handleUserCommand(command) {
      if (command === "logout") this.handleLogout();
      else this.$router.push(`/teacher/${command}`);
    },

    handleLogout() {
      this.$confirm("确定要退出登录吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          localStorage.clear();
          this.$router.push("/login");
          this.$message.success("已退出登录");
        })
        .catch(() => {});
    },
  },
watch: {
    $route(to) {
      if (to.meta && to.meta.breadcrumb) {
        this.breadcrumbs = to.meta.breadcrumb;
      }
    },
  },
};
</script>

<style scoped>
.teacher-home {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f2f6fc; /* 明亮浅灰背景 */
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
}

.school-logo h2 {
  font-size: 16px;
  margin: 0;
  color: #1f2937;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #3b82f6;
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
}

.avatar {
  width: 50px;
  height: 50px;
  background: #bfdbfe; /* 浅蓝背景 */
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e40af;
  font-size: 22px;
}

.user-details h3 {
  margin: 0 0 3px 0;
  font-size: 16px;
  color: #0369a1;
}

.user-details .role {
  margin: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #e0f2fe;
  color: #0369a1;
}

/* ===================== 菜单 ===================== */
.nav-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
}

.nav-menu .el-menu-item,
.nav-menu .el-submenu__title {
  height: 48px;
  color: #4b5563;
  font-weight: 500;
  display: flex;
  align-items: center;
  border-radius: 8px;
  margin: 4px 8px;
  transition: background-color 0.25s;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-submenu__title:hover {
  background-color: #eff6ff; /* 浅蓝 hover */
  color: #2563eb;
}

.nav-menu .el-menu-item.is-active {
  background-color: #dbeafe;
  color: #1e40af;
  border-right: 0;
  font-weight: 600;
}

.nav-menu .el-icon {
  margin-right: 10px;
  color: inherit;
}

/* ===================== 底部退出按钮 ===================== */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  transition: background 0.25s;
}

.logout-btn:hover {
  background: #e5e7eb;
}

/* ===================== 主内容区 ===================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
}

.breadcrumb {
  font-size: 14px;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.badge {
  background: #ef4444;
  color: white;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 16px;
  height: 16px;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center;
}

.user-dropdown {
  cursor: pointer;
  color: #374151;
  font-weight: 500;
}

.user-dropdown:hover {
  color: #2563eb;
}

/* ===================== 页面内容 ===================== */
.page-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* ===================== 通知抽屉 ===================== */
.notification-list {
  padding: 10px;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 6px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.notification-item:hover {
  background-color: #f0f9ff;
}

.notification-item.unread {
  background-color: #dbeafe;
}

.notification-content h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  color: #1e3a8a;
}

.notification-content p {
  margin: 0 0 5px 0;
  font-size: 13px;
  color: #4b5563;
}

.notification-content .time {
  font-size: 12px;
  color: #6b7280;
}
</style>
