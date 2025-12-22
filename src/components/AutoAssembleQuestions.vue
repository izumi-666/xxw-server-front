<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">自动组题系统</h1>
        <button @click="goBack" class="back-btn">
          返回
        </button>
      </div>
    </div>

    <!-- 组题模式选择 -->
    <div class="mode-selector">
      <div class="mode-tabs">
        <button
          :class="{ active: currentMode === 'auto' }"
          @click="currentMode = 'auto'"
          type="button"
          class="mode-tab"
        >
          自动组题
        </button>
        <button
          :class="{ active: currentMode === 'preview' }"
          @click="currentMode = 'preview'"
          type="button"
          class="mode-tab"
        >
          试卷预览
          <span class="question-count">{{ selectedQuestions.length }}</span>
        </button>
      </div>
    </div>
    <!-- ==================== 自动组题界面 ==================== -->
    <section v-if="currentMode === 'auto'" class="auto-create-section">
      <div class="auto-create-config card">
        <div class="card-header">
          <h2 class="section-title">自动组题配置</h2>
          <div class="header-actions">
            <button @click="generatePaper" class="btn-primary" :disabled="isGenerating">
              {{ isGenerating ? '生成中...' : '生成试卷' }}
            </button>
            <button @click="resetAutoConfig" class="btn-secondary">重置配置</button>
          </div>
        </div>

        <!-- 试卷基本信息 -->
        <div class="config-section">
          <h3 class="config-title">
            试卷基本信息
          </h3>
          <div class="config-grid">
            <div class="form-group">
              <label class="form-label">试卷标题</label>
              <input
                type="text"
                v-model="autoConfig.paper_name"
                placeholder="请输入试卷标题"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">年级</label>
              <select v-model="autoConfig.grade_id" class="form-select" required>
                <option :value="null">请选择年级</option>
                <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                  {{ grade.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">科目</label>
              <select v-model="autoConfig.subject_id" class="form-select" required>
                <option :value="null">请选择科目</option>
                <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                  {{ sub.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">总题数</label>
              <input
                type="number"
                v-model.number="autoConfig.total_questions"
                min="1"
                max="100"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">试卷总分</label>
              <input
                type="number"
                v-model.number="autoConfig.total_score"
                min="1"
                max="300"
                class="form-input"
                required
              />
            </div>
          </div>
        </div>

        <!-- 题型分布配置 -->
        <div class="config-section">
          <h3 class="config-title">
            题型分布配置
          </h3>
          
          <div class="distribution-controls">
            <div class="distribution-mode">
              <label class="radio-label">
                <input
                  type="radio"
                  v-model="distributionMode"
                  value="percentage"
                  @change="resetTypeDistribution"
                />
                <span class="radio-text">按占比配置</span>
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  v-model="distributionMode"
                  value="count"
                  @change="resetTypeDistribution"
                />
                <span class="radio-text">按题数配置</span>
              </label>
            </div>
          </div>

          <div class="type-distribution-list">
            <div
              v-for="(item, index) in typeDistribution"
              :key="index"
              class="distribution-item"
            >
              <div class="distribution-row">
                <div class="type-select">
                  <select
                    v-model="item.question_category_id"
                    class="form-select"
                    :disabled="item.fixed"
                  >
                    <option :value="null">请选择题型</option>
                    <option
                      v-for="category in questionCategoryList"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                </div>

                <div class="distribution-input">
                  <template v-if="distributionMode === 'percentage'">
                    <input
                      type="number"
                      v-model.number="item.percentage"
                      min="0"
                      max="100"
                      class="form-input"
                      placeholder="占比%"
                      @input="updateTypeDistribution"
                    />
                    <span class="input-suffix">%</span>
                  </template>
                  <template v-else>
                    <input
                      type="number"
                      v-model.number="item.count"
                      min="0"
                      :max="autoConfig.total_questions"
                      class="form-input"
                      placeholder="题数"
                      @input="updateTypeDistribution"
                    />
                    <span class="input-suffix">题</span>
                  </template>
                </div>

                <div class="score-input">
                  <input
                    type="number"
                    v-model.number="item.score_per_question"
                    min="0.5"
                    max="100"
                    step="0.5"
                    class="form-input"
                    placeholder="每题分数"
                  />
                  <span class="input-suffix">分</span>
                </div>

                <div class="distribution-actions">
                  <button
                    v-if="typeDistribution.length > 1"
                    @click="removeTypeDistribution(index)"
                    class="btn-icon danger"
                    title="删除"
                  >
                    ×
                  </button>
                  <button
                    v-if="index === typeDistribution.length - 1"
                    @click="addTypeDistribution"
                    class="btn-icon success"
                    title="添加"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="distribution-info">
                <span class="info-text">
                  预计题数: <span class="info-value">{{ calculateExpectedCount(item) }}题</span>
                </span>
                <span class="info-text">
                  预计分数: <span class="info-value">{{ calculateExpectedScore(item) }}分</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 分布统计 -->
          <div class="distribution-summary">
            <div class="summary-item">
              <span class="summary-label">已分配:</span>
              <span class="summary-value">
                {{ distributionMode === 'percentage' ? totalPercentage + '%' : totalCount + '题' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">剩余:</span>
              <span class="summary-value">
                {{ distributionMode === 'percentage' ? (100 - totalPercentage) + '%' : (autoConfig.total_questions - totalCount) + '题' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">预计总分:</span>
              <span class="summary-value">{{ expectedTotalScore }}分</span>
            </div>
          </div>

          <!-- 自动分配剩余 -->
          <div class="auto-distribute" v-if="distributionMode === 'count' && totalCount < autoConfig.total_questions">
            <button @click="autoDistributeRemaining" class="btn-secondary">
              自动分配剩余{{ autoConfig.total_questions - totalCount }}题
            </button>
          </div>
        </div>

        <!-- 难度分布配置 -->
        <div class="config-section">
          <h3 class="config-title">
            难度分布配置
          </h3>
          <div class="difficulty-distribution">
            <div
              v-for="level in 5"
              :key="level"
              class="difficulty-level"
            >
              <div class="difficulty-header">
                <span class="difficulty-stars">
                  <span v-for="n in level" :key="n" class="star active">⭐</span>
                  <span v-for="n in (5 - level)" :key="n + 5" class="star">⭐</span>
                </span>
                <span class="difficulty-label">{{ level }}星难度</span>
              </div>
              <div class="difficulty-slider">
                <input
                  type="range"
                  v-model.number="autoConfig.difficulty_distribution[level]"
                  min="0"
                  max="100"
                  step="5"
                  class="slider"
                  @input="updateDifficultyDistribution"
                />
                <div class="slider-value">
                  <span>{{ autoConfig.difficulty_distribution[level] }}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 难度分布统计 -->
          <div class="difficulty-summary" :class="{ 'has-error': difficultyError }">
            <div class="summary-item">
              <span class="summary-label">难度分布:</span>
              <span class="summary-value">
                {{ Object.values(autoConfig.difficulty_distribution).reduce((a, b) => a + b, 0) }}%
              </span>
            </div>
            <div class="summary-item" v-if="difficultyError">
              <span class="error-text">{{ difficultyError }}</span>
            </div>
          </div>
        </div>

        <!-- 高级选项 -->
        <div class="config-section">
          <h3 class="config-title">
            高级选项
          </h3>
          <div class="advanced-options">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="autoConfig.avoid_duplicate_knowledge" />
                <span class="checkbox-text">避免重复知识点</span>
              </label>
              <div class="checkbox-hint">确保题目覆盖不同的知识点</div>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="autoConfig.include_solution_ideas" />
                <span class="checkbox-text">包含解题思想标注</span>
              </label>
              <div class="checkbox-hint">优先选择有解题思想的题目</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">知识点覆盖数量</label>
              <input
                type="number"
                v-model.number="autoConfig.knowledge_coverage"
                min="1"
                max="20"
                class="form-input"
              />
              <div class="input-hint">希望覆盖的知识点数量</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">随机种子</label>
              <input
                type="number"
                v-model.number="autoConfig.random_seed"
                class="form-input"
              />
              <div class="input-hint">相同种子产生相同的组题结果</div>
            </div>
          </div>
        </div>

        <!-- 配置预览 -->
        <div class="config-preview card">
          <h3 class="config-title">
            配置预览
          </h3>
          <div class="preview-content">
            <div class="preview-row">
              <span class="preview-label">试卷标题:</span>
              <span class="preview-value">{{ autoConfig.paper_name || '未设置' }}</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">年级科目:</span>
              <span class="preview-value">
                {{ getGradeName(autoConfig.grade_id) }} - {{ getSubjectName(autoConfig.subject_id) }}
              </span>
            </div>
            <div class="preview-row">
              <span class="preview-label">题数总分:</span>
              <span class="preview-value">
                {{ autoConfig.total_questions }}题 / {{ autoConfig.total_score }}分
              </span>
            </div>
            <div class="preview-row">
              <span class="preview-label">题型分布:</span>
              <span class="preview-value">
                <template v-for="(item, index) in typeDistribution" :key="index">
                  <span v-if="item.question_category_id">
                    {{ getQuestionCategoryName(item.question_category_id) }}
                    ({{ distributionMode === 'percentage' ? item.percentage + '%' : item.count + '题' }})
                    {{ index < typeDistribution.length - 1 ? '、' : '' }}
                  </span>
                </template>
              </span>
            </div>
            <div class="preview-row">
              <span class="preview-label">难度分布:</span>
              <span class="preview-value">
                1星{{ autoConfig.difficulty_distribution[1] }}%、
                2星{{ autoConfig.difficulty_distribution[2] }}%、
                3星{{ autoConfig.difficulty_distribution[3] }}%、
                4星{{ autoConfig.difficulty_distribution[4] }}%、
                5星{{ autoConfig.difficulty_distribution[5] }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 试卷预览界面 ==================== -->
    <section v-if="currentMode === 'preview'" class="paper-preview-section">
      <div class="paper-header card">
        <h2 class="section-title">试卷预览</h2>
        <div class="paper-actions">
          <button @click="showBatchScoreModal = true" class="btn-primary">
            批量设置分值
          </button>
          <button @click="exportPaper" class="btn-primary">导出试卷</button>
          <button @click="uploadPaper" class="btn-primary">上传试卷</button>
          <button @click="clearPaper" class="btn-secondary">清空试卷</button>
          <button @click="regeneratePaper" class="btn-secondary" :disabled="isGenerating">
            {{ isGenerating ? '重新生成中...' : '重新生成' }}
          </button>
        </div>
      </div>

      <div v-if="selectedQuestions.length" class="paper-content">
        <!-- 试卷统计 -->
        <div class="paper-stats card">
          <h3 class="section-title">试卷统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">题目总数</span>
              <span class="stat-value">{{ selectedQuestions.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">试卷总分</span>
              <span class="stat-value">{{ totalScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">选择题</span>
              <span class="stat-value">{{ getQuestionTypeCount("选择题") }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">主观题</span>
              <span class="stat-value">{{ getQuestionTypeCount("主观题") }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均难度</span>
              <span class="stat-value">{{ getAverageDifficulty.toFixed(1) }}星</span>
            </div>
          </div>
        </div>

        <!-- 试卷题目列表 -->
        <div class="paper-questions card">
          <h3 class="section-title">试卷内容</h3>
          <div class="questions-list">
            <div
              v-for="(q, index) in selectedQuestions"
              :key="q.id"
              class="paper-question"
            >
              <div class="question-left">
                <div class="question-number">{{ index + 1 }}.</div>
              </div>

              <div class="question-content">
                <div class="question-text" v-html="renderMarkdown(q.title)"></div>

                <div class="score-area">
                  <label class="score-label">分值</label>
                  <input
                    type="number"
                    v-model.number="q.score"
                    @input="validateScore(q, $event)"
                    min="0"
                    max="100"
                    class="score-input"
                    :class="{ 'score-error': q.scoreError }"
                    @blur="formatScore(q)"
                  />
                  <span class="score-error-text" v-if="q.scoreError">
                    {{ q.scoreError }}
                  </span>
                </div>

                <div v-if="q.answer" class="question-answer">
                  <div class="answer-label">参考答案：</div>
                  <div class="answer-text" v-html="renderMarkdown(q.answer)"></div>
                </div>

                <div class="question-actions">
                  <button
                    @click="moveQuestionUp(index)"
                    class="btn-secondary"
                    :disabled="index === 0"
                  >
                    <span class="btn-icon">↑</span>
                    上移
                  </button>
                  <button
                    @click="moveQuestionDown(index)"
                    class="btn-secondary"
                    :disabled="index === selectedQuestions.length - 1"
                  >
                    <span class="btn-icon">↓</span>
                    下移
                  </button>
                  <button @click="removeFromPaper(q.id)" class="btn-delete">
                    <span class="btn-icon">×</span>
                    移除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-paper card">
        <div class="empty-content">
          <p>试卷为空</p>
          <div class="empty-actions">
            <button @click="currentMode = 'auto'" class="btn-primary">
              去自动组题
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 统一弹窗提示 ==================== -->
    <div v-if="showAlertModal" class="modal-overlay" @click="closeAlertModal">
      <div class="alert-modal-content">
        <h3 class="alert-modal-title">{{ alertModalTitle }}</h3>
        <p class="alert-modal-message">{{ alertModalMessage }}</p>
        <div class="alert-modal-actions">
          <button @click="closeAlertModal" class="btn-primary">确定</button>
        </div>
      </div>
    </div>

    <!-- ==================== 试卷上传模态框 ==================== -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">上传试卷</h3>
        
        <div class="form-group">
          <label for="paperTitle" class="form-label">试卷标题</label>
          <input
            type="text"
            id="paperTitle"
            v-model="paperTitle"
            placeholder="请输入试卷标题"
            class="form-input"
          />
        </div>
        
        <div class="preview-section">
          <h4 class="preview-title">试卷信息预览</h4>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">题目总数:</span>
              <span class="preview-value">{{ selectedQuestions.length }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">试卷总分:</span>
              <span class="preview-value">{{ totalScore }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="confirmUpload" class="btn-primary" :disabled="!canUpload">
            {{ isUploading ? '上传中...' : '确认上传' }}
          </button>
          <button @click="closeUploadModal" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- ==================== 批量设置分值模态框 ==================== -->
    <div v-if="showBatchScoreModal" class="modal-overlay" @click="closeBatchScoreModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">批量设置分值</h3>
        
        <div class="batch-score-form">
          <div class="batch-score-group">
            <label class="form-label">设置方式</label>
            <select v-model="batchScoreMode" class="form-select">
              <option value="single">单题分值</option>
              <option value="type">按题型设置</option>
              <option value="all">所有题目</option>
            </select>
          </div>

          <div v-if="batchScoreMode === 'type'" class="type-score-settings">
            <div
              class="type-score-item"
              v-for="type in availableQuestionTypes"
              :key="type"
            >
              <span class="type-score-label">{{ type }}</span>
              <input
                type="number"
                v-model.number="typeScores[type]"
                placeholder="分值"
                class="type-score-input"
                min="0"
                max="100"
              />
              <span class="type-score-count">({{ getTypeCount(type) }}题)</span>
            </div>
          </div>

          <div v-if="batchScoreMode === 'single'" class="single-score-setting">
            <div class="form-group">
              <label class="form-label">题目编号</label>
              <input
                type="text"
                v-model="singleQuestionIndex"
                placeholder="如: 1,3-5,7"
                class="form-input"
              />
              <div class="input-hint">支持单个数字或范围，如: 1,3-5,7</div>
            </div>
            <div class="form-group">
              <label class="form-label">分值</label>
              <input
                type="number"
                v-model.number="singleQuestionScore"
                placeholder="分值"
                class="form-input"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div v-if="batchScoreMode === 'all'" class="all-score-setting">
            <div class="form-group">
              <label class="form-label">所有题目分值</label>
              <input
                type="number"
                v-model.number="allQuestionsScore"
                placeholder="分值"
                class="form-input"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="applyBatchScores" class="btn-primary">应用设置</button>
          <button @click="closeBatchScoreModal" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { marked } from "marked";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  setup() {
    const router = useRouter();

    // ==================== 状态管理 ====================
    const currentMode = ref('auto');
    const selectedQuestions = ref([]);
    const showUploadModal = ref(false);
    const showBatchScoreModal = ref(false);
    const isGenerating = ref(false);
    const isUploading = ref(false);
    
    // 自动组题配置
    const distributionMode = ref('percentage');
    const autoConfig = reactive({
      grade_id: null,
      subject_id: null,
      total_questions: 20,
      total_score: 100,
      difficulty_distribution: {
        1: 10,
        2: 20,
        3: 40,
        4: 20,
        5: 10,
      },
      avoid_duplicate_knowledge: true,
      include_solution_ideas: false,
      knowledge_coverage: 5,
      random_seed: null
    });

    // 题型分布
    const typeDistribution = ref([
      { question_category_id: null, percentage: 30, count: 0, score_per_question: 2, fixed: false },
      { question_category_id: null, percentage: 30, count: 0, score_per_question: 3, fixed: false },
      { question_category_id: null, percentage: 40, count: 0, score_per_question: 5, fixed: false }
    ]);

    // 批量分值设置
    const batchScoreMode = ref("type");
    const typeScores = reactive({});
    const singleQuestionIndex = ref("");
    const singleQuestionScore = ref(5);
    const allQuestionsScore = ref(5);

    // 数据列表
    const gradeList = ref([]);
    const subjectList = ref([]);
    const questionCategoryList = ref([]);

    // 弹窗状态
    const showAlertModal = ref(false);
    const alertModalTitle = ref("");
    const alertModalMessage = ref("");

    // 试卷上传相关
    const paperTitle = ref("");

    // ==================== 计算属性 ====================
    const totalPercentage = computed(() => {
      if (distributionMode.value === 'percentage') {
        return typeDistribution.value.reduce((sum, item) => sum + (item.percentage || 0), 0);
      }
      return 0;
    });

    const totalCount = computed(() => {
      if (distributionMode.value === 'count') {
        return typeDistribution.value.reduce((sum, item) => sum + (item.count || 0), 0);
      }
      return 0;
    });

    const expectedTotalScore = computed(() => {
      return typeDistribution.value.reduce((sum, item) => {
        if (distributionMode.value === 'percentage') {
          const count = calculateExpectedCount(item);
          return sum + (count * (item.score_per_question || 0));
        } else {
          return sum + ((item.count || 0) * (item.score_per_question || 0));
        }
      }, 0);
    });

    const difficultyError = computed(() => {
      const total = Object.values(autoConfig.difficulty_distribution).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        return `难度分布总和应为100%，当前为${total}%`;
      }
      return null;
    });

    const totalScore = computed(() => {
      return selectedQuestions.value.reduce((sum, q) => {
        const score = Number(q.score) || 0;
        return sum + (isNaN(score) ? 0 : score);
      }, 0);
    });

    const getAverageDifficulty = computed(() => {
      if (selectedQuestions.value.length === 0) return 0;
      const sum = selectedQuestions.value.reduce(
        (total, q) => total + (q.difficulty_level || 0),
        0
      );
      return sum / selectedQuestions.value.length;
    });

    const availableQuestionTypes = computed(() => {
      const types = new Set();
      selectedQuestions.value.forEach((q) => {
        const type = getQuestionCategoryName(q.question_category_id);
        types.add(type);
      });
      return Array.from(types);
    });

    const canUpload = computed(() => {
      return (
        paperTitle.value.trim() &&
        !isUploading.value
      );
    });

    const getAffectedQuestionCount = computed(() => {
      if (batchScoreMode.value === "all") {
        return selectedQuestions.value.length;
      } else if (batchScoreMode.value === "type") {
        return selectedQuestions.value.length;
      } else if (batchScoreMode.value === "single") {
        if (!singleQuestionIndex.value.trim()) return 0;
        return getQuestionIndicesFromString(singleQuestionIndex.value).length;
      }
      return 0;
    });

    const getTypeScoreTotal = computed(() => {
      if (batchScoreMode.value !== "type") return 0;

      let total = 0;
      selectedQuestions.value.forEach((q) => {
        const type = getQuestionCategoryName(q.question_category_id);
        const score = typeScores[type] || 0;
        total += score;
      });
      return total;
    });

    // ==================== 方法 ====================
    const calculateExpectedCount = (item) => {
      if (!item.percentage || !autoConfig.total_questions) return 0;
      return Math.round(autoConfig.total_questions * item.percentage / 100);
    };

    const calculateExpectedScore = (item) => {
      const count = calculateExpectedCount(item);
      return count * (item.score_per_question || 0);
    };

    const updateTypeDistribution = () => {
      if (distributionMode.value === 'count') {
        typeDistribution.value.forEach(item => {
          if (autoConfig.total_questions > 0) {
            item.percentage = Math.round((item.count / autoConfig.total_questions) * 100);
          }
        });
      } else {
        typeDistribution.value.forEach(item => {
          item.count = calculateExpectedCount(item);
        });
      }
    };

    const updateDifficultyDistribution = () => {
      const total = Object.values(autoConfig.difficulty_distribution).reduce((a, b) => a + b, 0);
      if (total > 100) {
        Object.keys(autoConfig.difficulty_distribution).forEach(level => {
          autoConfig.difficulty_distribution[level] = Math.round(
            autoConfig.difficulty_distribution[level] * 100 / total
          );
        });
      }
    };

    const addTypeDistribution = () => {
      typeDistribution.value.push({
        question_category_id: null,
        percentage: 0,
        count: 0,
        score_per_question: 2,
        fixed: false
      });
    };

    const removeTypeDistribution = (index) => {
      typeDistribution.value.splice(index, 1);
    };

    const resetTypeDistribution = () => {
      typeDistribution.value = [
        { question_category_id: null, percentage: 30, count: 0, score_per_question: 2, fixed: false },
        { question_category_id: null, percentage: 30, count: 0, score_per_question: 3, fixed: false },
        { question_category_id: null, percentage: 40, count: 0, score_per_question: 5, fixed: false }
      ];
      updateTypeDistribution();
    };

    const autoDistributeRemaining = () => {
      const remaining = autoConfig.total_questions - totalCount.value;
      if (remaining <= 0) return;

      const validItems = typeDistribution.value.filter(item => item.question_category_id);
      if (validItems.length === 0) {
        showAlert("提示", "请先配置题型");
        return;
      }

      const perItem = Math.floor(remaining / validItems.length);
      let extra = remaining % validItems.length;

      validItems.forEach(item => {
        item.count += perItem;
        if (extra > 0) {
          item.count += 1;
          extra--;
        }
      });

      updateTypeDistribution();
    };

    const resetAutoConfig = () => {
      autoConfig.paper_name = '智能组卷试卷';
      autoConfig.grade_id = null;
      autoConfig.subject_id = null;
      autoConfig.total_questions = 20;
      autoConfig.total_score = 100;
      autoConfig.difficulty_distribution = {
        1: 10,
        2: 20,
        3: 40,
        4: 20,
        5: 10,
      };
      autoConfig.avoid_duplicate_knowledge = true;
      autoConfig.include_solution_ideas = false;
      autoConfig.knowledge_coverage = 5;
      autoConfig.random_seed = null;
      
      resetTypeDistribution();
    };

    const getQuestionIndicesFromString = (str) => {
      if (!str.trim()) return [];

      const indices = new Set();
      const parts = str.split(",");

      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.includes("-")) {
          const [start, end] = trimmed.split("-").map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              indices.add(i - 1);
            }
          }
        } else {
          const num = Number(trimmed);
          if (!isNaN(num)) {
            indices.add(num - 1);
          }
        }
      });

      return Array.from(indices).filter(
        (index) => index >= 0 && index < selectedQuestions.value.length
      );
    };

    const getTypeCount = (type) => {
      return selectedQuestions.value.filter(
        (q) => getQuestionCategoryName(q.question_category_id) === type
      ).length;
    };

    const applyBatchScores = () => {
      if (batchScoreMode.value === "all") {
        selectedQuestions.value.forEach((q) => {
          q.score = allQuestionsScore.value;
          q.scoreError = "";
        });
      } else if (batchScoreMode.value === "type") {
        selectedQuestions.value.forEach((q) => {
          const type = getQuestionCategoryName(q.question_category_id);
          if (typeScores[type] !== undefined) {
            q.score = typeScores[type];
            q.scoreError = "";
          }
        });
      } else if (batchScoreMode.value === "single") {
        const indices = getQuestionIndicesFromString(singleQuestionIndex.value);
        indices.forEach((index) => {
          if (index >= 0 && index < selectedQuestions.value.length) {
            selectedQuestions.value[index].score = singleQuestionScore.value;
            selectedQuestions.value[index].scoreError = "";
          }
        });
      }

      showAlert("设置成功", "分值已更新");
      closeBatchScoreModal();
    };

    const closeBatchScoreModal = () => {
      showBatchScoreModal.value = false;
      batchScoreMode.value = "type";
      singleQuestionIndex.value = "";
      singleQuestionScore.value = 5;
      allQuestionsScore.value = 5;
    };

    const generatePaper = async () => {
      if (!autoConfig.paper_name.trim()) {
        showAlert("错误", "请输入试卷标题");
        return;
      }

      if (!autoConfig.grade_id) {
        showAlert("错误", "请选择年级");
        return;
      }

      if (!autoConfig.subject_id) {
        showAlert("错误", "请选择科目");
        return;
      }

      if (autoConfig.total_questions <= 0) {
        showAlert("错误", "总题数必须大于0");
        return;
      }

      if (autoConfig.total_score <= 0) {
        showAlert("错误", "试卷总分必须大于0");
        return;
      }

      const validItems = typeDistribution.value.filter(item => item.question_category_id);
      if (validItems.length === 0) {
        showAlert("错误", "请至少配置一种题型");
        return;
      }

      if (distributionMode.value === 'percentage' && totalPercentage.value !== 100) {
        showAlert("错误", "题型占比总和必须为100%");
        return;
      }

      if (distributionMode.value === 'count' && totalCount.value !== autoConfig.total_questions) {
        showAlert("错误", "题型题数总和必须等于总题数");
        return;
      }

      if (difficultyError.value) {
        showAlert("错误", difficultyError.value);
        return;
      }

      isGenerating.value = true;

      try {
        const questionDistribution = typeDistribution.value
          .filter(item => item.question_category_id)
          .map(item => ({
            question_category_id: Number(item.question_category_id),
            count: distributionMode.value === 'count' ? item.count : calculateExpectedCount(item),
            score_per_question: item.score_per_question || 0
          }));

        const validDistribution = questionDistribution.filter(item => item.count > 0);

        if (validDistribution.length === 0) {
          showAlert("错误", "请配置有效的题型分布");
          return;
        }

        const payload = {
          name: autoConfig.paper_name,
          grade_id: Number(autoConfig.grade_id),
          subject_id: Number(autoConfig.subject_id),
          total_questions: autoConfig.total_questions,
          total_score: autoConfig.total_score,
          question_distribution: validDistribution,
          difficulty_distribution: autoConfig.difficulty_distribution,
          avoid_duplicate_knowledge: autoConfig.avoid_duplicate_knowledge,
          include_solution_ideas: autoConfig.include_solution_ideas,
          knowledge_coverage: autoConfig.knowledge_coverage,
          random_seed: autoConfig.random_seed
        };

        const res = await axios.post(`${API_BASE}/paper/autoCreatePaper`, payload);
        
        if (res.data.code === 200) {
          const questions = res.data.data?.questions || [];
          const questionsWithScores = questions.map(q => ({
            ...q,
            score: validDistribution.find(d => d.question_category_id === q.question_category_id)?.score_per_question || 5,
            scoreError: ""
          }));
          
          selectedQuestions.value = questionsWithScores;
          currentMode.value = 'preview';
          
          showAlert("成功", `已生成${questions.length}道题目`);
        } else {
          throw new Error(res.data.message || "生成试卷失败");
        }
      } catch (err) {
        console.error("生成试卷失败:", err);
        showAlert("生成失败", err.response?.data?.message || err.message || "生成试卷失败");
      } finally {
        isGenerating.value = false;
      }
    };

    const regeneratePaper = async () => {
      await generatePaper();
    };

    // ==================== 通用方法 ====================
    const showAlert = (title, message) => {
      alertModalTitle.value = title;
      alertModalMessage.value = message;
      showAlertModal.value = true;
    };

    const closeAlertModal = () => {
      showAlertModal.value = false;
    };

    const renderMarkdown = (text) => {
      if (!text) return "";
      return marked(text);
    };

    const getQuestionCategoryName = (id) => {
      if (id === null) return "-";
      const item = questionCategoryList.value.find((c) => c.id === Number(id));
      return item ? item.name : "-";
    };

    const getGradeName = (id) => {
      if (id === null) return "-";
      const grade = gradeList.value.find((g) => g.id === Number(id));
      return grade ? grade.name : "-";
    };

    const getSubjectName = (id) => {
      if (id === null) return "-";
      const subject = subjectList.value.find((s) => s.id === Number(id));
      return subject ? subject.name : "-";
    };

    // ==================== 试卷操作方法 ====================
    const removeFromPaper = (questionId) => {
      selectedQuestions.value = selectedQuestions.value.filter(
        (q) => q.id !== questionId
      );
    };

    const moveQuestionUp = (index) => {
      if (index <= 0) return;
      const temp = selectedQuestions.value[index];
      selectedQuestions.value[index] = selectedQuestions.value[index - 1];
      selectedQuestions.value[index - 1] = temp;
    };

    const moveQuestionDown = (index) => {
      if (index >= selectedQuestions.value.length - 1) return;
      const temp = selectedQuestions.value[index];
      selectedQuestions.value[index] = selectedQuestions.value[index + 1];
      selectedQuestions.value[index + 1] = temp;
    };

    const clearPaper = () => {
      selectedQuestions.value = [];
      showAlert("清空成功", "试卷已清空");
    };

    const exportPaper = () => {
      if (selectedQuestions.value.length === 0) {
        showAlert("导出失败", "试卷为空，无法导出");
        return;
      }
      showAlert("导出成功", "试卷导出功能待实现");
    };

    const uploadPaper = () => {
      if (selectedQuestions.value.length === 0) {
        showAlert("上传失败", "试卷为空，无法上传");
        return;
      }

      const hasInvalidScores = selectedQuestions.value.some(
        (q) => q.score === undefined || q.score === null || q.score === "" || q.scoreError
      );

      if (hasInvalidScores) {
        showAlert("上传失败", "请先设置所有题目的分数");
        return;
      }

      showUploadModal.value = true;
      paperTitle.value = autoConfig.paper_name;
    };

    const closeUploadModal = () => {
      showUploadModal.value = false;
      paperTitle.value = "";
    };

    const confirmUpload = async () => {
      if (!canUpload.value) return;

      isUploading.value = true;

      try {
        const questions = selectedQuestions.value.map((q) => q.id);
        const scores = selectedQuestions.value.map((q) => Number(q.score) || 0);

        const payload = {
          name: paperTitle.value.trim(),
          subject_id: autoConfig.subject_id,
          grade_id: autoConfig.grade_id,
          question_count: selectedQuestions.value.length,
          total_score: totalScore.value,
          questions,
          scores,
        };

        await axios.post(`${API_BASE}/paper/createPaper`, payload);

        showAlert("上传成功", "试卷已成功创建");
        closeUploadModal();
      } catch (err) {
        console.error(err);
        showAlert("上传失败", err.response?.data?.message || "试卷上传失败");
      } finally {
        isUploading.value = false;
      }
    };

    const getQuestionTypeCount = (type) => {
      if (type === "选择题") {
        return selectedQuestions.value.filter((q) => {
          const categoryName = getQuestionCategoryName(q.question_category_id);
          return (
            categoryName === "单选题" ||
            categoryName.includes("单选") ||
            categoryName === "多选题" ||
            categoryName.includes("多选")
          );
        }).length;
      } else if (type === "主观题") {
        return selectedQuestions.value.filter((q) => {
          const categoryName = getQuestionCategoryName(q.question_category_id);
          return !(
            categoryName === "单选题" ||
            categoryName.includes("单选") ||
            categoryName === "多选题" ||
            categoryName.includes("多选")
          );
        }).length;
      }
      return 0;
    };

    const validateScore = (question, event) => {
      const value = event.target.value;
      const numValue = Number(value);

      if (value === "") {
        question.scoreError = "分数不能为空";
      } else if (isNaN(numValue)) {
        question.scoreError = "请输入有效的数字";
      } else if (numValue < 0) {
        question.scoreError = "分数不能为负数";
      } else if (numValue > 100) {
        question.scoreError = "单题分数不能超过100分";
      } else if (!Number.isInteger(numValue) && numValue % 0.5 !== 0) {
        question.scoreError = "分数应为整数或0.5的倍数";
      } else {
        question.scoreError = "";
      }
    };

    const formatScore = (question) => {
      if (
        question.score === undefined ||
        question.score === null ||
        question.score === ""
      ) {
        question.score = 0;
      } else {
        const numValue = Number(question.score);
        question.score = Math.round(numValue * 2) / 2;
        if (question.score < 0) question.score = 0;
        if (question.score > 100) question.score = 100;
      }
      question.scoreError = "";
    };

    // ==================== 生命周期钩子 ====================
    onMounted(() => {
      loadLists();
      updateTypeDistribution();
    });

    const loadLists = async () => {
      try {
        const [g, sub, qc] = await Promise.all([
          axios.get(`${API_BASE}/questions/getGradeList`),
          axios.get(`${API_BASE}/questions/getSubjectList`),
          axios.get(`${API_BASE}/questions/getQuestionCategoryList`),
        ]);

        gradeList.value = Object.entries(g.data.data || {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }));

        subjectList.value = Object.entries(sub.data.data || {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }));

        questionCategoryList.value = Object.entries(
          qc.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));
      } catch (err) {
        console.error("获取列表失败:", err);
        showAlert("加载失败", "获取列表失败");
      }
    };

    const goBack = () => {
      router.go(-1);
    };

    // 监听总题数变化
    watch(() => autoConfig.total_questions, () => {
      updateTypeDistribution();
    });

    // 监听分布模式变化
    watch(distributionMode, () => {
      updateTypeDistribution();
    });

    return {
      // 状态
      currentMode,
      selectedQuestions,
      showUploadModal,
      showBatchScoreModal,
      isGenerating,
      isUploading,
      distributionMode,
      autoConfig,
      typeDistribution,
      batchScoreMode,
      typeScores,
      singleQuestionIndex,
      singleQuestionScore,
      allQuestionsScore,
      
      // 数据列表
      gradeList,
      subjectList,
      questionCategoryList,
      
      // 弹窗状态
      showAlertModal,
      alertModalTitle,
      alertModalMessage,
      
      // 试卷上传
      paperTitle,
      
      // 计算属性
      totalPercentage,
      totalCount,
      expectedTotalScore,
      difficultyError,
      totalScore,
      getAverageDifficulty,
      availableQuestionTypes,
      canUpload,
      getAffectedQuestionCount,
      getTypeScoreTotal,
      
      // 自动组题方法
      calculateExpectedCount,
      calculateExpectedScore,
      updateTypeDistribution,
      updateDifficultyDistribution,
      addTypeDistribution,
      removeTypeDistribution,
      resetTypeDistribution,
      autoDistributeRemaining,
      resetAutoConfig,
      generatePaper,
      regeneratePaper,
      getQuestionIndicesFromString,
      getTypeCount,
      applyBatchScores,
      closeBatchScoreModal,
      
      // 通用方法
      showAlert,
      closeAlertModal,
      renderMarkdown,
      getQuestionCategoryName,
      getGradeName,
      getSubjectName,
      
      // 试卷操作方法
      removeFromPaper,
      moveQuestionUp,
      moveQuestionDown,
      clearPaper,
      exportPaper,
      uploadPaper,
      closeUploadModal,
      confirmUpload,
      getQuestionTypeCount,
      validateScore,
      formatScore,
      
      // 其他
      goBack,
    };
  },
};
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

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(5px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateX(-2px);
}

.back-icon {
  font-size: 16px;
}

/* ==================== 模式选择器样式 ==================== */
.mode-selector {
  margin-bottom: 30px;
}

.mode-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s;
}

.mode-tab.active {
  background: #409eff;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.mode-tab:hover:not(.active) {
  background: #f5f7fa;
}

.question-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
}

.mode-tab:not(.active) .question-count {
  background: #e6e9f0;
  color: #606266;
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

.title-icon {
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
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
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #f4f4f5;
  color: #606266;
  border: 1px solid #d3d4d6;
  padding: 10px 20px;
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

.btn-delete {
  background-color: #f56c6c;
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
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
}

.btn-delete:hover {
  background-color: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background-color: white;
  color: #606266;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-icon:hover {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.btn-icon.success {
  color: #67c23a;
}

.btn-icon.success:hover {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.btn-icon.danger {
  color: #f56c6c;
}

.btn-icon.danger:hover {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

/* ==================== 表单控件样式 ==================== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

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

.input-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* ==================== 自动组题样式 ==================== */
.auto-create-config {
  margin-bottom: 24px;
}

.config-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e6e9f0;
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.config-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 分布模式选择 */
.distribution-controls {
  margin-bottom: 20px;
}

.distribution-mode {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.radio-text {
  font-size: 14px;
  color: #606266;
}

/* 题型分布列表 */
.type-distribution-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.distribution-item {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e6e9f0;
  transition: all 0.3s;
}

.distribution-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.distribution-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 15px;
  align-items: center;
}

.type-select {
  min-width: 200px;
}

.distribution-input,
.score-input {
  position: relative;
}

.distribution-input .form-input,
.score-input .form-input {
  padding-right: 40px;
  text-align: right;
}

.input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 14px;
}

.distribution-actions {
  display: flex;
  gap: 8px;
}

.distribution-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e6e9f0;
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value {
  font-weight: 600;
  color: #409eff;
}

/* 分布统计 */
.distribution-summary {
  display: flex;
  gap: 30px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
  margin-bottom: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #606266;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

/* 自动分配按钮 */
.auto-distribute {
  text-align: center;
  margin-top: 15px;
}

.auto-distribute .btn-secondary {
  padding: 8px 16px;
  font-size: 14px;
}

/* 难度分布 */
.difficulty-distribution {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.difficulty-level {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e6e9f0;
}

.difficulty-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.difficulty-stars {
  display: flex;
  gap: 2px;
}

.difficulty-label {
  font-weight: 500;
  color: #303133;
}

.difficulty-slider {
  display: flex;
  align-items: center;
  gap: 15px;
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e6e9f0;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #409eff;
}

.difficulty-summary {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
}

.difficulty-summary.has-error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.error-text {
  color: #f56c6c;
  font-size: 14px;
}

/* 高级选项 */
.advanced-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.checkbox-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 26px;
}

/* 配置预览 */
.config-preview {
  margin-top: 30px;
  background-color: #f9fafb;
  border-color: #e6e9f0;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #e6e9f0;
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-label {
  min-width: 100px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.preview-value {
  flex: 1;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

/* ==================== 试卷预览样式 ==================== */
.paper-preview-section .paper-header {
  margin-bottom: 24px;
}

.paper-actions {
  display: flex;
  gap: 12px;
}

.paper-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 试卷统计 */
.paper-stats {
  margin-bottom: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
  transition: all 0.3s;
}

.stat-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.stat-label {
  font-weight: 500;
  color: #606266;
}

.stat-value {
  font-weight: 600;
  color: #409eff;
  font-size: 18px;
}

/* 试卷题目列表 */
.paper-questions {
  margin-bottom: 30px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paper-question {
  display: flex;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
  gap: 15px;
}

.paper-question:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.question-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.question-number {
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
  text-align: center;
}

.score-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.score-label {
  font-size: 13px;
  color: #000000;
}

.score-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  transition: all 0.3s;
}

.score-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.score-input.score-error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.score-error-text {
  font-size: 12px;
  color: #f56c6c;
  text-align: center;
  max-width: 80px;
}

.question-answer {
  margin-top: 10px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.answer-label {
  font-weight: 500;
  color: #409eff;
  margin-bottom: 5px;
}

.answer-text {
  line-height: 1.5;
  color: #303133;
}

.paper-question .question-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.paper-question .question-actions button {
  padding: 6px 12px;
  font-size: 12px;
}

/* 空试卷提示 */
.empty-paper {
  text-align: center;
  padding: 60px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

.empty-content p {
  margin: 0;
  font-size: 16px;
  color: #909399;
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
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
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-title {
  margin-bottom: 24px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.modal-actions button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

/* 统一弹窗提示 */
.alert-modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: modalAppear 0.3s ease-out;
}

.alert-modal-title {
  margin-bottom: 20px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.alert-modal-message {
  margin-bottom: 30px;
  color: #606266;
  font-size: 18px;
  line-height: 1.5;
}

.alert-modal-actions {
  display: flex;
  justify-content: center;
}

/* 批量设置分值样式 */
.batch-score-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.batch-score-group {
  margin-bottom: 10px;
}

.type-score-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.type-score-label {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.type-score-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.type-score-count {
  font-size: 12px;
  color: #909399;
  width: 60px;
  text-align: right;
}

.single-score-setting,
.all-score-setting {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .config-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .mode-tabs {
    flex-direction: column;
  }
  
  .card {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .distribution-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .type-select {
    min-width: auto;
  }
  
  .distribution-summary {
    flex-direction: column;
    gap: 15px;
  }
  
  .advanced-options {
    grid-template-columns: 1fr;
  }
  
  .preview-row {
    flex-direction: column;
    gap: 4px;
  }
  
  .preview-label {
    min-width: auto;
  }
  
  .paper-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .paper-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .paper-question {
    flex-direction: column;
  }
  
  .question-left {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
  }
  
  .question-number {
    margin-bottom: 0;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content,
  .alert-modal-content {
    padding: 30px 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .distribution-mode {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>