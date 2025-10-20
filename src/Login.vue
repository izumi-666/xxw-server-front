<template>
  <div id="app">
    <!-- 登录页面整体包裹容器 -->
    <div class="login-wrapper">
      <!-- 登录卡片主体 -->
      <div class="login-card">
        <!-- 顶部 Logo -->
        <div class="logo">
          <img
            src="./components/新希望特长学校logo.png"
            alt="新希望特长学校"
          />
        </div>

        <!-- 登录表单区域 -->
        <div class="tab-content">
          <!-- prevent 阻止默认提交行为 -->
          <form @submit.prevent="handleLogin">
            <!-- 用户名输入框 -->
            <label for="username">用户名</label>
            <input
              type="text"
              id="username"
              v-model="username"
              :class="{ error: usernameErrorVisible }"
              placeholder="请输入用户名"
            />
            <!-- 用户名错误提示 -->
            <div class="error-message" v-if="usernameErrorVisible">
              {{ usernameError }}
            </div>

            <!-- 密码输入框 -->
            <label for="password">密码</label>
            <input
              type="password"
              id="password"
              v-model="password"
              :class="{ error: pwdErrorVisible }"
              placeholder="请输入密码"
            />
            <!-- 密码错误提示 -->
            <div class="error-message" v-if="pwdErrorVisible">
              {{ pwdError }}
            </div>

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
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      username: "", // 用户输入的用户名
      password: "", // 用户输入的密码
      usernameError: "请输入用户名", // 用户名错误提示信息
      pwdError: "密码至少 6 位", // 密码错误提示信息
      usernameErrorVisible: false, // 是否显示用户名错误提示
      pwdErrorVisible: false, // 是否显示密码错误提示
      loading: false, // 登录按钮加载状态
    };
  },

  mounted() {
    const savedToken = localStorage.getItem("token");
    const tokenExpire = localStorage.getItem("tokenExpire");

    // 如果 token 存在且未过期，自动跳转到主页面
    if (savedToken && tokenExpire && Date.now() < Number(tokenExpire)) {
      console.log("已检测到有效 token，自动跳转中...");
      this.$router.push("/upload"); // 登录成功或检测到 token 时
    }
  },

  methods: {
    // 校验表单输入合法性
    validateForm() {
      let valid = true;

      // 检查用户名是否为空
      if (!this.username.trim()) {
        this.usernameErrorVisible = true;
        valid = false;
      } else {
        this.usernameErrorVisible = false;
      }

      // 检查密码长度
      if (!this.password || this.password.length < 0) {
        this.pwdErrorVisible = true;
        valid = false;
      } else {
        this.pwdErrorVisible = false;
      }

      return valid;
    },

    // 登录处理逻辑
    async handleLogin() {
      if (!this.validateForm()) return;

      this.loading = true;
      try {
        // 向后端发送登录请求
        const res = await fetch("http://54.238.146.189:8080/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.username.trim(),
            password: this.password,
          }),
        });
        const data = await res.json();

        if (data.code && data.message) {
          alert("登录成功！");
          const expireTime = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem("token", data.message);
          localStorage.setItem("tokenExpire", expireTime);
          this.$router.push("/upload"); // 跳转页面
        } else {
          alert("登录失败：" + (data.message || "用户名或密码错误"));
        }
      } catch (err) {
        alert("网络错误，请稍后重试");
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
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

/* 输入错误时红色高亮 */
.error {
  border-color: #e74c3c !important;
}

/* 错误提示文字样式 */
.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: -12px;
  margin-bottom: 16px;
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
</style>
