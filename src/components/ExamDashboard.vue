<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">考试中心</h1>
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
                  <th>状态</th>
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
                  <td>
                    <span class="status-badge" :class="getStatusClass(exam.status)">
                      {{ getStatusText(exam.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="exam-time-range">
                      <div class="time-item">
                        <span class="time-label">开始时间：</span>
                        <span class="time-value">{{ formatDateTime(exam.start_time) }}</span>
                      </div>
                      <div class="time-item">
                        <span class="time-label">结束时间：</span>
                        <span class="time-value">{{ formatDateTime(calculateEndTime(exam)) }}</span>
                      </div>
                      <div class="time-item">
                        <span class="time-label">考试时长：</span>
                        <span class="time-value">{{ calculateDuration(exam) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons-cell">
                      <!-- 查看详情按钮 -->
                      <button
                        class="btn-info btn-sm"
                        @click="viewExamDetails(exam)"
                      >
                        详情
                      </button>
                      
                      <!-- 参加考试按钮（仅限已发布且未开始的考试） -->
                      <button
                        v-if="canTakeExam(exam)"
                        class="btn-success btn-sm"
                        @click="takeExam(exam)"
                      >
                        参加考试
                      </button>
                      
                      <!-- 继续考试按钮（如果已经开始） -->
                      <button
                        v-else-if="exam.status === 'ONGOING'"
                        class="btn-success btn-sm"
                        @click="takeExam(exam)"
                      >
                        继续考试
                      </button>
                      
                      <!-- 查看成绩按钮（已完成考试） -->
                      <button
                        v-else-if="exam.status === 'FINISHED'"
                        class="btn-info btn-sm"
                        @click="viewScore(exam)"
                      >
                        查看成绩
                      </button>
                      
                      <!-- 未发布状态提示 -->
                      <span v-else-if="exam.status === 'DRAFT'" class="exam-status-text">
                        考试未发布
                      </span>
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
            <p>暂无考试安排</p>
            <p class="no-results-tip">请等待老师发布考试</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 考试详情弹窗 -->
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
                  <label>考试状态：</label>
                  <span class="status-badge" :class="getStatusClass(detailExamData?.status)">
                    {{ getStatusText(detailExamData?.status) }}
                  </span>
                </div>
                <div class="info-item" v-if="detailExamData?.subject">
                  <label>科目：</label>
                  <span>{{ detailExamData?.subject }}</span>
                </div>
                <div class="info-item" v-if="detailExamData?.grade">
                  <label>年级：</label>
                  <span>{{ detailExamData?.grade }}</span>
                </div>
                <div class="info-item">
                  <label>开始时间：</label>
                  <span>{{ formatDateTime(detailExamData?.start_time) }}</span>
                </div>
                <div class="info-item">
                  <label>结束时间：</label>
                  <span>{{ formatDateTime(calculateEndTime(detailExamData)) }}</span>
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
                </div>
                <div class="paper-info-details">
                  <div>总分：{{ detailExamData.paper_info.total_score }} 分</div>
                  <div>题量：{{ detailExamData.paper_info.question_count }} 题</div>
                  <div v-if="detailExamData.paper_info.difficulty">难度：{{ detailExamData.paper_info.difficulty }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="detailVisible = false">关闭</button>
          <button 
            v-if="canTakeExam(detailExamData)"
            class="btn-primary"
            @click="takeExam(detailExamData)"
          >
            参加考试
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 数据状态 ==================== */
const examList = ref([]);

// 分页相关
const fullExamList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

const updatePagedExams = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  examList.value = fullExamList.value.slice(start, end);
  totalItems.value = fullExamList.value.length;
};

// 模态框状态
const detailVisible = ref(false);
const detailExamData = ref(null);

/* ==================== 状态相关函数 ==================== */
// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    DRAFT: "未发布",
    PUBLISHED: "已发布",
    ONGOING: "考试中",
    FINISHED: "已完成"
  };
  return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    DRAFT: "status-draft",
    PUBLISHED: "status-published",
    ONGOING: "status-ongoing",
    FINISHED: "status-finished"
  };
  return classMap[status] || "";
};

// 检查是否可以参加考试
const canTakeExam = (exam) => {
  if (!exam) return false;
  
  // 已发布的考试且未过期
  if (exam.status === 'PUBLISHED') {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(calculateEndTime(exam));
    
    return now >= startTime && now <= endTime;
  }
  
  return false;
};

/* ==================== 用户信息 ==================== */
const getUserInfo = () => {
  try {
    const userInfoStr = localStorage.getItem("userInfo");
    const permissionsStr = localStorage.getItem("userPermissions");

    if (!userInfoStr) {
      const userName = localStorage.getItem("userName");
      if (userName) {
        return {
          id: null,
          account: userName,
          username: userName,
        };
      }
      return null;
    }

    const userInfo = JSON.parse(userInfoStr);
    let permissions = [];
    
    try {
      permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
    } catch (e) {
      console.warn("权限解析失败", permissionsStr);
    }

    return {
      id: userInfo.id,
      account: userInfo.account,
      username: userInfo.name || userInfo.account,
      permissions,
    };
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
};

/* ==================== 数据加载 ==================== */
const loadExams = async () => {
  const userInfo = getUserInfo();
  
  if (!userInfo) {
    ElMessage.error("用户信息获取失败");
    return;
  }

  try {
    const res = await axios.get(
      `${API_BASE}/exam/getExamList/student/${userInfo.account}`
    );

    fullExamList.value = Array.isArray(res.data.data)
      ? res.data.data
      : [];

    currentPage.value = 1;
    updatePagedExams();
  } catch (error) {
    console.error("加载考试列表失败:", error);
    ElMessage.error("加载考试列表失败");
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
};

/* ==================== 考试操作 ==================== */
// 查看考试详情
const viewExamDetails = (exam) => {
  detailExamData.value = exam;
  detailVisible.value = true;
};

// 参加考试
const takeExam = (exam) => {
  // 检查考试是否已经开始
  const now = new Date();
  const startTime = new Date(exam.start_time);
  
  if (now < startTime) {
    ElMessage.warning("考试尚未开始，请在规定时间内参加考试");
    return;
  }
  
  // 检查考试是否已结束
  const endTime = new Date(calculateEndTime(exam));
  if (now > endTime) {
    ElMessage.warning("考试已结束");
    return;
  }
  
  // 跳转到考试页面
  router.push({
    path: '/student/exam/take',
    query: {
      examId: exam.id,
      paper_id: exam.paper_id,
      exam_name: encodeURIComponent(exam.name),
      start_time: exam.start_time,
      duration: exam.duration
    }
  });
};

// 查看成绩
const viewScore = (exam) => {
  ElMessage.info(`查看考试《${exam.name}》的成绩`);
  // 这里可以跳转到成绩查看页面
  // router.push(`/exam/score/${exam.id}`);
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

// 计算结束时间
const calculateEndTime = (exam) => {
  if (exam?.end_time) {
    return exam.end_time;
  }
  
  if (exam?.start_time && exam?.duration) {
    const startTime = new Date(exam.start_time);
    const endTime = new Date(startTime.getTime() + exam.duration * 60000);
    return endTime;
  }
  
  return "";
};

// 计算考试时长
const calculateDuration = (exam) => {
  if (exam?.duration) {
    const hours = Math.floor(exam.duration / 60);
    const minutes = exam.duration % 60;
    
    if (hours === 0) {
      return `${minutes}分钟`;
    } else if (minutes === 0) {
      return `${hours}小时`;
    } else {
      return `${hours}小时${minutes}分钟`;
    }
  }

  if (!exam?.start_time || !exam?.end_time) return "";
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  const duration = (end - start) / (1000 * 60); // 分钟
  if (duration < 60) {
    return `${duration}分钟`;
  } else {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}小时${minutes}分钟`;
  }
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  loadExams();
});

watch(currentPage, updatePagedExams);
</script>

<style scoped>
/* 保留原有样式，但移除不需要的样式 */
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

.section-title {
  font-size: 20px;
  margin: 0 0 16px 0;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 按钮样式 ==================== */
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

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* ==================== 状态标签样式 ==================== */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 60px;
}

.status-draft {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.status-published {
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

.status-ongoing {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-finished {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
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
  text-align: center;
  padding: 16px 12px;
  border-bottom: 1px solid #e6e9f0;
  white-space: nowrap;
}

.table td {
  padding: 16px 12px;
  border-bottom: 1px solid #e6e9f0;
   text-align: center;
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

.exam-time-range {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin: 0 auto;  
  width: fit-content;
}

.time-item {
  display: flex;
  align-items: center;
}

.time-label {
  color: #909399;
  font-size: 12px;
  min-width: 60px;
}

.time-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.exam-status-text {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.action-buttons-cell {
  display: flex;
  justify-content: center;
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

.no-results-tip {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.7;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

/* ==================== 响应式设计 ==================== */
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

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>