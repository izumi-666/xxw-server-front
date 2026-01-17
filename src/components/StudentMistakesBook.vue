<template>
  <div class="mistakes-book">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">错题本</h2>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="fetchMistakes" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新
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
        :data="filteredMistakes"
        v-loading="loading"
        @row-click="handleRowClick"
        style="width: 100%"
        row-class-name="mistake-row"
      >
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
              v-html="
                formatQuestionPreview(row.title || row.questionContent || row.content)
              "
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
          width="150"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click.stop="reviewMistake(row)">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button
                type="success"
                size="small"
                @click.stop="markAsReviewed(row)"
                v-if="row.status !== 'reviewed'"
              >
                <el-icon><Check /></el-icon>
              </el-button>
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
      :title="
        currentMistake
          ? `错题详情 - ${getSubjectName(currentMistake.subject_id)}`
          : '错题详情'
      "
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
            <div
              v-if="
                currentMistake.knowledgePoints &&
                currentMistake.knowledgePoints.length > 0
              "
            >
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
            <div
              v-if="
                currentMistake.subKnowledgePoints &&
                currentMistake.subKnowledgePoints.length > 0
              "
            >
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
              :type="
                currentMistake.last_answer === currentMistake.answer
                  ? 'success'
                  : 'danger'
              "
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

        <div class="detail-actions">
          <el-button
            type="primary"
            @click="handleReviewed"
            v-if="currentMistake.status !== 'reviewed'"
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
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";
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
} from "@element-plus/icons-vue";
import {
  fetchSubjectList,
  getSubjectName,
  getAllSubjects,
} from "../utils/subjectList";
import { getQuestionCategoryText } from "../utils/questionCategory";
import { markdownToHtml } from "../utils/markdownUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 初始化的科目映射（从API获取后会更新）
const SUBJECT_MAP = ref({});

// 知识点映射
const KNOWLEDGE_POINT_MAP = ref({});

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

