<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">自我评测</h1>
      </div>
    </div>

    <!-- 主要操作区域 -->
    <div class="main-content">
      <!-- 配置区域 -->
      <div class="config-section card">
        <div class="card-header">
          <h2 class="section-title">评估配置</h2>
        </div>

        <div class="config-form">
          <!-- 年级选择（多选） -->
          <div class="form-group">
            <label class="form-label">选择年级</label>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleGradeDropdown">
                <span class="placeholder" v-if="selectedGrades.length === 0">
                  请选择年级
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="grade in selectedGrades"
                    :key="grade.id"
                    class="selected-tag"
                    @click.stop="removeGrade(grade.id)"
                  >
                    {{ grade.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showGradeDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="gradeSearch"
                    placeholder="搜索年级..."
                    class="search-input"
                    @input="filterGrades"
                  />
                </div>
                <div class="dropdown-options">
                  <div
                    v-for="grade in filteredGrades"
                    :key="grade.id"
                    class="dropdown-option"
                    @click="toggleGrade(grade)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isGradeSelected(grade.id) }"
                    >
                      {{ isGradeSelected(grade.id) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ grade.name }}</span>
                  </div>
                  <div v-if="filteredGrades.length === 0" class="no-options">
                    无匹配选项
                  </div>
                </div>
              </div>
            </div>
            <div class="form-hint">可选多个年级进行评估</div>
          </div>

          <!-- 科目选择（单选） -->
          <div class="form-group">
            <label class="form-label">选择科目</label>
            <select
              v-model="selectedSubjectId"
              class="form-select"
              @change="onSubjectChange"
            >
              <option :value="null">请选择科目</option>
              <option v-for="(name, id) in SUBJECT_MAP" :key="id" :value="id">
                {{ name }}
              </option>
            </select>
          </div>

          <!-- 当前学生信息（只读） -->
          <div class="form-group">
            <label class="form-label">当前学生</label>
            <div class="form-input read-only">
              {{ studentInfo }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button
              @click="startAssessment"
              class="btn-primary"
              :disabled="!canStartAssessment"
            >
              <span class="btn-icon">▶</span>
              开始评估
            </button>
            <button @click="resetForm" class="btn-secondary">
              <span class="btn-icon">↺</span>
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载,请稍候...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useGradeList } from "../utils/gradeList";
import { SUBJECT_MAP, initSubjectData } from "../utils/subjectList";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();

// ==================== 状态管理 ====================
const { gradeList, filterGrades: filteredGrades, loadGradeList } = useGradeList();
const selectedGrades = ref([]);
const selectedSubjectId = ref(null);
const studentInfo = ref("");

// 下拉框状态
const showGradeDropdown = ref(false);
const gradeSearch = ref("");

// 评估状态
const isLoading = ref(false);
const errorMessage = ref("");

// ==================== 计算属性 ====================
const loadCurrentStudent = () => {
  const userName = localStorage.getItem("userName");

  if (!userName) {
    errorMessage.value = "未获取到学生信息，请重新登录";
    return;
  }

  studentInfo.value = userName;
};

const canStartAssessment = computed(() => {
  return (
    selectedGrades.value.length > 0 &&
    selectedSubjectId.value !== null &&
    !!studentInfo.value
  );
});

// ==================== 方法 ====================
// 年级下拉框相关方法
const toggleGradeDropdown = () => {
  showGradeDropdown.value = !showGradeDropdown.value;
  if (showGradeDropdown.value) {
    filterGrades();
  }
};

const filterGrades = () => {
  if (!gradeSearch.value) {
    filteredGrades.value = gradeList.value;
  } else {
    filteredGrades.value = gradeList.value.filter((grade) =>
      grade.name.toLowerCase().includes(gradeSearch.value.toLowerCase())
    );
  }
};

const toggleGrade = (grade) => {
  const index = selectedGrades.value.findIndex((g) => g.id === grade.id);
  if (index > -1) {
    selectedGrades.value.splice(index, 1);
  } else {
    selectedGrades.value.push(grade);
  }
};

const removeGrade = (id) => {
  selectedGrades.value = selectedGrades.value.filter((g) => g.id !== id);
};

const isGradeSelected = (id) => {
  return selectedGrades.value.some((g) => g.id === id);
};

const onSubjectChange = () => {
  // 可以在这里添加科目变更时的逻辑
};

// 开始评估
const startAssessment = async () => {
  if (!canStartAssessment.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const { data: res } = await axios.post(
      `${API_BASE}/learning/selfAssessment`,
      {
        subject_id: selectedSubjectId.value,
        grade_ids: selectedGrades.value.map(g => g.id),
        student: studentInfo.value,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // 业务失败
    if (res.code !== 200) {
      ElMessage.error(
        res.code === 500 ? "暂无相应题目" : res.message || "评估失败"
      );
      return;
    }

    const assessmentData = res.data;
    if (!assessmentData) {
      ElMessage.error("评测数据为空");
      return;
    }

    localStorage.setItem(
      "current_assessment",
      JSON.stringify({
        ...assessmentData,
        subject_name:
          SUBJECT_MAP[selectedSubjectId.value] || selectedSubjectId.value,
        grade_names: selectedGrades.value.map(g => g.name).join(", "),
      })
    );

    router.push({
      path: "/student/selfassessment/selfassessment",
      query: {
        exam_history_id: assessmentData.exam_history_id,
        exam_id: assessmentData.exam_id,
        subject_name: SUBJECT_MAP[selectedSubjectId.value],
        grade_names: selectedGrades.value.map(g => g.name).join(", "),
      },
    });
  } catch (err) {
    console.error("评估请求失败:", err);
    ElMessage.error(
      err.response?.data?.message || "网络或服务器异常，请稍后重试"
    );
  } finally {
    isLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  selectedGrades.value = [];
  selectedSubjectId.value = null;
};

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  if (!event.target.closest(".multi-select-wrapper")) {
    showGradeDropdown.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  loadGradeList();
  initSubjectData();
  loadCurrentStudent();
  document.addEventListener("click", handleClickOutside);
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
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  margin: 0;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 配置区域样式 ==================== */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* ==================== 多选下拉框样式 ==================== */
.multi-select-wrapper {
  position: relative;
  width: 100%;
}

.multi-select-trigger {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  min-height: 46px;
}

.multi-select-trigger:hover {
  border-color: #c0c4cc;
}

.multi-select-trigger:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.placeholder {
  color: #c0c4cc;
  font-size: 14px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.selected-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #d9ecff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-tag:hover {
  background: #d9ecff;
  transform: translateY(-1px);
}

.remove-icon {
  font-weight: bold;
  font-size: 14px;
  color: #f56c6c;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s;
}

.remove-icon:hover {
  background-color: rgba(245, 108, 108, 0.1);
}

.dropdown-arrow {
  color: #c0c4cc;
  font-size: 12px;
  transition: transform 0.3s;
}

.multi-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
  max-height: 250px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input-container {
  padding: 8px;
  border-bottom: 1px solid #e6e9f0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.dropdown-options {
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.dropdown-option:hover {
  background-color: #f5f7fa;
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.checkbox.checked {
  background-color: #409eff;
  border-color: #409eff;
}

.option-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.no-options {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* ==================== 表单控件样式 ==================== */
.form-select,
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

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input.read-only {
  background-color: #f5f7fa;
  color: #606266;
  cursor: not-allowed;
}

/* ==================== 按钮样式 ==================== */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

.btn-secondary {
  background-color: #f4f4f5;
  color: #606266;
  border: 1px solid #d3d4d6;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover {
  background-color: #e9e9eb;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 16px;
}

/* ==================== 加载状态样式 ==================== */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .main-content {
    padding: 0;
  }

  .card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }
}
</style>