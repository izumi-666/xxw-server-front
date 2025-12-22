<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          考试管理
        </h1>
      </div>
    </div>

    <!-- 顶部操作区 - 有创建权限时才显示 -->
    <div v-if="hasCreatePermission" class="action-bar card">
      <div class="action-buttons">
        <button class="btn-primary" @click="goCreateExam">
          安排新考试
        </button>
        <button class="btn-success" @click="batchArrange">
          批量安排
        </button>
        <button class="btn-info" @click="exportExamData">
          导出数据
        </button>
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
            v-model="searchForm.description"
            placeholder="请输入考试名称"
            class="form-input"
          />
        </div>
      </div>

      <div class="criteria-grid">
        <!-- 考试发起人 -->
        <div class="criteria-item">
          <label class="criteria-label">考试发起人</label>
          <input
            type="text"
            v-model="searchForm.description"
            placeholder="请输入考试发起人名"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <!-- 考试列表 - 有读权限时才显示 -->
    <div v-if="hasReadPermission">
      <div class="search-results card">
        <div class="results-header">
          <h2 class="section-title">考试列表</h2>
          <div class="results-count" v-if="examList.length">
            共 {{ examList.length }} 场考试
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
                  <th>参考人数</th>
                  <th>平均分</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exam in examList" :key="exam.id">
                  <td>
                    <div class="exam-name">{{ exam.name }}</div>
                    <div class="exam-desc" v-if="exam.description">{{ exam.description }}</div>
                  </td>
                  <td>{{ exam.subject }}</td>
                  <td>{{ exam.grade }}</td>
                  <td>
                    <div>{{ formatDateTime(exam.start_time) }}</div>
                    <div class="time-range">至 {{ formatDateTime(exam.end_time) }}</div>
                  </td>
                  <td>
                    <span class="status-badge" :class="`status-${exam.status}`">
                      {{ getStatusText(exam.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="participant-count">{{ exam.participant_count || 0 }}</div>
                  </td>
                  <td>
                    <div class="avg-score" v-if="exam.average_score !== null">
                      {{ exam.average_score.toFixed(1) }}
                    </div>
                    <div class="no-score" v-else>--</div>
                  </td>
                  <td>
                    <div class="action-buttons-cell">
                      <!-- 查看详情按钮 -->
                      <button 
                        v-if="hasReadPermission"
                        class="btn-info btn-sm"
                        @click="viewExamDetails(exam)"
                      >
                        详情
                      </button>
                      
                      <!-- 编辑按钮 -->
                      <button 
                        v-if="hasUpdatePermission && exam.status === 'pending'"
                        class="btn-secondary btn-sm"
                        @click="editExam(exam)"
                      >
                        编辑
                      </button>
                      
                      <!-- 监考安排按钮 -->
                      <button 
                        v-if="hasUpdatePermission && exam.status === 'pending'"
                        class="btn-warning btn-sm"
                        @click="arrangeInvigilators(exam)"
                      >
                        监考
                      </button>
                      
                      <!-- 成绩录入按钮 -->
                      <button 
                        v-if="hasUpdatePermission && exam.status === 'completed'"
                        class="btn-success btn-sm"
                        @click="enterScores(exam)"
                      >
                        成绩
                      </button>
                      
                      <!-- 成绩分析按钮 -->
                      <button 
                        v-if="hasReadPermission && exam.status === 'graded'"
                        class="btn-primary btn-sm"
                        @click="analyzeScores(exam)"
                      >
                        分析
                      </button>
                      
                      <!-- 删除按钮 -->
                      <button 
                        v-if="hasDeletePermission && exam.status === 'pending'"
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
            <p class="no-results-tip">请安排新考试或调整筛选条件</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 无权限提示 -->
    <div v-if="!hasAnyExamPermission" class="no-permission-card card">
      <div class="no-permission-content">
        <p class="no-permission-text">您没有考试管理权限，请联系管理员</p>
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
                  <span>{{ formatDateTime(detailExamData?.start_time) }} - {{ formatDateTime(detailExamData?.end_time) }}</span>
                </div>
                <div class="info-item">
                  <label>考试时长：</label>
                  <span>{{ calculateDuration(detailExamData) }}</span>
                </div>
                <div class="info-item full-width" v-if="detailExamData?.description">
                  <label>考试说明：</label>
                  <span>{{ detailExamData.description }}</span>
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
                    v-if="hasReadPermission"
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
            
            <!-- 监考安排 -->
            <div class="detail-section" v-if="detailExamData?.invigilators && detailExamData.invigilators.length">
              <h4 class="section-subtitle">监考安排</h4>
              <div class="invigilator-list">
                <div 
                  v-for="invigilator in detailExamData.invigilators" 
                  :key="invigilator.id"
                  class="invigilator-item"
                >
                  <div class="invigilator-avatar">
                    {{ invigilator.name.charAt(0) }}
                  </div>
                  <div class="invigilator-info">
                    <div class="invigilator-name">{{ invigilator.name }}</div>
                    <div class="invigilator-role">{{ invigilator.role }}</div>
                  </div>
                  <div class="invigilator-contact">
                    <div class="contact-item">📞 {{ invigilator.phone || '未提供' }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 成绩概览 -->
            <div class="detail-section" v-if="detailExamData?.status === 'graded'">
              <h4 class="section-subtitle">成绩概览</h4>
              <div class="score-overview">
                <div class="score-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ detailExamData.participant_count || 0 }}</div>
                    <div class="stat-label">参考人数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ detailExamData.average_score?.toFixed(1) || '--' }}</div>
                    <div class="stat-label">平均分</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ detailExamData.highest_score || '--' }}</div>
                    <div class="stat-label">最高分</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ detailExamData.lowest_score || '--' }}</div>
                    <div class="stat-label">最低分</div>
                  </div>
                </div>
                
                <div class="score-distribution" v-if="detailExamData.score_distribution">
                  <h5>分数分布</h5>
                  <div class="distribution-chart">
                    <div 
                      v-for="(range, index) in detailExamData.score_distribution.ranges"
                      :key="index"
                      class="distribution-bar"
                    >
                      <div class="bar-label">{{ range.label }}</div>
                      <div class="bar-container">
                        <div 
                          class="bar-fill"
                          :style="{ height: range.percentage + '%' }"
                        ></div>
                      </div>
                      <div class="bar-count">{{ range.count }}人</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================
          安排监考弹窗
    ============================== -->
    <div v-if="invigilatorVisible" class="modal-overlay" @click="invigilatorVisible = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">安排监考 - {{ currentExam?.name }}</h3>
          <button @click="invigilatorVisible = false" class="btn-close">×</button>
        </div>
        
        <div class="invigilator-content">
          <div class="invigilator-form">
            <div class="form-group">
              <label>选择监考老师</label>
              <div class="teacher-selector">
                <div 
                  v-for="teacher in availableTeachers"
                  :key="teacher.id"
                  class="teacher-option"
                  :class="{ selected: selectedInvigilators.includes(teacher.id) }"
                  @click="toggleInvigilator(teacher.id)"
                >
                  <div class="teacher-avatar">{{ teacher.name.charAt(0) }}</div>
                  <div class="teacher-info">
                    <div class="teacher-name">{{ teacher.name }}</div>
                    <div class="teacher-subject">{{ teacher.subject }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group" v-if="selectedInvigilators.length > 0">
              <label>分配角色</label>
              <div class="role-assignment">
                <div 
                  v-for="teacherId in selectedInvigilators"
                  :key="teacherId"
                  class="role-item"
                >
                  <div class="teacher-name">
                    {{ getTeacherById(teacherId)?.name }}
                  </div>
                  <select 
                    v-model="invigilatorRoles[teacherId]"
                    class="role-select"
                  >
                    <option value="main">主监考</option>
                    <option value="assistant">副监考</option>
                    <option value="reserve">备用监考</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="invigilatorVisible = false">取消</button>
          <button class="btn-primary" @click="saveInvigilators">保存安排</button>
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

/* ==================== 权限相关 ==================== */
const getUserPermissions = () => {
  try {
    const permissionsStr = localStorage.getItem("userPermissions");
    return permissionsStr ? JSON.parse(permissionsStr) : [];
  } catch (error) {
    console.error("解析权限信息失败:", error);
    return [];
  }
};

const hasPermission = (permission) => {
  const userPermissions = getUserPermissions();
  return userPermissions.includes(permission) || userPermissions.includes('exam:*');
};

const hasReadPermission = computed(() => hasPermission('exam:read'));
const hasCreatePermission = computed(() => hasPermission('exam:create'));
const hasUpdatePermission = computed(() => hasPermission('exam:update'));
const hasDeletePermission = computed(() => hasPermission('exam:delete'));
const hasDownloadPermission = computed(() => hasPermission('exam:download'));

const hasAnyExamPermission = computed(() => {
  const perms = ['exam:read', 'exam:create', 'exam:update', 'exam:delete', 'exam:download'];
  return perms.some(perm => hasPermission(perm));
});

/* ==================== 数据状态 ==================== */
const examList = ref([]);
const subjectList = ref([]);
const gradeList = ref([]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 模态框状态
const detailVisible = ref(false);
const invigilatorVisible = ref(false);
const detailExamData = ref(null);
const currentExam = ref(null);

/* ==================== 搜索相关 ==================== */
const searchForm = ref({
  description: "",
  created_by: [],
});

/* ==================== 数据加载 ==================== */
const loadExams = async () => {
  try {
    const params = {
      ...searchForm.value,
      page: currentPage.value,
      page_size: pageSize.value,
      // 将数组转换为逗号分隔的字符串
      subject_id: searchForm.value.subject_id.join(','),
      grade_id: searchForm.value.grade_id.join(','),
      status: searchForm.value.status.join(',')
    };
    
    const res = await axios.get(`${API_BASE}/exam/list`, { params });
    examList.value = res.data.data?.items || [];
    totalItems.value = res.data.data?.total || 0;
  } catch (error) {
    console.error("加载考试列表失败:", error);
    // 模拟数据
    examList.value = [
      {
        id: 1,
        name: "2024学年第一学期期中考试",
        subject: "数学",
        grade: "七年级",
        start_time: "2024-11-15T09:00:00",
        end_time: "2024-11-15T11:00:00",
        status: "graded",
        description: "本学期期中考试，请各位同学认真备考",
        participant_count: 45,
        average_score: 85.5,
        highest_score: 98,
        lowest_score: 62,
        paper_info: {
          name: "七年级数学期中试卷",
          total_score: 100,
          question_count: 25,
          difficulty: "中等"
        },
        invigilators: [
          { id: 1, name: "张老师", role: "主监考", phone: "13800138000" },
          { id: 2, name: "李老师", role: "副监考", phone: "13800138001" }
        ],
        score_distribution: {
          ranges: [
            { label: "90-100", count: 12, percentage: 26.7 },
            { label: "80-89", count: 18, percentage: 40.0 },
            { label: "70-79", count: 10, percentage: 22.2 },
            { label: "60-69", count: 4, percentage: 8.9 },
            { label: "0-59", count: 1, percentage: 2.2 }
          ]
        }
      },
      {
        id: 2,
        name: "英语单元测试",
        subject: "英语",
        grade: "八年级",
        start_time: "2024-11-20T14:00:00",
        end_time: "2024-11-20T15:30:00",
        status: "completed",
        description: "第三单元测试",
        participant_count: 48,
        average_score: null,
        paper_info: {
          name: "八年级英语第三单元测试卷",
          total_score: 100,
          question_count: 30,
          difficulty: "简单"
        }
      },
      {
        id: 3,
        name: "物理期末考试",
        subject: "物理",
        grade: "九年级",
        start_time: "2024-12-25T09:00:00",
        end_time: "2024-12-25T11:30:00",
        status: "pending",
        description: "本学期期末考试",
        participant_count: 0,
        average_score: null
      }
    ];
    totalItems.value = examList.value.length;
  }
};

const loadSubjectList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getSubjectList`);
    subjectList.value = Object.entries(res.data.data || {}).map(
      ([id, name]) => ({ id: Number(id), name })
    );
    filteredSubjects.value = subjectList.value;
  } catch (error) {
    console.error("加载科目列表失败:", error);
    // 模拟数据
    subjectList.value = [
      { id: 1, name: "数学" },
      { id: 2, name: "英语" },
      { id: 3, name: "语文" },
      { id: 4, name: "物理" },
      { id: 5, name: "化学" },
      { id: 6, name: "生物" },
      { id: 7, name: "历史" },
      { id: 8, name: "地理" }
    ];
    filteredSubjects.value = subjectList.value;
  }
};

const loadGradeList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getGradeList`);
    gradeList.value = Object.entries(res.data.data || {}).map(
      ([id, name]) => ({ id: Number(id), name })
    );
    filteredGrades.value = gradeList.value;
  } catch (error) {
    console.error("加载年级列表失败:", error);
    // 模拟数据
    gradeList.value = [
      { id: 1, name: "七年级" },
      { id: 2, name: "八年级" },
      { id: 3, name: "九年级" },
      { id: 4, name: "高一年级" },
      { id: 5, name: "高二年级" },
      { id: 6, name: "高三年级" }
    ];
    filteredGrades.value = gradeList.value;
  }
};

