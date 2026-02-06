<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">考试管理</h1>
      </div>
    </div>

    <!-- 顶部操作区 -->
    <div class="action-bar card">
      <div class="action-buttons">
        <button class="btn-primary" @click="CreateExam">安排新考试</button>
      </div>
    </div>

    <!-- 查询条件 -->
    <div class="search-bar card">
      <div class="card-header">
        <h2 class="section-title">筛选条件</h2>
        <div class="header-actions">
          <button class="btn-primary search-btn" @click="searchExam">查询</button>
          <button class="btn-secondary" @click="resetSearch">重置</button>
        </div>
      </div>

      <div class="criteria-grid">
        <!-- 考试名称 -->
        <div class="criteria-item">
          <label class="criteria-label">考试名称</label>
          <input
            type="text"
            v-model="searchForm.name"
            placeholder="请输入考试名称"
            class="form-input"
          />
        </div>

        <!-- 考试发起人筛选（改为多选下拉框） -->
        <div class="criteria-item">
          <label class="criteria-label">考试发起人</label>
          <div class="multi-select-wrapper" ref="creatorWrapper">
            <div class="multi-select-trigger" @click="toggleCreatorDropdown">
              <span class="placeholder" v-if="searchForm.created_by.length === 0">
                请选择考试发起人
              </span>
              <span class="selected-tags" v-else>
                <span
                  v-for="creator in selectedCreators"
                  :key="creator.id"
                  class="selected-tag"
                  @click.stop="removeCreator(creator.id)"
                >
                  {{ creator.name }}
                  <span class="remove-icon">×</span>
                </span>
              </span>
              <span class="dropdown-arrow">▼</span>
            </div>

            <div class="multi-select-dropdown" v-if="showCreatorDropdown">
              <div class="search-input-container">
                <input
                  type="text"
                  v-model="creatorSearch"
                  placeholder="搜索教职工..."
                  class="search-input"
                  @input="filterCreators"
                />
              </div>
              <div class="dropdown-options">
                <div
                  v-for="creator in filteredCreators"
                  :key="creator.id"
                  class="dropdown-option"
                  @click="toggleCreator(creator)"
                >
                  <span
                    class="checkbox"
                    :class="{ checked: isCreatorSelected(creator.id) }"
                  >
                    {{ isCreatorSelected(creator.id) ? "✓" : "" }}
                  </span>
                  <span class="option-text">{{ creator.name }}</span>
                </div>
                <div v-if="filteredCreators.length === 0" class="no-options">
                  无匹配选项
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 考试列表 -->
    <div>
      <div class="search-results card">
        <div class="results-header">
          <h2 class="section-title">考试列表</h2>
          <div class="results-count" v-if="!loading && examList.length">
            共 {{ totalItems }} 场考试
          </div>
        </div>

        <!-- 加载动画 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
            <p class="loading-text">正在加载考试列表...</p>
          </div>
        </div>

        <!-- 考试列表内容 -->
        <div v-else-if="examList.length">
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
                    <span
                      class="status-badge"
                      :class="getStatusClass(getExamDisplayStatus(exam))"
                    >
                      {{ getStatusText(getExamDisplayStatus(exam)) }}
                    </span>
                  </td>
                  <td>
                    <div class="exam-time-range">
                      <div class="time-item">
                        <span class="time-label">开始时间：</span>
                        <span class="time-value">{{
                          formatDateTime(exam.start_time)
                        }}</span>
                      </div>
                      <div class="time-item">
                        <span class="time-label">结束时间：</span>
                        <span class="time-value">{{
                          formatDateTime(calculateEndTime(exam))
                        }}</span>
                      </div>
                      <div class="time-item">
                        <span class="time-label">考试时长：</span>
                        <span class="time-value">{{ calculateDuration(exam) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons-cell">
                      <!-- 编辑按钮 -->
                      <button
                        v-if="exam.status === 'DRAFT'"
                        class="btn-secondary btn-sm"
                        @click="editExam(exam)"
                      >
                        编辑
                      </button>

                      <!-- 删除按钮 -->
                      <button
                        v-if="exam.status === 'DRAFT'"
                        class="btn-delete btn-sm"
                        @click="deleteExam(exam)"
                      >
                        删除
                      </button>

                      <!-- 发布按钮 -->
                      <button
                        v-if="exam.status === 'DRAFT'"
                        class="btn-success btn-sm"
                        @click="openPublishExam(exam)"
                      >
                        发布
                      </button>

                      <!-- 查看详情按钮（所有状态都可查看） -->
                      <button class="btn-info btn-sm" @click="viewExamDetails(exam)">
                        详情
                      </button>

                      <!-- 批改按钮 -->
                      <button
                        v-if="shouldShowGradeButton(exam)"
                        class="btn-warning btn-sm"
                        @click="gradeExam(exam)"
                      >
                        批改
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
            <p class="no-results-tip">请安排新考试或调整筛选条件</p>
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
                  <span
                    class="status-badge"
                    :class="getStatusClass(detailExamData?.status)"
                  >
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
                  <div v-if="detailExamData.paper_info.difficulty">
                    难度：{{ detailExamData.paper_info.difficulty }}
                  </div>
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
                :min="minStartTime"
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

    <!-- 创建考试弹窗 -->
    <div v-if="createVisible" class="modal-overlay" @click="createVisible = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">安排新考试</h3>
          <button class="btn-close" @click="createVisible = false">×</button>
        </div>

        <div class="edit-content">
          <div class="edit-form">
            <!-- 考试名称 -->
            <div class="form-group">
              <label class="form-label">考试名称</label>
              <input
                type="text"
                v-model="createExamData.name"
                class="form-input"
                placeholder="请输入考试名称"
              />
            </div>

            <!-- 试卷选择 -->
            <div class="form-group">
              <label class="form-label">选择试卷</label>
              <select v-model="createExamData.paper_id" class="form-input">
                <option disabled value="">请选择试卷</option>
                <option v-for="paper in paperOptions" :key="paper.id" :value="paper.id">
                  {{ paper.name }}
                </option>
              </select>
            </div>

            <!-- 开始时间 -->
            <div class="form-group">
              <label class="form-label">开始时间</label>
              <input
                type="datetime-local"
                v-model="createExamData.start_time"
                class="form-input"
                :min="minStartTime"
              />
            </div>

            <!-- 持续时间 -->
            <div class="form-group">
              <label class="form-label">考试时长（分钟）</label>
              <input
                type="number"
                v-model="createExamData.duration"
                class="form-input"
                min="1"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="createVisible = false">取消</button>
          <button class="btn-primary" @click="submitCreateExam">安排考试</button>
        </div>
      </div>
    </div>

    <!-- 发布考试弹窗 -->
    <div v-if="publishVisible" class="modal-overlay" @click="publishVisible = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">发布考试 - {{ publishExamData?.name }}</h3>
          <button class="btn-close" @click="publishVisible = false">×</button>
        </div>

        <div class="edit-content">
          <div class="form-group">
            <label class="form-label">选择接收考试的学生</label>

            <div class="multi-select-wrapper" ref="studentWrapper">
              <div class="multi-select-trigger" @click="toggleStudentDropdown">
                <span class="placeholder" v-if="selectedStudents.length === 0">
                  请选择学生
                </span>

                <span class="selected-tags" v-else>
                  <span
                    v-for="stu in selectedStudents"
                    :key="stu.id"
                    class="selected-tag"
                    @click.stop="removeStudent(stu.id)"
                  >
                    {{ stu.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>

                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showStudentDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="studentSearch"
                    placeholder="搜索学生..."
                    class="search-input"
                    @input="filterStudents"
                  />
                </div>

                <div class="dropdown-options">
                  <div
                    v-for="stu in filteredStudents"
                    :key="stu.id"
                    class="dropdown-option"
                    @click="toggleStudent(stu)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isStudentSelected(stu.id) }"
                    >
                      {{ isStudentSelected(stu.id) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ stu.name }}</span>
                  </div>

                  <div v-if="filteredStudents.length === 0" class="no-options">
                    无匹配学生
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="publishVisible = false">取消</button>
          <button class="btn-primary" @click="submitPublishExam">确认发布</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import { useRouter } from "vue-router";
import { getBeijingTime } from "../utils/chinaTime";

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 数据状态 ==================== */
const examList = ref([]);
const paperList = ref([]);
const loading = ref(false); // 添加loading状态

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
const editVisible = ref(false);
const detailExamData = ref(null);

// 时间格式化
const formatDateTimeForBackend = (datetimeLocalStr) => {
  if (!datetimeLocalStr) return "";

  const date = new Date(datetimeLocalStr);

  const pad = (n) => (n < 10 ? "0" + n : n);

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
};

// 时间选择不可用当前时间之前的时间
const minStartTime = computed(() => {
  const now = getBeijingTime();
  const pad = (n) => (n < 10 ? "0" + n : n);

  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    "T" +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes())
  );
});

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
  created_by: [], // 改为数组，支持多选
});

