<template>
  <div class="grading-container" tabindex="0" @keydown.enter="handleGlobalEnter">
    <!-- 头部信息 -->
    <div class="grading-header">
      <div class="header-content">
        <h1 class="page-title">{{ examName || "考试批改" }}</h1>
        <div class="header-actions">
          <button class="btn-primary" @click="saveAllGrading" :disabled="saving">
            {{ saving ? "保存中..." : "保存批改结果" }}
          </button>
          <button class="btn-secondary" @click="goBack">返回</button>
        </div>
      </div>
      <div class="grading-progress">
        <div class="progress-info">
          已完成批改：{{ gradedCount }} / {{ totalQuestions }} 题
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="grading-content" v-if="gradingData.length > 0">
      <!-- 左侧：学生列表 -->
      <div class="left-panel">
        <div class="students-sidebar">
          <div class="sidebar-header">
            <h3>学生列表</h3>
            <div class="exam-info">
              <!-- 显示总评语统计 -->
              <div class="total-comment-stats" v-if="hasTotalComments">
                已添加总评语：{{ totalCommentCount }} / {{ gradingData.length }} 人
              </div>
              <!-- 显示批改状态统计 -->
              <div class="marked-stats">
                已批改：{{ markedCount }} / {{ gradingData.length }} 人
              </div>
            </div>
          </div>

          <div class="student-list">
            <div
              class="student-item"
              v-for="(studentData, sIndex) in gradingData"
              :key="sIndex"
              :class="{
                active: currentStudentIndex === sIndex,
                'all-graded': isStudentAllGraded(sIndex),
                'partial-graded': !isStudentAllGraded(sIndex),
                'has-comment': totalComments[sIndex],
                marked: isStudentMarked(sIndex),
                unmarked: !isStudentMarked(sIndex),
              }"
              @click="selectStudent(sIndex)"
            >
              <div class="student-header">
                <span class="student-name">{{ getStudentName(sIndex) }}</span>
                <div class="student-header-buttons">
                  <button
                    class="btn-comment"
                    @click.stop="openTotalCommentModal(sIndex)"
                    :title="totalComments[sIndex] ? '编辑总评语' : '添加总评语'"
                  >
                    <svg
                      v-if="totalComments[sIndex]"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 21L3.52439 17.9024C3.81989 16.0764 5.35368 14.7143 7.19935 14.7143H16.8007C18.6463 14.7143 20.1801 16.0764 20.4756 17.9024L21 21"
                        stroke="#409eff"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                        stroke="#409eff"
                        stroke-width="2"
                      />
                    </svg>
                    <svg
                      v-else
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 21L3.52439 17.9024C3.81989 16.0764 5.35368 14.7143 7.19935 14.7143H16.8007C18.6463 14.7143 20.1801 16.0764 20.4756 17.9024L21 21"
                        stroke="#909399"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                        stroke="#909399"
                        stroke-width="2"
                      />
                    </svg>
                  </button>

                  <!-- 批改状态标签 -->
                  <span
                    v-if="isStudentMarked(sIndex)"
                    class="marked-badge"
                    title="已批改"
                  >
                    已批
                  </span>
                </div>
              </div>
              <div class="student-status">
                <span class="status-badge" :class="getStudentStatusClass(sIndex)">
                  {{ getStudentStatusText(sIndex) }}
                </span>
                <div class="score-display">
                  <span class="total-score"
                    >总分：{{ getStudentTotalScore(sIndex) }}</span
                  >
                  <span class="progress-score"
                    >({{ getStudentGradedCount(sIndex) }}/{{ totalQuestions }})</span
                  >
                </div>
              </div>

              <!-- 显示总评语预览（如果有） -->
              <div v-if="totalComments[sIndex]" class="comment-preview">
                <div class="comment-preview-text">
                  {{ previewTotalComment(sIndex) }}
                </div>
                <span class="comment-indicator">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="#409eff"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                    />
                  </svg>
                  已添加评语
                </span>
              </div>

              <div class="student-progress">
                <div class="progress-bar small">
                  <div
                    class="progress-fill"
                    :style="{ width: getStudentProgressPercentage(sIndex) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 总评语模态框 -->
      <div
        v-if="showCommentModal"
        class="modal-overlay"
        @click.self="closeTotalCommentModal"
      >
        <div class="comment-modal">
          <div class="modal-header">
            <h3>为 {{ getStudentName(selectedStudentForComment) }} 添加总评语</h3>
            <button class="btn-close" @click="closeTotalCommentModal">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18"
                  stroke="#606266"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M6 6L18 18"
                  stroke="#606266"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <div class="modal-content">
            <div class="student-info">
              <div class="info-item">
                <span class="info-label">学生姓名：</span>
                <span class="info-value">{{
                  getStudentName(selectedStudentForComment)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前总分：</span>
                <span class="info-value">{{
                  getStudentTotalScore(selectedStudentForComment)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">批改进度：</span>
                <span class="info-value"
                  >{{ getStudentGradedCount(selectedStudentForComment) }}/{{
                    totalQuestions
                  }}</span
                >
              </div>
            </div>

            <div class="comment-input-area">
              <label class="comment-label">总评语：</label>
              <textarea
                v-model="tempTotalComment"
                class="comment-textarea"
                placeholder="请输入对该学生的总评语，可以从学习态度、知识掌握、答题情况等方面综合评价..."
                rows="8"
                maxlength="500"
                ref="commentTextarea"
              ></textarea>
              <div class="comment-footer">
                <div class="word-count">
                  已输入 {{ tempTotalComment?.length || 0 }}/500 字
                </div>
                <div class="comment-tips">提示：总评语将随批改结果一起保存</div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeTotalCommentModal">取消</button>
            <button
              class="btn-primary"
              @click="saveTotalComment"
              :disabled="!tempTotalComment?.trim()"
            >
              保存总评语
            </button>
          </div>
        </div>
      </div>

      <!-- 中间：题目列表 -->
      <div class="middle-panel">
        <div class="questions-panel">
          <div class="panel-header">
            <h3>题目列表 - {{ currentStudent }}</h3>
            <div class="summary-info">
              <span class="summary-item"
                >总分：{{ getStudentTotalScore(currentStudentIndex) }}</span
              >
              <span class="summary-item"
                >批改进度：{{ getStudentGradedCount(currentStudentIndex) }}/{{
                  totalQuestions
                }}</span
              >
            </div>
          </div>

          <div class="question-list">
            <div
              class="question-item"
              v-for="(item, index) in currentQuestions"
              :key="index"
              :class="{
                active: currentQuestionIndex === index,
                graded: isQuestionGraded(index),
                ungraded: !isQuestionGraded(index),
              }"
              @click="selectQuestion(index)"
            >
              <div class="question-header">
                <span class="question-number">第{{ index + 1 }}题</span>
                <span class="question-type">{{
                  getQuestionCategoryText(item.question_category_id)
                }}</span>
                <span class="question-score">({{ getQuestionScore(index) }}分)</span>
              </div>
              <div class="question-status">
                <span class="status-badge" :class="getQuestionStatusClass(index)">
                  {{ getQuestionStatusText(index) }}
                </span>
                <div class="score-display" v-if="getFinalScore(index) >= 0">
                  <span class="final-score">得分：{{ getFinalScore(index) }}分</span>
                  <!-- 如果已批改，显示手动批改标签 -->
                  <span v-if="isManuallyGraded(index)" class="manual-score-tag">
                    (已批)
                  </span>
                  <!-- 如果是自动评分 -->
                  <span v-else-if="getAutoScore(index) >= 0" class="auto-score-tag">
                    (自动)
                  </span>
                </div>
                <div v-else class="no-score-display">
                  <span class="no-score">待评分</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：题目详情和批改区 -->
      <div class="right-panel">
        <div class="grading-detail">
          <!-- 题目内容 -->
          <div class="question-content">
            <div class="section-header">
              <h3>题目内容</h3>
              <div class="question-meta">
                <span class="meta-item"
                  >题型：{{ getQuestionCategoryText(currentQuestion.question_category_id) }}</span
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
                >
                  <span class="option-label">{{ key }}.</span>
                  <span class="option-content" v-html="markdownToHtml(option)"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 学生答案 -->
          <div class="student-answer">
            <div class="section-header">
              <h3>学生答案</h3>
              <div class="answer-status">
                <span class="status-badge" :class="getAnswerStatusClass(currentAnswer)">
                  {{ getAnswerStatusText(currentAnswer) }}
                </span>
              </div>
            </div>

            <div class="answer-content">
              <div
                v-if="
                  currentAnswer.student_answer !== '未作答' &&
                  currentAnswer.student_answer
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
                      alt="学生作答图片"
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
                <span class="no-answer-text">学生未作答</span>
              </div>
            </div>
          </div>

          <!-- 老师批改区 -->
          <div class="grading-section">
            <div class="section-header">
              <h3>评分区</h3>
              <div class="score-display">
                <span class="score-label">本题分值：</span>
                <span class="score-total"
                  >{{ getQuestionScore(currentQuestionIndex) }} 分</span
                >
              </div>
            </div>

            <div class="grading-form">
              <!-- 自动评分显示 -->
              <div
                v-if="getAutoScore(currentQuestionIndex) >= 0"
                class="auto-grading-info"
              >
                <div class="info-item">
                  <span class="info-label">系统自动评分：</span>
                  <span class="info-value"
                    >{{ getAutoScore(currentQuestionIndex) }} 分</span
                  >
                </div>
              </div>

              <!-- 手动评分 -->
              <div class="manual-grading">
                <div class="score-input">
                  <label class="score-label">评分：</label>
                  <div class="score-controls">
                    <input
                      type="number"
                      v-model="currentGrading.score"
                      :max="getQuestionScore(currentQuestionIndex)"
                      min="0"
                      step="0.5"
                      class="score-input-field"
                    />
                    <span class="score-unit">分</span>
                  </div>
                  <div class="score-slider" v-if="canGradeManually(currentQuestionIndex)">
                    <input
                      type="range"
                      v-model="currentGrading.score"
                      :max="getQuestionScore(currentQuestionIndex)"
                      min="0"
                      step="0.5"
                      class="score-range"
                    />
                  </div>
                </div>

                <div class="feedback-input">
                  <label class="feedback-label">本题评语：</label>
                  <textarea
                    v-model="currentGrading.feedback"
                    class="feedback-textarea"
                    placeholder="请输入评语（选填）"
                    rows="4"
                  ></textarea>
                </div>

                <div class="grading-actions">
                  <button
                    class="btn-success btn-sm"
                    @click="saveAndNext"
                    :disabled="!canSaveGrading"
                  >
                    保存本题评分
                  </button>
                  <button class="btn-secondary btn-sm" @click="nextQuestion">
                    下一题
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最右侧：参考答案和解析 -->
      <div class="far-right-panel">
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

          <!-- 备注 -->
          <div v-if="currentQuestion.remark" class="question-remark">
            <div class="section-header">
              <h3>备注</h3>
            </div>
            <div class="remark-content">{{ currentQuestion.remark }}</div>
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
              >
                {{ getKnowledgePointName(pointId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在加载批改数据...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-container">
      <div class="empty-content">
        <p>暂无批改数据</p>
        <button class="btn-primary" @click="loadGradingData">重新加载</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";
import { getQuestionCategoryText } from "../utils/questionCategory";
import { markdownToHtml } from "../utils/markdownUtils";

const route = useRoute();
const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ==================== 数据状态 ====================
const examId = ref(route.query.examId);
const examName = ref("");
const loading = ref(false);
const saving = ref(false);
const gradingData = ref([]); // 批改数据
const knowledgePoints = ref({}); // 知识点映射
const totalComments = ref({}); // 总评语
const showCommentModal = ref(false);
const selectedStudentForComment = ref(-1);
const tempTotalComment = ref("");
const commentTextarea = ref(null);
const examHistoryData = ref([]);

// 当前显示的学生和题目索引
const currentStudentIndex = ref(0);
const currentQuestionIndex = ref(0);

// 当前批改数据
const currentGrading = ref({
  score: 0,
  feedback: "",
});

// ==================== 计算属性 ====================
// 完全批改完成的学生数量
const getFullyGradedStudentsCount = () => {
  if (gradingData.value.length === 0) return 0;

  return gradingData.value.reduce((count, studentData, studentIndex) => {
    return count + (isStudentMarked(studentIndex) ? 1 : 0);
  }, 0);
};

// 已批改学生数量
const markedCount = computed(() => {
  if (gradingData.value.length === 0) return 0;

  let count = 0;
  for (let i = 0; i < gradingData.value.length; i++) {
    if (isStudentMarked(i)) {
      count++;
    }
  }
  return count;
});

// 当前学生数据
const currentStudentData = computed(() => {
  return gradingData.value[currentStudentIndex.value] || {};
});

// 当前学生名称
const currentStudent = computed(() => {
  return getStudentName(currentStudentIndex.value);
});

// 当前题目列表
const currentQuestions = computed(() => {
  return currentStudentData.value.questions || [];
});

// 当前答案记录
const currentAnswerRecords = computed(() => {
  return currentStudentData.value.answer_records || [];
});

// 当前自动评分
const currentAutoMarkings = computed(() => {
  return currentStudentData.value.auto_markings || [];
});

// 当前题目
const currentQuestion = computed(() => {
  return currentQuestions.value[currentQuestionIndex.value] || {};
});

// 当前答案
const currentAnswer = computed(() => {
  return currentAnswerRecords.value[currentQuestionIndex.value] || {};
});

// 总题目数
const totalQuestions = computed(() => {
  return currentQuestions.value.length || 0;
});

// 已批改题目数
const gradedCount = computed(() => {
  return currentQuestions.value.filter((_, index) => {
    const answer = currentAnswerRecords.value[index];
    const autoScore = getAutoScore(index);

    return answer?.manual_override === true || autoScore >= 0;
  }).length;
});

// 批改进度百分比
const progressPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0;
  return Math.round((gradedCount.value / totalQuestions.value) * 100);
});

// 是否可以保存当前批改
const canSaveGrading = computed(() => {
  const maxScore = getQuestionScore(currentQuestionIndex.value);
  return currentGrading.value.score >= 0 && currentGrading.value.score <= maxScore;
});

// 是否有总评语
const hasTotalComments = computed(() => {
  return Object.keys(totalComments.value).some(
    (key) => totalComments.value[key] && totalComments.value[key].trim()
  );
});

// 总评语数量统计
const totalCommentCount = computed(() => {
  return Object.values(totalComments.value).filter((comment) => comment && comment.trim())
    .length;
});

// 打开总评语模态框
const openTotalCommentModal = (studentIndex) => {
  selectedStudentForComment.value = studentIndex;
  tempTotalComment.value = totalComments.value[studentIndex] || "";
  showCommentModal.value = true;

  // 模态框打开后聚焦到文本框
  nextTick(() => {
    if (commentTextarea.value) {
      commentTextarea.value.focus();
    }
  });
};

// 关闭总评语模态框
const closeTotalCommentModal = () => {
  showCommentModal.value = false;
  selectedStudentForComment.value = -1;
  tempTotalComment.value = "";
};

// 保存总评语
const saveTotalComment = () => {
  if (selectedStudentForComment.value >= 0 && tempTotalComment.value?.trim()) {
    // 更新总评语
    totalComments.value = {
      ...totalComments.value,
      [selectedStudentForComment.value]: tempTotalComment.value.trim(),
    };
    ElMessage.success(
      `学生  ${getStudentName(selectedStudentForComment.value)}  的总评语书写完成`
    );
    closeTotalCommentModal();
  }
};

// 预览总评语（截断显示）
const previewTotalComment = (studentIndex) => {
  const comment = totalComments.value[studentIndex];
  if (!comment) return "";

  if (comment.length > 60) {
    return comment.substring(0, 60) + "...";
  }
  return comment;
};

// ==================== 学生相关函数 ====================
// 获取学生姓名
const getStudentName = (studentIndex) => {
  const student = gradingData.value[studentIndex]?.answer_records?.[0]?.student;
  return student || `学生${studentIndex + 1}`;
};

// 获取学生ID
const getStudentId = (studentIndex) => {
  const student = gradingData.value[studentIndex]?.answer_records?.[0];
  return student?.student_id || `ID${studentIndex + 1}`;
};

// 获取学生总分
const getStudentTotalScore = (studentIndex) => {
  const studentData = gradingData.value[studentIndex];
  if (!studentData) return 0;

  let total = 0;
  const questions = studentData.questions || [];
  const answerRecords = studentData.answer_records || [];
  const autoMarkings = studentData.auto_markings || [];

  questions.forEach((_, index) => {
    const answer = answerRecords[index];
    let score = 0;

    if (answer && answer.score !== null && answer.score !== undefined) {
      score = answer.score;
    } else {
      const autoScore = autoMarkings[index];
      if (autoScore !== undefined && autoScore !== null && autoScore >= 0) {
        score = autoScore;
      }
    }

    total += parseFloat(score) || 0;
  });

  return total.toFixed(1);
};

// 获取学生批改进度（包含系统评分）
const getStudentGradedCount = (studentIndex) => {
  const studentData = gradingData.value[studentIndex];
  if (!studentData) return 0;

  const questions = studentData.questions || [];
  const answerRecords = studentData.answer_records || [];
  const autoMarkings = studentData.auto_markings || [];

  // 统计已批改的题目数量（包含系统评分）
  return questions.reduce((count, _, index) => {
    const answer = answerRecords[index];
    const autoScore = autoMarkings[index];

    // 已手动批改
    if (answer?.is_marked === 1) return count + 1;

    // 系统已评分
    if (autoScore !== undefined && autoScore !== null && autoScore >= 0) return count + 1;

    return count;
  }, 0);
};

// 获取学生批改进度百分比
const getStudentProgressPercentage = (studentIndex) => {
  if (totalQuestions.value === 0) return 0;
  const graded = getStudentGradedCount(studentIndex);
  return Math.round((graded / totalQuestions.value) * 100);
};

// 学生是否全部批改完成
const isStudentAllGraded = (studentIndex) => {
  return getStudentGradedCount(studentIndex) === totalQuestions.value;
};

// 学生状态类名
const getStudentStatusClass = (studentIndex) => {
  if (isStudentMarked(studentIndex)) {
    return "status-marked";
  }

  const gradedCount = getStudentGradedCount(studentIndex);
  if (gradedCount === totalQuestions.value) {
    return "status-graded";
  } else if (gradedCount > 0) {
    return "status-partial";
  } else {
    return "status-ungraded";
  }
};

// 学生状态文本
const getStudentStatusText = (studentIndex) => {
  if (isStudentMarked(studentIndex)) {
    return "已批改";
  }

  const gradedCount = getStudentGradedCount(studentIndex);
  if (gradedCount === totalQuestions.value) {
    return "已完成";
  } else if (gradedCount > 0) {
    return "部分完成";
  } else {
    return "未开始";
  }
};

// ==================== 学生批改状态相关函数 ====================
// 判断学生是否已批改
const isStudentMarked = (studentIndex) => {
  const studentData = gradingData.value[studentIndex];
  if (!studentData) return false;

  const questions = studentData.questions || [];
  const answerRecords = studentData.answer_records || [];
  const autoMarkings = studentData.auto_markings || [];

  // 检查该学生的所有题目是否都已批改（包含系统评分）
  return questions.every((_, index) => {
    const answer = answerRecords[index];
    const autoScore = autoMarkings[index];

    // 已手动批改
    if (answer?.is_marked === 1) return true;

    // 系统已评分（auto_markings中有值且>=0）
    if (autoScore !== undefined && autoScore !== null && autoScore >= 0) return true;

    return false;
  });
};

// ==================== 数据加载 ====================
// 加载考试名称
const loadExamName = async () => {
  try {
    const userInfo = getUserInfo();
    if (!userInfo || !examId.value) return;

    const res = await axios.get(`${API_BASE}/exam/getExamList/staff/${userInfo.account}`);

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
    if (!userInfo) return;

    const res = await axios.get(
      `${API_BASE}/exam/getExamHistoryByStaff/${userInfo.account}`
    );

    if (res.data.code === 200 && res.data.data) {
      examHistoryData.value = res.data.data;
    }
  } catch (error) {
    console.warn("加载考试历史记录失败:", error);
  }
};

// 加载批改数据
const loadGradingData = async () => {
  if (!examId.value) {
    console.error("考试ID不存在");
    return;
  }

  loading.value = true;
  try {
    // 并行加载批改数据和考试历史
    await Promise.all([loadExamHistory(), loadGradingDataFromAPI()]);
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 从API加载批改数据
const loadGradingDataFromAPI = async () => {
  try {
    const res = await axios.get(`${API_BASE}/exam/getAnswerRecord/${examId.value}`);

    if (res.data.code === 200 && res.data.data) {
      gradingData.value = res.data.data;

      // 重新格式化选择题选项
      gradingData.value.forEach((student) => {
        student.questions?.forEach((question) => {
          if (
            question.options &&
            Object.keys(question.options).some((k) => k.startsWith("option_"))
          ) {
            const formattedOptions = {};
            Object.keys(question.options).forEach((key) => {
              const letter = key.replace(/^option_/, "");
              formattedOptions[letter] = question.options[key];
            });
            question.options = formattedOptions;
          }
        });
      });

      // 加载知识点
      await loadKnowledgePoints();

      // 初始化总评语对象
      const initialComments = {};
      gradingData.value.forEach((_, index) => {
        initialComments[index] = ""; // 初始化为空
      });
      totalComments.value = initialComments;

      // 初始化当前批改数据
      if (gradingData.value.length > 0) {
        initializeCurrentGrading();
      }
    } else {
      console.error("获取批改数据失败:", res.data.message);
    }
  } catch (error) {
    console.error("加载批改数据失败:", error);
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

// ==================== 初始化 ====================
// 初始化当前批改数据
const initializeCurrentGrading = () => {
  const answer = currentAnswer.value;
  const questionIndex = currentQuestionIndex.value;
  const autoScore = getAutoScore(questionIndex);

  let score = 0;
  let feedback = "";

  // 如果题目已被手动批改
  if (answer && answer.is_marked === 1) {
    score = answer.score || 0;
    feedback = answer.feedback || "";
  } else if (autoScore >= 0) {
    // 使用系统评分
    score = autoScore;
    feedback = answer?.feedback || "";
  } else {
    // 否则默认0分
    score = 0;
    feedback = "";
  }

  currentGrading.value = {
    score,
    feedback,
  };
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

// 难度
const maxDifficulty = 5;

// 获取知识点名称
const getKnowledgePointName = (pointId) => {
  return knowledgePoints.value[pointId] || `知识点${pointId}`;
};

// 获取题目分值 - 从学生数据的scores数组中获取
const getQuestionScore = (questionIndex) => {
  const studentData = currentStudentData.value;
  if (studentData.scores && studentData.scores[questionIndex] !== undefined) {
    return studentData.scores[questionIndex];
  }
  return 5; // 默认值
};

// 获取自动评分
const getAutoScore = (questionIndex) => {
  const autoScore = currentAutoMarkings.value[questionIndex];
  // auto_markings 中 -1 代表需要手动评分，其他数字代表自动评分值
  if (autoScore === undefined || autoScore === null) {
    return -1; // 默认需要手动评分
  }
  return parseFloat(autoScore);
};

// 是否可以手动评分
const canGradeManually = () => {
  return true;
};

// 题目是否已批改
const isQuestionGraded = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex];
  const autoScore = getAutoScore(questionIndex);

  // 已手动批改 或 系统已评分
  return answer?.is_marked === 1 || autoScore >= 0;
};

// 获取题目状态类
const getQuestionStatusClass = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex];
  const autoScore = getAutoScore(questionIndex);

  if (answer?.is_marked === 1) return "status-graded";
  if (autoScore >= 0) return "status-auto-graded";
  return "status-ungraded";
};

// 获取最终得分
const getFinalScore = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex];
  const autoScore = getAutoScore(questionIndex);

  // 优先级：手动批改 > 系统评分
  if (answer?.is_marked === 1) {
    return parseFloat(answer.score);
  }

  if (autoScore >= 0) {
    return autoScore;
  }

  return -1; // 表示未评分
};

// 获取题目状态文本
const getQuestionStatusText = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex];
  const autoScore = getAutoScore(questionIndex);

  if (answer?.is_marked === 1) return "已批改";
  if (autoScore >= 0) return "系统评分";
  return "待批改";
};

// 是否是手动评分（已批改）
const isManuallyGraded = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex];
  return answer?.is_marked === 1;
};

