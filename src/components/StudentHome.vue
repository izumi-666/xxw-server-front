<template>
  <div class="student-home">
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

      <!-- 用户信息 -->
      <div class="user-info" v-if="!isCollapsed">
        <div class="avatar">
          <el-icon><User /></el-icon>
        </div>
        <div class="user-details">
          <h3>{{ userName }}</h3>
          <p class="role">学生</p>
        </div>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        class="nav-menu"
        :collapse="isCollapsed"
        @select="handleMenuSelect"
      >
        <el-menu-item index="student-dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-menu-item index="self-analysis">
          <el-icon><DataAnalysis /></el-icon>
          <span>自我分析</span>
        </el-menu-item>

        <el-menu-item index="homework">
          <el-icon><Notebook /></el-icon>
          <span>课后作业</span>
        </el-menu-item>

        <el-menu-item index="online-class">
          <el-icon><School /></el-icon>
          <span>线上课堂</span>
        </el-menu-item>

        <!-- 自主学习 -->
        <el-sub-menu index="self-study">
          <template #title>
            <el-icon><Collection /></el-icon>
            <span>自主学习</span>
          </template>
          <el-menu-item index="learning-resources">
            <el-icon><Reading /></el-icon>
            <span>学习资源</span>
          </el-menu-item>
          <el-menu-item index="self-learning">
            <el-icon><Calendar /></el-icon>
            <span>自主练题</span>
          </el-menu-item>
          <el-menu-item index="mistakes-book">
            <el-icon><EditPen /></el-icon>
            <span>错题本</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="student-settings">
          <el-icon><Setting /></el-icon>
          <span>个人设置</span>
        </el-menu-item>
      </el-menu>

      <!-- 底部退出 -->
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span v-if="!isCollapsed">退出登录</span>
        </button>
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
          <el-button type="text" @click="showNotifications">
            <el-icon><Bell /></el-icon>
            <span class="badge" v-if="notificationCount > 0">
              {{ notificationCount }}
            </span>
          </el-button>

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
                <el-dropdown-item command="student-settings">
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

    <!-- 通知抽屉 -->
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
  name: "StudentHome",

  data() {
    return {
      isCollapsed: false,
      activeMenu: "student-dashboard",
      currentModule: "首页",
      currentPage: "仪表板",
      userName: localStorage.getItem("userName") || "学生",
      notificationCount: 2,
      showNotificationDrawer: false,

      notifications: [
        {
          id: 1,
          title: "作业提醒",
          message: "数学第5章作业今晚11点前提交",
          time: "20分钟前",
          read: false,
        },
        {
          id: 2,
          title: "课堂直播链接更新",
          message: "明天的语文课直播地址已更新",
          time: "1小时前",
          read: true,
        },
      ],
    };
  },

  mounted() {
    this.checkLoginStatus();
    this.initRoute();
  },

  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem("token");
      const tokenExpire = localStorage.getItem("tokenExpire");

      if (!token || Date.now() > Number(tokenExpire)) {
        this.$router.push("/login");
      }
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
        "student-dashboard": {
          path: "/student/dashboard",
          module: "首页",
          page: "仪表板",
        },
        "self-analysis": {
          path: "/student/self/analysis",
          module: "自我分析",
          page: "数据分析",
        },
        homework: {
          path: "/student/homework",
          module: "课后作业",
          page: "作业列表",
        },
        "online-class": {
          path: "/student/online/class",
          module: "线上课堂",
          page: "课程直播",
        },
        // 自主学习子项的路由映射
        "learning-resources": {
          path: "/student/self/study/resources",
          module: "自主学习",
          page: "学习资源",
        },
        "study-plan": {
          path: "/student/self/study/plan",
          module: "自主学习",
          page: "学习计划",
        },
        "mistakes-book": {
          path: "/student/self/study/mistakes",
          module: "自主学习",
          page: "错题本",
        },
        "student-settings": {
          path: "/student/settings",
          module: "设置",
          page: "个人设置",
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
      this.notificationCount = 0;
    },

    handleUserCommand(command) {
      if (command === "logout") this.handleLogout();
      else this.$router.push(`/student/${command}`);
    },

    handleLogout() {
      this.$confirm("确定退出登录？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          localStorage.clear();
          this.$message.success("已退出登录");
          this.$router.push("/login");
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.student-home {
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
  color: #018a55;
  font-size: 22px;
}

.user-details h3 {
  margin: 0 0 3px 0;
  font-size: 16px;
  color: #03a164;
}

.user-details .role {
  margin: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #e0f2fe;
  color:#03a164;
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

/* 子菜单项样式 */
.nav-menu .el-menu-item {
  padding-left: 40px !important;
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