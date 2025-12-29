<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">账户管理</h1>
      </div>
    </div>

    <!-- ==================== 学生账户列表 ==================== -->
    <div v-if="hasReadPermission && studentList.length" class="card">
      <h2 class="section-title">学生账户列表</h2>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>账号</th>
              <th>性别</th>
              <th>手机号</th>
              <th>邮箱</th>
              <th>紧急联系人电话</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stu in studentList" :key="stu.id">
              <td>{{ stu.account }}</td>
              <td>{{ formatGender(stu.gender) }}</td>
              <td>{{ stu.phone || "-" }}</td>
              <td>{{ stu.email || "-" }}</td>
              <td>{{ stu.emergency_call || "-" }}</td>
              <td>{{ formatDate(stu.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="studentTotal > studentPageSize && studentList.length" class="pagination">
        <button
          class="page-btn"
          :disabled="studentPage === 1"
          @click="changeStudentPage(studentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info"> 第 {{ studentPage }} / {{ studentTotalPages }} 页 </span>
        <button
          class="page-btn"
          :disabled="studentPage === studentTotalPages"
          @click="changeStudentPage(studentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- ==================== 教师账户列表 ==================== -->
    <div v-if="hasReadPermission && teacherList.length" class="card">
      <h2 class="section-title">教师账户列表</h2>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>账号</th>
              <th>性别</th>
              <th>手机号</th>
              <th>邮箱</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="teacher in teacherList" :key="teacher.id">
              <td>{{ teacher.account }}</td>
              <td>{{ formatGender(teacher.gender) }}</td>
              <td>{{ teacher.phone || "-" }}</td>
              <td>{{ teacher.email || "-" }}</td>
              <td>{{ formatDate(teacher.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="teacherTotal > teacherPageSize && teacherList.length" class="pagination">
        <button
          class="page-btn"
          :disabled="teacherPage === 1"
          @click="changeTeacherPage(teacherPage - 1)"
        >
          上一页
        </button>
        <span class="page-info"> 第 {{ teacherPage }} / {{ teacherTotalPages }} 页 </span>
        <button
          class="page-btn"
          :disabled="teacherPage === teacherTotalPages"
          @click="changeTeacherPage(teacherPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div
      v-if="hasReadPermission && !studentList.length && !teacherList.length"
      class="card"
    >
      <div class="empty-tip">
        <p>暂无账户数据</p>
      </div>
    </div>

    <!-- 创建按钮 - 有创建权限时才显示 -->
    <div v-if="hasCreatePermission" class="card">
      <div class="create-btn-group">
        <button class="btn-primary student-btn" @click="showCreateForm('student')">
          ＋新建学生账户
        </button>
        <button class="btn-primary teacher-btn" @click="showCreateForm('teacher')">
          ＋新建教师账户
        </button>
      </div>
    </div>

    <!-- 无权限提示 -->
    <div v-if="!hasAnyPermission" class="card">
      <div class="no-permission-tip">
        <p>您没有账户管理权限，请联系管理员</p>
      </div>
    </div>

    <!-- ==================== 创建账户表单 ==================== -->
    <div v-if="showForm && hasCreatePermission" class="card">
      <h2 class="section-title">{{ formTitle }}</h2>

      <form class="criteria-grid" @submit.prevent="submitForm">
        <!-- 学校选择下拉框 -->
        <div class="criteria-item">
          <label class="criteria-label">学校</label>
          <div class="select-wrapper">
            <select v-model="form.school_id" class="form-select" required>
              <option value="">请选择学校</option>
              <option v-for="school in schoolList" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
            <span class="select-arrow">▾</span>
          </div>
        </div>

        <div class="criteria-item">
          <label class="criteria-label">账号</label>
          <input v-model="form.account" class="form-input" autocomplete="username" required />
        </div>

        <div class="criteria-item">
          <label class="criteria-label">密码</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              class="form-input"
              required
              autocomplete="new-password"
            />
            <span class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? "🙈" : "👁️" }}
            </span>
          </div>
        </div>

        <div class="criteria-item">
          <label class="criteria-label">性别</label>
          <div class="select-wrapper">
            <select v-model="form.gender" class="form-select" required>
              <option value="">请选择</option>
              <option value="1">男</option>
              <option value="0">女</option>
            </select>
            <span class="select-arrow">▾</span>
          </div>
        </div>

        <div class="criteria-item">
          <label class="criteria-label">出生日期</label>
          <input v-model="form.date_of_birth" type="date" class="form-input" />
        </div>

        <div class="criteria-item">
          <label class="criteria-label">手机号</label>
          <input v-model="form.phone" class="form-input" />
        </div>

        <div class="criteria-item full-width">
          <label class="criteria-label">邮箱</label>
          <input v-model="form.email" type="email" class="form-input" />
        </div>

        <!-- 学生特有字段 -->
        <div v-if="accountType === 'student'" class="criteria-item full-width">
          <label class="criteria-label">紧急联系人电话</label>
          <input v-model="form.emergency_call" class="form-input" />
        </div>

        <div class="criteria-item full-width form-actions">
          <button type="button" class="btn-cancel" @click="closeForm">取消</button>
          <button class="btn-primary" :disabled="loading || loadingSchoolList">
            {{ loading ? "提交中..." : submitButtonText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

/* ==================== 权限相关 ==================== */
// 从localStorage获取权限
const getUserPermissions = () => {
  try {
    const permissionsStr = localStorage.getItem("userPermissions");
    return permissionsStr ? JSON.parse(permissionsStr) : [];
  } catch (error) {
    console.error("解析权限信息失败:", error);
    return [];
  }
};

// 权限检查函数
const hasPermission = (permission) => {
  const userPermissions = getUserPermissions();
  return userPermissions.includes(permission) || userPermissions.includes("user:*");
};

// 计算属性：是否有读权限
const hasReadPermission = computed(() => {
  return hasPermission("user:read");
});

// 计算属性：是否有创建权限
const hasCreatePermission = computed(() => {
  return hasPermission("user:create");
});

// 计算属性：是否有更新权限
const hasUpdatePermission = computed(() => {
  return hasPermission("user:update");
});

// 计算属性：是否有删除权限
const hasDeletePermission = computed(() => {
  return hasPermission("user:delete");
});

// 计算属性：是否有任何用户管理权限
const hasAnyPermission = computed(() => {
  return hasPermission("user:*");
});

/* ==================== 状态 ==================== */
const loading = ref(false);
const showPassword = ref(false);
const showForm = ref(false);
const accountType = ref(""); // 'student' 或 'teacher'
const schoolList = ref([]); // 学校列表
const loadingSchoolList = ref(false); // 加载学校列表状态

/* ==================== 学生列表 ==================== */
const studentList = ref([]);
const studentPage = ref(1);
const studentPageSize = ref(10);
const studentTotal = ref(0);

/* ==================== 教师列表 ==================== */
const teacherList = ref([]);
const teacherPage = ref(1);
const teacherPageSize = ref(10);
const teacherTotal = ref(0);

/* ==================== 表单 ==================== */
const form = reactive({
  school_id: "",
  account: "",
  password: "",
  gender: 0,
  date_of_birth: null,
  phone: "",
  email: "",
  emergency_call: "", // 仅学生用
});

/* ==================== 计算属性 ==================== */
const formTitle = computed(() => {
  return accountType.value === "student" ? "新建学生账户" : "新建教师账户";
});

const submitButtonText = computed(() => {
  return accountType.value === "student" ? "创建学生账户" : "创建教师账户";
});

const studentTotalPages = computed(() =>
  Math.ceil(studentTotal.value / studentPageSize.value)
);
const teacherTotalPages = computed(() =>
  Math.ceil(teacherTotal.value / teacherPageSize.value)
);

//时间格式化
const formatDateToDateTime = (dateStr) => {
  if (!dateStr) return null;
  return `${dateStr} 00:00:00`;
};

/* ==================== API ==================== */
// 从环境变量获取API基础URL
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 获取学校列表
const fetchSchoolList = async () => {
  loadingSchoolList.value = true;
  try {
    const res = await axios.get(`${API_BASE}/questions/getSchoolList`);

    schoolList.value = Object.entries(res.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
  } catch (error) {
    console.error("获取学校列表失败:", error);
    schoolList.value = [];
    alert("获取学校列表失败，请稍后重试");
  } finally {
    loadingSchoolList.value = false;
  }
};

// 获取学生列表
const fetchStudentList = async () => {
  // 如果没有读权限，不调用API
  if (!hasReadPermission.value) {
    studentList.value = [];
    studentTotal.value = 0;
    return;
  }

  try {
    const res = await axios.get(`${API_BASE}/user/getStudentList`, {
      params: {
        page: studentPage.value,
        pageSize: studentPageSize.value,
      },
    });
    studentList.value = res.data.data || [];
    studentTotal.value = res.data.data?.length || 0;
  } catch (error) {
    console.error("获取学生列表失败:", error);
    studentList.value = [];
    studentTotal.value = 0;
  }
};

// 获取教师列表
const fetchTeacherList = async () => {
  // 如果没有读权限，不调用API
  if (!hasReadPermission.value) {
    teacherList.value = [];
    teacherTotal.value = 0;
    return;
  }

  try {
    const res = await axios.get(`${API_BASE}/user/getStaffList`, {
      params: {
        page: teacherPage.value,
        pageSize: teacherPageSize.value,
      },
    });
    teacherList.value = res.data.data || [];
    teacherTotal.value = res.data.data?.length || 0;
  } catch (error) {
    console.error("获取教师列表失败:", error);
    teacherList.value = [];
    teacherTotal.value = 0;
  }
};

const submitForm = async () => {
  // 再次检查创建权限（安全起见）
  if (!hasCreatePermission.value) {
    alert("您没有创建账户的权限");
    return;
  }

  // 验证学校是否已选择
  if (!form.school_id) {
    alert("请选择学校");
    return;
  }

  loading.value = true;
  try {
    let url = "";
    let requestData = { ...form };
    //时间格式化处理
    if (requestData.date_of_birth) {
  requestData.date_of_birth = formatDateToDateTime(
    requestData.date_of_birth
  );
} else {
  requestData.date_of_birth = null;
}

    if (accountType.value === "student") {
      url = `${API_BASE}/user/SignupForStudent`;
    } else {
      url = `${API_BASE}/user/SignupForStaff`;
      delete requestData.emergency_call;
    }

    await axios.post(url, requestData);
    alert(`${accountType.value === "student" ? "学生" : "教师"}账户创建成功`);

    // 重置表单
    resetForm();
    showForm.value = false;

    // 根据创建的账户类型刷新对应的列表
    if (accountType.value === "student") {
      studentPage.value = 1;
      fetchStudentList();
    } else {
      teacherPage.value = 1;
      fetchTeacherList();
    }
  } catch (e) {
    alert("创建失败");
    console.error("创建失败:", e);
  } finally {
    loading.value = false;
  }
};

const showCreateForm = (type) => {
  // 检查是否有创建权限
  if (!hasCreatePermission.value) {
    alert("您没有创建账户的权限");
    return;
  }

  accountType.value = type;
  showForm.value = true;
  resetForm();
  // 每次显示表单时获取学校列表（确保数据最新）
  fetchSchoolList();
};

const closeForm = () => {
  showForm.value = false;
  accountType.value = "";
  resetForm();
};

const resetForm = () => {
  Object.keys(form).forEach((key) => {
    if (key !== "school_id") {
      form[key] = "";
    }
  });
  form.school_id = "";
};

const changeStudentPage = (p) => {
  studentPage.value = p;
  fetchStudentList();
};

const changeTeacherPage = (p) => {
  teacherPage.value = p;
  fetchTeacherList();
};

const formatGender = (g) => {
  if (g === 1) return "男";
  if (g === 0) return "女";
  return "-";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN");
  } catch (e) {
    return dateString;
  }
};

onMounted(() => {
  // 直接根据权限获取数据
  if (hasReadPermission.value) {
    fetchStudentList();
    fetchTeacherList();
  }
  if (hasCreatePermission.value) {
    fetchSchoolList();
  }
});
</script>

<style scoped>
/* ===== 基础 ===== */
.container {
  max-width: 2000px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #409eff, #3375e0);
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
}

.page-title {
  color: #fff;
  font-size: 28px;
  margin: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
}

/* ===== 表单 ===== */
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.criteria-item {
  display: flex;
  flex-direction: column;
}

.criteria-item.full-width {
  grid-column: 1 / -1;
}

.criteria-label {
  margin-bottom: 8px;
  color: #606266;
  font-weight: 500;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  transition: all 0.3s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* ==================== 密码显示切换 ==================== */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrapper .form-input {
  width: 100%;
  padding-right: 44px;
}
.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 18px;
  user-select: none;
  color: #909399;
}
.toggle-password:hover {
  color: #409eff;
}

/* 统一下拉框容器 */
.select-wrapper {
  position: relative;
  width: 100%;
}

.form-select {
  width: 100%;
  padding: 12px 44px 12px 16px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 25px;
  color: #909399;
  pointer-events: none;
}

.select-wrapper:hover .form-select {
  border-color: #409eff;
}

/* ===== 表格 ===== */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
  border-radius: 3px; 
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
}

.data-table th {
  background: #c0e0ff; 
  color: #303133;
  font-weight: 600;
  text-align: left;
  padding: 16px 12px;
  border-bottom: 2px solid #ebeef5;
}

.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #dcdee4;
  color: #606266;
}

.data-table tbody tr:hover {
  background-color: #f0f9ff;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
}

.page-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #606266;
  font-size: 14px;
}

.data-table th,
.data-table td {
  text-align: center;
}

/* ===== 按钮样式 ===== */
.create-btn-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  border: none;
  font-size: 14px;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #409eff;
  color: #fff;
  font-weight: 500;
}

.student-btn {
  background: #409eff;
  color: #fff;
}

.student-btn:hover {
  background: #5596eb;
}

.teacher-btn {
  background: #67c23a;
  color: #fff;
}

.teacher-btn:hover {
  background: #85ce61;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.btn-cancel {
  background: #f56c6c;
  border: 1px solid #f56c6c;
  color: #fff;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  font-weight: 500;
}
.btn-cancel:hover {
  background: #f78989;
  border-color: #f78989;
}

.empty-tip {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 16px;
}

.empty-tip-hint {
  font-size: 14px;
  color: #c0c4cc;
  margin-top: 8px;
}

/* ===== 无权限提示 ===== */
.no-permission-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.permission-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.no-permission-tip p {
  color: #909399;
  font-size: 16px;
  margin: 0;
}
</style>
