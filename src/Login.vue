<template>
  <div id="app">
    <!-- 登录页面整体包裹容器 -->
    <div class="login-wrapper">
      <!-- 登录卡片主体 -->
      <div class="login-card">
        <!-- 顶部 Logo -->
        <div class="logo">
          <img src="./components/新希望特长学校logo.png" alt="新希望特长学校" />
        </div>

        <!-- 登录表单区域 -->
        <div class="tab-content">
          <form @submit.prevent="handleLogin">
            <!-- 用户名输入框 -->
            <label for="username">用户名</label>
            <input type="text" id="username" v-model="username" placeholder="请输入用户名" />

            <!-- 密码输入框 -->
            <label for="password">密码</label>
            <input type="password" id="password" v-model="password" placeholder="请输入密码" />

            <!-- 登录按钮 -->
            <button type="submit" class="login-btn" :disabled="loading">
              {{ loading ? "登录中..." : "登 录" }}
            </button>
          </form>
        </div>

        <!-- 底部协议声明 -->
        <div class="privacy">
          登录即代表同意 <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content">
        <h3 class="modal-title">{{ modalTitle }}</h3>
        <p class="modal-message">{{ modalMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "Login",
  data() {
    return {
      username: "", // 用户输入的用户名
      password: "", // 用户输入的密码
      loading: false, // 登录按钮加载状态
      showModal: false, // 是否显示弹窗
      modalTitle: "", // 弹窗标题
      modalMessage: "", // 弹窗消息
      modalTimer: null // 弹窗定时器
    };
  },

  mounted() {
    const token = localStorage.getItem("token");
    const tokenExpire = localStorage.getItem("tokenExpire");
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

    if (token && tokenExpire && Date.now() < Number(tokenExpire)) {
      this.redirectByPermissions(permissions);
    }
  },

  methods: {
    // 根据角色跳转到对应页面
    redirectByPermissions(permissions) {
      if (permissions.includes("ROLE_ROOT") ||
          permissions.includes("ROLE_ADMINISTRATOR") ||
          permissions.includes("ROLE_TEACHER")) {
        this.$router.push("/teacher/teacherdashboard");
      } else if (permissions.includes("ROLE_STUDENT")) {
        this.$router.push("/student/studentdashboard");
      } else if (permissions.includes("ROLE_VISITOR")) {
        this.$router.push("/visitor");
      } else {
        this.$router.push("/login");
      }
    },

    // 显示弹窗
    showAlert(title, message) {
      this.modalTitle = title;
      this.modalMessage = message;
      this.showModal = true;

      // 清除之前的定时器
      if (this.modalTimer) {
        clearTimeout(this.modalTimer);
      }

      // 设置2秒后自动关闭弹窗
      this.modalTimer = setTimeout(() => {
        this.showModal = false;
      }, 1500);
    },

    // 校验表单输入合法性
    validateForm() {
      // 检查用户名是否为空
      if (!this.username.trim()) {
        this.showAlert("输入错误", "请输入用户名");
        return false;
      }

      // 检查密码是否为空
      if (!this.password.trim()) {
        this.showAlert("输入错误", "请输入密码");
        return false;
      }

      return true;
    },

    // 获取用户权限信息
    async fetchUserPermissions(token) {
      try {
        const response = await fetch(`${API_BASE}/user/me`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();
        
        if (data.code === 200) {
          // 成功获取权限信息
          return {
            success: true,
            permissions: data.permissions || [],
            userInfo: data.data || null
          };
        } else {
          // 获取权限信息失败
          return {
            success: false,
            message: data.message || "获取用户信息失败"
          };
        }
      } catch (error) {
        console.error("获取用户权限失败:", error);
        return {
          success: false,
          message: "网络错误，请稍后重试"
        };
      }
    },

    // 登录处理逻辑
    async handleLogin() {
      if (!this.validateForm()) return;

      this.loading = true;
      try {
        // 1. 先进行登录
        const loginRes = await fetch(`${API_BASE}/user/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.username.trim(),
            password: this.password,
          }),
        });
        
        const loginData = await loginRes.json();

        if (loginData.code && loginData.message !== "用户名或密码错误") {
          const token = loginData.message;
          const expireTime = Date.now() + 24 * 60 * 60 * 1000;
          
          // 存储 token 和基本用户信息
          localStorage.setItem("token", token);
          localStorage.setItem("tokenExpire", expireTime);
          localStorage.setItem("userName", this.username.trim());
          
          // 2. 登录成功后获取用户权限信息
          const permissionResult = await this.fetchUserPermissions(token);
          
          if (permissionResult.success) {
            // 存储权限信息
            localStorage.setItem("userPermissions", JSON.stringify(permissionResult.permissions));
            
            // 如果有额外的用户信息也存储
            if (permissionResult.userInfo) {
              localStorage.setItem("userInfo", JSON.stringify(permissionResult.userInfo));
            }
            
            this.showAlert("登录成功", "欢迎回来！");
            
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
              this.redirectByPermissions(permissionResult.permissions);
            }, 1500);
            
          } else {
            // 获取权限信息失败
            this.showAlert("登录失败", permissionResult.message);
            // 清除已存储的token
            localStorage.removeItem("token");
            localStorage.removeItem("tokenExpire");
            localStorage.removeItem("userName");
          }
          
        } else {
          this.showAlert("登录失败", loginData.message || "用户名或密码错误");
          this.password = "";
        }
      } catch (err) {
        this.showAlert("网络错误", "请稍后重试");
        console.error(err);
      } finally {
        this.loading = false;
      }
    }
  },
};
</script>

<style scoped>
/* === 页面背景和整体布局 === */
html,
body,
#app {
  height: 100%;
  margin: 0;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #e9f3ff 0%, #f6faff 100%);
}

/* 用 flex 实现垂直+水平居中布局 */
.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 登录卡片样式 */
.login-card {
  width: 480px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  text-align: center;
  padding-bottom: 26px;
  animation: fadeIn 0.6s ease;
}

/* === 顶部 Logo 区域 === */
.logo {
  padding: 45px 0 20px 0;
}

.logo img {
  width: 240px;
}

/* === 表单区域 === */
.tab-content {
  padding: 36px 50px 50px 50px;
  text-align: left;
}

.tab-content label {
  font-size: 16px;
  margin-bottom: 8px;
  display: block;
  color: #444;
}

.tab-content input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  margin-bottom: 22px;
  font-size: 16px;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

/* 聚焦时的高亮边框 */
.tab-content input:focus {
  border-color: #00a1f5;
  box-shadow: 0 0 0 4px rgba(0, 161, 245, 0.15);
  outline: none;
  background: #fff;
}

/* === 登录按钮 === */
.login-btn {
  width: 100%;
  height: 54px;
  font-size: 17px;
  font-weight: 600;
  background: #00a1f5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.25s, transform 0.1s;
}

.login-btn:hover {
  background: #008fde;
  transform: scale(1.02);
}

.login-btn:disabled {
  background: #92d8ff;
  cursor: not-allowed;
}

/* === 底部隐私协议 === */
.privacy {
  margin: 26px 28px 10px 28px;
  font-size: 14px;
  color: #888;
  line-height: 1.6;
}

.privacy a {
  color: #00a1f5;
  text-decoration: none;
}

/* === 渐入动画 === */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === 弹窗样式 === */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 80%;
  text-align: center;
  animation: scaleIn 0.3s ease;
}

.modal-title {
  font-size: 20px;
  margin-bottom: 15px;
  color: #333;
}

.modal-message {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>