/* ==================== 状态相关函数 ==================== */
// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    DRAFT: "未发布",
    PUBLISHED: "已发布",
    ONGOING: "考试中",
    FINISHED: "已完成",
  };
  return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    DRAFT: "status-draft",
    PUBLISHED: "status-published",
    ONGOING: "status-ongoing",
    FINISHED: "status-finished",
  };
  return classMap[status] || "";
};

const getExamDisplayStatus = (exam) => {
  // 直接使用后端返回的状态
  return exam.status;
};

/* ==================== 考试发起人多选下拉框相关 ==================== */
const creatorList = ref([]);
const creatorSearch = ref("");
const showCreatorDropdown = ref(false);
const filteredCreators = ref([]);

// 计算属性：选中的发起人
const selectedCreators = computed(() => {
  return searchForm.value.created_by
    .map((id) => creatorList.value.find((c) => c.id === id))
    .filter(Boolean);
});

// 加载教职工列表
const loadCreatorList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/user/getStaffList`);
    const staffData = res.data.data || [];
    creatorList.value = staffData
      .filter((item) => item && item.account)
      .map((item) => ({
        id: item.account, // 使用 account 作为 id
        name: item.account, // 显示名称为 account
      }));

    filteredCreators.value = creatorList.value;
  } catch (error) {
    console.error("加载教职工列表失败:", error);
    ElMessage.error("加载教职工列表失败");
  }
};

// 切换下拉框显示
const toggleCreatorDropdown = () => {
  showCreatorDropdown.value = !showCreatorDropdown.value;
  if (showCreatorDropdown.value) {
    filterCreators();
  }
};

// 过滤教职工
const filterCreators = () => {
  if (!creatorSearch.value) {
    filteredCreators.value = creatorList.value;
  } else {
    filteredCreators.value = creatorList.value.filter((creator) =>
      creator.name.toLowerCase().includes(creatorSearch.value.toLowerCase())
    );
  }
};

// 切换选择
const toggleCreator = (creator) => {
  const index = searchForm.value.created_by.indexOf(creator.id);
  if (index > -1) {
    searchForm.value.created_by.splice(index, 1);
  } else {
    searchForm.value.created_by.push(creator.id);
  }
};

// 移除已选发起人（现在处理的是字符串）
const removeCreator = (account) => {
  searchForm.value.created_by = searchForm.value.created_by.filter(
    (creatorAccount) => creatorAccount !== account
  );
};

// 检查是否已选择（现在检查的是字符串）
const isCreatorSelected = (account) => {
  return searchForm.value.created_by.includes(account);
};

// 点击外部关闭下拉框
const creatorWrapper = ref(null);
const handleClickOutside = (event) => {
  if (creatorWrapper.value && !creatorWrapper.value.contains(event.target)) {
    showCreatorDropdown.value = false;
  }
};

/* ==================== 用户信息 ==================== */
const getUserInfo = () => {
  try {
    const userInfoStr = localStorage.getItem("userInfo");
    const permissionsStr = localStorage.getItem("userPermissions");

    if (!userInfoStr) {
      // 尝试从其他可能的地方获取
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
      id: userInfo.id, // 添加 id 字段
      account: userInfo.account,
      username: userInfo.name || userInfo.account,
      permissions,
    };
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
};

// const getUserType = () => {
//   const userInfoStr = localStorage.getItem("userPermissions");
//   if (!userInfoStr) return null;

//   const userInfo = JSON.parse(userInfoStr);
//   const permissions = userInfo.permissions || [];

//   // 只要包含 ROLE_STUDENT，就是学生
//   if (permissions.includes("ROLE_STUDENT")) {
//     return "student";
//   }

//   // 其余 ROLE_ROOT / ROLE_TEACHER / ROLE_ADMINISTRATOR
//   return "staff";
// };

/* ==================== 数据加载 ==================== */
const loadExams = async () => {
  const userInfo = getUserInfo();
  // const role = getUserType();

  // 确保 userInfo 存在且包含 id
  if (!userInfo) {
    ElMessage.error("用户信息获取失败");
    return;
  }

  // 尝试从 localStorage 获取 userInfo，看看是否有 id
  const userInfoStr = localStorage.getItem("userInfo");
  let userId = userInfo.account; // 默认使用 account

  if (userInfoStr) {
    try {
      const userDetail = JSON.parse(userInfoStr);
      userId = userDetail.id || userInfo.account;
    } catch (e) {
      console.warn("解析用户信息失败");
    }
  }

  loading.value = true; // 开始加载
  try {
    const res = await axios.get(`${API_BASE}/exam/getExamList/staff/${userId}`);

    // 获取数据并按照开始时间降序排列（最新的在前面）
    let exams = Array.isArray(res.data.data) ? res.data.data : [];

    // 按开始时间排序：最新的考试排在最前面
    exams.sort((a, b) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return timeB - timeA; // 降序排列
    });

    fullExamList.value = exams;

    currentPage.value = 1;
    updatePagedExams();
  } catch (error) {
    console.error("加载考试列表失败:", error);
    ElMessage.error("加载考试列表失败");
  } finally {
    loading.value = false; // 加载完成
  }
};

// 搜索考试
const searchExam = async () => {
  loading.value = true; // 开始加载
  try {
    // 直接传递账户名字符串数组
    const res = await axios.post(`${API_BASE}/exam/findExam`, {
      name: searchForm.value.name,
      staffs: searchForm.value.created_by,
    });

    // 获取数据并按照开始时间降序排列
    let exams = Array.isArray(res.data.data) ? res.data.data : [];

    // 按开始时间排序：最新的考试排在最前面
    exams.sort((a, b) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return timeB - timeA; // 降序排列
    });

    fullExamList.value = exams;

    currentPage.value = 1;
    updatePagedExams();
  } catch (error) {
    console.error("搜索考试失败:", error);
    ElMessage.error("搜索考试失败");
  } finally {
    loading.value = false; // 加载完成
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
    const res = await axios.get(`${API_BASE}/paper/getPaperList`);
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
};

/* ==================== 考试操作 ==================== */
// 判断是否显示批改按钮 - 直接根据后端状态
const shouldShowGradeButton = (exam) => {
  // 直接使用后端状态判断
  // ONGOING 或 FINISHED 状态的考试都可以批改
  return exam.status === "ONGOING" || exam.status === "FINISHED";
};

// 批改考试
const gradeExam = (exam) => {
  // 跳转到批改考试页面，传递考试ID
  router.push({
    path: "/teacher/exammanagement/assessexam",
    query: { examId: exam.id },
  });
};

// 查看考试详情
const viewExamDetails = (exam) => {
  detailExamData.value = exam;
  detailVisible.value = true;
};

/* ==================== 创建考试弹窗 ==================== */
const createVisible = ref(false);

const createExamData = ref({
  paper_id: null,
  name: "",
  start_time: "",
  duration: 120,
});

const paperOptions = ref([]);

const loadPaperOptions = async () => {
  try {
    const res = await axios.get(`${API_BASE}/paper/getPaperList`);
    paperOptions.value = res.data.data || [];
  } catch (error) {
    console.error("获取试卷列表失败", error);
    ElMessage.error("获取试卷列表失败");
  }
};

const CreateExam = async () => {
  await loadPaperOptions();

  // 重置表单
  createExamData.value = {
    paper_id: null,
    name: "",
    start_time: "",
    duration: 120,
  };

  createVisible.value = true;
};

const submitCreateExam = async () => {
  try {
    const userInfo = getUserInfo();
    if (!userInfo) {
      ElMessage.error("无法获取用户信息");
      return;
    }

    // 直接使用账户名作为 created_by
    const payload = {
      paper_id: createExamData.value.paper_id,
      name: createExamData.value.name,
      start_time: formatDateTimeForBackend(createExamData.value.start_time),
      duration: createExamData.value.duration,
      created_by: userInfo.account, // 直接使用账户名字符串
    };

    await axios.post(`${API_BASE}/exam/createExam`, payload);

    ElMessage.success("考试创建成功");
    createVisible.value = false;

    // 刷新列表
    await loadExams();
  } catch (error) {
    console.error("创建考试失败", error);
    ElMessage.error("创建考试失败");
  }
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

    const examData = {
      ...editExamData.value,
      start_time: formatDateTimeForBackend(editExamData.value.start_time),
      created_by: userInfo.account, // 直接使用账户名字符串
    };

    await axios.post(`${API_BASE}/exam/updateExam`, examData);

    ElMessage.success("考试更新成功");
    editVisible.value = false;

    if (searchForm.value.name || searchForm.value.created_by.length > 0) {
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

/* ==================== 发布考试 ==================== */
const publishVisible = ref(false);
const publishExamData = ref(null);

// 学生列表
const studentList = ref([]);
const filteredStudents = ref([]);
const studentSearch = ref("");
const showStudentDropdown = ref(false);

// 选中的学生姓名数组
const selectedStudentNames = ref([]);

const loadStudentList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/user/getStudentList`);
    const list = res.data.data || [];

    // 确保每个学生对象都有 name 字段
    studentList.value = list.map((item) => ({
      id: item.id,
      name: item.name || item.account, // 使用姓名，如果没有则使用账号
      account: item.account, // 保留账号字段备用
    }));

    filteredStudents.value = studentList.value;
  } catch (err) {
    ElMessage.error("加载学生列表失败");
  }
};

