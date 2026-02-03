<template>
  <div class="mistakes-book">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">错题本</h2>
      </div>
      <div class="header-actions">
        <!-- 错题重做按钮 -->
        <el-button 
          v-if="!isRedoMode"
          type="warning"
          @click="enterRedoMode"
          :disabled="mistakes.length === 0"
        >
          <el-icon><RefreshRight /></el-icon>错题重做
        </el-button>
        
        <!-- 开始重做按钮 -->
        <el-button 
          v-if="isRedoMode"
          type="success"
          @click="startRedo"
          :disabled="getSelectedCount === 0"
          :loading="redoLoading"
        >
          <el-icon><VideoPlay /></el-icon>开始重做
        </el-button>
        
        <!-- 取消重做按钮 -->
        <el-button 
          v-if="isRedoMode"
          type="info"
          @click="cancelRedoMode"
        >
          <el-icon><Close /></el-icon>取消
        </el-button>
        
        <el-button type="primary" @click="fetchMistakes" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 错题选择状态提示 -->
    <div v-if="isRedoMode" class="redo-mode-tip">
      <el-alert
        title="错题重做模式"
        type="warning"
        description="请勾选需要重做的错题，然后点击'开始重做'按钮"
        show-icon
        :closable="false"
      />
      <div class="selection-info">
        已选择 <span class="selected-count">{{ getSelectedCount }}</span> 道错题
        <el-button 
          v-if="getSelectedCount > 0"
          type="text" 
          @click="clearSelection"
          size="small"
        >
          清空选择
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <div class="filter-bar">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="filter-item">
            <label>科目：</label>
            <el-select
              v-model="filters.subject"
              placeholder="全部科目"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="subject in subjects"
                :key="subject"
                :label="subject"
                :value="subject"
              />
            </el-select>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="filter-item">
            <label>错题类型：</label>
            <el-select
              v-model="filters.type"
              placeholder="全部类型"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="单选题" value="single-choice" />
              <el-option label="多选题" value="multi-choice" />
              <el-option label="证明题" value="proof" />
              <el-option label="解答题" value="answer" />
              <el-option label="填空题" value="fill" />
              <el-option label="计算题" value="calculation" />
              <el-option label="判断题" value="judge" />
              <el-option label="作图题" value="drawing" />
            </el-select>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="filter-item">
            <label>时间范围：</label>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleFilterChange"
              clearable
            />
          </div>
        </el-col>

        <el-col :span="6">
          <div class="filter-item">
            <label>搜索：</label>
            <el-input
              v-model="filters.keyword"
              placeholder="搜索题目内容"
              clearable
              @input="handleFilterChange"
              @clear="handleFilterChange"
            >
              <template #append>
                <el-button @click="handleFilterChange">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 统计数据 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总错题数</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card recent">
            <div class="stat-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.recent }}</div>
              <div class="stat-label">近期新增</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card reviewed">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.reviewed }}</div>
              <div class="stat-label">已复习</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card accuracy">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.accuracy }}%</div>
              <div class="stat-label">复习正确率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 错题列表 -->
    <div class="mistakes-list">
      <el-table
        ref="mistakesTableRef"
        :data="filteredMistakes"
        v-loading="loading"
        @row-click="handleRowClick"
        style="width: 100%"
        :row-class-name="getRowClassName"
        :row-key="getRowKey"
        @selection-change="handleSelectionChange"
      >
        <!-- 多选列（只在重做模式下显示） -->
        <el-table-column 
          v-if="isRedoMode"
          type="selection"
          width="55"
          align="center"
          :selectable="checkSelectable"
          :reserve-selection="true"
        />

        <!-- 科目列 -->
        <el-table-column
          prop="subject"
          label="科目"
          width="110"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getSubjectTagType(getSubjectName(row.subject_id))">
              {{ getSubjectName(row.subject_id) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 题型列 -->
        <el-table-column
          prop="type"
          label="题型"
          width="110"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <span :class="`type-${getQuestionType(row).type}`">
              {{ getQuestionType(row).name }}
            </span>
          </template>
        </el-table-column>

        <!-- 题目内容列 -->
        <el-table-column
          prop="title"
          label="题目内容"
          min-width="300"
          header-align="center"
        >
          <template #default="{ row }">
            <div
              class="question-preview"
              v-html="formatQuestionPreview(row.title || row.questionContent || row.content)"
            />
          </template>
        </el-table-column>

        <!-- 错误次数列 -->
        <el-table-column
          prop="errorCount"
          label="错误次数"
          width="110"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <span class="error-count">{{ row.wrong_count || 1 }}</span>
          </template>
        </el-table-column>

        <!-- 上次错误时间列 -->
        <el-table-column
          prop="lastErrorTime"
          label="上次错误时间"
          width="160"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            {{ formatDate(row.last_wrong_time) }}
          </template>
        </el-table-column>

        <!-- 状态列 -->
        <el-table-column
          prop="status"
          label="状态"
          width="110"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'reviewed' ? 'success' : 'warning'"
              size="small"
            >
              {{ row.status === "reviewed" ? "已复习" : "待复习" }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          label="操作"
          width="180"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-button-group>
              <!-- 收藏按钮 -->
              <el-button
                :type="row.is_collected ? 'danger' : 'info'"
                size="small"
                @click.stop="toggleCollect(row)"
                :loading="row.collectLoading"
              >
                <el-icon>
                  <StarFilled v-if="row.is_collected" />
                  <Star v-else />
                </el-icon>
              </el-button>
              
              <!-- 查看按钮 -->
              <el-button type="primary" size="small" @click.stop="reviewMistake(row)">
                <el-icon><View /></el-icon>
              </el-button>
              
              <!-- 标记为已复习按钮 -->
              <el-button
                type="success"
                size="small"
                @click.stop="markAsReviewed(row)"
                v-if="row.status !== 'reviewed'"
              >
                <el-icon><Check /></el-icon>
              </el-button>
              
              <!-- 删除按钮 -->
              <el-button type="danger" size="small" @click.stop="deleteMistake(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20]"
        layout="sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 错题详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentMistake ? `错题详情 - ${getSubjectName(currentMistake.subject_id)}` : '错题详情'"
      width="70%"
    >
      <div v-if="currentMistake" class="mistake-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="科目">{{
            getSubjectName(currentMistake.subject_id)
          }}</el-descriptions-item>
          <el-descriptions-item label="题型">{{
            getQuestionType(currentMistake).name
          }}</el-descriptions-item>
          <el-descriptions-item label="知识点">
            <div v-if="currentMistake.knowledgePoints && currentMistake.knowledgePoints.length > 0">
              <el-tag
                v-for="(point, index) in currentMistake.knowledgePoints"
                :key="index"
                type="info"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px"
              >
                {{ point }}
              </el-tag>
            </div>
            <span v-else class="no-knowledge-points">暂无知识点</span>
          </el-descriptions-item>

          <el-descriptions-item label="子知识点">
            <div v-if="currentMistake.subKnowledgePoints && currentMistake.subKnowledgePoints.length > 0">
              <el-tag
                v-for="(point, index) in currentMistake.subKnowledgePoints"
                :key="index"
                type="warning"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px"
              >
                {{ point }}
              </el-tag>
            </div>
            <span v-else class="no-knowledge-points">暂无子知识点</span>
          </el-descriptions-item>
          <el-descriptions-item label="难度">
            <el-rate
              v-model="currentMistake.difficulty_level"
              :max="5"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value} 星"
            />
          </el-descriptions-item>
          <el-descriptions-item label="错误次数">{{
            currentMistake.wrong_count || 1
          }}</el-descriptions-item>
          <el-descriptions-item label="首次错误时间">{{
            formatDate(currentMistake.first_wrong_time)
          }}</el-descriptions-item>
          <el-descriptions-item label="最后错误时间">{{
            formatDate(currentMistake.last_wrong_time)
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentMistake.status === 'reviewed' ? 'success' : 'warning'">
              {{ currentMistake.status === "reviewed" ? "已复习" : "待复习" }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h3>题目内容</h3>
          <div class="content-box">
            <div
              v-html="markdownToHtml(currentMistake.title || '暂无题目内容')"
              class="markdown-content"
            ></div>
            <div v-if="currentMistake.img_url" class="question-image">
              <el-image
                :src="currentMistake.img_url"
                :preview-src-list="[currentMistake.img_url]"
                fit="contain"
                style="max-width: 100%; max-height: 300px"
              />
            </div>
          </div>
        </div>

        <div v-if="hasOptions(currentMistake)" class="detail-section">
          <h3>选项</h3>
          <div class="content-box options-container">
            <div v-if="currentMistake.options?.option_A" class="option-item">
              <span class="option-label">A.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentMistake.options.option_A)"
              ></span>
            </div>
            <div v-if="currentMistake.options?.option_B" class="option-item">
              <span class="option-label">B.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentMistake.options.option_B)"
              ></span>
            </div>
            <div v-if="currentMistake.options?.option_C" class="option-item">
              <span class="option-label">C.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentMistake.options.option_C)"
              ></span>
            </div>
            <div v-if="currentMistake.options?.option_D" class="option-item">
              <span class="option-label">D.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentMistake.options.option_D)"
              ></span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="currentMistake.answer">
          <div class="section-header">
            <h3>正确答案</h3>
            <el-button
              type="text"
              @click="showAnswer = !showAnswer"
              class="toggle-button"
            >
              <el-icon>
                <ArrowDown v-if="!showAnswer" />
                <ArrowUp v-else />
              </el-icon>
              {{ showAnswer ? "隐藏" : "显示" }}
            </el-button>
          </div>
          <el-collapse-transition>
            <div v-show="showAnswer" class="content-box markdown-content">
              <div v-html="markdownToHtml(currentMistake.answer)"></div>
            </div>
          </el-collapse-transition>
        </div>

        <div class="detail-section" v-if="currentMistake.last_answer">
          <h3>你的答案</h3>
          <div class="content-box">
            <span
              :class="{
                'wrong-answer': currentMistake.last_answer !== currentMistake.answer,
              }"
            >
              <span v-html="markdownToHtml(currentMistake.last_answer)"></span>
            </span>
            <el-tag
              v-if="currentMistake.answer && currentMistake.last_answer"
              :type="currentMistake.last_answer === currentMistake.answer ? 'success' : 'danger'"
              size="small"
            >
              {{ currentMistake.last_answer === currentMistake.answer ? "正确" : "错误" }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section" v-if="currentMistake.notes">
          <div class="section-header">
            <h3>解析</h3>
            <el-button
              type="text"
              @click="showAnalysis = !showAnalysis"
              class="toggle-button"
            >
              <el-icon>
                <ArrowDown v-if="!showAnalysis" />
                <ArrowUp v-else />
              </el-icon>
              {{ showAnalysis ? "隐藏" : "显示" }}
            </el-button>
          </div>
          <el-collapse-transition>
            <div v-show="showAnalysis" class="content-box">
              <div
                v-html="markdownToHtml(currentMistake.notes)"
                class="markdown-content"
              ></div>
              <div v-if="currentMistake.notes_img_url" class="notes-image">
                <el-image
                  :src="currentMistake.notes_img_url"
                  :preview-src-list="[currentMistake.notes_img_url]"
                  fit="contain"
                  style="max-width: 100%; max-height: 300px; margin-top: 10px"
                />
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <div class="detail-section" v-if="currentMistake.remark">
          <h3>备注</h3>
          <div class="content-box" v-html="markdownToHtml(currentMistake.remark)"></div>
        </div>

        <!-- 详情页操作按钮 -->
        <div class="detail-actions">
          <el-button
            :type="currentMistake?.is_collected ? 'danger' : 'info'"
            @click="toggleCollect(currentMistake)"
            :loading="currentMistake?.collectLoading"
          >
            <el-icon>
              <StarFilled v-if="currentMistake?.is_collected" />
              <Star v-else />
            </el-icon>
            {{ currentMistake?.is_collected ? '取消收藏' : '收藏题目' }}
          </el-button>
          
          <el-button
            type="primary"
            @click="handleReviewed"
            v-if="currentMistake && currentMistake.status !== 'reviewed'"
          >
            标记为已复习
          </el-button>
          
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRouter } from 'vue-router';
import { ArrowDown, ArrowUp, RefreshRight, VideoPlay, Close } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import {
  Refresh,
  Search,
  Document,
  Calendar,
  Check,
  TrendCharts,
  View,
  Delete,
  Star,
  StarFilled
} from "@element-plus/icons-vue";
import { getAllSubjects, getSubjectName, initSubjectData } from "../utils/subjectList";
import { getQuestionCategoryText } from "../utils/questionCategory";
import { markdownToHtml } from "../utils/markdownUtils";
import { fetchKnowledgePointList, getKnowledgePointNames } from "../utils/knowledgeList";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 题目详情缓存
const questionCache = new Map();