// 获取答案状态
const getAnswerStatusClass = (answer) => {
  if (!answer.student_answer || answer.student_answer === "未作答") {
    return "status-incorrect";
  } else if (answer.is_correct === 1) {
    return "status-correct";
  } else if (answer.is_correct === 0) {
    return "status-incorrect";
  } else {
    return "status-unknown";
  }
};

const getAnswerStatusText = (answer) => {
  if (!answer.student_answer || answer.student_answer === "未作答") {
    return "错误(未作答)";
  } else if (answer.is_correct === 1) {
    return "正确";
  } else if (answer.is_correct === 0) {
    return "错误";
  } else {
    return "未知";
  }
};

// ==================== 题目操作 ====================
// 选择题目
const selectQuestion = (index) => {
  currentQuestionIndex.value = index;
  initializeCurrentGrading();
};

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++;
    initializeCurrentGrading();
  }
};

// ==================== 批改操作 ====================
// 保存当前题目批改
const saveCurrentGrading = () => {
  const answer = currentAnswer.value;
  if (!answer) return;

  answer.score = Number(currentGrading.value.score);
  answer.feedback = currentGrading.value.feedback;
  answer.manual_override = true;
  // 设置已批改状态
  answer.is_marked = 1;
};

const nextStudent = () => {
  if (currentStudentIndex.value < gradingData.value.length - 1) {
    selectStudent(currentStudentIndex.value + 1);
  } else {
    ElMessage.success("所有学生已批改完成");
  }
};