const openPublishExam = async (exam) => {
  publishExamData.value = exam;
  selectedStudentNames.value = [];

  await loadStudentList();
  publishVisible.value = true;
};

// 计算属性：选中的学生对象（用于显示）
const selectedStudents = computed(() =>
  selectedStudentNames.value
    .map((name) => studentList.value.find((s) => s.name === name))
    .filter(Boolean)
);

const toggleStudentDropdown = () => {
  showStudentDropdown.value = !showStudentDropdown.value;
  filterStudents();
};

const filterStudents = () => {
  if (!studentSearch.value) {
    filteredStudents.value = studentList.value;
  } else {
    filteredStudents.value = studentList.value.filter((s) =>
      s.name.toLowerCase().includes(studentSearch.value.toLowerCase())
    );
  }
};

const toggleStudent = (stu) => {
  const idx = selectedStudentNames.value.indexOf(stu.name);
  if (idx > -1) {
    selectedStudentNames.value.splice(idx, 1);
  } else {
    selectedStudentNames.value.push(stu.name);
  }
};

const removeStudent = (name) => {
  selectedStudentNames.value = selectedStudentNames.value.filter(
    (stuName) => stuName !== name
  );
};

const isStudentSelected = (name) => {
  return selectedStudentNames.value.includes(name);
};

