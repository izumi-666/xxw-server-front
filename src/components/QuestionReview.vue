<template>
  <!-- 主容器 -->
  <div class="container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">题目审核系统</h1>
        <div class="user-info">
          <span class="user-name">审核人：{{ currentUserName }}</span>
        </div>
      </div>
    </div>

    <!-- 页面内容区域 -->
    <div>
      <!-- 操作区域 -->
      <div class="action-section">
        <div class="action-row">
          <div class="action-info">
            <span class="info-text">待审核题目：{{ totalCount }} 个</span>
          </div>
          <div class="action-buttons">
            <button 
              @click="batchApprove" 
              class="btn-primary" 
              :disabled="!hasSelectedItems || approving"
            >
              <span v-if="approving">同意中...</span>
              <span v-else>批量同意 ({{ selectedIds.length }})</span>
            </button>
            <button @click="refreshList" class="btn-secondary">
              刷新列表
            </button>
          </div>
        </div>
      </div>

      <!-- 题目审核列表 -->
      <div class="review-management-section">
        <div class="review-container">
          <!-- 题目列表 -->
          <div class="question-list-section">
            <h3>待审核题目列表</h3>
            <div class="list-header">
              <div class="list-controls">
                <div class="select-all">
                  <input 
                    type="checkbox" 
                    id="selectAll" 
                    v-model="selectAll"
                    @change="toggleSelectAll"
                  />
                  <label for="selectAll">全选</label>
                </div>
                <span class="list-info" v-if="questionList.length">
                  已选择 {{ selectedIds.length }} 个题目
                </span>
              </div>
            </div>
            
            <!-- 列表加载动画 -->
            <div v-if="loading" class="loading-container">
              <div class="loading-content">
                <div class="loading-spinner">
                  <div class="spinner"></div>
                </div>
                <p class="loading-text">正在加载待审核题目...</p>
              </div>
            </div>

            <div class="list-container" v-else-if="questionList.length">
              <div class="question-table">
                <div class="table-header">
                  <div class="table-cell select-cell">选择</div>
                  <div class="table-cell title-cell">题目内容</div>
                  <div class="table-cell type-cell">题型</div>
                  <div class="table-cell subject-cell">科目</div>
                  <div class="table-cell difficulty-cell">难度</div>
                  <div class="table-cell grade-cell">年级</div>
                  <div class="table-cell submitter-cell">提交人</div>
                  <div class="table-cell reviewer-cell">审核人</div>
                  <div class="table-cell action-cell">操作</div>
                </div>
                
                <div 
                  v-for="question in questionList" 
                  :key="question.id"
                  class="table-row"
                  :class="{ 
                    'selected': selectedIds.includes(question.id),
                    'active': selectedQuestion && selectedQuestion.id === question.id
                  }"
                  @click="handleRowClick(question)"
                >
                  <div class="table-cell select-cell" @click.stop>
                    <input 
                      type="checkbox" 
                      :id="'question-' + question.id"
                      :value="question.id"
                      v-model="selectedIds"
                    />
                  </div>
                  <div class="table-cell title-cell">
                    <div 
                      class="question-content markdown-content" 
                      v-html="renderMarkdown(truncateContent(question.title))"
                      :title="question.title"
                    ></div>
                  </div>
                  <div class="table-cell type-cell">
                    <span class="type-badge" :class="getQuestionTypeClass(question.marking_type)">
                       {{ getQuestionTypeText(question.question_category_id) }}
                    </span>
                  </div>
                  <div class="table-cell subject-cell">
                    <span class="subject-badge">
                      {{ getSubjectName(question.subject_id) }}
                    </span>
                  </div>
                  <div class="table-cell difficulty-cell">
                    <div class="star-rating">
                      <span 
                        v-for="star in getDifficultyStars(question.difficulty_level).filled" 
                        :key="'filled-' + star"
                        class="star filled"
                      >⭐</span>
                    </div>
                  </div>
                  <div class="table-cell grade-cell">
                    {{ getGradeName(question.grade_id) }}
                  </div>
                  <div class="table-cell submitter-cell">{{ question.uploader || '未知' }}</div>
                  <div class="table-cell reviewer-cell">{{ question.reviewer || '待分配' }}</div>
                  <div class="table-cell action-cell" @click.stop>
                    <!-- 行内操作按钮 -->
                    <div class="row-actions">
                      <button 
                        @click="approveQuestion(question.id)" 
                        class="btn-approve-small"
                        :disabled="approving"
                      >
                        同意
                      </button>
                      <button 
                        @click="singleRejectQuestion(question.id)"
                        class="btn-reject-small"
                        :disabled="rejecting"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 分页 -->
              <div class="pagination" v-if="totalCount > pageSize">
                <button 
                  @click="prevPage" 
                  :disabled="currentPage === 1"
                  class="page-btn"
                >
                  上一页
                </button>
                <span class="page-info">
                  第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
                </span>
                <button 
                  @click="nextPage" 
                  :disabled="currentPage === totalPages"
                  class="page-btn"
                >
                  下一页
                </button>
                <div class="page-size-selector">
                  <label>每页显示：</label>
                  <select v-model="pageSize" @change="onPageSizeChange">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="empty-list" v-else>
              <p>暂无待审核题目</p>
            </div>
          </div>
          
          <!-- 题目详情 -->
          <div class="question-detail-section">
            <h3>题目详情</h3>
            <div class="detail-content" v-if="selectedQuestion">
              <!-- 基本信息 -->
              <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>题型：</label>
                    <span>
                      <span class="type-badge" :class="getQuestionTypeClass(selectedQuestion.marking_type)">
                        {{ getQuestionTypeText(selectedQuestion.question_category_id) }}
                      </span>
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>评分方法：</label>
                    <span>
                      <span class="type-badge marking-badge" :class="getMarkingTypeClass(selectedQuestion.marking_type)">
                        {{ getMarkingTypeText(selectedQuestion.marking_type) }}
                      </span>
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>科目：</label>
                    <span class="subject-badge">
                      {{ getSubjectName(selectedQuestion.subject_id) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>难度：</label>
                    <span class="difficulty-stars">
                      <span 
                        v-for="star in getDifficultyStars(selectedQuestion.difficulty_level).filled" 
                        :key="'filled-' + star"
                        class="star filled"
                      >⭐</span>
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>年级：</label>
                    <span>{{ getGradeName(selectedQuestion.grade_id) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>提交人：</label>
                    <span>{{ selectedQuestion.uploader || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <label>审核人：</label>
                    <span>{{ selectedQuestion.reviewer || '待分配' }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedQuestion.school_id">
                    <label>学校：</label>
                    <span>{{ getSchoolName(selectedQuestion.school_id) }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedQuestion.knowledge_point_id">
                    <label>知识点：</label>
                    <span class="knowledge-tag primary">
                      {{ getKnowledgePointNameById(selectedQuestion.knowledge_point_id) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <label>副知识点：</label>
                    <span class="sub-knowledge-list" v-if="selectedQuestion.sub_knowledge_point_ids && hasSubKnowledgePoints(selectedQuestion.sub_knowledge_point_ids)">
                      <span 
                        v-for="(name, index) in getSubKnowledgePointNames(selectedQuestion.sub_knowledge_point_ids)" 
                        :key="index"
                        class="knowledge-tag secondary"
                      >
                        {{ name }}
                      </span>
                    </span>
                    <span v-else class="no-data-text">暂无</span>
                  </div>
                  <div class="detail-item">
                    <label>解题思想：</label>
                    <span class="solution-idea-list" v-if="hasSolutionIdeas(selectedQuestion.solution_idea_ids)">
                      <span 
                        v-for="(name, index) in getSolutionIdeaNames(selectedQuestion.solution_idea_ids)" 
                        :key="index"
                        class="solution-idea-tag"
                      >
                        {{ name }}
                      </span>
                    </span>
                    <span v-else class="no-data-text">暂无</span>
                  </div>
                </div>
              </div>
              
              <!-- 题目内容 -->
              <div class="detail-section">
                <h4>题目内容</h4>
                <div class="question-full-content markdown-content" v-html="renderMarkdown(selectedQuestion.title)"></div>
              </div>
              
              <!-- 选项 -->
              <div class="detail-section" v-if="selectedQuestion.options && Object.keys(selectedQuestion.options).length">
                <h4>选项</h4>
                <div class="options-list">
                  <div 
                    v-for="(optionContent, optionKey) in selectedQuestion.options" 
                    :key="optionKey"
                    class="option-item"
                    :class="{ 'correct': isCorrectOption(optionKey) }"
                  >
                    <span class="option-label">{{ optionKey.replace('option_', '') }}.</span>
                    <span class="option-content markdown-content" v-html="renderMarkdown(optionContent)"></span>
                    <span v-if="isCorrectOption(optionKey)" class="correct-indicator">✓ 正确答案</span>
                  </div>
                </div>
              </div>
              
              <!-- 答案 -->
              <div class="detail-section" v-if="selectedQuestion.answer">
                <h4>正确答案</h4>
                <div class="analysis-content markdown-content" v-html="renderMarkdown(selectedQuestion.answer)"></div>
              </div>
              
              <!-- 解析和备注 -->
              <div class="detail-section" v-if="selectedQuestion.notes || selectedQuestion.remark">
                <h4>解析和备注</h4>
                <div class="detail-grid">
                  <div class="detail-item" v-if="selectedQuestion.notes">
                    <label>解析：</label>
                    <span class="markdown-content" v-html="renderMarkdown(selectedQuestion.notes)"></span>
                  </div>
                  <div class="detail-item" v-if="selectedQuestion.remark">
                    <label>备注：</label>
                    <span class="markdown-content" v-html="renderMarkdown(selectedQuestion.remark)"></span>
                  </div>
                </div>
              </div>
              
              <!-- 图片 -->
              <div class="detail-section" v-if="selectedQuestion.img_url">
                <h4>题目图片</h4>
                <div class="image-container">
                  <img :src="selectedQuestion.img_url" alt="题目图片" class="question-image" />
                </div>
              </div>
              
              <!-- 审核操作按钮 -->
              <div class="review-actions">
                <button 
                  @click="approveQuestion(selectedQuestion.id)" 
                  class="btn-primary"
                  :disabled="approving"
                >
                  <span v-if="approving">同意中...</span>
                  <span v-else>同意该题目</span>
                </button>
                <button 
                  @click="singleRejectQuestion(selectedQuestion.id)"
                  class="btn-delete"
                  :disabled="rejecting"
                >
                  <span v-if="rejecting">拒绝中...</span>
                  <span v-else>拒绝该题目</span>
                </button>
              </div>
            </div>
            
            <!-- 未选择提示 -->
            <div class="no-selection" v-else>
              <p>请从左侧选择题目查看详情</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 拒绝确认对话框 -->
      <div v-if="showRejectConfirm" class="modal-overlay">
        <div class="modal-content">
          <h3>拒绝题目</h3>
          <!-- 只显示单个题目 -->
          <p v-if="rejectingSingleId">
            确定要拒绝选中的题目吗？
          </p>
          <!-- 拒绝理由输入框 -->
          <div class="reject-reason-input">
            <label for="rejectReason">拒绝理由：</label>
            <textarea 
              id="rejectReason"
              v-model="rejectReason"
              placeholder="请输入拒绝理由..."
              rows="4"
              class="reason-textarea"
              maxlength="500"
            ></textarea>
            <div class="char-count" :class="{ 'limit': rejectReason.length >= 500 }">
              {{ rejectReason.length }}/500
            </div>
          </div>
          <div class="modal-actions">
            <button @click="confirmSingleReject" class="btn-delete" :disabled="rejecting || !rejectReason.trim()">
              <span v-if="rejecting">处理中...</span>
              <span v-else>确认拒绝</span>
            </button>
            <button @click="cancelReject" class="btn-secondary">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { getQuestionCategoryText } from "../utils/questionCategory.js";
import { useGradeList } from "../utils/gradeList.js";
import { getSubjectName, initSubjectData } from "../utils/subjectList.js";
import { getSchoolList, schoolList } from "../utils/schoolList.js";
import { getKnowledgePointName, fetchKnowledgePointList } from "../utils/knowledgeList.js";
import { markdownToHtml } from "../utils/markdownUtils.js";

// API基础URL
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 使用年级列表
const { gradeList, loadGradeList, getGradeName } = useGradeList();

// ==================== 数据状态 ====================
const currentUserName = ref(""); // 当前用户名
const questionList = ref([]); // 题目列表
const selectedQuestion = ref(null); // 选中的题目
const selectedIds = ref([]); // 选中的题目ID数组
const rejectingSingleId = ref(null); // 存储单个拒绝的题目ID

// 加载状态
const loading = ref(false); // 题目列表加载状态
const approving = ref(false); // 同意操作中
const rejecting = ref(false); // 拒绝操作中
const knowledgePointMap = ref({}); // 存储知识点映射

// 分页相关
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 拒绝相关状态
const showRejectConfirm = ref(false); // 拒绝确认框显示状态
const rejectReason = ref(""); // 拒绝原因
const rejectingSingle = ref(false); // 是否拒绝单个题目
const pendingRejectIds = ref([]); // 待拒绝的题目ID数组

// ==================== 计算属性 ====================
// 是否有选中的题目
const hasSelectedItems = computed(() => {
  return selectedIds.value.length > 0;
});

// 是否全选
const selectAll = computed({
  get() {
    if (questionList.value.length === 0) return false;
    return questionList.value.every(item => selectedIds.value.includes(item.id));
  },
  set(value) {
    if (value) {
      selectedIds.value = questionList.value.map(item => item.id);
    } else {
      selectedIds.value = [];
    }
  }
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / pageSize.value);
});

// ==================== 生命周期 ====================
onMounted(async () => {
  try {
    // 并行加载所有基础数据
    await Promise.all([
      loadUserInfo(),
      loadAllBasicData(),
    ]);
    
    // 基础数据加载完成后，加载题目列表
    await loadReviewQuestionList();
  } catch (error) {
    console.error("页面初始化失败:", error);
    ElMessage.error("页面初始化失败，请刷新页面重试");
  }
});

// ==================== 基础数据加载方法 ====================
// 加载用户信息
const loadUserInfo = async () => {
  const userName = localStorage.getItem("userName");
  if (userName) {
    currentUserName.value = userName;
  } else {
    currentUserName.value = "未知用户";
    ElMessage.warning("未获取到当前用户信息");
  }
};

// 加载所有基础数据
const loadAllBasicData = async () => {
  try {
    await Promise.all([
      // 加载年级列表
      loadGradeList(),
      // 加载科目列表
      initSubjectData(),
      // 加载解题思想列表
      loadSolutionIdeas(),
      // 加载知识点列表
      loadKnowledgePointList(),
      // 加载学校列表
      getSchoolList()
    ]);
    
  } catch (error) {
    console.error("加载基础数据失败:", error);
    // 如果某个数据加载失败，不影响其他功能
    ElMessage.warning("部分基础数据加载失败，功能可能受限");
  }
};

// 加载解题思想列表
const solutionIdeas = ref({}); // 存储解题思想映射
const loadSolutionIdeas = async () => {
  if (Object.keys(solutionIdeas.value).length > 0) return;
  
  try {
    const res = await axios.get(`${API_BASE}/questions/getSolutionIdeaList`);
    
    if (res.data.code === 200 && res.data.data) {
      solutionIdeas.value = res.data.data;
    } else {
      console.warn("加载解题思想失败:", res.data.message);
    }
  } catch (error) {
    console.error("加载解题思想失败:", error);
    // 不显示错误消息，因为这不影响主要功能
  }
};

// 加载知识点列表
const loadKnowledgePointList = async () => {
  try {
    await fetchKnowledgePointList();
  } catch (error) {
    console.error("加载知识点列表失败:", error);
    // 不显示错误消息，因为这不影响主要功能
  }
};

// ==================== 待审核题目列表加载 ====================
// 加载待审核题目列表
const loadReviewQuestionList = async () => {
  if (!currentUserName.value) {
    ElMessage.error("无法获取当前用户信息");
    return;
  }
  
  loading.value = true;
  try {
    const res = await axios.get(
      `${API_BASE}/questions/getReviewQuestionList/${currentUserName.value}`,
      {
        params: {
          page: currentPage.value,
          pageSize: pageSize.value
        }
      }
    );

    if (res.data.code === 200) {
      questionList.value = res.data.data || [];
      totalCount.value = questionList.value.length;
      
      // 重新加载后，移除不存在的题目的选择
      const validIds = new Set(questionList.value.map(item => item.id));
      selectedIds.value = selectedIds.value.filter(id => validIds.has(id));
      
      if (questionList.value.length === 0 && currentPage.value > 1) {
        currentPage.value -= 1;
        await loadReviewQuestionList();
      }
    } else {
      ElMessage.error(res.data.message || "加载失败");
      questionList.value = [];
      totalCount.value = 0;
    }
  } catch (err) {
    console.error("加载待审核题目列表失败:", err);
    ElMessage.error("加载待审核题目列表失败");
    questionList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

// ==================== Markdown渲染方法 ====================
// 渲染Markdown内容
const renderMarkdown = (content) => {
  if (!content) return '';
  return markdownToHtml(content);
};

// ==================== 学校相关方法 ====================
// 根据学校ID获取学校名称
const getSchoolName = (schoolId) => {
  if (!schoolId) return '未知';
  
  const school = schoolList.value.find(item => item.id === schoolId);
  return school ? school.name : `学校ID: ${schoolId}`;
};

// 获取知识点名称
const getKnowledgePointNameById = (id) => {
  if (!id) return '未设置';
  return getKnowledgePointName(id);
};

// 获取副知识点名称
const getSubKnowledgePointNames = (ids) => {
  if (!ids) return ['未设置'];
  
  if (Array.isArray(ids)) {
    return ids.map(id => getKnowledgePointName(id));
  }
  
  if (typeof ids === 'string' && ids.includes(',')) {
    const idArray = ids.split(',').map(id => id.trim());
    return idArray.map(id => getKnowledgePointName(id));
  }
  
  return [getKnowledgePointName(ids)];
};

// 是否有副知识点
const hasSubKnowledgePoints = (ids) => {
  if (!ids) return false;
  
  if (Array.isArray(ids)) {
    return ids.length > 0;
  }
  
  if (typeof ids === 'string' && ids.includes(',')) {
    return ids.split(',').some(id => id.trim());
  }
  
  return true;
};

// ==================== 题目操作方法 ====================
// 行点击事件
const handleRowClick = (question) => {
  selectedQuestion.value = question;
};

// 同意题目（批量）
const approveQuestion = async (question_id) => {
  // 如果传入question_id，则只同意这一个题目
  // 如果没有传入question_id，则同意所有选中的题目（批量同意）
  const ids = question_id ? [question_id] : selectedIds.value;
  
  if (ids.length === 0) {
    ElMessage.warning("请选择要同意的题目");
    return;
  }
  
  approving.value = true;
  try {
    // 批量同意时，直接发送ID数组
    const response = await axios.post(
      `${API_BASE}/questions/approvedQuestions`,
      ids
    );

    if (response.data.code === 200) {
      ElMessage.success(`成功同意 ${ids.length} 个题目`);
      
      await loadReviewQuestionList();
      selectedIds.value = selectedIds.value.filter(id => !ids.includes(id));
      
      if (selectedQuestion.value && ids.includes(selectedQuestion.value.id)) {
        selectedQuestion.value = null;
      }
    } else {
      ElMessage.error(response.data.message || "同意失败");
    }
  } catch (err) {
    console.error("同意题目失败:", err);
    ElMessage.error(err.response?.data?.message || "同意题目失败");
  } finally {
    approving.value = false;
  }
};

// 单个题目拒绝
const singleRejectQuestion = (question_id) => {
  if (!question_id) {
    ElMessage.warning("请选择要拒绝的题目");
    return;
  }
  
  // 只允许单个题目拒绝
  rejectingSingleId.value = question_id;
  showRejectConfirm.value = true;
  rejectReason.value = ""; // 重置拒绝理由
};

// 确认单个拒绝
const confirmSingleReject = async () => {
  if (!rejectingSingleId.value) {
    ElMessage.warning("请选择要拒绝的题目");
    return;
  }
  
  // 检查拒绝理由是否填写
  if (!rejectReason.value.trim()) {
    ElMessage.warning("请填写拒绝理由");
    return;
  }
  
  rejecting.value = true;
  try {
    // 根据API要求，发送对象格式而不是数组
    const rejectRequest = {
      question_id: rejectingSingleId.value,
      comment: rejectReason.value.trim()
    };
    
    const response = await axios.post(
      `${API_BASE}/questions/rejectedQuestions`,
      rejectRequest  // 直接发送对象
    );

    if (response.data.code === 200) {
      ElMessage.success("题目已成功拒绝");
      
      await loadReviewQuestionList();
      
      // 更新已选择的ID，移除已拒绝的题目
      selectedIds.value = selectedIds.value.filter(id => id !== rejectingSingleId.value);
      
      cancelReject();
      
      // 如果当前查看的题目被拒绝了，清空详情
      if (selectedQuestion.value && selectedQuestion.value.id === rejectingSingleId.value) {
        selectedQuestion.value = null;
      }
    } else {
      ElMessage.error(response.data.message || "拒绝失败");
    }
  } catch (err) {
    console.error("拒绝题目失败:", err);
    
    if (err.response) {
      console.error("服务器响应:", err.response.data);
      ElMessage.error(`拒绝失败: ${err.response.data?.message || err.response.statusText}`);
    } else if (err.request) {
      ElMessage.error("网络错误，请检查连接");
    } else {
      ElMessage.error(err.message || "拒绝题目失败");
    }
  } finally {
    rejecting.value = false;
  }
};

// 取消拒绝
const cancelReject = () => {
  showRejectConfirm.value = false;
  rejectReason.value = "";
  rejectingSingleId.value = null;
};

// 批量同意
const batchApprove = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请选择要同意的题目");
    return;
  }
  approveQuestion(); // 不传参，同意所有选中的题目
};

// 刷新列表
const refreshList = async () => {
  loading.value = true;
  try {
    await Promise.all([
      getSchoolList(),
      loadReviewQuestionList()
    ]);
  } finally {
    loading.value = false;
  }
};

// ==================== 解题思想相关 ====================
// 根据解题思想ID获取名称
const getSolutionIdeaName = (id) => {
  if (!id) return '未设置';
  return solutionIdeas.value[id] || `ID: ${id}`;
};

// 获取解题思想名称列表
const getSolutionIdeaNames = (ids) => {
  if (!ids) return ['未设置'];
  
  if (Array.isArray(ids)) {
    return ids.map(id => getSolutionIdeaName(id));
  }
  
  if (typeof ids === 'string' && ids.includes(',')) {
    const idArray = ids.split(',').map(id => id.trim());
    return idArray.map(id => getSolutionIdeaName(id));
  }
  
  return [getSolutionIdeaName(ids)];
};

// 是否有解题思想
const hasSolutionIdeas = (ids) => {
  if (!ids) return false;
  
  if (Array.isArray(ids)) {
    return ids.length > 0;
  }
  
  if (typeof ids === 'string' && ids.includes(',')) {
    return ids.split(',').some(id => id.trim());
  }
  
  return true;
};

// ==================== 辅助方法 ====================
// 获取评分方法文本
const getMarkingTypeText = (markingType) => {
  switch (markingType) {
    case 0:
      return '自动评分';
    case 1:
      return '人工评分';
    default:
      return '未知';
  }
};

// 获取评分方法CSS类
const getMarkingTypeClass = (markingType) => {
  return 'type-badge-default';
};

// 判断是否为正确答案
const isCorrectOption = (optionKey) => {
  if (!selectedQuestion.value || !selectedQuestion.value.answer) return false;
  
  const answerKey = optionKey.replace('option_', '');
  const answers = selectedQuestion.value.answer.split(',');
  return answers.includes(answerKey);
};

// 切换全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = questionList.value.map(item => item.id);
  } else {
    selectedIds.value = [];
  }
};

// 截断内容
const truncateContent = (content, length = 50) => {
  if (!content) return '';
  if (content.length <= length) return content;
  return content.substring(0, length) + '...';
};

// 获取题型文本
const getQuestionTypeText = (question_category_id) => {
  return getQuestionCategoryText(question_category_id);
};

// 获取题型CSS类
const getQuestionTypeClass = () => {
  return 'type-badge-default';
};

// 获取难度星级
const getDifficultyStars = (difficulty) => {
  const difficultyLevel = parseInt(difficulty) || 1;
  const maxStars = 5;
  const filledStars = Math.min(Math.max(difficultyLevel, 1), maxStars);
  const emptyStars = maxStars - filledStars;
  
  return {
    filled: filledStars,
    empty: emptyStars
  };
};

// ==================== 分页方法 ====================
// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadReviewQuestionList();
  }
};

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadReviewQuestionList();
  }
};

// 每页显示数量变化
const onPageSizeChange = () => {
  currentPage.value = 1;
  loadReviewQuestionList();
};
</script>

<style scoped>
/* ==================== 全局容器样式 ==================== */
.container {
  max-width: 1800px;
  margin: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.user-info {
  color: white;
  font-size: 16px;
}

.user-name {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
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

/* ==================== 操作区域样式 ==================== */
.action-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.action-info {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.info-text {
  background: #ecf5ff;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d9ecff;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ==================== 审核管理区域样式 ==================== */
.review-management-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.review-container {
  display: flex;
  gap: 30px;
  min-height: 700px;
}

/* ==================== 左侧题目列表样式 ==================== */
.question-list-section {
  flex: 1;
  min-width: 800px;
  max-width: 900px;
  border-right: 1px solid #e4e7ed;
  padding-right: 30px;
}

.question-list-section h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.list-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.select-all input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.select-all label {
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.list-info {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.list-container {
  min-height: 500px;
}

/* ==================== 表格样式 ==================== */
.question-table {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  transition: background-color 0.3s;
  cursor: pointer;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: #f5f7fa;
}

.table-row.selected {
  background-color: #ecf5ff;
}

.table-row.active {
  background-color: #e6f7ff;
  border-left: 3px solid #409eff;
}

.table-cell {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-align: center;
}

.select-cell {
  width: 50px;
  justify-content: center;
}

.title-cell {
  flex: 2;
  min-width: 170px;
  text-align: left;
}

.type-cell {
  width: 90px;
}

.subject-cell {
  width: 70px;
}

.difficulty-cell {
  width: 125px;
}

.grade-cell {
  width: 115px;
}

.submitter-cell {
  width: 100px;
}

.reviewer-cell {
  width: 100px;
}

.action-cell {
  width: 100px;
  justify-content: center;
}

/* ==================== 题目内容样式 ==================== */
.question-content {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  color: #606266;
  text-align: left;
}

.question-full-content {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  max-height: 200px;
  overflow-y: auto;
}

.content-display {
  line-height: 1.6;
}

/* ==================== Markdown内容样式 ==================== */
.markdown-content {
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.25em; }
.markdown-content h3 { font-size: 1.125em; }
.markdown-content h4 { font-size: 1em; }

.markdown-content p {
  margin-bottom: 0.8em;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0.8em 0;
  padding-left: 2em;
}

.markdown-content li {
  margin-bottom: 0.3em;
}

.markdown-content blockquote {
  margin: 0.8em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #ddd;
  color: #666;
  background-color: #f9f9f9;
}

.markdown-content pre {
  margin: 1em 0;
  padding: 1em;
  background-color: #f6f8fa;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-content code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 0.9em;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.markdown-content pre code {
  padding: 0;
  background-color: transparent;
}

.markdown-content table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.markdown-content th,
.markdown-content td {
  padding: 0.5em 1em;
  border: 1px solid #dfe2e5;
}

.markdown-content th {
  background-color: #f6f8fa;
  font-weight: 600;
}

.markdown-content a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}

/* Katex公式样式 */
.markdown-content .katex-display {
  margin: 1em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-content .katex {
  font-size: 1.1em;
}

/* 调整Markdown内容的边距 */
.question-full-content.markdown-content,
.analysis-content.markdown-content {
  padding: 15px;
  line-height: 1.6;
}

.option-content.markdown-content {
  flex: 1;
  line-height: 1.4;
  text-align: left;
}

/* 确保Markdown内容不超出容器 */
.question-full-content.markdown-content,
.analysis-content.markdown-content,
.option-content.markdown-content {
  max-height: 300px;
  overflow-y: auto;
}

/* ==================== 标签和徽章样式 ==================== */
/* 统一的题型样式 */
.type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 统一的题型背景色 */
.type-badge-default {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

/* 科目样式 */
.subject-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f9ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  text-align: center;
}

/* ==================== 星级评分样式 ==================== */
.star-rating, .difficulty-stars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.star {
  font-size: 14px;
  color: #e4e7ed;
  line-height: 1;
  transition: color 0.2s;
}

.star.filled {
  color: #f7ba2a;
}

.star.empty {
  color: #e4e7ed;
}

/* 调整表格单元格中的星级显示 */
.table-cell.difficulty-cell {
  width: 150px;
  justify-content: center;
}

.table-cell.difficulty-cell .star-rating {
  flex-wrap: wrap;
  justify-content: center;
}

.table-cell.difficulty-cell .star {
  font-size: 12px;
}

/* 调整详情中的星级显示 */
.difficulty-stars {
  flex-wrap: wrap;
}

.difficulty-stars .star {
  font-size: 16px;
}

/* ==================== 行内操作按钮样式 ==================== */
.row-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-approve-small {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  min-width: 50px;
}

.btn-approve-small:hover:not(:disabled) {
  background-color: #85ce61;
  transform: translateY(-1px);
}

.btn-approve-small:disabled {
  background-color: #a4da89;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.btn-reject-small {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  min-width: 50px;
}

.btn-reject-small:hover:not(:disabled) {
  background-color: #f78989;
  transform: translateY(-1px);
}

.btn-reject-small:disabled {
  background-color: #fab6b6;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

/* ==================== 右侧题目详情样式 ==================== */
.question-detail-section {
  flex: 1;
  min-width: 500px;
}

.question-detail-section h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.detail-content {
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  max-height: 650px;
  overflow-y: auto;
}

.no-selection {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 16px;
}

/* ==================== 详情区块样式 ==================== */
.detail-section {
  margin-bottom: 25px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: #409eff;
  font-size: 16px;
  border-bottom: 1px solid #dcdfe6;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  margin-bottom: 5px;
  font-size: 14px;
}

.detail-item span {
  color: #303133;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

/* ==================== 选项列表样式 ==================== */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 15px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s;
  gap: 10px;
}

.option-item.correct {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  min-width: 20px;
}

.option-content {
  flex: 1;
  color: #303133;
  line-height: 1.5;
}

.correct-indicator {
  color: #52c41a;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
}

/* ==================== 解析内容样式 ==================== */
.analysis-content {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  line-height: 1.6;
  color: #606266;
}

/* ==================== 图片样式 ==================== */
.image-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.question-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ==================== 审核操作区域样式 ==================== */
.review-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.review-actions button {
  min-width: 140px;
  padding: 10px 20px;
}

/* ==================== 分页样式 ==================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  gap: 15px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 8px 16px;
  background: #ecf5ff;
  border: 1px solid #409eff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 80px;
}

.page-btn:hover:not(:disabled) {
  background: #409eff;
  color: white;
}

.page-btn:disabled {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

.page-info {
  color: #606266;
  font-size: 14px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.page-size-selector label {
  font-size: 14px;
  color: #606266;
}

.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

/* ==================== 空列表样式 ==================== */
.empty-list {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  color: #909399;
  font-size: 16px;
}

/* ==================== 拒绝理由输入框样式 ==================== */
.reject-reason-input {
  margin: 20px;
}

.reject-reason-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.reason-textarea {
  width: 100%;
  padding: 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  transition: border-color 0.3s;
}

.reason-textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.reason-textarea::placeholder {
  color: #c0c4cc;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.char-count.limit {
  color: #f56c6c;
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
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
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

.modal-content h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.modal-content p {
  margin-bottom: 20px;
  color: #606266;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;
}

/* ==================== 解题思想标签样式 ==================== */
.solution-idea-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 6px;
  margin-bottom: 4px;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.solution-idea-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ==================== 暂无数据样式 ==================== */
.no-data-text {
  color: #909399;
  font-style: italic;
  font-size: 14px;
}

/* ==================== 评分方法标签样式 ==================== */
.marking-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

/* 确保详情网格适应新增项 */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

/* ==================== 按钮样式 ==================== */
.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #909399;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #a6a9ad;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(144, 147, 153, 0.3);
}

.btn-secondary:disabled {
  background-color: #c8c9cc;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-delete {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover:not(:disabled) {
  background-color: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
}

.btn-delete:disabled {
  background-color: #fab6b6;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.modal-actions button {
  min-width: 100px;
  padding: 10px 20px;
  height: 36px;
}

/* 禁用状态样式 */
.modal-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* ==================== 知识点标签样式 ==================== */
.knowledge-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 6px;
  margin-bottom: 4px;
}

.knowledge-tag.primary {
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

.knowledge-tag.secondary {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}
.sub-knowledge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 调整详情项以支持多行显示 */
.detail-item span:not(.sub-knowledge-list) {
  white-space: normal;
  word-break: break-word;
}

/* 确保副知识点容器正确显示 */
.detail-item {
  align-items: flex-start;
}

/* ==================== 响应式调整 ==================== */
@media (max-width: 1400px) {
  .review-container {
    flex-direction: column;
  }
  
  .question-list-section {
    min-width: 100%;
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
    padding-right: 0;
    padding-bottom: 30px;
    margin-bottom: 30px;
  }
  
  .question-detail-section {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .table-header, .table-row {
    flex-wrap: wrap;
  }
  
  .table-cell {
    width: 100% !important;
    justify-content: flex-start !important;
    text-align: left !important;
  }
  
  .select-cell, .id-cell {
    width: 50% !important;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-buttons button {
    width: 100%;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .review-actions {
    flex-direction: column;
  }
  
  .review-actions button {
    width: 100%;
  }
  
  .row-actions {
    justify-content: flex-start;
  }
}
</style>