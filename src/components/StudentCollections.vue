<template>
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          我的收藏
        </h1>
        <div class="header-actions">
          <el-button 
            type="primary" 
            @click="fetchCollections" 
            :loading="loading"
            class="btn-action"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
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
            <label>题目类型：</label>
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
            <label>收藏时间：</label>
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
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">收藏总数</div>
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
          <div class="stat-card subject">
            <div class="stat-icon">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.subjectCount }}</div>
              <div class="stat-label">涉及科目</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card type">
            <div class="stat-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.typeCount }}</div>
              <div class="stat-label">题目类型</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 收藏题目列表 -->
    <div class="collections-list">
      <el-table
        :data="filteredCollections"
        v-loading="loading"
        element-loading-text="正在加载收藏题目..."
        @row-click="handleRowClick"
        style="width: 100%"
        row-class-name="collection-row"
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
              v-html="formatQuestionPreview(row.title || row.questionContent || row.content)"
            />
          </template>
        </el-table-column>

        <!-- 难度列 -->
        <el-table-column
          prop="difficulty"
          label="难度"
          width="120"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-rate
              v-model="row.difficulty_level"
              :max="5"
              disabled
              text-color="#ff9900"
              size="small"
            />
          </template>
        </el-table-column>

        <!-- 收藏时间列 -->
        <el-table-column
          prop="collection_time"
          label="收藏时间"
          width="160"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            {{ formatDate(row.collection_time || row.created_at) }}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          label="操作"
          width="220"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-button-group>
              <!-- 取消收藏按钮 -->
              <el-button
                type="danger"
                size="small"
                @click.stop="cancelCollect(row)"
                :loading="row.collectLoading"
              >
                <el-icon><Star /></el-icon>
              </el-button>
              
              <!-- 查看详情按钮 -->
              <el-button type="primary" size="small" @click.stop="viewDetail(row)">
                <el-icon><View /></el-icon>
              </el-button>
              
              <!-- 练习按钮 -->
              <el-button
                type="success"
                size="small"
                @click.stop="practiceQuestion(row)"
              >
                <el-icon><EditPen /></el-icon>
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

    <!-- 题目详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentQuestion ? `题目详情 - ${getSubjectName(currentQuestion.subject_id)}` : '题目详情'"
      width="70%"
    >
      <div v-if="currentQuestion" class="question-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="科目">{{
            getSubjectName(currentQuestion.subject_id)
          }}</el-descriptions-item>
          <el-descriptions-item label="题型">{{
            getQuestionType(currentQuestion).name
          }}</el-descriptions-item>
          <el-descriptions-item label="知识点">
            <div v-if="currentQuestion.knowledgePoints && currentQuestion.knowledgePoints.length > 0">
              <el-tag
                v-for="(point, index) in currentQuestion.knowledgePoints"
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
            <div v-if="currentQuestion.subKnowledgePoints && currentQuestion.subKnowledgePoints.length > 0">
              <el-tag
                v-for="(point, index) in currentQuestion.subKnowledgePoints"
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
              v-model="currentQuestion.difficulty_level"
              :max="5"
              disabled
              text-color="#ff9900"
            />
          </el-descriptions-item>
          
          <el-descriptions-item label="收藏时间">{{
            formatDate(currentQuestion.collection_time || currentQuestion.created_at)
          }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h3>题目内容</h3>
          <div class="content-box">
            <div
              v-html="markdownToHtml(currentQuestion.title || '暂无题目内容')"
              class="markdown-content"
            ></div>
            <div v-if="currentQuestion.img_url" class="question-image">
              <el-image
                :src="currentQuestion.img_url"
                :preview-src-list="[currentQuestion.img_url]"
                fit="contain"
                style="max-width: 100%; max-height: 300px"
              />
            </div>
          </div>
        </div>

        <div v-if="hasOptions(currentQuestion)" class="detail-section">
          <h3>选项</h3>
          <div class="content-box options-container">
            <div v-if="currentQuestion.options?.option_A" class="option-item">
              <span class="option-label">A.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentQuestion.options.option_A)"
              ></span>
            </div>
            <div v-if="currentQuestion.options?.option_B" class="option-item">
              <span class="option-label">B.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentQuestion.options.option_B)"
              ></span>
            </div>
            <div v-if="currentQuestion.options?.option_C" class="option-item">
              <span class="option-label">C.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentQuestion.options.option_C)"
              ></span>
            </div>
            <div v-if="currentQuestion.options?.option_D" class="option-item">
              <span class="option-label">D.</span>
              <span
                class="option-content"
                v-html="markdownToHtml(currentQuestion.options.option_D)"
              ></span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="currentQuestion.answer">
          <div class="section-header">
            <h3>答案</h3>
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
              <div v-html="markdownToHtml(currentQuestion.answer)"></div>
            </div>
          </el-collapse-transition>
        </div>

        <div class="detail-section" v-if="currentQuestion.notes">
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
                v-html="markdownToHtml(currentQuestion.notes)"
                class="markdown-content"
              ></div>
              <div v-if="currentQuestion.notes_img_url" class="notes-image">
                <el-image
                  :src="currentQuestion.notes_img_url"
                  :preview-src-list="[currentQuestion.notes_img_url]"
                  fit="contain"
                  style="max-width: 100%; max-height: 300px; margin-top: 10px"
                />
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <div class="detail-section" v-if="currentQuestion.remark">
          <h3>备注</h3>
          <div class="content-box" v-html="markdownToHtml(currentQuestion.remark)"></div>
        </div>

        <!-- 详情页操作按钮 -->
        <div class="detail-actions">
          <el-button
            type="danger"
            @click="cancelCollect(currentQuestion)"
            :loading="currentQuestion?.collectLoading"
          >
            <el-icon><Star /></el-icon>
            取消收藏
          </el-button>
          
          <el-button
            type="success"
            @click="practiceQuestion(currentQuestion)"
          >
            <el-icon><EditPen /></el-icon>
            开始练习
          </el-button>
          
          <el-button @click="showDetailDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import {
  Refresh,
  Search,
  Star,
  Calendar,
  Notebook,
  Collection,
  View,
  DocumentAdd,
  EditPen,
  Delete
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
  name: "CollectionsBook",
  components: {
    Refresh,
    Search,
    Star,
    Calendar,
    Notebook,
    Collection,
    View,
    DocumentAdd,
    EditPen,
    Delete,
    ArrowDown,
    ArrowUp
  },
  setup() {
    // 状态管理
    const collections = ref([]);
    const loading = ref(false);
    const showDetailDialog = ref(false);
    const currentQuestion = ref(null);
    const questionDetailsLoaded = ref(new Set());
    const showAnswer = ref(false);
    const showAnalysis = ref(false);
    const currentStudentName = ref(localStorage.getItem("userName") || "student");

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
      subjectCount: 0,
      typeCount: 0,
    });

    // 计算属性
    const subjects = computed(() => getAllSubjects());
    
    const filteredCollections = computed(() => {
      let result = [...collections.value];

      // 按最新收藏时间排序
      result.sort((a, b) => {
        const dateA = new Date(a.collection_time || a.created_at).getTime();
        const dateB = new Date(b.collection_time || b.created_at).getTime();
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
          const date = new Date(item.collection_time || item.created_at);
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

    // 用题目详情丰富收藏信息
    const enrichCollectionWithDetail = (collection, detail) => {
      return {
        ...collection,
        ...detail,
        type: getQuestionType(detail),
        is_collected: true,
        collectLoading: false,
        knowledgePoints: getKnowledgePointNames(detail.knowledge_point_id || collection.knowledge_point_id),
        subKnowledgePoints: getKnowledgePointNames(
          detail.sub_knowledge_point_ids || collection.sub_knowledge_point_ids
        ) || [],
      };
    };

    // 批量获取题目详情
    const fetchAllQuestionDetails = async (collectionItems) => {
      // 按收藏时间排序
      collectionItems.sort((a, b) => {
        const dateA = new Date(a.collection_time || a.created_at).getTime();
        const dateB = new Date(b.collection_time || b.created_at).getTime();
        return dateB - dateA;
      });

      const questionIds = collectionItems.map((item) => item.question_id).filter((id) => id);
      if (questionIds.length === 0) return collectionItems;

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
      return collectionItems.map((item) => {
        const itemIdStr = String(item.question_id);
        const questionDetail = questionMap[itemIdStr];

        if (questionDetail) {
          return enrichCollectionWithDetail(item, questionDetail);
        }

        // 如果没有获取到详情，返回基础信息
        return {
          ...item,
          type: getQuestionType(item),
          is_collected: true,
          collectLoading: false,
          knowledgePoints: item.knowledge_points_id ? getKnowledgePointNames(item.knowledge_points_id) : [],
          subKnowledgePoints: item.sub_knowledge_point_ids ? getKnowledgePointNames(item.sub_knowledge_point_ids) : [],
        };
      });
    };

    // 获取收藏列表
    const fetchCollections = async () => {
      loading.value = true;

      try {
        // 先获取科目和知识点数据
        await Promise.all([fetchKnowledgePointList()]);
        
        // 初始化科目数据
        await initSubjectData();

        // 获取收藏数据
        const response = await axios.get(
          `${API_BASE}/collections/getCollectionList/${encodeURIComponent(
            currentStudentName.value
          )}`
        );

        if (response.data?.code === 200) {
          const rawData = response.data.data || [];
          
          // 获取所有题目详情
          collections.value = await fetchAllQuestionDetails(rawData);

          // 更新统计数据
          updateStats();
          
          ElMessage.success(`获取到 ${collections.value.length} 条收藏记录`);
        } else {
          ElMessage.warning("获取收藏数据成功，但数据格式可能不符合预期");
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

    // 取消收藏
    const cancelCollect = async (row) => {
      if (!row?.question_id) {
        ElMessage.warning('无法取消收藏，题目ID不存在');
        return;
      }
      
      try {
        row.collectLoading = true;
        currentQuestion.value && (currentQuestion.value.collectLoading = true);
        
        await ElMessageBox.confirm("确认取消收藏该题目？", "提示", {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "warning",
        });

        // 调用取消收藏API
        await axios.delete(`${API_BASE}/collections/cancelCollecting`, {
          data: {
            question_id: row.question_id,
            student: currentStudentName.value
          }
        });

        // 从列表中移除
        collections.value = collections.value.filter(
          (item) => item.question_id !== row.question_id
        );

        if (currentQuestion.value && currentQuestion.value.question_id === row.question_id) {
          showDetailDialog.value = false;
        }

        updateStats();
        ElMessage.success('已取消收藏');
      } catch (error) {
        if (error !== 'cancel') {
          console.error('取消收藏失败:', error);
          ElMessage.error(error.response?.data?.message || '操作失败');
        }
      } finally {
        row.collectLoading = false;
        currentQuestion.value && (currentQuestion.value.collectLoading = false);
      }
    };

    // 开始练习
    const practiceQuestion = (row) => {
      ElMessage.info('练习功能开发中...');
      // 这里可以跳转到练习页面或打开练习弹窗
    };

    // 更新统计数据
    const updateStats = () => {
      const total = collections.value.length;

      // 近期新增（7天内）
      const recent = collections.value.filter((item) => {
        if (!item.collection_time && !item.created_at) return false;
        const collectionDate = item.collection_time || item.created_at;
        const days = (Date.now() - new Date(collectionDate).getTime()) / (1000 * 3600 * 24);
        return days <= 7;
      }).length;

      // 涉及科目数量
      const subjectSet = new Set();
      collections.value.forEach((item) => {
        const subjectName = getSubjectName(item.subject_id);
        if (subjectName) {
          subjectSet.add(subjectName);
        }
      });

      // 题目类型数量
      const typeSet = new Set();
      collections.value.forEach((item) => {
        const typeName = getQuestionType(item).name;
        if (typeName) {
          typeSet.add(typeName);
        }
      });

      stats.value = {
        total,
        recent,
        subjectCount: subjectSet.size,
        typeCount: typeSet.size
      };
    };

    // 其他方法
    const handleFilterChange = () => {
      pagination.value.currentPage = 1;
    };

    const handleRowClick = async (row) => {
      currentQuestion.value = row;
      showAnswer.value = false;
      showAnalysis.value = false;
      showDetailDialog.value = true;

      nextTick(() => {
        renderKatexInDialog();
      });
    };

    const viewDetail = async (row) => {
      currentQuestion.value = row;
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
      fetchCollections();
    });

    return {
      // 状态
      collections,
      loading,
      showDetailDialog,
      currentQuestion,
      filters,
      subjects,
      pagination,
      stats,
      showAnswer,
      showAnalysis,

      // 计算属性
      filteredCollections,

      // 方法
      fetchCollections,
      handleFilterChange,
      handleRowClick,
      viewDetail,
      cancelCollect,
      practiceQuestion,
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

/* 按钮图标始终白色 */
:deep(.el-table .el-button .el-icon svg) {
  color: white !important;
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
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ==================== 按钮样式 ==================== */
.btn-action {
  background-color: white;
  color: #409eff;
  border: 2px solid white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.2);
}

.btn-action:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.3);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-action.el-button--primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.btn-action.el-button--primary:hover:not(:disabled) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* ==================== 筛选栏 ==================== */
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

/* ==================== 统计数据卡片 ==================== */
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
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}
.recent .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}
.subject .stat-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}
.type .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
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

/* ==================== 收藏列表 ==================== */
.collections-list {
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

/* 收藏行样式 */
:deep(.collection-row) {
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.collection-row:hover) {
  background-color: #f0f9ff !important;
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

/* ==================== 题目详情样式 ==================== */
.question-detail {
  padding: 10px;
}

.detail-section {
  margin-top: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .page-header {
    padding: 16px 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .btn-action {
    padding: 8px 16px;
    font-size: 13px;
  }

  .filter-bar .el-col {
    margin-bottom: 16px;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }
}

/* ==================== 打印样式 ==================== */
@media print {
  .header-actions,
  .filter-bar,
  .pagination-container,
  .el-table-column--selection {
    display: none !important;
  }

  .collections-list {
    box-shadow: none;
    padding: 0;
  }
}

/* 难度星星样式调整 */
:deep(.el-rate__icon) {
  font-size: 16px;
}

:deep(.el-rate__text) {
  font-size: 12px;
  margin-left: 5px;
}

/* 收藏按钮样式 */
:deep(.el-table .el-button--danger) {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

:deep(.el-table .el-button--primary) {
  background-color: #409eff !important;
  border-color: #409eff !important;
}

:deep(.el-table .el-button--success) {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
}

/* 悬停效果 */
:deep(.el-table .el-button--danger:hover) {
  background-color: #f78989 !important;
  border-color: #f78989 !important;
}

:deep(.el-table .el-button--primary:hover) {
  background-color: #66b1ff !important;
  border-color: #66b1ff !important;
}

:deep(.el-table .el-button--success:hover) {
  background-color: #85ce61 !important;
  border-color: #85ce61 !important;
}
</style>