const submitPublishExam = async () => {
  if (selectedStudentNames.value.length === 0) {
    ElMessage.warning("请选择至少一名学生");
    return;
  }

  try {
    await axios.post(`${API_BASE}/exam/publishExam`, {
      exam_id: publishExamData.value.id,
      students: selectedStudentNames.value, // 传递学生姓名数组
    });

    ElMessage.success("考试发布成功");
    publishVisible.value = false;

    await loadExams();
  } catch (err) {
    console.error(err);
    ElMessage.error("发布考试失败");
  }
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
  loadCreatorList();

  // 添加点击外部关闭下拉框的事件监听
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  // 移除事件监听
  document.removeEventListener("click", handleClickOutside);
});

watch(currentPage, updatePagedExams);
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

/* ==================== 加载动画样式 ==================== */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 0;
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 4px solid rgba(64, 158, 255, 0.1);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  color: #606266;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* 表格行加载占位符 */
.loading-row {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    90deg,
    rgba(240, 240, 240, 0.2) 25%,
    rgba(230, 230, 230, 0.4) 37%,
    rgba(240, 240, 240, 0.2) 63%
  );
  background-size: 1000px 100%;
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
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

/* 考试时间样式 */
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

/* 多选下拉框样式 */
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

  /* 响应式加载动画 */
  .loading-spinner {
    width: 50px;
    height: 50px;
  }
  
  .loading-text {
    font-size: 14px;
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