const searchExam = async () => {
  if (!hasReadPermission.value) return;
  currentPage.value = 1;
  await loadExams();
};

const resetSearch = () => {
  searchForm.value = {
    name: "",
    subject_id: [],
    grade_id: [],
    status: [],
    start_time: "",
    end_time: ""
  };
  currentPage.value = 1;
  loadExams();
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
  loadExams();
};

/* ==================== 考试操作 ==================== */
const goCreateExam = () => {
  if (!hasCreatePermission.value) {
    ElMessage.warning("您没有创建考试的权限");
    return;
  }
  router.push("/teacher/exam/create");
};

const batchArrange = () => {
  if (!hasCreatePermission.value) {
    ElMessage.warning("您没有批量安排考试的权限");
    return;
  }
  ElMessage.info("批量安排功能开发中...");
};

const exportExamData = () => {
  if (!hasDownloadPermission.value) {
    ElMessage.warning("您没有导出数据的权限");
    return;
  }
  ElMessage.info("导出数据功能开发中...");
};

const viewExamDetails = (exam) => {
  if (!hasReadPermission.value) {
    ElMessage.warning("您没有查看考试详情的权限");
    return;
  }
  detailExamData.value = exam;
  detailVisible.value = true;
};

const editExam = (exam) => {
  if (!hasUpdatePermission.value) {
    ElMessage.warning("您没有编辑考试的权限");
    return;
  }
  ElMessage.info(`编辑考试 ID = ${exam.id}`);
  // router.push(`/exam/edit/${exam.id}`)
};