// 题型映射
const getQuestionTypeInfo = (categoryId) => {
  const typeName = getQuestionCategoryText(categoryId);
  const typeMap = {
    单选题: "single-choice",
    多选题: "multi-choice",
    证明题: "proof",
    解答题: "answer",
    填空题: "fill",
    计算题: "calculation",
    判断题: "judge",
    作图题: "drawing",
    未知题型: "unknown",
  };
  return {
    name: typeName,
    type: typeMap[typeName] || "unknown",
  };
};

export default {
  name: "MistakesBook",
  components: {
    Refresh,
    Search,
    Document,
    Calendar,
    Check,
    TrendCharts,
    View,
    Delete,
    ArrowDown,
    ArrowUp,
    Star,
    StarFilled,
    RefreshRight,
    VideoPlay,
    Close
  },
  setup() {
    const router = useRouter();
    
    // 状态管理
    const mistakes = ref([]);
    const loading = ref(false);
    const showDetailDialog = ref(false);
    const currentMistake = ref(null);
    const questionDetailsLoaded = ref(new Set());
    const showAnswer = ref(false);
    const showAnalysis = ref(false);
    const currentStudentName = ref(localStorage.getItem("userName") || "student");
    const mistakesTableRef = ref(null);
    
    // 重做模式相关状态
    const isRedoMode = ref(false);
    const selectedMistakes = ref([]); // 当前页选中的错题
    const selectedMistakeIds = ref(new Map()); // 全局选中的错题，key: rowKey, value: mistake object
    const redoLoading = ref(false);
    const allMistakesMap = ref(new Map()); // 存储所有错题的引用
    const restoreSelectionTimer = ref(null);

    // 筛选条件
    const filters = ref({
      subject: "",
      type: "",
      dateRange: "",
      keyword: "",
    });

    // 分页
    const pagination = ref({
      currentPage: 1,
      pageSize: 10,
      total: 0,
    });

    // 统计数据
    const stats = ref({
      total: 0,
      recent: 0,
      reviewed: 0,
      accuracy: 0,
    });

    // 计算属性
    const subjects = computed(() => getAllSubjects());
    
    // 获取已选择的题目数量
    const getSelectedCount = computed(() => {
      return selectedMistakeIds.value.size;
    });
    
    const filteredMistakes = computed(() => {
      let result = [...mistakes.value];

      // 按最新错误时间排序
      result.sort((a, b) => {
        const dateA = new Date(a.last_wrong_time).getTime();
        const dateB = new Date(b.last_wrong_time).getTime();
        return dateB - dateA;
      });

      // 科目筛选
      if (filters.value.subject) {
        result = result.filter(
          (item) => getSubjectName(item.subject_id) === filters.value.subject
        );
      }

      // 题型筛选
      if (filters.value.type) {
        result = result.filter((item) => {
          const typeInfo = getQuestionType(item);
          return typeInfo.type === filters.value.type;
        });
      }

      // 关键词搜索
      if (filters.value.keyword) {
        const keyword = filters.value.keyword.toLowerCase();
        result = result.filter((item) => {
          const content = item.title || "";
          return (
            content.toLowerCase().includes(keyword) ||
            getSubjectName(item.subject_id).toLowerCase().includes(keyword)
          );
        });
      }

      // 日期筛选
      if (filters.value.dateRange && filters.value.dateRange.length === 2) {
        const [start, end] = filters.value.dateRange;
        result = result.filter((item) => {
          const date = new Date(item.last_wrong_time);
          return date >= start && date <= end;
        });
      }

      // 更新分页总数
      pagination.value.total = result.length;

      // 分页处理
      const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
      const end = start + pagination.value.pageSize;
      return result.slice(start, end);
    });

    // 方法
    const getQuestionType = (row) => {
      if (!row) return getQuestionTypeInfo(0);
      const categoryId = row.question_category_id;
      if (categoryId !== undefined && categoryId !== null) {
        return getQuestionTypeInfo(categoryId);
      }
      return getQuestionTypeInfo(0);
    };

    // 获取行的唯一key
    const getRowKey = (row) => {
      // 优先使用错题ID，如果没有则使用题目ID，最后使用随机字符串
      return row.id || row.question_id || Math.random().toString(36).substr(2);
    };

    // 用题目详情丰富错题信息
    const enrichMistakeWithDetail = (mistake, detail) => {
      const enriched = {
        ...mistake,
        ...detail,
        type: getQuestionType(detail),
        status: mistake.status || "pending",
        last_answer: mistake.last_answer || detail.last_answer || "未作答",
        knowledgePoints: getKnowledgePointNames(detail.knowledge_point_id || mistake.knowledge_point_id),
        subKnowledgePoints: getKnowledgePointNames(
          detail.sub_knowledge_point_ids || mistake.sub_knowledge_point_ids
        ) || [],
        is_collected: mistake.is_collected || false,
        collectLoading: false
      };
      
      // 生成行的唯一key并保存
      const rowKey = getRowKey(enriched);
      enriched._rowKey = rowKey;
      
      return enriched;
    };

    // 批量获取题目详情
    const fetchAllQuestionDetails = async (mistakeItems) => {
      mistakeItems.sort((a, b) => {
        const dateA = new Date(a.last_wrong_time).getTime();
        const dateB = new Date(b.last_wrong_time).getTime();
        return dateB - dateA;
      });

      const questionIds = mistakeItems.map((item) => item.question_id).filter((id) => id);
      if (questionIds.length === 0) return mistakeItems;

      // 计算需要请求的ID
      const cachedIds = [];
      const needFetchIds = [];

      questionIds.forEach((id) => {
        const idStr = String(id);
        if (questionDetailsLoaded.value.has(idStr) || questionCache.has(idStr)) {
          cachedIds.push(idStr);
        } else {
          needFetchIds.push(id);
        }
      });

      // 创建ID到详情的映射
      const questionMap = {};

      // 处理已缓存的数据
      cachedIds.forEach((idStr) => {
        const cachedDetail = questionCache.get(idStr);
        if (cachedDetail) {
          questionMap[idStr] = cachedDetail;
        }
      });

      // 获取需要请求的题目详情
      if (needFetchIds.length > 0) {
        try {
          const response = await axios.post(
            `${API_BASE}/questions/findQuestionById`,
            needFetchIds,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data?.code === 200) {
            const questionDetails = response.data.data || [];
            questionDetails.forEach((detail) => {
              if (detail?.id) {
                const detailIdStr = String(detail.id);

                // 处理知识点信息
                if (detail.knowledge_point_id) {
                  detail.knowledgePoints = getKnowledgePointNames(detail.knowledge_point_id);
                }
                if (detail.sub_knowledge_point_ids) {
                  detail.subKnowledgePoints = getKnowledgePointNames(detail.sub_knowledge_point_ids);
                } else {
                  detail.subKnowledgePoints = [];
                }

                questionCache.set(detailIdStr, detail);
                questionDetailsLoaded.value.add(detailIdStr);
                questionMap[detailIdStr] = detail;
              }
            });
          }
        } catch (error) {
          console.error("API请求错误:", error.response?.data || error.message);
        }
      }

      // 合并数据
      return mistakeItems.map((item) => {
        const itemIdStr = String(item.question_id);
        const questionDetail = questionMap[itemIdStr];

        if (questionDetail) {
          return enrichMistakeWithDetail(item, questionDetail);
        }

        // 如果没有获取到详情，返回基础信息
        const basicItem = {
          ...item,
          type: getQuestionType(item),
          status: item.status || "pending",
          last_answer: item.last_answer || "未作答",
          knowledgePoints: item.knowledge_points_id ? getKnowledgePointNames(item.knowledge_points_id) : [],
          subKnowledgePoints: item.sub_knowledge_point_ids ? getKnowledgePointNames(item.sub_knowledge_point_ids) : [],
        };
        
        // 生成行的唯一key并保存
        const rowKey = getRowKey(basicItem);
        basicItem._rowKey = rowKey;
        
        return basicItem;
      });
    };

    // 获取错题列表
    const fetchMistakes = async () => {
      loading.value = true;

      try {
        // 先获取知识点数据
        await initSubjectData();
        await Promise.all([fetchKnowledgePointList()]);

        // 获取错题数据
        const response = await axios.get(
          `${API_BASE}/incorrectQuestion/getIncorrectQuestionByStudent/${encodeURIComponent(
            currentStudentName.value
          )}`
        );

        if (response.data?.code === 200) {
          const rawData = response.data.data || [];
          
          // 排序
          rawData.sort((a, b) => {
            const dateA = new Date(a.last_wrong_time).getTime();
            const dateB = new Date(b.last_wrong_time).getTime();
            return dateB - dateA;
          });

          // 首先获取收藏状态
          await fetchCollectionStatus(rawData);
          
          // 然后获取所有题目详情
          const enrichedData = await fetchAllQuestionDetails(rawData);
          
          // 更新 allMistakesMap
          allMistakesMap.value.clear();
          enrichedData.forEach(item => {
            if (item._rowKey) {
              allMistakesMap.value.set(item._rowKey, item);
            }
          });
          
          mistakes.value = enrichedData;

          // 确保每个错题都有状态
          mistakes.value.forEach((item) => {
            if (!item.status) {
              item.status = "pending";
            }
          });

          updateStats();
          ElMessage.success(`获取到 ${mistakes.value.length} 条错题记录`);
        } else {
          ElMessage.warning("获取错题数据成功，但数据格式可能不符合预期");
          updateStats();
        }
      } catch (error) {
        console.error("API错误:", error.response?.data || error.message);
        ElMessage.error("获取数据失败");
        updateStats();
      } finally {
        loading.value = false;
      }
    };

    // 获取收藏状态
    const fetchCollectionStatus = async (mistakeItems) => {
      try {
        // 获取收藏列表
        const collectionResponse = await axios.get(
          `${API_BASE}/collections/getCollectionList/${encodeURIComponent(
            currentStudentName.value
          )}`
        );
        
        let collectedQuestionIds = [];
        
        if (collectionResponse.data?.code === 200) {
          // 提取所有已收藏的题目ID
          collectedQuestionIds = collectionResponse.data.data.map(
            item => item.question_id
          );
        } else {
          console.warn('获取收藏列表失败:', collectionResponse.data?.message);
        }
        
        // 更新每个错题的收藏状态
        mistakeItems.forEach((item) => {
          if (item.question_id) {
            item.is_collected = collectedQuestionIds.includes(item.question_id);
            item.collectLoading = false;
          }
        });
        
      } catch (error) {
        console.error("获取收藏状态失败:", error);
        // 失败时默认设为未收藏
        mistakeItems.forEach((item) => {
          item.is_collected = false;
          item.collectLoading = false;
        });
      }
    };

    // 收藏/取消收藏
    const toggleCollect = async (row) => {
      if (!row?.question_id) {
        ElMessage.warning('无法收藏，题目ID不存在');
        return;
      }
      
      try {
        row.collectLoading = true;
        currentMistake.value && (currentMistake.value.collectLoading = true);
        
        if (row.is_collected) {
          // 取消收藏
          await axios.delete(`${API_BASE}/collections/cancelCollecting`, {
            data: {
              question_id: row.question_id,
              student: currentStudentName.value
            }
          });
          
          row.is_collected = false;
          currentMistake.value && (currentMistake.value.is_collected = false);
          ElMessage.success('已取消收藏');
        } else {
          // 添加收藏
          await axios.post(`${API_BASE}/collections/collectQuestion`, {
            question_id: row.question_id,
            student: currentStudentName.value
          });
          
          row.is_collected = true;
          currentMistake.value && (currentMistake.value.is_collected = true);
          ElMessage.success('已收藏题目');
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        ElMessage.error(error.response?.data?.message || '操作失败');
      } finally {
        row.collectLoading = false;
        currentMistake.value && (currentMistake.value.collectLoading = false);
      }
    };

    // 更新统计数据
    const updateStats = () => {
      const total = mistakes.value.length;

      const recent = mistakes.value.filter((item) => {
        if (!item.last_wrong_time) return false;
        const days = (Date.now() - new Date(item.last_wrong_time).getTime()) / (1000 * 3600 * 24);
        return days <= 7;
      }).length;

      const reviewed = mistakes.value.filter((item) => item.status === "reviewed").length;
      const accuracy = reviewed > 0 ? Math.round((reviewed / total) * 100) : 0;

      stats.value = { total, recent, reviewed, accuracy };
    };

    // 重做相关方法
    const checkSelectable = (row) => {
      return row.status !== 'reviewed';
    };

    // 获取行类名
    const getRowClassName = ({ row }) => {
      const classes = [];
      if (isRedoMode.value) {
        classes.push('is-selectable');
        const rowKey = getRowKey(row);
        if (selectedMistakeIds.value.has(rowKey)) {
          classes.push('is-selected');
        }
      }
      return classes.join(' ');
    };

    // 清除无效的选择（已复习的题目）
    const clearInvalidSelections = () => {
      // 清除已复习题目的选择
      const invalidKeys = [];
      selectedMistakeIds.value.forEach((value, key) => {
        if (value.status === 'reviewed') {
          invalidKeys.push(key);
        }
      });
      
      invalidKeys.forEach(key => {
        selectedMistakeIds.value.delete(key);
      });
      
      // 如果当前页有这些无效选择，也需要清除
      if (mistakesTableRef.value) {
        const currentSelections = mistakesTableRef.value.getSelectionRows();
        currentSelections.forEach(row => {
          const rowKey = getRowKey(row);
          if (selectedMistakeIds.value.has(rowKey) && row.status === 'reviewed') {
            mistakesTableRef.value.toggleRowSelection(row, false);
          }
        });
      }
    };

    const enterRedoMode = () => {
      isRedoMode.value = true;
      clearInvalidSelections(); // 清除无效的选择
      ElMessage.info('已进入错题重做模式，请选择需要重做的错题');
    };

    const cancelRedoMode = () => {
      isRedoMode.value = false;
      selectedMistakeIds.value.clear();
      selectedMistakes.value = [];
      if (mistakesTableRef.value) {
        mistakesTableRef.value.clearSelection();
      }
    };

    const clearSelection = () => {
      selectedMistakeIds.value.clear();
      selectedMistakes.value = [];
      if (mistakesTableRef.value) {
        mistakesTableRef.value.clearSelection();
      }
      ElMessage.info('已清空所有选择');
    };

    const handleSelectionChange = (selection) => {
      selectedMistakes.value = selection;
      
      // 获取当前页所有行的key
      const currentPageKeys = new Set(filteredMistakes.value.map(row => getRowKey(row)));
      
      // 更新 selectedMistakeIds
      currentPageKeys.forEach(key => {
        const isSelected = selection.some(row => getRowKey(row) === key);
        if (isSelected) {
          // 找到对应的完整数据
          const fullData = allMistakesMap.value.get(key);
          if (fullData && checkSelectable(fullData)) {
            selectedMistakeIds.value.set(key, fullData);
          }
        } else {
          // 当前页取消选择时，如果该行不在其他页面被选中，则从全局选择中移除
          // 注意：这里我们不移除，因为可能在别的页面选中了
          // 如果需要严格的当前页取消选择逻辑，可以在这里实现
        }
      });
    };

    // 恢复选中状态
    const restoreSelection = () => {
      if (!mistakesTableRef.value || !isRedoMode.value) return;
      
      // 清空当前页的选择
      mistakesTableRef.value.clearSelection();
      
      // 恢复当前页的选择状态
      if (selectedMistakeIds.value.size > 0) {
        filteredMistakes.value.forEach(row => {
          const rowKey = getRowKey(row);
          if (selectedMistakeIds.value.has(rowKey) && checkSelectable(row)) {
            mistakesTableRef.value.toggleRowSelection(row, true);
          }
        });
      }
    };

    // 点击行处理（重做模式下）
    const handleRowClick = async (row, column, event) => {
      // 在重做模式下，点击行触发选择/取消选择
      if (isRedoMode.value) {
        // 检查是否可选中
        if (!checkSelectable(row)) {
          ElMessage.warning('已复习的题目不能重做');
          return;
        }
        
        const rowKey = getRowKey(row);
        
        if (mistakesTableRef.value) {
          // 获取当前行的选择状态
          const currentSelections = mistakesTableRef.value.getSelectionRows();
          const isSelected = currentSelections.some(r => getRowKey(r) === rowKey);
          
          if (isSelected) {
            // 取消选中当前页
            mistakesTableRef.value.toggleRowSelection(row, false);
            // 从全局选择中移除
            selectedMistakeIds.value.delete(rowKey);
          } else {
            // 选中当前页
            mistakesTableRef.value.toggleRowSelection(row, true);
            // 添加到全局选择
            selectedMistakeIds.value.set(rowKey, row);
          }
        }
        return;
      }
      
      // 非重做模式下，点击行查看详情
      currentMistake.value = row;
      showAnswer.value = false;
      showAnalysis.value = false;
      showDetailDialog.value = true;

      nextTick(() => {
        renderKatexInDialog();
      });
    };

const startRedo = async () => {
  if (selectedMistakeIds.value.size === 0) {
    ElMessage.warning('请至少选择一道错题');
    return;
  }

  try {
    redoLoading.value = true;
    
    // 获取所有已选错题的数据
    const selectedItems = Array.from(selectedMistakeIds.value.values());
    
    // 检查所选错题是否有相同的科目
    const subjects = [...new Set(selectedItems.map(item => item.subject_id))];
    if (subjects.length > 1) {
      await ElMessageBox.confirm(
        '您选择了多个科目的错题，系统将按科目分组进行重做。确定继续吗？',
        '提示',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
    }

    // 按科目分组
    const questionsBySubject = {};
    selectedItems.forEach(item => {
      const subjectId = item.subject_id;
      if (!questionsBySubject[subjectId]) {
        questionsBySubject[subjectId] = [];
      }
      // 存储完整的题目ID数组
      questionsBySubject[subjectId].push(item.question_id);
    });

    // 对每个科目发起重做请求
    const redoRequests = Object.entries(questionsBySubject).map(async ([subjectId, questionIds]) => {
      try {
        const requestData = {
          subject_id: parseInt(subjectId),
          question_ids: questionIds,
          student: currentStudentName.value
        };

        const response = await axios.post(
          `${API_BASE}/incorrectQuestion/review`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.code === 200) {
          return {
            success: true,
            subjectId,
            data: response.data.data,
            questionIds
          };
        } else {
          console.error('API返回错误:', response.data);
          return {
            success: false,
            subjectId,
            message: response.data?.message || '请求失败'
          };
        }
      } catch (error) {
        console.error(`科目 ${subjectId} 重做请求失败:`, error);
        return {
          success: false,
          subjectId,
          message: error.response?.data?.message || error.message
        };
      }
    });

    const results = await Promise.all(redoRequests);
    const successResults = results.filter(r => r.success);
    
     if (successResults.length > 0) {
      // 取第一个成功的响应数据
      const firstSuccess = successResults[0];
      const responseData = firstSuccess.data;
      
      // 准备存储的数据
      const assessmentData = {
        exam_name: responseData.exam_name || `错题重做_${new Date().toLocaleString()}`,
        start_time: responseData.start_time || new Date().toISOString(),
        duration: responseData.duration || 60,
        exam_id: responseData.exam_id,
        paper_id: responseData.paper_id,
        exam_history_id: responseData.exam_history_id,
        questions: responseData.questions || [],
        // 添加额外的元数据
        from: 'mistakesbook',
        subject_id: parseInt(firstSuccess.subjectId),
        selected_question_ids: firstSuccess.questionIds
      };

      
      // 验证数据
      if (!assessmentData.questions || assessmentData.questions.length === 0) {
        throw new Error('API返回的题目数据为空');
      }
      
      // 确保每个题目都有必要的字段
      assessmentData.questions = assessmentData.questions.map((q, index) => ({
        ...q,
        // 确保有 id 字段
        id: q.id || `temp_${index}_${Date.now()}`,
        // 确保有标记类型
        marking_type: q.marking_type || 0,
        // 确保有 difficulty_level
        difficulty_level: q.difficulty_level || 2,
        // 确保有分数
        score: q.score || 1,
        // 确保 options 是对象
        options: q.options || {}
      }));
      
      // 存储到本地
      localStorage.setItem('current_assessment', JSON.stringify(assessmentData));
    
      router.push({
        path: '/student/studentcollections/redoquestions',
        query: {
          from: 'mistakesbook',
          exam_history_id: assessmentData.exam_history_id,
          exam_id: assessmentData.exam_id,
          timestamp: Date.now() // 防止缓存
        }
      });
      
      // 退出重做模式
      isRedoMode.value = false;
      selectedMistakeIds.value.clear();
      selectedMistakes.value = [];
      
      ElMessage.success(`已开始重做 ${assessmentData.questions.length} 道错题`);
    } else {
      const errorMessages = results
        .filter(r => !r.success)
        .map(r => `科目 ${r.subjectId}: ${r.message}`)
        .join('; ');
      
      ElMessage.error(`重做请求失败: ${errorMessages}`);
    }
    
  }catch (error) {
    console.error('开始重做失败:', error);
    ElMessage.error(error.message || '开始重做失败');
  } finally {
    redoLoading.value = false;
  }
};

    // 其他方法
    const handleFilterChange = () => {
      pagination.value.currentPage = 1;
      // 筛选时保持选中状态
      if (isRedoMode.value) {
        // 在下一次渲染后恢复选中状态
        nextTick(() => {
          restoreSelection();
        });
      }
    };

    const reviewMistake = async (row) => {
      currentMistake.value = row;
      showAnswer.value = false;
      showAnalysis.value = false;
      showDetailDialog.value = true;

      nextTick(() => {
        renderKatexInDialog();
      });
    };

    // 关闭对话框时重置状态
    watch(showDetailDialog, (newVal) => {
      if (!newVal) {
        showAnswer.value = false;
        showAnalysis.value = false;
      }
    });

    // 渲染对话框中的Katex
    const renderKatexInDialog = () => {
      setTimeout(() => {
        const contentElements = document.querySelectorAll(".markdown-content");
        contentElements.forEach((el) => {
          const html = el.innerHTML;
          if (html.includes("$")) {
            el.innerHTML = markdownToHtml(el.textContent || "");
          }
        });
      }, 100);
    };

    const markAsReviewed = async (row) => {
      try {
        await ElMessageBox.confirm("确认标记为已复习？", "提示", {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "warning",
        });

        row.status = "reviewed";
        // 如果是已选中的题目，将其从选择中移除
        if (isRedoMode.value) {
          const rowKey = getRowKey(row);
          if (selectedMistakeIds.value.has(rowKey)) {
            selectedMistakeIds.value.delete(rowKey);
            if (mistakesTableRef.value) {
              mistakesTableRef.value.toggleRowSelection(row, false);
            }
          }
        }
        updateStats();
        ElMessage.success("标记成功");
      } catch {
        // 用户取消
      }
    };

    const deleteMistake = async (row) => {
      try {
        await ElMessageBox.confirm("确认删除这条错题记录？", "警告", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "error",
        });

        mistakes.value = mistakes.value.filter((item) => item.id !== row.id);
        // 如果是已选中的题目，将其从选择中移除
        if (isRedoMode.value) {
          const rowKey = getRowKey(row);
          if (selectedMistakeIds.value.has(rowKey)) {
            selectedMistakeIds.value.delete(rowKey);
          }
        }
        updateStats();
        ElMessage.success("删除成功");
      } catch {
        // 用户取消
      }
    };

    const handleReviewed = () => {
      if (currentMistake.value) {
        currentMistake.value.status = "reviewed";
        // 如果是已选中的题目，将其从选择中移除
        if (isRedoMode.value) {
          const rowKey = getRowKey(currentMistake.value);
          if (selectedMistakeIds.value.has(rowKey)) {
            selectedMistakeIds.value.delete(rowKey);
            if (mistakesTableRef.value) {
              mistakesTableRef.value.toggleRowSelection(currentMistake.value, false);
            }
          }
        }
        updateStats();
        showDetailDialog.value = false;
        ElMessage.success("已标记为已复习");
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return "未知时间";

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const pad = (n) => String(n).padStart(2, "0");

      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());

      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    const formatQuestionPreview = (content) => {
      if (!content) return '<span class="no-content">无题目内容</span>';

      try {
        const maxLength = 150;
        let previewText = content;

        if (content.length > maxLength) {
          let truncated = content.substring(0, maxLength);

          // 处理LaTeX公式的截断
          const lastDollarIndex = truncated.lastIndexOf("$");
          if (lastDollarIndex > -1) {
            const formulaStart = truncated.lastIndexOf("$", lastDollarIndex - 1);
            if (formulaStart > -1) {
              const remainingText = content.substring(lastDollarIndex + 1);
              const formulaEndIndex = remainingText.indexOf("$");
              if (formulaEndIndex > -1) {
                truncated = content.substring(0, lastDollarIndex + formulaEndIndex + 2);
              }
            }
          }

          previewText = truncated + "...";
        }

        return markdownToHtml(previewText);
      } catch (error) {
        console.error("预览渲染错误:", error);
        return content ? content.substring(0, 100) + "..." : "无内容";
      }
    };

    const getSubjectTagType = (subject) => {
      const types = {
        数学: "primary",
        语文: "success",
        英语: "warning",
        物理: "info",
        化学: "danger",
        生物: "success",
        历史: "warning",
        地理: "info",
        政治: "danger",
      };
      return types[subject] || "info";
    };

    const hasOptions = (question) => {
      return (
        question.options &&
        (question.options.option_A ||
          question.options.option_B ||
          question.options.option_C ||
          question.options.option_D)
      );
    };

    const handleSizeChange = (val) => {
      pagination.value.pageSize = val;
      // 分页大小变化后恢复选中状态
      if (isRedoMode.value) {
        nextTick(() => {
          restoreSelection();
        });
      }
    };

    const handleCurrentChange = (val) => {
      pagination.value.currentPage = val;
      // 页码变化后恢复选中状态
      if (isRedoMode.value) {
        nextTick(() => {
          restoreSelection();
        });
      }
    };

    // 监听重做模式变化
    watch(isRedoMode, (newVal) => {
      if (newVal) {
        // 进入重做模式时自动清空选择
        selectedMistakeIds.value.clear();
        selectedMistakes.value = [];
      }
    });

    // 监听过滤后的错题数据，恢复选中状态
watch(filteredMistakes, () => {
  if (isRedoMode.value) {
    // 清空之前的定时器
    if (restoreSelectionTimer.value) {
      clearTimeout(restoreSelectionTimer.value);
    }
    
    // 设置新的定时器，确保在DOM更新后恢复选中状态
    restoreSelectionTimer.value = setTimeout(() => {
      restoreSelection();
    }, 100);
  }
});

    // 初始化
    onMounted(() => {
      fetchMistakes();
    });

    return {
      // 状态
      mistakes,
      loading,
      showDetailDialog,
      currentMistake,
      filters,
      subjects,
      pagination,
      stats,
      showAnswer,
      showAnalysis,
      
      // 重做相关状态
      isRedoMode,
      selectedMistakes,
      redoLoading,
      mistakesTableRef,
      getSelectedCount,

      // 计算属性
      filteredMistakes,

      // 方法
      fetchMistakes,
      handleFilterChange,
      handleRowClick,
      reviewMistake,
      markAsReviewed,
      deleteMistake,
      handleReviewed,
      formatDate,
      formatQuestionPreview,
      markdownToHtml,
      getSubjectTagType,
      getSubjectName,
      getQuestionType,
      getKnowledgePointNames,
      hasOptions,
      handleSizeChange,
      handleCurrentChange,
      toggleCollect,
      
      // 重做相关方法
      enterRedoMode,
      cancelRedoMode,
      clearSelection,
      startRedo,
      handleSelectionChange,
      checkSelectable,
      getRowKey,
      getRowClassName,
    };
  },
};
</script>

<style scoped>
/* 添加Katex样式支持 */
:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 1em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Markdown内容样式 */
.markdown-content {
  line-height: 1.6;
}

.markdown-content p {
  margin: 0.5em 0;
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
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.markdown-content blockquote {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
}

.markdown-content code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
}

.markdown-content pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

/* 表格列名居中样式 */
:deep(.el-table th > .cell) {
  text-align: center;
  font-weight: 600;
}

/* 表格内容垂直居中 */
:deep(.el-table .cell) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 题目内容列特殊处理 - 左对齐 */
:deep(.el-table .question-preview) {
  justify-content: flex-start !important;
  text-align: left;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #e2e8f0;
}

.option-label {
  font-weight: bold;
  margin-right: 8px;
  color: #409eff;
  min-width: 20px;
  flex-shrink: 0;
  line-height: 3.5;
  padding-top: 2px;
}

.option-content {
  flex: 1;
  line-height: 3.5;
}

/* 收藏按钮样式 */
:deep(.el-table .el-button--info) {
  background-color: #f7a168 !important;
  border-color: #f7a168 !important;
}

:deep(.el-table .el-button--danger) {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

/* 所有按钮图标始终白色 */
:deep(.el-table .el-button .el-icon svg) {
  color: white !important;
}

/* 悬停效果 - 背景色略微变化 */
:deep(.el-table .el-button--info:hover) {
  background-color: #66b1ff !important;
  border-color: #66b1ff !important;
}

:deep(.el-table .el-button--danger:hover) {
  background-color: #f78989 !important;
  border-color: #f78989 !important;
}

/* 处理markdown内容中的段落 */
:deep(.option-content p) {
  margin: 0;
  padding: 0;
  line-height: inherit;
}

.options-container {
  max-height: 300px;
  overflow-y: auto;
}

.wrong-answer {
  color: #f56c6c;
  font-weight: bold;
}

.question-image,
.notes-image {
  margin-top: 10px;
  text-align: center;
}

.content-box {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  line-height: 1.6;
}

.mistakes-book {
  padding: 20px;
  background-color: #f8fafc;
  min-height: 100%;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 重做模式提示样式 */
.redo-mode-tip {
  margin-bottom: 20px;
  animation: slideDown 0.3s ease;
}

.selection-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-count {
  font-weight: bold;
  color: #e6a23c;
  font-size: 18px;
  margin: 0 5px;
}

/* 动画效果 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 筛选栏 */
.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: #475569;
  white-space: nowrap;
}

/* 统计数据卡片 */
.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.total .stat-icon {
  background: #3b82f6;
}
.recent .stat-icon {
  background: #10b981;
}
.reviewed .stat-icon {
  background: #8b5cf6;
}
.accuracy .stat-icon {
  background: #f59e0b;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

/* 错题列表 */
.mistakes-list {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.question-preview {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: left;
}

.error-count {
  display: inline-block;
  padding: 2px 8px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* 错题行样式 */
:deep(.mistake-row) {
  transition: background-color 0.2s;
}

:deep(.mistake-row:hover) {
  background-color: #f1f5f9 !important;
}

/* 重做模式下的行样式 */
:deep(.mistake-row.is-selectable) {
  cursor: pointer;
}

:deep(.mistake-row.is-selected) {
  background-color: #f0f9ff !important;
}

:deep(.mistake-row.is-disabled .el-checkbox__input.is-disabled) {
  cursor: not-allowed;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 错题详情样式 */
.mistake-detail {
  padding: 10px;
}

.detail-section {
  margin-top: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.detail-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.detail-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.no-knowledge-points {
  color: #999;
  font-style: italic;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

.toggle-button {
  padding: 4px 8px;
  font-size: 12px;
}

.toggle-button .el-icon {
  margin-right: 4px;
}

/* 答案对比区域样式 */
.answer-comparison {
  margin-top: 15px;
}

.answer-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: #f8f9fa;
}

.answer-label {
  font-weight: bold;
  margin-right: 12px;
  min-width: 80px;
}

.correct-answer {
  color: #10b981;
  font-weight: bold;
}

.wrong-answer {
  color: #ef4444;
  font-weight: bold;
}

.answer-status {
  margin-left: auto;
}

/* 过渡动画 */
:deep(.el-collapse-transition-leave-active),
:deep(.el-collapse-transition-enter-active) {
  transition: all 0.3s ease-in-out;
}

:deep(.el-collapse-transition-enter-from),
:deep(.el-collapse-transition-leave-to) {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

:deep(.el-collapse-transition-enter-to),
:deep(.el-collapse-transition-leave-from) {
  opacity: 1;
  max-height: 1000px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-bar .el-col {
    margin-bottom: 16px;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }
}

/* 打印样式 */
@media print {
  .header-actions,
  .filter-bar,
  .pagination-container,
  .el-table-column--selection {
    display: none !important;
  }

  .mistakes-book {
    padding: 0;
  }

  .mistakes-list {
    box-shadow: none;
    padding: 0;
  }
}
</style>