const saveAndNext = () => {
  saveCurrentGrading();

  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    nextQuestion();
  } else {
    nextStudent();
  }
};

// 回车保存并跳转到下一题
const handleGlobalEnter = (e) => {
  const tagName = e.target.tagName.toLowerCase();

  // 输入框里不触发
  if (tagName === "textarea") return;

  e.preventDefault();

  // 添加分值验证
  if (!canSaveGrading.value) {
    alert(`请输入有效的分数（0-${getQuestionScore(currentQuestionIndex.value)}分）`);
    return;
  }

  saveAndNext();
};

// 保存所有批改（一次性提交）
const saveAllGrading = async () => {
  saving.value = true;
  try {
    // 构建所有学生的批改数据
    const allStudentGradingData = [];

    for (let studentIndex = 0; studentIndex < gradingData.value.length; studentIndex++) {
      const studentData = gradingData.value[studentIndex];

      if (
        !studentData ||
        !studentData.answer_records ||
        studentData.answer_records.length === 0
      ) {
        console.warn(`学生${studentIndex + 1}没有有效的答案记录，跳过`);
        continue;
      }

      // 检查该学生是否所有题目都已批改（包含系统评分）
      if (!isStudentMarked(studentIndex)) {
        continue;
      }

      // 获取考试历史ID
      const firstRecord = studentData.answer_records[0];
      if (!firstRecord || !firstRecord.exam_history_id) {
        console.warn(`学生${studentIndex + 1}没有有效的考试历史ID，跳过`);
        continue;
      }

      // 计算该学生的总分
      let totalScore = 0;
      const answerRecords = [];

      studentData.questions.forEach((_, recordIndex) => {
        const answer = studentData.answer_records[recordIndex];
        const autoScore = studentData.auto_markings?.[recordIndex];

        // 确定最终得分
        let finalScore = 0;

        // 优先级：手动批改 > 系统评分
        if (answer?.is_marked === 1) {
          finalScore = parseFloat(answer.score);
        } else if (autoScore !== undefined && autoScore !== null && autoScore >= 0) {
          finalScore = parseFloat(autoScore);
        }

        totalScore += finalScore;

        // 获取题目满分分值
        const questionFullScore = studentData.scores?.[recordIndex] || 5;

        // 根据得分是否满分设置is_correct
        const isCorrect = finalScore >= questionFullScore ? 1 : 0;

        // 构建答案记录
        answerRecords.push({
          id: answer?.id || null,
          exam_history_id: answer?.exam_history_id || firstRecord.exam_history_id,
          question_id: answer?.question_id || studentData.questions[recordIndex]?.id,
          student: answer?.student || getStudentName(studentIndex),
          student_answer: answer?.student_answer || "未作答",
          is_correct: isCorrect,
          is_marked: 1, // 标记为已批改（包含系统评分）
          score: finalScore,
          feedback: answer?.feedback || null,
          image_url: answer?.image_url || null,
        });
      });

      // 获取总评语
      const report_json = totalComments.value[studentIndex] || "";

      // 获取批改人信息
      const examiner = getUserInfo()?.account || "unknown";

      // 构建该学生的请求数据
      const studentGradingData = {
        exam_history_id: firstRecord.exam_history_id,
        total_score: totalScore,
        examiner: examiner,
        report_json: report_json.trim(),
        answer_record: answerRecords,
      };

      allStudentGradingData.push(studentGradingData);
    }

    // 检查是否有有效数据
    if (allStudentGradingData.length === 0) {
      alert(
        "没有完全批改完成的学生数据需要保存\n请确保所有学生都已完全批改完成（包含系统评分）"
      );
      saving.value = false;
      return;
    }

    const res = await axios.post(
      `${API_BASE}/exam/submitAssessmentResult`,
      allStudentGradingData
    );

    if (res.data.code === 200) {
      // 保存成功后显示统计信息
      const fullyGradedCount = gradingData.value.reduce((total, _, index) => {
        return total + (isStudentMarked(index) ? 1 : 0);
      }, 0);

      const submittedCount = allStudentGradingData.length;
      const commentCount = Object.values(totalComments.value).filter(
        (comment) => comment && comment.trim()
      ).length;

      ElMessage.success(
        `批改结果保存成功！\n已提交学生：${submittedCount}/${gradingData.value.length}\n已添加总评语：${commentCount}/${gradingData.value.length}`
      );

      // 保存成功后返回上一页
      router.push("/teacher/exammanagement/");
    } else {
      console.error("批量保存失败:", res.data.message);
      alert(`批量保存失败: ${res.data.message}`);
    }
  } catch (error) {
    console.error("保存批改结果失败:", error);
    alert(`保存批改结果失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

const selectStudent = (index) => {
  // 如果当前学生有未保存内容，这里以后可以加确认弹窗
  currentStudentIndex.value = index;
  currentQuestionIndex.value = 0; // 切学生必须回到第 1 题
  initializeCurrentGrading();
};

// ==================== 页面导航 ====================
const goBack = () => {
  router.back();
};

// ==================== 生命周期 ====================
onMounted(() => {
  loadExamName();
  loadGradingData();
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.grading-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}
.grading-container:focus-visible {
  outline: none;
}

/* ==================== 头部样式 ==================== */
.grading-header {
  background: white;
  border-bottom: 1px solid #e6e9f0;
  padding: 20px 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.grading-progress {
  margin-top: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.progress-bar {
  height: 6px;
  background-color: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #3375e0);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* ==================== 内容区布局 ==================== */
.grading-content {
  display: flex;
  height: calc(100vh - 180px);
  padding: 20px;
  gap: 20px;
}

.left-panel {
  width: 280px;
  flex-shrink: 0;
}

.middle-panel {
  width: 320px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.far-right-panel {
  width: 320px;
  flex-shrink: 0;
}

/* ==================== 左侧学生列表 ==================== */
.students-sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e6e9f0;
}

.sidebar-header h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.exam-info {
  font-size: 14px;
}

.student-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.student-list::-webkit-scrollbar {
  display: none;
}

.student-item {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.student-item:hover {
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.student-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.student-item.all-graded {
  border-left: 3px solid #67c23a;
}

.student-item.partial-graded {
  border-left: 3px solid #e6a23c;
}

/* ==================== 总评语相关样式 ==================== */
/* 学生头部按钮 */
.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.btn-comment {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-comment:hover {
  background-color: #f5f7fa;
  transform: scale(1.1);
}

.btn-comment:active {
  transform: scale(0.95);
}

/* 总评语预览 */
.comment-preview {
  margin: 8px 0;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #d9ecff;
}

.comment-preview-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 4px;
}

.comment-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #d9ecff;
}

/* 有评语的学生项样式 */
.student-item.has-comment {
  border-right: 3px solid #409eff;
}

/* 总评语统计 */
.total-comment-stats {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d9ecff;
  margin-top: 4px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.comment-modal {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e6e9f0;
}

.modal-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f5f7fa;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.student-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.comment-input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.comment-textarea {
  width: 95%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 150px;
  font-family: inherit;
  transition: all 0.2s;
}

.comment-textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.comment-textarea::placeholder {
  color: #c0c4cc;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.word-count {
  font-size: 12px;
  color: #909399;
}

.comment-tips {
  font-size: 12px;
  color: #e6a23c;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e6e9f0;
  background: #fafafa;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .comment-modal {
    width: 90vw;
    max-height: 90vh;
  }

  .student-info {
    grid-template-columns: 1fr;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-content {
    padding: 16px;
  }

  .modal-actions {
    padding: 16px;
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}

.student-name {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.student-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.total-score {
  font-weight: 600;
  color: #303133;
}

.progress-score {
  color: #909399;
  font-size: 12px;
}

.student-progress {
  margin-top: 8px;
}

.progress-bar.small {
  height: 4px;
  margin-top: 4px;
}

/* ==================== 批改状态样式 ==================== */
/* 学生项批改状态 */
.student-item.marked {
  border-right: 3px solid #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
}

.student-item.unmarked {
  border-right: 3px solid #e6a23c;
}

/* 批改状态标签 */
.marked-badge {
  font-size: 10px;
  padding: 2px 6px;
  background-color: #67c23a;
  color: white;
  border-radius: 10px;
  font-weight: 500;
  text-align: center;
  min-width: 30px;
}

/* 批改统计 */
.marked-stats {
  font-size: 12px;
  color: #67c23a;
  background: #f0f9eb;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
  margin-top: 4px;
}

/* 学生头部按钮组 */
.student-header-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 状态标签 - 已批改状态 */
.status-marked {
  background-color: #67c23a;
  color: white;
  border: 1px solid #529b2d;
}

/* 已批改学生项的样式 */
.student-item.marked .total-score {
  color: #67c23a;
  font-weight: 600;
}

/* 不可点击的已批改学生项 */
.student-item.marked {
  cursor: default;
  opacity: 0.9;
}

.student-item.marked:hover {
  border-color: #e6e9f0;
  transform: none;
  box-shadow: none;
}

/* ==================== 中间题目列表 ==================== */
.questions-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #e6e9f0;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.summary-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.summary-item {
  color: #606266;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.question-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.question-list::-webkit-scrollbar {
  display: none;
}

.question-item {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.question-item:hover {
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.question-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.question-item.graded {
  border-left: 3px solid #67c23a;
}

.question-item.ungraded {
  border-left: 3px solid #e6a23c;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.question-number {
  font-weight: 600;
  color: #303133;
}

.question-type {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.question-score {
  font-size: 12px;
  color: #909399;
}

/* ==================== 题目项样式更新 ==================== */
.question-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.final-score {
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
  background: #f0f9eb;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
}

/* 手动批改标签 */
.manual-score-tag {
  font-size: 10px;
  color: #67c23a;
  background: #f0f9eb;
  padding: 1px 4px;
  border-radius: 2px;
  border: 1px solid #e1f3d8;
}

/* 已批改题目项的特殊样式 */
.question-item.marked {
  border-left: 3px solid #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
}

.auto-score-tag {
  font-size: 10px;
  color: #409eff;
  background: #ecf5ff;
  padding: 1px 4px;
  border-radius: 2px;
  border: 1px solid #d9ecff;
}

.no-score-display .no-score {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

/* ==================== 右侧题目详情 ==================== */
.grading-detail {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}
.grading-detail::-webkit-scrollbar {
  display: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e9f0;
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
}

.question-content,
.student-answer,
.grading-section {
  margin-bottom: 32px;
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
  padding: 8px;
  border: 1px solid #e6e9f0;
  border-radius: 4px;
  background: #fafafa;
}

.option-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 8px;
  min-width: 20px;
}

.option-content {
  flex: 1;
}

/* ==================== 学生答案样式 ==================== */
.answer-content {
  min-height: 100px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
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
  height: 100px;
  color: #909399;
  font-style: italic;
}

/* ==================== 批改区样式 ==================== */
.grading-form {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e6e9f0;
}

.auto-grading-info {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e6e9f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #606266;
  font-size: 14px;
}

.info-value {
  font-weight: 600;
  color: #67c23a;
  font-size: 16px;
}

.manual-grading {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input-field {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
  text-align: center;
}

.score-input-field:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.score-unit {
  color: #606266;
  font-size: 14px;
}

.score-slider {
  padding: 0 4px;
}

.score-range {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: #dcdfe6;
  border-radius: 2px;
  outline: none;
}

.score-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
}

.score-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
  border: none;
}

.feedback-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.grading-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e6e9f0;
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
  color: #dcdfe6; /* 灰色 */
}

.star.active {
  color: #f7ba2a; /* Element 风格金色 */
}

/* ==================== 最右侧参考面板 ==================== */
.reference-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}

.reference-answer,
.question-analysis,
.question-remark,
.knowledge-points {
  margin-bottom: 24px;
}

.reference-answer .answer-content,
.question-analysis .analysis-content,
.question-remark .remark-content {
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
  padding: 4px 8px;
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  font-size: 12px;
}

/* ==================== 状态标签样式 ==================== */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

/* 学生状态 */
.status-graded {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-partial {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.status-ungraded {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e4e7ed;
}

/* 题目状态 */
.status-no-answer {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.status-correct {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-incorrect {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.status-unknown {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.status-auto-graded {
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

/* ==================== 加载和空状态 ==================== */
.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-content,
.empty-content {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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

.btn-success {
  background-color: #67c23a;
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
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}

.btn-success:hover:not(:disabled) {
  background-color: #5daf34;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.btn-success:disabled {
  background-color: #b3e19d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
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

/* ==================== 响应式设计 ==================== */
@media (max-width: 1400px) {
  .grading-content {
    flex-wrap: wrap;
    height: auto;
  }

  .left-panel,
  .middle-panel,
  .right-panel,
  .far-right-panel {
    width: 100%;
    height: 400px;
    margin-bottom: 20px;
  }

  .right-panel {
    order: 2;
  }

  .far-right-panel {
    order: 3;
  }
}

@media (max-width: 768px) {
  .grading-header {
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

  .grading-content {
    padding: 16px;
  }

  .grading-detail,
  .reference-panel {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .grading-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .student-item,
  .question-item {
    padding: 12px;
  }

  .grading-form {
    padding: 16px;
  }

  .student-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
