<template>
  <div class="result-container">
    <!-- 头部信息 -->
    <div class="result-header">
      <div class="header-content">
        <h1 class="page-title">{{ examName || "考试成绩查看" }}</h1>
        <div class="header-actions">
          <button class="btn-primary" @click="showChartDialog">查看图表</button>
          <button class="btn-secondary" @click="goBack">返回</button>
        </div>
      </div>
      <div class="result-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#409eff"
                  stroke-width="2"
                />
                <path
                  d="M12 6V12L16 14"
                  stroke="#409eff"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="card-content">
              <div class="card-label">总分</div>
              <div class="card-value">{{ totalScore }} / {{ maxScore }}</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                  stroke="#67c23a"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M22 4L12 14.01L9 11.01"
                  stroke="#67c23a"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="card-content">
              <div class="card-label">正确率</div>
              <div class="card-value">{{ accuracy }}%</div>
            </div>
          </div>

          <!-- 考试时间 -->
          <div class="summary-card">
            <div class="card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 10H3M16 2V6M8 2V6M10.5 14L12 13V18M10.75 18H13.25M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                  stroke="#e6a23c"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="card-content">
              <div class="card-label">考试时间</div>
              <div class="card-value">
                <div class="time-item">
                  <span class="time-label">开始：</span>
                  <span class="time-value">{{ formatDate(startTime) }}</span>
                </div>
                <div class="time-item" style="margin-top: 4px">
                  <span class="time-label">结束：</span>
                  <span class="time-value">{{ formatDate(submitTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="#909399"
                  stroke-width="2"
                />
                <path
                  d="M3 21L3.52439 17.9024C3.81989 16.0764 5.35368 14.7143 7.19935 14.7143H16.8007C18.6463 14.7143 20.1801 16.0764 20.4756 17.9024L21 21"
                  stroke="#909399"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="card-content">
              <div class="card-label">批改老师</div>
              <div class="card-value">{{ examiner }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表弹窗 -->
    <div
      v-if="chartDialogVisible"
      class="chart-dialog-overlay"
      @click.self="closeChartDialog"
    >
      <div class="chart-dialog">
        <div class="chart-dialog-header">
          <h2>{{ examName }} - 考试分析图表</h2>
          <button class="close-btn" @click="closeChartDialog">×</button>
        </div>
        <div class="chart-dialog-content">
          <!-- 图表导航 -->
          <div class="chart-tabs">
            <button
              v-for="tab in chartTabs"
              :key="tab.id"
              :class="['chart-tab', { active: activeChartTab === tab.id }]"
              @click="activeChartTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- 图表内容区 -->
          <div class="charts-container">
            <!-- 总体得分分布 -->
            <div v-show="activeChartTab === 'overall'" class="chart-section">
              <div class="chart-card">
                <h3>总体得分分析</h3>
                <div class="chart-wrapper">
                  <canvas ref="overallScoreChart"></canvas>
                </div>
                <div class="chart-summary">
                  <div class="summary-item">
                    <span class="label">总分：</span>
                    <span class="value">{{ totalScore }} / {{ maxScore }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">正确率：</span>
                    <span class="value">{{ accuracy }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 题型分析 -->
            <div v-show="activeChartTab === 'type'" class="chart-section">
              <div class="chart-grid">
                <div class="chart-card">
                  <h3>各题型得分率</h3>
                  <div class="chart-wrapper">
                    <canvas ref="typeScoreChart"></canvas>
                  </div>
                </div>
                <div class="chart-card">
                  <h3>题型分布</h3>
                  <div class="chart-wrapper">
                    <canvas ref="typeDistributionChart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- 难度分析 -->
            <div v-show="activeChartTab === 'difficulty'" class="chart-section">
              <div class="chart-grid">
                <div class="chart-card">
                  <h3>各难度得分率</h3>
                  <div class="chart-wrapper">
                    <canvas ref="difficultyScoreChart"></canvas>
                  </div>
                </div>
                <div class="chart-card">
                  <h3>难度分布</h3>
                  <div class="chart-wrapper">
                    <canvas ref="difficultyDistributionChart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- 题目得分详情 -->
            <div v-show="activeChartTab === 'details'" class="chart-section">
              <div class="chart-card">
                <h3>每题得分详情</h3>
                <div class="chart-wrapper">
                  <canvas ref="questionScoreChart"></canvas>
                </div>
                <div class="question-detail-table">
                  <table>
                    <thead>
                      <tr>
                        <th>题号</th>
                        <th>题型</th>
                        <th>难度</th>
                        <th>满分</th>
                        <th>得分</th>
                        <th>得分率</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(q, index) in questionDetails" :key="index">
                        <td>第{{ index + 1 }}题</td>
                        <td>{{ getQuestionType(q.question_category_id) }}</td>
                        <td>
                          <span class="difficulty-stars">
                            <span
                              v-for="i in maxDifficulty"
                              :key="i"
                              class="star"
                              :class="{ active: i <= q.difficulty_level }"
                            >
                              ★
                            </span>
                          </span>
                        </td>
                        <td>{{ q.fullScore }}分</td>
                        <td>{{ q.score }}分</td>
                        <td>
                          <span :class="getScoreRateClass(q.scoreRate)">
                            {{ q.scoreRate }}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="chart-dialog-footer">
          <button class="btn-primary" @click="closeChartDialog">关闭</button>
        </div>
      </div>
    </div>

    <!-- 考试总评 -->
    <div v-if="overallComment && overallComment.trim() !== ''" class="overall-comment">
      <div class="comment-section">
        <div class="section-header">
          <h3>考试总评</h3>
        </div>
        <div class="comment-content">
          {{ overallComment }}
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="result-content" v-if="resultData">
      <!-- 左侧：题目列表 -->
      <div class="left-panel">
        <div class="questions-sidebar">
          <div class="sidebar-header">
            <h3>题目列表</h3>
            <div class="result-info">
              <div class="correct-count">
                正确：{{ correctCount }} / {{ totalQuestions }}
              </div>
            </div>
          </div>

          <div class="question-nav">
            <div
              class="question-nav-item"
              v-for="(question, index) in resultData.questions"
              :key="index"
              :class="{
                active: currentQuestionIndex === index,
                'score-excellent': getScorePercentage(index) >= 80,
                'score-good':
                  getScorePercentage(index) >= 60 && getScorePercentage(index) < 80,
                'score-average':
                  getScorePercentage(index) >= 40 && getScorePercentage(index) < 60,
                'score-poor': getScorePercentage(index) < 40,
              }"
              @click="selectQuestion(index)"
            >
              <div class="nav-number">第{{ index + 1 }}题</div>
              <div class="nav-status">
                <span class="nav-score">{{ getQuestionScore(index) }}分</span>
                <span class="nav-result">
                  {{ getQuestionResultIcon(index) }} {{ getStudentScore(index) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：题目详情和答案 -->
      <div class="middle-panel">
        <div class="question-detail">
          <!-- 题目内容 -->
          <div class="question-section">
            <div class="section-header">
              <h3>题目内容</h3>
              <div class="question-meta">
                <span class="meta-item"
                  >题型：{{ getQuestionType(currentQuestion.question_category_id) }}</span
                >
                <span class="meta-item difficulty">
                  难度：
                  <span class="stars">
                    <span
                      v-for="i in maxDifficulty"
                      :key="i"
                      class="star"
                      :class="{ active: i <= currentQuestion.difficulty_level }"
                    >
                      ★
                    </span>
                  </span>
                </span>
                <span class="meta-item"
                  >分值：{{ getQuestionScore(currentQuestionIndex) }}分</span
                >
              </div>
            </div>

            <div class="question-body">
              <div
                class="question-title"
                v-html="markdownToHtml(currentQuestion.title)"
              ></div>

              <!-- 选择题选项 -->
              <div
                v-if="
                  [1, 2].includes(currentQuestion.question_category_id) &&
                  currentQuestion.options
                "
                class="question-options"
              >
                <div
                  v-for="(option, key) in currentQuestion.options"
                  :key="key"
                  class="option-item"
                  :class="{
                    'correct-option': isCorrectOption(key),
                    'selected-option': isSelectedOption(key),
                  }"
                >
                  <span class="option-label">{{ key }}.</span>
                  <span class="option-content" v-html="markdownToHtml(option)"></span>
                  <span v-if="isCorrectOption(key)" class="option-mark"> ✓ </span>
                  <span
                    v-if="isSelectedOption(key) && !isCorrectOption(key)"
                    class="option-mark wrong"
                  >
                    ✗
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 学生答案 -->
          <div class="answer-section">
            <div class="section-header">
              <h3>我的答案</h3>
              <div class="answer-score">
                <span class="score-label">得分：</span>
                <span
                  class="score-value"
                  :class="getScoreClass(getStudentScore(currentQuestionIndex))"
                >
                  {{ getStudentScore(currentQuestionIndex) }} /
                  {{ getQuestionScore(currentQuestionIndex) }}
                </span>
              </div>
            </div>

            <div class="answer-content">
              <div
                v-if="
                  currentAnswer.student_answer &&
                  currentAnswer.student_answer !== '未作答'
                "
              >
                <div v-if="currentAnswer.image_url" class="answer-with-image">
                  <div
                    class="text-answer"
                    v-html="markdownToHtml(currentAnswer.student_answer)"
                  ></div>
                  <div class="image-answer">
                    <img
                      :src="currentAnswer.image_url"
                      alt="我的作答"
                      class="answer-image"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="text-answer"
                  v-html="markdownToHtml(currentAnswer.student_answer)"
                ></div>
              </div>
              <div v-else class="no-answer">
                <span class="no-answer-text">未作答</span>
              </div>
            </div>

            <!-- 老师评语 -->
            <div v-if="currentAnswer.feedback" class="teacher-feedback">
              <div class="feedback-header">
                <h4>老师评语</h4>
              </div>
              <div class="feedback-content">
                {{ currentAnswer.feedback }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：参考答案和解析 -->
      <div class="right-panel">
        <div class="reference-panel">
          <!-- 参考答案 -->
          <div class="reference-answer">
            <div class="section-header">
              <h3>参考答案</h3>
            </div>
            <div
              class="answer-content"
              v-html="markdownToHtml(currentQuestion.answer)"
            ></div>
          </div>

          <!-- 题目解析 -->
          <div class="question-analysis">
            <div class="section-header">
              <h3>题目解析</h3>
            </div>
            <div
              class="analysis-content"
              v-html="markdownToHtml(currentQuestion.notes)"
            ></div>
          </div>

          <!-- 知识点 -->
          <div
            v-if="
              currentQuestion.sub_knowledge_point_ids &&
              currentQuestion.sub_knowledge_point_ids.length > 0
            "
            class="knowledge-points"
          >
            <div class="section-header">
              <h3>相关知识点</h3>
            </div>
            <div class="points-list">
              <span
                v-for="pointId in currentQuestion.sub_knowledge_point_ids"
                :key="pointId"
                class="point-tag"
                :class="getKnowledgePointClass(pointId)"
              >
                {{ getKnowledgePointName(pointId) }}
              </span>
            </div>
          </div>

          <!-- 错题总结 -->
          <div
            v-if="getScorePercentage(currentQuestionIndex) < 100"
            class="mistake-summary"
          ></div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在加载考试结果...</p>
      </div>
    </div>

    <!-- 未批改状态 -->
    <div v-else-if="!resultData && !loading" class="not-graded-container">
      <div class="not-graded-content">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="#e6a23c"
            stroke-width="2"
          />
          <path d="M12 8V12" stroke="#e6a23c" stroke-width="2" stroke-linecap="round" />
          <path
            d="M12 16H12.01"
            stroke="#e6a23c"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <h3>试卷尚未批改</h3>
        <p>老师正在批改您的试卷，请耐心等待...</p>
        <button class="btn-primary" @click="loadResultData">刷新状态</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";
import { ElMessage } from "element-plus";
import Chart from "chart.js/auto";

const route = useRoute();
const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ==================== 图表相关变量 ====================
const chartDialogVisible = ref(false);
const activeChartTab = ref("overall");
const chartTabs = [
  { id: "overall", label: "总体得分" },
  { id: "type", label: "题型分析" },
  { id: "difficulty", label: "难度分析" },
  { id: "details", label: "题目详情" },
];

// Chart.js 实例引用
const overallScoreChart = ref(null);
const typeScoreChart = ref(null);
const typeDistributionChart = ref(null);
const difficultyScoreChart = ref(null);
const difficultyDistributionChart = ref(null);
const questionScoreChart = ref(null);

// Chart.js 实例存储
let chartInstances = {
  overallScore: null,
  typeScore: null,
  typeDistribution: null,
  difficultyScore: null,
  difficultyDistribution: null,
  questionScore: null,
};

// ==================== 数据状态 ====================
const examId = ref(route.query.examId);
const examName = ref("");
const loading = ref(false);
const resultData = ref(null);
const knowledgePoints = ref({});
const currentQuestionIndex = ref(0);
const maxDifficulty = ref(5);
const examHistory = ref(null);

// ==================== 计算属性 ====================
// 当前题目
const currentQuestion = computed(() => {
  if (!resultData.value?.questions || resultData.value.questions.length === 0) {
    return {};
  }
  return resultData.value.questions[currentQuestionIndex.value] || {};
});

// 当前答案
const currentAnswer = computed(() => {
  if (!resultData.value?.answer_records || resultData.value.answer_records.length === 0) {
    return {};
  }
  return resultData.value.answer_records[currentQuestionIndex.value] || {};
});

// 总题目数
const totalQuestions = computed(() => {
  return resultData.value?.questions?.length || 0;
});

// 总分 - 直接从examHistory获取，不再计算
const totalScore = computed(() => {
  // 优先使用examHistory中的总分
  if (examHistory.value && examHistory.value.total_score !== undefined) {
    console.log(
      "使用examHistory总分:",
      examHistory.value.total_score,
      "examHistory数据:",
      examHistory.value
    );
    return examHistory.value.total_score;
  }

  // 如果examHistory没有，尝试使用resultData中的total_score
  if (resultData.value && resultData.value.total_score !== undefined) {
    console.log("使用resultData总分:", resultData.value.total_score);
    return resultData.value.total_score;
  }

  // 如果都没有，返回0
  console.log("未找到总分，返回0");
  return 0;
});

// 满分 - 从scores数组计算
const maxScore = computed(() => {
  if (!resultData.value?.scores || resultData.value.scores.length === 0) {
    console.log("没有scores数组，从题目计算满分");

    // 如果没有scores数组，就从questions中的分值计算
    if (resultData.value?.questions) {
      const total = resultData.value.questions.reduce((sum, question) => {
        // 每个题目的默认分值
        return (
          sum +
          (question.question_score ||
            resultData.value.scores?.[resultData.value.questions.indexOf(question)] ||
            5)
        );
      }, 0);
      console.log("从题目计算出的满分:", total);
      return total;
    }
    return 0;
  }

  const total = resultData.value.scores.reduce((sum, score) => sum + score, 0);
  console.log("从scores数组计算的满分:", total, "scores:", resultData.value.scores);
  return total;
});

// 学生开始考试时间和结束时间
const startTime = computed(() => {
  if (examHistory.value && examHistory.value.start_time) {
    return examHistory.value.start_time;
  }
  return resultData.value?.created_at || "";
});

const submitTime = computed(() => {
  if (examHistory.value && examHistory.value.submit_time) {
    return examHistory.value.submit_time;
  }
  return "";
});

// 正确率
const accuracy = computed(() => {
  const actualScore = totalScore.value || 0;
  if (maxScore.value === 0) return 0;

  const percentage = Math.round((actualScore / maxScore.value) * 100);
  console.log(`正确率: ${actualScore}/${maxScore.value} = ${percentage}%`);
  return percentage;
});

// 正确题目数（得满分的题目）
const correctCount = computed(() => {
  if (!resultData.value?.answer_records) return 0;

  const count = resultData.value.answer_records.filter((record, index) => {
    const questionScore = getQuestionScore(index);
    return (record?.score || 0) >= questionScore;
  }).length;

  return count;
});

// 批改老师
const examiner = computed(() => {
  if (examHistory.value && examHistory.value.examiner) {
    return examHistory.value.examiner;
  }
  return resultData.value?.examiner || "未指定";
});

// 老师总评语
const overallComment = computed(() => {
  if (examHistory.value && examHistory.value.report_json) {
    return examHistory.value.report_json;
  }
  return resultData.value?.report_json || "";
});

// 是否已批改
const isMarked = computed(() => {
  return examHistory.value?.is_marked === 1;
});

// 获取题型统计数据
const questionTypeStats = computed(() => {
  if (!resultData.value?.questions || !resultData.value?.answer_records) {
    return {};
  }

  const stats = {};
  resultData.value.questions.forEach((question, index) => {
    const typeId = question.question_category_id;
    const typeName = getQuestionType(typeId);
    const score = resultData.value.answer_records[index]?.score || 0;
    const fullScore = getQuestionScore(index);

    if (!stats[typeName]) {
      stats[typeName] = {
        count: 0,
        totalScore: 0,
        totalFullScore: 0,
        questions: [],
      };
    }

    stats[typeName].count++;
    stats[typeName].totalScore += score;
    stats[typeName].totalFullScore += fullScore;
    stats[typeName].questions.push({
      index,
      score,
      fullScore,
      scoreRate: fullScore > 0 ? Math.round((score / fullScore) * 100) : 0,
    });
  });

  return stats;
});

// 获取难度统计数据
const difficultyStats = computed(() => {
  if (!resultData.value?.questions || !resultData.value?.answer_records) {
    return {};
  }

  const stats = {};
  resultData.value.questions.forEach((question, index) => {
    const difficulty = question.difficulty_level || 1;
    const score = resultData.value.answer_records[index]?.score || 0;
    const fullScore = getQuestionScore(index);

    if (!stats[difficulty]) {
      stats[difficulty] = {
        count: 0,
        totalScore: 0,
        totalFullScore: 0,
        questions: [],
      };
    }

    stats[difficulty].count++;
    stats[difficulty].totalScore += score;
    stats[difficulty].totalFullScore += fullScore;
    stats[difficulty].questions.push({
      index,
      score,
      fullScore,
      scoreRate: fullScore > 0 ? Math.round((score / fullScore) * 100) : 0,
    });
  });

  return stats;
});

// 题目详情数据
const questionDetails = computed(() => {
  if (!resultData.value?.questions || !resultData.value?.answer_records) {
    return [];
  }

  return resultData.value.questions.map((question, index) => {
    const score = resultData.value.answer_records[index]?.score || 0;
    const fullScore = getQuestionScore(index);
    const scoreRate = fullScore > 0 ? Math.round((score / fullScore) * 100) : 0;

    return {
      ...question,
      fullScore,
      score,
      scoreRate,
    };
  });
});

// ==================== 图表相关方法 ====================
// 显示图表弹窗
const showChartDialog = () => {
  chartDialogVisible.value = true;
  // 使用 nextTick 确保 DOM 已渲染
  nextTick(() => {
    // 延迟初始化，确保 canvas 元素已准备好
    setTimeout(() => {
      initCurrentTabChart();
    }, 100);
  });
};

// 关闭图表弹窗
const closeChartDialog = () => {
  chartDialogVisible.value = false;
  destroyCharts();
};

// 销毁所有图表
const destroyCharts = () => {
  Object.keys(chartInstances).forEach((key) => {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      chartInstances[key] = null;
    }
  });
};

// 初始化所有图表
const initCurrentTabChart = () => {
  if (!resultData.value) {
    console.warn("没有数据用于初始化图表");
    return;
  }

  try {
    // 根据当前活跃标签初始化对应图表
    switch (activeChartTab.value) {
      case 'overall':
        if (!chartInstances.overallScore) createOverallScoreChart();
        break;
      case 'type':
        if (!chartInstances.typeScore) createTypeAnalysisCharts();
        break;
      case 'difficulty':
        if (!chartInstances.difficultyScore) createDifficultyAnalysisCharts();
        break;
      case 'details':
        if (!chartInstances.questionScore) createQuestionScoreChart();
        break;
    }
  } catch (error) {
    console.error("图表初始化失败:", error);
    ElMessage.error("图表初始化失败: " + error.message);
  }
};

// 创建总体得分图表
const createOverallScoreChart = () => {
  if (!overallScoreChart.value) return;

  const ctx = overallScoreChart.value.getContext("2d");

  const data = {
    labels: ["已得分", "未得分"],
    datasets: [
      {
        data: [totalScore.value, maxScore.value - totalScore.value],
        backgroundColor: ["#67c23a", "#f56c6c"],
        borderWidth: 2,
        borderColor: ["#67c23a", "#f56c6c"],
      },
    ],
  };

  chartInstances.overallScore = new Chart(ctx, {
    type: "doughnut",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value}分 (${percentage}%)`;
            },
          },
        },
      },
    },
  });
};

// 创建题型分析图表
const createTypeAnalysisCharts = () => {
  // 定义统一的颜色方案
  const typeColors = [
    "#409eff", // 蓝色
    "#67c23a", // 绿色
    "#e6a23c", // 黄色
    "#f56c6c", // 红色
    "#909399", // 灰色
    "#b779e1", // 紫色
    "#17becf", // 青色
    "#ff7f0e", // 橙色
  ];

  // 各题型得分率图表
  if (typeScoreChart.value) {
    const typeNames = Object.keys(questionTypeStats.value);
    const scoreRates = typeNames.map((typeName) => {
      const stats = questionTypeStats.value[typeName];
      return stats.totalFullScore > 0
        ? Math.round((stats.totalScore / stats.totalFullScore) * 100)
        : 0;
    });

    const ctx = typeScoreChart.value.getContext("2d");

    chartInstances.typeScore = new Chart(ctx, {
      type: "bar",
      data: {
        labels: typeNames,
        datasets: [
          {
            label: "得分率 (%)",
            data: scoreRates,
            backgroundColor: typeNames.map(
              (_, index) =>
                // 使用原色，或者轻微调整透明度
                `${typeColors[index % typeColors.length]}80`
            ),
            borderColor: typeNames.map(
              (_, index) => typeColors[index % typeColors.length]
            ),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "得分率 (%)",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const typeName = context.label;
                const stats = questionTypeStats.value[typeName];
                return [
                  `得分: ${stats.totalScore}/${stats.totalFullScore}`,
                  `题目数: ${stats.count}题`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // 题型分布图表
  if (typeDistributionChart.value) {
    const typeNames = Object.keys(questionTypeStats.value);
    const typeCounts = typeNames.map(
      (typeName) => questionTypeStats.value[typeName].count
    );

    const ctx = typeDistributionChart.value.getContext("2d");

    chartInstances.typeDistribution = new Chart(ctx, {
      type: "pie",
      data: {
        labels: typeNames,
        datasets: [
          {
            data: typeCounts,
            backgroundColor: typeNames.map(
              (_, index) => typeColors[index % typeColors.length]
            ),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value}题 (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }
};

// 创建难度分析图表
const createDifficultyAnalysisCharts = () => {
  // 定义统一的难度颜色方案（从易到难）
  const difficultyColors = [
    "#67c23a", // 绿色 - 1星难度
    "#95d475", // 浅绿 - 2星难度
    "#e6a23c", // 黄色 - 3星难度
    "#f2b453", // 浅橙 - 4星难度
    "#f56c6c", // 红色 - 5星难度
  ];

  // 各难度得分率图表
  if (difficultyScoreChart.value) {
    const difficulties = Object.keys(difficultyStats.value).sort();
    const scoreRates = difficulties.map((difficulty) => {
      const stats = difficultyStats.value[difficulty];
      return stats.totalFullScore > 0
        ? Math.round((stats.totalScore / stats.totalFullScore) * 100)
        : 0;
    });

    const ctx = difficultyScoreChart.value.getContext("2d");

    chartInstances.difficultyScore = new Chart(ctx, {
      type: "bar",
      data: {
        labels: difficulties.map((d) => `${d}星难度`),
        datasets: [
          {
            label: "得分率 (%)",
            data: scoreRates,
            backgroundColor: difficulties.map(
              (_, index) =>
                // 使用带透明度的颜色
                `${difficultyColors[index]}80`
            ),
            borderColor: difficulties.map((_, index) => difficultyColors[index]),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "得分率 (%)",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const difficulty = difficulties[context.dataIndex];
                const stats = difficultyStats.value[difficulty];
                return [
                  `得分: ${stats.totalScore}/${stats.totalFullScore}`,
                  `题目数: ${stats.count}题`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // 难度分布图表
  if (difficultyDistributionChart.value) {
    const difficulties = Object.keys(difficultyStats.value).sort();
    const difficultyCounts = difficulties.map(
      (difficulty) => difficultyStats.value[difficulty].count
    );

    const ctx = difficultyDistributionChart.value.getContext("2d");

    chartInstances.difficultyDistribution = new Chart(ctx, {
      type: "pie",
      data: {
        labels: difficulties.map((d) => `${d}星难度`),
        datasets: [
          {
            data: difficultyCounts,
            backgroundColor: difficulties.map((_, index) => difficultyColors[index]),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value}题 (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }
};

// 创建题目得分详情图表
const createQuestionScoreChart = () => {
  if (!questionScoreChart.value) return;

  const questionIndices = questionDetails.value.map((_, index) => index + 1);
  const questionScores = questionDetails.value.map((q) => q.score);
  const questionFullScores = questionDetails.value.map((q) => q.fullScore);

  const ctx = questionScoreChart.value.getContext("2d");

  chartInstances.questionScore = new Chart(ctx, {
    type: "line",
    data: {
      labels: questionIndices,
      datasets: [
        {
          label: "每题得分",
          data: questionScores,
          borderColor: "#409eff",
          backgroundColor: "rgba(64, 158, 255, 0.1)",
          tension: 0.1,
          fill: true,
        },
        {
          label: "每题满分",
          data: questionFullScores,
          borderColor: "#e6a23c",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "分数",
          },
        },
        x: {
          title: {
            display: true,
            text: "题目序号",
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              const detail = questionDetails.value[index];
              return [
                `第${index + 1}题`,
                `得分: ${detail.score}/${detail.fullScore}`,
                `得分率: ${detail.scoreRate}%`,
              ];
            },
          },
        },
      },
    },
  });
};

// 辅助函数：根据得分率获取类名
const getScoreRateClass = (rate) => {
  if (rate >= 80) return "score-excellent";
  if (rate >= 60) return "score-good";
  if (rate >= 40) return "score-average";
  return "score-poor";
};

// ==================== 监听图表标签切换 ====================
watch(activeChartTab, (newTab, oldTab) => {
  // 销毁旧标签的图表（可选）
  switch (oldTab) {
    case 'overall':
      if (chartInstances.overallScore) {
        chartInstances.overallScore.destroy();
        chartInstances.overallScore = null;
      }
      break;
    case 'type':
      if (chartInstances.typeScore) {
        chartInstances.typeScore.destroy();
        chartInstances.typeScore = null;
      }
      if (chartInstances.typeDistribution) {
        chartInstances.typeDistribution.destroy();
        chartInstances.typeDistribution = null;
      }
      break;
    case 'difficulty':
      if (chartInstances.difficultyScore) {
        chartInstances.difficultyScore.destroy();
        chartInstances.difficultyScore = null;
      }
      if (chartInstances.difficultyDistribution) {
        chartInstances.difficultyDistribution.destroy();
        chartInstances.difficultyDistribution = null;
      }
      break;
    case 'details':
      if (chartInstances.questionScore) {
        chartInstances.questionScore.destroy();
        chartInstances.questionScore = null;
      }
      break;
  }
  
  // 延迟初始化新标签的图表
  nextTick(() => {
    setTimeout(() => {
      initCurrentTabChart();
    }, 100);
  });
});

// ==================== 数据加载 ====================
// 加载考试名称
const loadExamName = async () => {
  try {
    const userInfo = getUserInfo();
    if (!userInfo || !examId.value) return;

    const res = await axios.get(
      `${API_BASE}/exam/getExamList/student/${userInfo.account}`
    );

    const exam = res.data.data.find((e) => String(e.id) === String(examId.value));

    examName.value = exam ? exam.name : "";
  } catch (error) {
    console.error("加载考试名称失败:", error);
  }
};

// 加载考试历史记录
const loadExamHistory = async () => {
  try {
    const userInfo = getUserInfo();
    if (!userInfo) {
      throw new Error("用户信息获取失败");
    }

    console.log("加载考试历史记录，学生:", userInfo.account, "考试ID:", examId.value);

    const res = await axios.get(
      `${API_BASE}/exam/getExamHistoryByStudent/${userInfo.account}`
    );

    console.log("考试历史记录API响应:", res.data);

    if (res.data.code === 200 && res.data.data) {
      // 查找当前考试的历史记录
      const history = res.data.data.find(
        (item) => String(item.exam_id) === String(examId.value)
      );

      if (history) {
        examHistory.value = history;
        console.log("找到考试历史记录:", history);
        console.log("总分字段total_score:", history.total_score);
        console.log("是否已批改is_marked:", history.is_marked);

        return {
          graded: history.is_marked === 1,
          history: history,
          totalScore: history.total_score || 0,
        };
      }
    }
    return { graded: false, history: null, totalScore: 0 };
  } catch (error) {
    console.error("加载考试历史记录失败:", error);
    return { graded: false, history: null, totalScore: 0 };
  }
};

// 加载考试结果
const loadResultData = async () => {
  if (!examId.value) {
    ElMessage.error("考试ID不存在");
    return;
  }

  loading.value = true;
  try {
    const userInfo = getUserInfo();
    if (!userInfo) {
      throw new Error("用户信息获取失败");
    }

    console.log("=== 开始加载考试结果 ===");
    console.log("考试ID:", examId.value, "学生:", userInfo.account);

    // 1. 先加载考试历史记录
    const historyResult = await loadExamHistory();

    console.log("考试历史记录结果:", historyResult);

    if (!historyResult.graded) {
      console.log("试卷尚未批改");

      if (historyResult.history) {
        console.log("找到历史记录但未批改:", historyResult.history);
        ElMessage.info("试卷正在批改中，请稍后再查看结果");
      } else {
        ElMessage.warning("未找到您的考试记录");
      }

      resultData.value = null;
      loading.value = false;
      return;
    }

    // 2. 试卷已批改，获取详细结果
    console.log("试卷已批改，获取详细答题记录");
    const resultRes = await axios.get(`${API_BASE}/exam/getAnswerRecord/${examId.value}`);

    console.log("答题记录API响应:", resultRes.data);

    if (resultRes.data.code === 200 && resultRes.data.data) {
      const allRecords = resultRes.data.data;
      console.log("所有记录数量:", allRecords.length);

      // 查找当前学生的记录
      const currentStudentRecord = allRecords.find((record) => {
        if (record.answer_records && record.answer_records.length > 0) {
          return record.answer_records[0].student === userInfo.account;
        }
        return false;
      });

      if (currentStudentRecord) {
        console.log("找到学生答题记录:", currentStudentRecord);

        // 计算每道题的学生得分总和（用于验证）
        let calculatedTotalScore = 0;
        if (currentStudentRecord.answer_records) {
          calculatedTotalScore = currentStudentRecord.answer_records.reduce(
            (sum, record) => {
              return sum + (record.score || 0);
            },
            0
          );
          console.log("从答题记录计算的得分总和:", calculatedTotalScore);
        }

        // 构建结果数据
        resultData.value = {
          ...currentStudentRecord,
          // 使用examHistory中的总分
          total_score: historyResult.totalScore,
          examiner: historyResult.history?.examiner || "未指定",
          report_json: historyResult.history?.report_json || "无",
        };

        console.log("最终结果数据:");
        console.log("- 使用的总分:", resultData.value.total_score);
        console.log("- 计算的总分:", calculatedTotalScore);
        console.log("- 批改老师:", resultData.value.examiner);
        console.log("- 总评语:", resultData.value.report_json);

        // 格式化选择题选项
        if (resultData.value.questions) {
          resultData.value.questions.forEach((question, index) => {
            if (question.options && Object.keys(question.options).length > 0) {
              const formattedOptions = {};
              Object.keys(question.options).forEach((key) => {
                if (key.startsWith("option_")) {
                  const letter = key.replace(/^option_/, "");
                  formattedOptions[letter] = question.options[key];
                } else {
                  formattedOptions[key] = question.options[key];
                }
              });
              question.options = formattedOptions;
            }
          });
        }

        // 加载知识点
        await loadKnowledgePoints();

        ElMessage.success("考试成绩加载成功");

        // 调试信息：显示所有题目的得分
        if (resultData.value.answer_records) {
          console.log("=== 题目得分详情 ===");
          resultData.value.answer_records.forEach((record, index) => {
            console.log(`第${index + 1}题: 得分 ${record.score || 0}`);
          });
        }
      } else {
        console.log("未找到该学生的详细答题记录");
        ElMessage.warning("未找到您的详细答题记录");
      }
    }
  } catch (error) {
    console.error("加载考试结果失败:", error);
    ElMessage.error("加载考试结果失败: " + error.message);
  } finally {
    loading.value = false;
  }
};

// 加载知识点
const loadKnowledgePoints = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getKnowledgePointList`);
    if (res.data.code === 200 && res.data.data) {
      knowledgePoints.value = res.data.data;
    }
  } catch (error) {
    console.warn("加载知识点失败:", error);
  }
};

// ==================== 工具函数 ====================
// 获取用户信息
const getUserInfo = () => {
  try {
    const userName = localStorage.getItem("userName");
    return userName ? { account: userName } : null;
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
};

// 获取题目类型
const getQuestionType = (typeId) => {
  const typeMap = {
    1: "单选题",
    2: "多选题",
    3: "证明题",
    4: "解答题",
    5: "填空题",
    6: "计算题",
    7: "判断题",
    8: "作图题",
  };
  return typeMap[typeId] || "未知题型";
};

// 获取知识点名称
const getKnowledgePointName = (pointId) => {
  return knowledgePoints.value[pointId] || `知识点${pointId}`;
};

// 获取知识点类名（用于标记掌握情况）
const getKnowledgePointClass = (pointId) => {
  const percentage = getScorePercentage(currentQuestionIndex.value);
  if (percentage >= 80) return "point-mastered";
  else if (percentage >= 60) return "point-partial";
  else return "point-weak";
};

// 获取题目分值
const getQuestionScore = (questionIndex) => {
  if (resultData.value?.scores?.[questionIndex] !== undefined) {
    return resultData.value.scores[questionIndex];
  }
  return 5;
};

// 获取学生得分
const getStudentScore = (questionIndex) => {
  const answer = resultData.value?.answer_records?.[questionIndex];
  const score = answer?.score || 0;
  console.log(`第${questionIndex + 1}题得分:`, score);
  return score;
};

// 获取得分百分比
const getScorePercentage = (questionIndex) => {
  const fullScore = getQuestionScore(questionIndex);
  const studentScore = getStudentScore(questionIndex);
  if (fullScore === 0) return 0;
  const percentage = Math.round((studentScore / fullScore) * 100);
  return percentage;
};

// 获取题目结果图标
const getQuestionResultIcon = (questionIndex) => {
  const percentage = getScorePercentage(questionIndex);
  if (percentage === 100) return "✓";
  else if (percentage >= 60) return "※";
  else if (percentage > 0) return "※";
  else return "✗";
};

// 得分类名
const getScoreClass = (score) => {
  const fullScore = getQuestionScore(currentQuestionIndex.value);
  const percentage = fullScore === 0 ? 0 : (score / fullScore) * 100;

  if (percentage >= 80) return "score-excellent";
  else if (percentage >= 60) return "score-good";
  else if (percentage >= 40) return "score-average";
  else return "score-poor";
};

// 判断是否为正确答案选项
const isCorrectOption = (optionKey) => {
  const correctAnswer = currentQuestion.value.answer;
  if (!correctAnswer) return false;
  if (typeof correctAnswer === "string") {
    return correctAnswer.includes(optionKey);
  }
  return false;
};

// 判断是否为选择的选项
const isSelectedOption = (optionKey) => {
  const studentAnswer = currentAnswer.value.student_answer;
  if (!studentAnswer) return false;
  return studentAnswer.includes(optionKey);
};

// 格式化日期 - yyyy-mm-dd hh:mm 格式
const formatDate = (dateString) => {
  if (!dateString) return "--";
  try {
    const date = new Date(dateString);

    // 获取年月日时分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error("日期格式化失败:", error);
    return dateString;
  }
};

/* ==================== Markdown渲染函数 ==================== */
marked.setOptions({
  breaks: true,
  gfm: true,
});

const markdownToHtml = (text) => {
  if (!text) return "";
  try {
    let content = text;
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    });
    content = content.replace(/\$([\s\S]+?)\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    });
    return marked(content);
  } catch (err) {
    console.error("Markdown 渲染失败:", err);
    return text;
  }
};

// ==================== 页面操作 ====================
const selectQuestion = (index) => {
  currentQuestionIndex.value = index;
};

const goBack = () => {
  router.back();
};

// ==================== 生命周期 ====================
onMounted(() => {
  loadExamName();
  loadResultData();
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.result-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  padding-bottom: 40px;
}

/* ==================== 头部样式 ==================== */
.result-header {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  border: 1px solid #e6e9f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.result-summary {
  margin-top: 20px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 12px;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

/* 考试时间样式 */
.time-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.time-label {
  color: #909399;
  font-weight: 500;
  min-width: 40px;
}

.time-value {
  color: #303133;
  font-weight: 600;
}

/* ==================== 总评语区域 ==================== */
.overall-comment {
  max-width: 2000px;
  margin: 20px auto 0;
}

.comment-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  border: 1px solid #e6e9f0;
}

.comment-content {
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
  line-height: 1.6;
  font-size: 15px;
  margin-top: 12px;
  white-space: pre-wrap;
}

/* ==================== 内容区布局 ==================== */
.result-content {
  display: flex;
  gap: 20px;
  max-width: 2000px;
  margin: 20px auto;
  align-items: stretch;
  min-height: 600px;
}

.left-panel,
.middle-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
}

/* ==================== 左侧题目导航 ==================== */
.questions-sidebar {
  background: white;
  width: 280px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  border: 1px solid #e6e9f0;
  flex: 1;
  height: 100%;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e6e9f0;
  flex-shrink: 0;
}

.sidebar-header h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.result-info {
  font-size: 14px;
}

.correct-count {
  color: #67c23a;
  background: #f0f9eb;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.question-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
}

.question-nav-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;
  flex-shrink: 0;
}

.question-nav-item:hover {
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.question-nav-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 得分样式 - 根据得分比例显示不同颜色 */
.question-nav-item.score-excellent {
  border-left: 4px solid #67c23a;
}

.question-nav-item.score-good {
  border-left: 4px solid #409eff;
}

.question-nav-item.score-average {
  border-left: 4px solid #e6a23c;
}

.question-nav-item.score-poor {
  border-left: 4px solid #f56c6c;
}

.nav-number {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px;
}

.nav-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.nav-score {
  color: #909399;
}

.nav-result {
  font-weight: 600;
}

/* 根据得分设置结果文本颜色 */
.question-nav-item.score-excellent .nav-result {
  color: #67c23a;
}

.question-nav-item.score-good .nav-result {
  color: #409eff;
}

.question-nav-item.score-average .nav-result {
  color: #e6a23c;
}

.question-nav-item.score-poor .nav-result {
  color: #f56c6c;
}

/* ==================== 中间题目详情 ==================== */
.question-detail {
  background: white;
  width: 500px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid #e6e9f0;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.question-detail > .question-section,
.question-detail > .answer-section {
  flex: 0 0 auto;
  margin-bottom: 32px;
}

.question-section:last-child,
.answer-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e9f0;
  flex-shrink: 0;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.question-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #909399;
  flex-wrap: wrap;
}

.question-body {
  line-height: 1.6;
}

.question-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
}

.question-options {
  margin-top: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 12px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  background: #fafafa;
  position: relative;
  transition: all 0.2s;
}

.option-item:hover {
  background: #f0f9ff;
}

.option-item.correct-option {
  background: #f0f9eb;
  border-color: #67c23a;
}

.option-item.selected-option:not(.correct-option) {
  background: #fef0f0;
  border-color: #f56c6c;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 12px;
  min-width: 24px;
}

.option-content {
  flex: 1;
}

.option-mark {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-size: 18px;
  font-weight: bold;
}

.option-mark.wrong {
  color: #f56c6c;
}

/* ==================== 答案区域 ==================== */
.answer-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-label {
  color: #606266;
  font-size: 14px;
}

.score-value {
  font-weight: 600;
  font-size: 18px;
  padding: 4px 12px;
  border-radius: 6px;
}

.score-excellent {
  color: #67c23a;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.score-good {
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
}

.score-average {
  color: #e6a23c;
  background: #fdf6ec;
  border: 1px solid #faecd8;
}

.score-poor {
  color: #f56c6c;
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.answer-content {
  min-height: 120px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
  margin-bottom: 16px;
}

.text-answer {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.answer-with-image {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-answer {
  text-align: center;
}

.answer-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-answer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #909399;
  font-style: italic;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
}

.teacher-feedback {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #d9ecff;
  margin-top: 16px;
}

.feedback-header h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.feedback-content {
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
}

/* ==================== 右侧参考面板 ==================== */
.reference-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid #e6e9f0;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 690px;
}

.reference-answer,
.question-analysis,
.knowledge-points,
.mistake-summary {
  margin-bottom: 24px;
  flex: 0 0 auto;
}

.reference-answer:last-child,
.question-analysis:last-child,
.knowledge-points:last-child,
.mistake-summary:last-child {
  margin-bottom: 0;
}

.reference-answer .answer-content,
.question-analysis .analysis-content {
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
  font-size: 15px;
  line-height: 1.6;
}

.points-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.point-tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

.point-mastered {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.point-partial {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.point-weak {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.mistake-summary .summary-content {
  padding: 16px;
  background: #fdf6ec;
  border-radius: 8px;
  border: 1px solid #faecd8;
}

/* ==================== 加载和空状态 ==================== */
.loading-container,
.not-graded-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 40px 20px;
}

.loading-content,
.not-graded-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
  padding: 60px 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e6e9f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.loading-content p {
  font-size: 16px;
  color: #606266;
  margin: 0;
  font-weight: 500;
}

.not-graded-content svg {
  margin: 0 auto;
  display: block;
  width: 100px;
  height: 100px;
}

.not-graded-content h3 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.not-graded-content p {
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  padding: 0 20px;
  max-width: 400px;
}

.not-graded-content .btn-primary {
  margin-top: 16px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff, #3375e0);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  min-width: 140px;
}

.not-graded-content .btn-primary:hover {
  background: linear-gradient(135deg, #3375e0, #2a65cc);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.not-graded-content .btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.not-graded-content .btn-primary::before {
  content: '⟳';
  font-size: 18px;
  font-weight: bold;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .loading-container,
  .not-graded-container {
    min-height: 400px;
    padding: 20px;
  }
  
  .loading-content,
  .not-graded-content {
    padding: 40px 20px;
    margin: 0 20px;
  }
  
  .loading-spinner {
    width: 50px;
    height: 50px;
  }
  
  .not-graded-content svg {
    width: 80px;
    height: 80px;
  }
  
  .not-graded-content h3 {
    font-size: 22px;
  }
  
  .not-graded-content p {
    font-size: 15px;
    padding: 0 10px;
  }
  
  .not-graded-content .btn-primary {
    padding: 10px 24px;
    font-size: 15px;
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .loading-content,
  .not-graded-content {
    padding: 30px 16px;
    gap: 16px;
  }
  
  .not-graded-content svg {
    width: 70px;
    height: 70px;
  }
  
  .not-graded-content h3 {
    font-size: 20px;
  }
  
  .not-graded-content p {
    font-size: 14px;
  }
  
  .not-graded-content .btn-primary {
    padding: 10px 20px;
    font-size: 14px;
    min-width: 110px;
  }
}

/* ==================== 难度星级 ==================== */
.difficulty {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars {
  display: inline-flex;
  gap: 2px;
}

.star {
  font-size: 16px;
  color: #dcdfe6;
}

.star.active {
  color: #f7ba2a;
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
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #3375e0;
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

/* ==================== 滚动条统一 ==================== */
::-webkit-scrollbar {
  display: none; /* 默认隐藏滚动条 */
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* ==================== 图表弹窗样式 ==================== */
.chart-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.chart-dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.chart-dialog-header {
  padding: 24px;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chart-dialog-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #909399;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #303133;
}

.chart-dialog-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #e6e9f0;
  flex-shrink: 0;
  overflow-x: auto;
}

.chart-tab {
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.chart-tab:hover {
  color: #409eff;
}

.chart-tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.charts-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 0;
}

.chart-section {
  height: 100%;
}

.chart-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e6e9f0;
  height: 100%;
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.chart-wrapper {
  height: 300px;
  position: relative;
  margin-bottom: 20px;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
}

.chart-grid .chart-card {
  margin-bottom: 0;
}

.chart-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  display: block;
  color: #909399;
  font-size: 14px;
  margin-bottom: 4px;
}

.summary-item .value {
  display: block;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.question-detail-table {
  margin-top: 20px;
  overflow-x: auto;
}

.question-detail-table table {
  width: 100%;
  border-collapse: collapse;
}

.question-detail-table th,
.question-detail-table td {
  padding: 12px;
  text-align: center;
  border: 1px solid #e6e9f0;
}

.question-detail-table th {
  background: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.question-detail-table tr:hover {
  background: #f0f9ff;
}

.difficulty-stars {
  display: inline-flex;
  gap: 2px;
}

.difficulty-stars .star {
  font-size: 14px;
  color: #dcdfe6;
}

.difficulty-stars .star.active {
  color: #f7ba2a;
}

.chart-dialog-footer {
  padding: 20px 24px;
  border-top: 1px solid #e6e9f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* ==================== 动画 ==================== */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .chart-dialog {
    width: 95%;
    max-height: 85vh;
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .chart-dialog {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }

  .chart-dialog-header,
  .chart-dialog-content,
  .chart-dialog-footer {
    padding: 16px;
  }

  .chart-tabs {
    padding: 0 16px;
  }

  .chart-tab {
    padding: 12px 16px;
  }

  .charts-container {
    padding: 16px;
  }

  .chart-card {
    padding: 16px;
  }

  .chart-wrapper {
    height: 250px;
  }

  .chart-summary {
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .chart-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .chart-tab {
    padding: 8px 12px;
    font-size: 13px;
  }

  .chart-card h3 {
    font-size: 16px;
  }

  .chart-wrapper {
    height: 200px;
  }

  .question-detail-table th,
  .question-detail-table td {
    padding: 8px;
    font-size: 13px;
  }
}

/* ==================== 得分率颜色类 ==================== */
.score-excellent {
  color: #67c23a;
  font-weight: 600;
}

.score-good {
  color: #409eff;
  font-weight: 600;
}

.score-average {
  color: #e6a23c;
  font-weight: 600;
}

.score-poor {
  color: #f56c6c;
  font-weight: 600;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .result-content {
    flex-direction: column;
  }

  .left-panel,
  .middle-panel,
  .right-panel {
    width: 100%;
    height: auto;
    min-height: 400px;
    max-height: 400px;
  }

  .questions-sidebar,
  .question-detail,
  .reference-panel {
    height: 400px;
    min-height: 400px;
    max-height: 400px;
  }

  .question-nav {
    max-height: 320px;
  }
}

@media (max-width: 768px) {
  .result-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .result-content {
    padding: 16px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .question-meta {
    flex-direction: column;
    gap: 8px;
  }

  .questions-sidebar,
  .question-detail,
  .reference-panel {
    min-height: 300px;
    max-height: 300px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .question-nav-item {
    padding: 10px;
  }

  .summary-card {
    padding: 16px;
  }

  .card-value {
    font-size: 20px;
  }
}

/* ==================== 数学公式样式 ==================== */
:deep(.katex-display) {
  margin: 1em 0;
  overflow: auto hidden;
  padding: 0.5em;
  background: #f8f9fa;
  border-radius: 4px;
}

:deep(.katex) {
  font-size: 1.1em;
}
</style>