// 监考安排相关
const availableTeachers = ref([]);
const selectedInvigilators = ref([]);
const invigilatorRoles = ref({});

const arrangeInvigilators = async (exam) => {
  if (!hasUpdatePermission.value) {
    ElMessage.warning("您没有安排监考的权限");
    return;
  }
  
  currentExam.value = exam;
  
  // 加载可用的教师
  try {
    const res = await axios.get(`${API_BASE}/exam/availableTeachers`, {
      params: { exam_id: exam.id }
    });
    availableTeachers.value = res.data.data || [];
  } catch (error) {
    console.error("加载教师列表失败:", error);
    // 模拟数据
    availableTeachers.value = [
      { id: 1, name: "张老师", subject: "数学" },
      { id: 2, name: "李老师", subject: "英语" },
      { id: 3, name: "王老师", subject: "语文" },
      { id: 4, name: "赵老师", subject: "物理" },
      { id: 5, name: "刘老师", subject: "化学" }
    ];
  }
  
  // 如果考试已有监考安排，预选中
  if (exam.invigilators) {
    selectedInvigilators.value = exam.invigilators.map(i => i.id);
    exam.invigilators.forEach(inv => {
      invigilatorRoles.value[inv.id] = inv.role === '主监考' ? 'main' : 
                                       inv.role === '副监考' ? 'assistant' : 'reserve';
    });
  } else {
    selectedInvigilators.value = [];
    invigilatorRoles.value = {};
  }
  
  invigilatorVisible.value = true;
};