// 题目详情缓存
const questionCache = new Map();

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
  },
  setup() {
    // 状态管理
    const mistakes = ref([]);
    const loading = ref(false);
    const showDetailDialog = ref(false);
    const currentMistake = ref(null);
    const questionDetailsLoaded = ref(new Set()); // 记录已加载的题目ID
    const showAnswer = ref(false);
    const showAnalysis = ref(false);

    // 当前学生名字
    const currentStudentName = ref(localStorage.getItem("userName") || "student");

    // 筛选条件
    const filters = ref({
      subject: "",
      type: "",
      dateRange: "",
      keyword: "",
    });

    // 获取知识点列表
    const fetchKnowledgePointList = async () => {
      try {
        const response = await axios.get(`${API_BASE}/questions/getKnowledgePointList`);
        if (response.data && response.data.code === 200) {
          KNOWLEDGE_POINT_MAP.value = response.data.data;
        }
      } catch (error) {
        console.error("获取知识点列表失败:", error);
        KNOWLEDGE_POINT_MAP.value = {};
      }
    };

    // 科目列表（用于筛选下拉框）
     const subjects = computed(() => {
  return getAllSubjects();
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

    // 根据 question_category_id 获取题型信息
    const getQuestionType = (row) => {
      if (!row) return getQuestionTypeInfo(0);

      // 使用question_category_id
      const categoryId = row.question_category_id;

      if (categoryId !== undefined && categoryId !== null) {
        return getQuestionTypeInfo(categoryId);
      }

      return getQuestionTypeInfo(0);
    };

    // 计算筛选后的数据
    const filteredMistakes = computed(() => {
      let result = [...mistakes.value];

      // 按最新错误时间排序（降序）
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

    // 批量获取题目详情
    const fetchAllQuestionDetails = async (mistakeItems) => {
      // 按最新错误时间排序
      mistakeItems.sort((a, b) => {
        const dateA = new Date(a.last_wrong_time).getTime();
        const dateB = new Date(b.last_wrong_time).getTime();
        return dateB - dateA;
      });

      // 提取所有需要获取详情的题目ID
      const questionIds = mistakeItems.map((item) => item.question_id).filter((id) => id);

      if (questionIds.length === 0) {
        return mistakeItems;
      }

      // 计算已缓存的ID和需要请求的ID
      const cachedIds = [];
      const needFetchIds = [];

      questionIds.forEach((id) => {
        // 转换为字符串，避免类型不匹配
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

      // 一次性获取所有需要请求的题目详情
      if (needFetchIds.length > 0) {
        try {
          const response = await axios.post(
            `${API_BASE}/questions/findQuestionById`,
            needFetchIds, // 直接传递数组
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data && response.data.code === 200) {
            // 直接返回data数组
            const questionDetails = response.data.data || [];

            // 处理每个题目的知识点并更新缓存
            questionDetails.forEach((detail) => {
              if (detail && detail.id) {
                const detailIdStr = String(detail.id);

                // 处理主知识点ID
                if (detail.knowledge_point_id) {
                  detail.knowledgePoints = getKnowledgePointNames(
                    detail.knowledge_point_id
                  );
                }

                // 处理子知识点ID
                if (detail.sub_knowledge_point_ids) {
                  detail.subKnowledgePoints = getKnowledgePointNames(
                    detail.sub_knowledge_point_ids
                  );
                } else {
                  detail.subKnowledgePoints = []; // 确保有默认值
                }

                // 更新缓存和映射
                questionCache.set(detailIdStr, detail);
                questionDetailsLoaded.value.add(detailIdStr);
                questionMap[detailIdStr] = detail;
              }
            });
          }
        } catch (error) {
          console.error("API请求错误详情:", error.response?.data || error.message);
        }
      }

      // 合并数据 - 确保每个错题都有对应的题目详情
      const enrichedMistakes = mistakeItems.map((item) => {
        const itemIdStr = String(item.question_id);
        const questionDetail = questionMap[itemIdStr];

        if (questionDetail) {
          const enriched = enrichMistakeWithDetail(item, questionDetail);
          return enriched;
        }

        // 如果没有获取到详情，返回基础信息
        const baseInfo = {
          ...item,
          type: getQuestionType(item),
          status: item.status || "pending",
          last_answer: item.last_answer || "未作答",
          knowledgePoints: item.knowledge_points_id
            ? getKnowledgePointNames(item.knowledge_points_id)
            : [],
          subKnowledgePoints: item.sub_knowledge_point_ids
            ? getKnowledgePointNames(item.sub_knowledge_point_ids)
            : [],
        };
        return baseInfo;
      });

      return enrichedMistakes;
    };

    // 用题目详情丰富错题信息
    const enrichMistakeWithDetail = (mistake, detail) => {
      // 确保有默认的状态值
      const status = mistake.status || "pending";

      return {
        ...mistake,
        ...detail,
        type: getQuestionType(detail),
        status: status,
        last_answer: mistake.last_answer || detail.last_answer || "未作答",
        // 确保知识点信息被传递
        knowledge_point_id: detail.knowledge_point_id || mistake.knowledge_point_id,
        knowledgePoints:
          detail.knowledgePoints ||
          getKnowledgePointNames(detail.knowledge_point_id || mistake.knowledge_point_id),
        // 确保子知识点信息被传递
        sub_knowledge_point_ids:
          detail.sub_knowledge_point_ids || mistake.sub_knowledge_point_ids,
        subKnowledgePoints:
          detail.subKnowledgePoints ||
          getKnowledgePointNames(
            detail.sub_knowledge_point_ids || mistake.sub_knowledge_point_ids
          ) ||
          [],
      };
    };

    // 获取错题列表
    const fetchMistakes = async () => {
      loading.value = true;

      try {
        // 先获取科目和知识点数据
        await Promise.all([fetchSubjectList(), fetchKnowledgePointList()]);

        // 获取错题数据
        const response = await axios.get(
          `${API_BASE}/incorrectQuestion/getIncorrectQuestionByStudent/${encodeURIComponent(
            currentStudentName.value
          )}`
        );

        if (response.data && response.data.code === 200) {
          const rawData = response.data.data || [];

          // 按最新错误时间排序（降序）
          rawData.sort((a, b) => {
            const dateA = new Date(a.last_wrong_time).getTime();
            const dateB = new Date(b.last_wrong_time).getTime();
            return dateB - dateA;
          });

          // 一次性获取所有题目详情
          mistakes.value = await fetchAllQuestionDetails(rawData);

          // 确保每个错题都有状态
          mistakes.value.forEach((item, index) => {
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
        console.error("API错误详情:", error.response?.data || error.message);
        ElMessage.error("获取数据失败");
        updateStats();
      } finally {
        loading.value = false;
      }
    };

    // 查看错题详情
    const loadFullQuestionDetail = async (mistake) => {
      // 如果已经有完整信息，直接返回
      if (mistake.title && mistake.answer) return;

      if (mistake.question_id) {
        try {
          // 首先检查缓存
          let questionDetail = questionCache.get(mistake.question_id);

          // 如果没有缓存，则请求单个题目详情
          if (!questionDetail) {
            questionDetail = await fetchQuestionDetail(mistake.question_id);
          }

          if (questionDetail) {
            // 合并数据，包含子知识点
            Object.assign(mistake, questionDetail, {
              type: getQuestionType(questionDetail),
              subKnowledgePoints:
                questionDetail.subKnowledgePoints ||
                getKnowledgePointNames(questionDetail.sub_knowledge_point_ids) ||
                [],
            });

            // 更新缓存中的数据
            const index = mistakes.value.findIndex((item) => item.id === mistake.id);
            if (index !== -1) {
              mistakes.value[index] = { ...mistakes.value[index], ...questionDetail };
            }
          }
        } catch (error) {
          console.error("获取完整题目详情失败:", error);
        }
      }
    };

    // 从缓存或API获取单个题目详情
    const fetchQuestionDetail = async (questionId) => {
      const questionIdStr = String(questionId);

      if (questionCache.has(questionIdStr)) {
        return questionCache.get(questionIdStr);
      }

      try {
        const response = await axios.post(
          `${API_BASE}/questions/findQuestionById`,
          [questionId], // 单个ID也放在数组中
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && response.data.code === 200) {
          // 直接返回data数组
          const questionDetails = response.data.data || [];
          const questionDetail =
            questionDetails.find((item) => item.id === questionId) || null;

          if (questionDetail) {
            // 处理知识点ID
            if (questionDetail.knowledge_point_id) {
              questionDetail.knowledgePoints = getKnowledgePointNames(
                questionDetail.knowledge_point_id
              );
            }

            // 处理子知识点ID
            if (questionDetail.sub_knowledge_point_ids) {
              questionDetail.subKnowledgePoints = getKnowledgePointNames(
                questionDetail.sub_knowledge_point_ids
              );
            } else {
              questionDetail.subKnowledgePoints = []; // 确保有默认值
            }

            questionCache.set(questionIdStr, questionDetail);
            questionDetailsLoaded.value.add(questionIdStr);

            return questionDetail;
          }
          return null;
        }

        return null;
      } catch (error) {
        console.error("API请求错误详情:", error.response?.data || error.message);
        return null;
      }
    };

    const updateStats = () => {
      const total = mistakes.value.length;

      // 计算近期新增（7天内）
      const recent = mistakes.value.filter((item) => {
        if (!item.last_wrong_time) return false;
        const days =
          (Date.now() - new Date(item.last_wrong_time).getTime()) / (1000 * 3600 * 24);
        return days <= 7;
      }).length;

      // 计算已复习数量
      const reviewed = mistakes.value.filter((item) => item.status === "reviewed").length;

      // 计算复习正确率（这里假设标记为已复习的题目都是正确的）
      const accuracy = reviewed > 0 ? Math.round((reviewed / total) * 100) : 0;

      stats.value = { total, recent, reviewed, accuracy };
    };

    // 获取知识点名称
    const getKnowledgePointNames = (knowledgePointIds) => {
      if (!knowledgePointIds) return [];

      // 处理数字类型的单个ID
      if (typeof knowledgePointIds === "number") {
        return [
          KNOWLEDGE_POINT_MAP.value[knowledgePointIds] || `知识点${knowledgePointIds}`,
        ];
      }

      // 处理字符串类型的ID
      if (typeof knowledgePointIds === "string") {
        // 如果是逗号分隔的字符串
        if (knowledgePointIds.includes(",")) {
          const ids = knowledgePointIds.split(",").map((id) => id.trim());
          return ids.map((id) => KNOWLEDGE_POINT_MAP.value[id] || `知识点${id}`);
        }
        // 单个字符串ID
        return [
          KNOWLEDGE_POINT_MAP.value[knowledgePointIds] || `知识点${knowledgePointIds}`,
        ];
      }

      // 处理数组类型的ID
      if (Array.isArray(knowledgePointIds)) {
        return knowledgePointIds.map(
          (id) => KNOWLEDGE_POINT_MAP.value[id] || `知识点${id}`
        );
      }

      return [];
    };

    // 获取单个知识点名称
    const getKnowledgePointName = (knowledgePointId) => {
      if (!knowledgePointId) return "";
      return KNOWLEDGE_POINT_MAP.value[knowledgePointId] || `知识点${knowledgePointId}`;
    };

    const handleFilterChange = () => {
      pagination.value.currentPage = 1;
    };

    const handleRowClick = async (row) => {
      currentMistake.value = row;
      showAnswer.value = false;
      showAnalysis.value = false;
      await loadFullQuestionDetail(row);
      showDetailDialog.value = true;

      // 触发Katex渲染
      nextTick(() => {
        renderKatexInDialog();
      });
    };

    const reviewMistake = async (row) => {
      currentMistake.value = row;
      showAnswer.value = false;
      showAnalysis.value = false;
      await loadFullQuestionDetail(row);
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
            // 重新渲染包含LaTeX的内容
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
        updateStats();
        ElMessage.success("删除成功");
      } catch {
        // 用户取消
      }
    };

    const handleReviewed = () => {
      if (currentMistake.value) {
        currentMistake.value.status = "reviewed";
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
    };

    const handleCurrentChange = (val) => {
      pagination.value.currentPage = val;
    };

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
      currentStudentName,
      filters,
      subjects,
      pagination,
      stats,
      showAnswer,
      showAnalysis,

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
      getKnowledgePointName,
      hasOptions,
      handleSizeChange,
      handleCurrentChange,
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
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.mistake-row:hover) {
  background-color: #f1f5f9 !important;
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
