<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">考试中心</h1>
      </div>
    </div>

    <!-- 顶部操作区 -->
    <!-- <div class="action-bar card">
      <div class="action-buttons">
        <button class="btn-primary" @click="goCreateExam">安排新考试</button>
      </div>
    </div> -->

    <!-- 查询条件 -->
    <!-- <div class="search-bar card">
      <div class="card-header">
        <h2 class="section-title">筛选条件</h2>
        <div class="header-actions">
          <button class="btn-primary search-btn" @click="searchExam">查询</button>
          <button class="btn-secondary" @click="resetSearch">重置</button>
        </div>
      </div> -->

      <!-- <div class="criteria-grid"> -->
        <!-- 考试名称 -->
        <!-- <div class="criteria-item">
          <label class="criteria-label">考试名称</label>
          <input
            type="text"
            v-model="searchForm.name"
            placeholder="请输入考试名称"
            class="form-input"
          />
        </div> -->

        <!-- 考试发起人 -->
        <!-- <div class="criteria-item">
          <label class="criteria-label">考试发起人</label>
          <input
            type="text"
            v-model="searchForm.created_by"
            placeholder="请输入考试发起人姓名，多个用逗号分隔"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <!-- 考试列表 -->
    <div>
      <div class="search-results card">
        <div class="results-header">
          <h2 class="section-title">考试列表</h2>
          <div class="results-count" v-if="examList.length">
            共 {{ totalItems }} 场考试
          </div>
        </div>

        <div v-if="examList.length">
          <div class="exams-table">
            <table class="table">
              <thead>
                <tr>
                  <th>考试名称</th>
                  <th>科目</th>
                  <th>年级</th>
                  <th>考试时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exam in examList" :key="exam.id">
                  <td>
                    <div class="exam-name">{{ exam.name }}</div>
                    <div class="exam-desc" v-if="exam.description">
                      {{ exam.description }}
                    </div>
                  </td>
                  <td>{{ exam.subject }}</td>
                  <td>{{ exam.grade }}</td>
                  <td>
                    <div>{{ formatDateTime(exam.start_time) }}</div>
                    <div class="time-range">至 {{ formatDateTime(exam.end_time) }}</div>
                  </td>
                  <td>
                    <div class="action-buttons-cell">
                      <!-- 编辑按钮 -->
                      <button
                        v-if="exam.status === 'pending'"
                        class="btn-secondary btn-sm"
                        @click="editExam(exam)"
                      >
                        编辑
                      </button>

                      <!-- 删除按钮 -->
                      <button
                        v-if="exam.status === 'pending'"
                        class="btn-delete btn-sm"
                        @click="deleteExam(exam)"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页控件 -->
          <div class="pagination" v-if="totalPages > 1">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              上一页
            </button>

            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-number"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <span v-if="showEllipsis" class="ellipsis">...</span>
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              下一页
            </button>

            <div class="page-info">
              第 {{ currentPage }} / {{ totalPages }} 页，共 {{ totalItems }} 条记录
            </div>
          </div>
        </div>

        <div v-else class="no-results">
          <div class="no-results-content">
            <p>暂无考试数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================
          考试详情弹窗
    ============================== -->
    <div v-if="detailVisible" class="modal-overlay" @click="detailVisible = false">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">考试详情 - {{ detailExamData?.name }}</h3>
          <button @click="detailVisible = false" class="btn-close">×</button>
        </div>

        <div class="detail-content">
          <div class="detail-sections">
            <!-- 基本信息 -->
            <div class="detail-section">
              <h4 class="section-subtitle">基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>考试名称：</label>
                  <span>{{ detailExamData?.name }}</span>
                </div>
                <div class="info-item">
                  <label>科目：</label>
                  <span>{{ detailExamData?.subject }}</span>
                </div>
                <div class="info-item">
                  <label>年级：</label>
                  <span>{{ detailExamData?.grade }}</span>
                </div>
                <div class="info-item">
                  <label>考试时间：</label>
                  <span
                    >{{ formatDateTime(detailExamData?.start_time) }} -
                    {{ formatDateTime(detailExamData?.end_time) }}</span
                  >
                </div>
                <div class="info-item">
                  <label>考试时长：</label>
                  <span>{{ calculateDuration(detailExamData) }}</span>
                </div>
                <div class="info-item">
                  <label>考试发起人：</label>
                  <span>{{ detailExamData?.created_by }}</span>
                </div>
              </div>
            </div>

            <!-- 试卷信息 -->
            <div class="detail-section" v-if="detailExamData?.paper_info">
              <h4 class="section-subtitle">试卷信息</h4>
              <div class="paper-info-card">
                <div class="paper-info-header">
                  <div class="paper-name">{{ detailExamData.paper_info.name }}</div>
                  <button
                    class="btn-info btn-sm"
                    @click="previewPaper(detailExamData.paper_info)"
                  >
                    预览试卷
                  </button>
                </div>
                <div class="paper-info-details">
                  <div>总分：{{ detailExamData.paper_info.total_score }} 分</div>
                  <div>题量：{{ detailExamData.paper_info.question_count }} 题</div>
                  <div>难度：{{ detailExamData.paper_info.difficulty }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑考试弹窗 -->
    <div v-if="editVisible" class="modal-overlay" @click="editVisible = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑考试 - {{ editExamData.name }}</h3>
          <button @click="editVisible = false" class="btn-close">×</button>
        </div>

        <div class="edit-content">
          <div class="edit-form">
            <div class="form-group">
              <label class="form-label">考试名称</label>
              <input type="text" v-model="editExamData.name" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">考试时长（分钟）</label>
              <input type="number" v-model="editExamData.duration" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">开始时间</label>
              <input
                type="datetime-local"
                v-model="editExamData.start_time"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">试卷</label>
              <select v-model="editExamData.paper_id" class="form-input">
                <option v-for="paper in paperList" :key="paper.id" :value="paper.id">
                  {{ paper.name }} ({{ paper.subject }} - {{ paper.grade }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="editVisible = false">取消</button>
          <button class="btn-primary" @click="saveExam">保存修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 数据状态 ==================== */
const examList = ref([]);
const paperList = ref([]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 模态框状态
const detailVisible = ref(false);
const editVisible = ref(false);
const detailExamData = ref(null);

// 编辑考试数据
const editExamData = ref({
  id: null,
  name: "",
  paper_id: null,
  created_by: "",
  start_time: "",
  duration: 120,
});

/* ==================== 搜索相关 ==================== */
const searchForm = ref({
  name: "",
  created_by: [],
});

/* ==================== 用户信息 ==================== */
const getUserInfo = () => {
  const userName = localStorage.getItem("userName");
  const permissionsStr = localStorage.getItem("userPermissions");

  if (!userName) return null;

  let permissions = [];
  try {
    permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
  } catch (e) {
    console.warn("权限解析失败", permissionsStr);
  }

  return {
    account: userName,   
    username: userName,
    permissions,
  };
};

const getUserType = () => {
  const userInfoStr = localStorage.getItem("userInfo");
  if (!userInfoStr) return null;

  const userInfo = JSON.parse(userInfoStr);
  const permissions = userInfo.permissions || [];

  // 只要包含 ROLE_STUDENT，就是学生
  if (permissions.includes("ROLE_STUDENT")) {
    return "student";
  }

  // 其余 ROLE_ROOT / ROLE_TEACHER / ROLE_ADMINISTRATOR
  return "staff";
};

/* ==================== 数据加载 ==================== */
const loadExams = async () => {
  try {
    const userInfo = getUserInfo();
    const { account } = userInfo;

    if (!account) {
      ElMessage.error("无法获取用户信息，请重新登录");
      return;
    }

    const mappedRole = getUserType(); // 获取用户类型
    const res = await axios.get(
      `${API_BASE}/exam/getExamList/${mappedRole}/${account}`,
      {
        params: {
          page: currentPage.value,
          page_size: pageSize.value,
        },
      }
    );

    examList.value = res.data.data?.items || [];
    totalItems.value = res.data.data?.total || 0;
  } catch (error) {
    console.error("加载考试列表失败:", error);
    ElMessage.error("加载考试列表失败");
  }
};

const searchExam = async () => {
  try {
    currentPage.value = 1;

    // 处理created_by，如果是逗号分隔的字符串，转换为数组
    const searchData = {
      name: searchForm.value.name,
      created_by: searchForm.value.created_by
        ? searchForm.value.created_by.split(",").map((item) => item.trim())
        : [],
    };

    const res = await axios.post(`${API_BASE}/exam/findExam`, searchData, {
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
      },
    });

    examList.value = res.data.data?.items || [];
    totalItems.value = res.data.data?.total || 0;
  } catch (error) {
    console.error("搜索考试失败:", error);
    ElMessage.error("搜索考试失败");
  }
};

const resetSearch = () => {
  searchForm.value = {
    name: "",
    created_by: [],
  };
  currentPage.value = 1;
  loadExams();
};

const loadPaperList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/exam/getPaperList`);
    paperList.value = res.data.data || [];
  } catch (error) {
    console.error("加载试卷列表失败:", error);
  }
};

/* ==================== 分页相关 ==================== */
const visiblePages = computed(() => {
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const showEllipsis = computed(() => {
  return totalPages.value > 5 && currentPage.value < totalPages.value - 2;
});

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  if (searchForm.value.name || searchForm.value.created_by) {
    searchExam();
  } else {
    loadExams();
  }
};

/* ==================== 考试操作 ==================== */
const goCreateExam = () => {
  router.push("/teacher/exam/create");
};

const editExam = async (exam) => {
  try {
    // 加载试卷列表
    await loadPaperList();

    // 填充编辑表单数据
    editExamData.value = {
      id: exam.id,
      name: exam.name,
      paper_id: exam.paper_id,
      created_by: exam.created_by,
      start_time: formatDateTimeForInput(exam.start_time),
      duration: exam.duration || 120,
    };

    editVisible.value = true;
  } catch (error) {
    console.error("编辑考试失败:", error);
    ElMessage.error("编辑考试失败");
  }
};

const saveExam = async () => {
  try {
    const userInfo = getUserInfo();

    // 准备请求数据
    const examData = {
      ...editExamData.value,
      created_by: userInfo.account || userInfo.username || "",
    };

    await axios.post(`${API_BASE}/exam/updateExam`, examData);

    ElMessage.success("考试更新成功");
    editVisible.value = false;

    // 刷新列表
    if (searchForm.value.name || searchForm.value.created_by) {
      await searchExam();
    } else {
      await loadExams();
    }
  } catch (error) {
    console.error("更新考试失败:", error);
    ElMessage.error("更新考试失败");
  }
};

const deleteExam = async (exam) => {
  ElMessageBox.confirm(`确定要删除考试《${exam.name}》吗？删除后无法恢复！`, "警告", {
    type: "warning",
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      try {
        await axios.delete(`${API_BASE}/exam/deleteExam/${exam.id}`);

        // 从列表中移除
        examList.value = examList.value.filter((e) => e.id !== exam.id);
        totalItems.value -= 1;

        ElMessage.success("删除成功！");
      } catch (error) {
        console.error("删除考试失败:", error);
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {});
};

const previewPaper = (paper) => {
  ElMessage.info(`预览试卷: ${paper.name}`);
  // 这里可以打开试卷预览弹窗
};

/* ==================== 工具函数 ==================== */
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\//g, "-");
};

const formatDateTimeForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
};

const calculateDuration = (exam) => {
  if (exam?.duration) {
    const hours = Math.floor(exam.duration / 60);
    const minutes = exam.duration % 60;
    return `${hours}小时${minutes}分钟`;
  }

  if (!exam?.start_time || !exam?.end_time) return "";
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  const duration = (end - start) / (1000 * 60); // 分钟
  if (duration < 60) {
    return `${duration}分钟`;
  } else {
    return `${Math.floor(duration / 60)}小时${duration % 60}分钟`;
  }
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  loadExams();
});

// 监听页码变化
watch(currentPage, () => {
  if (searchForm.value.name || searchForm.value.created_by) {
    searchExam();
  } else {
    loadExams();
  }
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
* {
  box-sizing: border-box;
}

.container {
  max-width: 2000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
}

/* ==================== 页面头部样式 ==================== */
.page-header {
  background: linear-gradient(135deg, #409eff 0%, #3375e0 100%);
  border-radius: 12px;
  padding: 20px 30px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
}

.page-title {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ==================== 卡片通用样式 ==================== */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  border: 1px solid #e6e9f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6e9f0;
}

.section-title {
  font-size: 20px;
  margin: 0 0 16px 0;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 操作栏样式 ==================== */
.action-bar {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ==================== 搜索栏样式 ==================== */
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.criteria-item {
  display: flex;
  flex-direction: column;
}

.criteria-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ==================== 表单控件样式 ==================== */
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.1);
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* ==================== 按钮样式系统 ==================== */
.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.btn-primary:disabled {
  background-color: #b3e19d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #f4f4f5;
  color: #606266;
  border: 1px solid #d3d4d6;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e9e9eb;
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-success {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}

.btn-success:hover:not(:disabled) {
  background-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.btn-info {
  background-color: #909399;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-info:hover:not(:disabled) {
  background-color: #a6a9ad;
  transform: translateY(-1px);
}

.btn-warning {
  background-color: #e6a23c;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(230, 162, 60, 0.2);
}

.btn-warning:hover:not(:disabled) {
  background-color: #ebb563;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(230, 162, 60, 0.3);
}

.btn-delete {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
}

.btn-delete:hover {
  background-color: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.icon {
  font-size: 14px;
}

/* ==================== 考试列表表格样式 ==================== */
.search-results {
  margin-bottom: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-count {
  font-size: 14px;
  color: #909399;
  background: #f4f4f5;
  padding: 6px 12px;
  border-radius: 4px;
}

.exams-table {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
  text-align: left;
  padding: 16px 12px;
  border-bottom: 1px solid #e6e9f0;
  white-space: nowrap;
}

.table td {
  padding: 16px 12px;
  border-bottom: 1px solid #e6e9f0;
  vertical-align: top;
}

.table tr:hover {
  background-color: #f5f7fa;
}

.exam-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.exam-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.time-range {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.status-ongoing {
  background-color: #f0f9ff;
  color: #409eff;
}

.status-completed {
  background-color: #f4f4f5;
  color: #909399;
}

.status-grading {
  background-color: #f0f9ff;
  color: #409eff;
}

.status-graded {
  background-color: #f0f9eb;
  color: #67c23a;
}

.participant-count {
  font-weight: 600;
  color: #303133;
}

.avg-score {
  font-weight: 600;
  color: #67c23a;
  font-size: 16px;
}

.no-score {
  color: #909399;
  font-style: italic;
}

.action-buttons-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ==================== 分页样式 ==================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
}

.pagination-btn:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  background-color: #f5f7fa;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-number:hover {
  background-color: #f5f7fa;
}

.page-number.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.ellipsis {
  padding: 0 8px;
  color: #909399;
}

.page-info {
  font-size: 14px;
  color: #606266;
  margin-left: auto;
}

/* ==================== 无结果提示样式 ==================== */
.no-results-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

/* ==================== 模态框样式 ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

.large-modal {
  max-width: 1000px;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6e9f0;
}

.modal-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f4f4f5;
  color: #606266;
}

/* 考试详情样式 */
.detail-content {
  margin: 20px 0;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section {
  padding: 20px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  background: #fafafa;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e9f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-item label {
  min-width: 100px;
  color: #606266;
  font-weight: 500;
}

.info-item span {
  flex: 1;
  color: #303133;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

/* 试卷信息卡片 */
.paper-info-card {
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  padding: 16px;
}

.paper-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.paper-name {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.paper-info-details {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}

/* 成绩概览 */
.score-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.score-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.score-distribution h5 {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 16px;
}

.distribution-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 150px;
  padding: 20px 0;
}

.distribution-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 12px;
  color: #606266;
}

.bar-container {
  width: 100%;
  height: 100px;
  background: #f5f7fa;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #409eff, #3375e0);
  border-radius: 4px;
  transition: height 0.5s ease;
}

.bar-count {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

/* 编辑表单样式 */
.edit-content {
  margin: 20px 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .criteria-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-header {
    padding: 16px 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .criteria-grid {
    grid-template-columns: 1fr;
  }

  .date-range-picker {
    flex-direction: column;
    gap: 10px;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .table {
    font-size: 12px;
  }

  .table th,
  .table td {
    padding: 12px 8px;
  }

  .action-buttons-cell {
    flex-direction: column;
  }

  .action-buttons-cell button {
    width: 100%;
    justify-content: center;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
  }

  .page-info {
    margin-left: 0;
  }

  .modal-content {
    padding: 20px 16px;
    width: 95%;
  }

  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
    justify-content: center;
  }

  .teacher-selector {
    grid-template-columns: 1fr;
  }

  .score-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
    justify-content: center;
  }

  .score-stats {
    grid-template-columns: 1fr;
  }

  .distribution-chart {
    flex-wrap: wrap;
    height: auto;
  }

  .distribution-bar {
    width: 45%;
  }
}
</style>