const toggleInvigilator = (teacherId) => {
  const index = selectedInvigilators.value.indexOf(teacherId);
  if (index > -1) {
    selectedInvigilators.value.splice(index, 1);
    delete invigilatorRoles.value[teacherId];
  } else {
    selectedInvigilators.value.push(teacherId);
    invigilatorRoles.value[teacherId] = 'assistant'; // 默认设为副监考
  }
};

const getTeacherById = (id) => {
  return availableTeachers.value.find(teacher => teacher.id === id);
};

const saveInvigilators = async () => {
  try {
    const invigilators = selectedInvigilators.value.map(teacherId => ({
      teacher_id: teacherId,
      role: invigilatorRoles.value[teacherId]
    }));
    
    await axios.post(`${API_BASE}/exam/arrangeInvigilators`, {
      exam_id: currentExam.value.id,
      invigilators
    });
    
    ElMessage.success("监考安排保存成功");
    invigilatorVisible.value = false;
    loadExams(); // 刷新列表
  } catch (error) {
    console.error("保存监考安排失败:", error);
    ElMessage.error("保存失败");
  }
};

const enterScores = (exam) => {
  if (!hasUpdatePermission.value) {
    ElMessage.warning("您没有录入成绩的权限");
    return;
  }
  ElMessage.info(`录入成绩 - 考试ID: ${exam.id}`);
  // router.push(`/exam/enter-scores/${exam.id}`)
};

const analyzeScores = (exam) => {
  if (!hasReadPermission.value) {
    ElMessage.warning("您没有查看成绩分析的权限");
    return;
  }
  ElMessage.info(`成绩分析 - 考试ID: ${exam.id}`);
  // router.push(`/exam/analysis/${exam.id}`)
};

const deleteExam = (exam) => {
  if (!hasDeletePermission.value) {
    ElMessage.warning("您没有删除考试的权限");
    return;
  }
  
  ElMessageBox.confirm(
    `确定要删除考试《${exam.name}》吗？删除后无法恢复！`,
    "警告",
    { 
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消"
    }
  )
    .then(async () => {
      try {
        await axios.delete(`${API_BASE}/exam/delete/${exam.id}`);
        examList.value = examList.value.filter((e) => e.id !== exam.id);
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

const exportExamReport = (exam) => {
  if (!hasDownloadPermission.value) {
    ElMessage.warning("您没有导出报告的权限");
    return;
  }
  ElMessage.info(`导出考试报告: ${exam.name}`);
};

/* ==================== 工具函数 ==================== */
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-');
};

const calculateDuration = (exam) => {
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

const getStatusText = (status) => {
  const statusMap = {
    'pending': '未开始',
    'ongoing': '进行中',
    'completed': '已结束',
    'grading': '阅卷中',
    'graded': '已出成绩'
  };
  return statusMap[status] || status;
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  loadExams();
  loadSubjectList();
  loadGradeList();
  filteredStatuses.value = statusList.value;
  document.addEventListener("click", handleClickOutside);
});

// 监听页码变化
watch(currentPage, () => {
  loadExams();
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

.date-range-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  flex: 1;
}

.date-separator {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
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
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.1);
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
  background: #f0f9eb;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #e1f3d8;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-tag.status-pending {
  background: #fdf6ec;
  color: #e6a23c;
  border-color: #faecd8;
}

.selected-tag.status-ongoing {
  background: #f0f9ff;
  color: #409eff;
  border-color: #d9ecff;
}

.selected-tag.status-completed {
  background: #f4f4f5;
  color: #909399;
  border-color: #e9e9eb;
}

.selected-tag.status-grading {
  background: #f0f9ff;
  color: #409eff;
  border-color: #d9ecff;
}

.selected-tag.status-graded {
  background: #f0f9eb;
  color: #67c23a;
  border-color: #e1f3d8;
}

.selected-tag:hover {
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

.no-results-tip {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.7;
}

/* ==================== 无权限提示样式 ==================== */
.no-permission-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.no-permission-text {
  font-size: 16px;
  margin: 0;
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

/* 监考安排 */
.invigilator-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invigilator-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  gap: 16px;
}

.invigilator-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #409eff 0%, #3375e0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.invigilator-info {
  flex: 1;
}

.invigilator-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.invigilator-role {
  font-size: 12px;
  color: #409eff;
  background: #f0f9eb;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.invigilator-contact {
  color: #606266;
  font-size: 14px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
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

/* 监考安排弹窗 */
.invigilator-content {
  margin: 20px 0;
}

.invigilator-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group label {
  font-weight: 600;
  color: #303133;
}

.teacher-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
}

.teacher-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 12px;
}

.teacher-option:hover {
  border-color: #409eff;
  background-color: #f0f9eb;
}

.teacher-option.selected {
  border-color: #409eff;
  background-color: #f0f9eb;
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #409eff 0%, #3375e0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.teacher-info {
  flex: 1;
}

.teacher-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.teacher-subject {
  font-size: 12px;
  color: #909399;
}

.role-assignment {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
}

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
}

.role-select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  background: white;
  cursor: pointer;
}

.role-select:focus {
  outline: none;
  border-color: #409eff;
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