<template>
  <div class="assessment-container">
    <!-- 评测头部信息 -->
    <div class="assessment-header card">
      <div class="assessment-header-content">
        <h1 class="assessment-title">{{ formatExamName(assessmentInfo.exam_name) || "自我练习" }}</h1>
        <div class="assessment-meta">
          <div class="meta-item">
            <span class="meta-label">开始时间：</span>
            <span class="meta-value">{{ formatDateTime(assessmentInfo.start_time) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">时长：</span>
            <span class="meta-value">{{ assessmentInfo.duration }}分钟</span>
          </div>
        </div>
      </div>

      <!-- 评测计时器 -->
      <div class="assessment-timer">
        <div class="timer-display">
          <div class="timer-label">剩余时间</div>
          <div class="timer-value" :class="{ 'time-warning': remainingTime < 600, 'time-danger': remainingTime < 300 }">
            {{ formatRemainingTime(remainingTime) }}
          </div>
        </div>
        <div class="timer-progress">
          <div
            class="timer-progress-bar"
            :style="{ width: timeProgress + '%' }"
            :class="{ 'progress-warning': timeProgress > 70, 'progress-danger': timeProgress > 85 }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 评测主体 -->
    <div class="assessment-body">
      <!-- 左侧题目导航 -->
      <div class="assessment-sidebar card">
        <div class="sidebar-header">
          <h3 class="sidebar-title">题目导航</h3>
          <div class="answered-count">
            已答：{{ answeredCount }}/{{ questions.length }}
          </div>
        </div>

        <div class="question-nav">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="nav-item"
            :class="{
              current: currentQuestionIndex === index,
              answered: isQuestionAnswered(question.id),
              marked: markedQuestions.includes(question.id),
            }"
            @click="goToQuestion(index)"
          >
            <span class="nav-number">{{ index + 1 }}</span>
            <span v-if="markedQuestions.includes(question.id)" class="nav-mark">★</span>
          </div>
        </div>

        <div class="sidebar-actions">
          <button
            class="btn-mark"
            :class="{ active: isCurrentQuestionMarked }"
            @click="toggleMarkCurrentQuestion"
          >
            {{ isCurrentQuestionMarked ? "取消标记" : "标记本题" }}
          </button>
        </div>

        <div class="sidebar-footer">
          <button class="btn-submit-assessment" @click="showSubmitConfirm = true">
            提交评测
          </button>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color current"></div>
              <span>当前</span>
            </div>
            <div class="legend-item">
              <div class="legend-color answered"></div>
              <span>已答</span>
            </div>
            <div class="legend-item">
              <div class="legend-color marked"></div>
              <span>标记</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧题目区域 -->
      <div class="assessment-content card">
        <!-- 题目显示区域 -->
        <div class="question-area" v-if="questions.length > 0 && currentQuestion">
          <div class="question-header">
            <div class="question-title">
              <span class="question-number">第{{ currentQuestionIndex + 1 }}题</span>
              <span class="question-difficulty">
                难度：
                <div class="star-rating">
                  <span
                    v-for="star in 5"
                    :key="star"
                    class="star"
                    :class="{
                      filled: star <= currentQuestion.difficulty_level,
                      'half-filled': star === Math.ceil(currentQuestion.difficulty_level) && currentQuestion.difficulty_level % 1 !== 0
                    }"
                  >
                    ★
                  </span>
                </div>
              </span>
            </div>
            <div class="question-type">
              {{ getQuestionCategoryText(currentQuestion.question_category_id) }}
            </div>
          </div>

          <div class="question-content">
            <!-- 题目文本 -->
            <div
              class="question-text"
              v-html="markdownToHtml(currentQuestion.title)"
            ></div>

            <!-- 题目图片（如果有） -->
            <div class="question-image" v-if="currentQuestion.img_url">
              <img :src="currentQuestion.img_url" alt="题目图片" />
            </div>

            <!-- 选择题选项区域 -->
            <div
              class="options-area"
              v-if="currentQuestion.marking_type === 0 && currentQuestion.options"
            >
              <div
                v-for="(option, key) in currentQuestion.options"
                :key="key"
                class="option-item"
                :class="{
                  selected: isOptionSelected(key),
                }"
                @click="selectOption(key)"
              >
                <div class="option-selector">
                  <div class="option-letter">{{ key.replace('option_', '') }}</div>
                  <div class="option-text" v-html="markdownToHtml(option)"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 题目操作按钮 -->
          <div class="question-actions">
            <button
              class="btn-prev"
              :disabled="currentQuestionIndex === 0"
              @click="goToQuestion(currentQuestionIndex - 1)"
            >
              ← 上一题
            </button>

            <button
              class="btn-next"
              :disabled="currentQuestionIndex === questions.length - 1"
              @click="goToQuestion(currentQuestionIndex + 1)"
            >
              下一题 →
            </button>
          </div>
        </div>

      <!-- 统一加载组件 -->
    <LoadingOverlay 
      v-if="loading" 
      text="正在加载评测题目..."
      :bold="true"
    />
    
    <LoadingOverlay 
      v-if="submitting" 
      text="正在提交评测..."
      :bold="true"
    />
      </div>
    </div>

    <!-- 提交确认模态框 -->
    <div
      v-if="showSubmitConfirm"
      class="modal-overlay"
      @click.self="showSubmitConfirm = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">提交评测</h3>
          <button @click="showSubmitConfirm = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="submit-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <p>确定要提交评测吗？</p>
              <p v-if="remainingTime > 0">剩余时间：<span class="time-remaining">{{ formatRemainingTime(remainingTime) }}</span></p>
              <p v-else>已超时：<span class="time-overdue">{{ formatTime(elapsedTime - assessmentInfo.duration * 60) }}</span></p>
              <div class="answered-stats">
                <div>
                  已答题数：<span class="stat-value">{{ answeredCount }}</span>
                </div>
                <div>
                  未答题数：<span class="stat-value">{{
                    questions.length - answeredCount
                  }}</span>
                </div>
                <div>
                  标记题数：<span class="stat-value">{{ markedQuestions.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showSubmitConfirm = false">取消</button>
          <button class="btn-confirm" @click="submitAssessment">确认提交</button>
        </div>
      </div>
    </div>

    <!-- 批改结果查看模态框 -->
    <div v-if="showGradingResult" class="modal-overlay" @click.self="showGradingResult = false">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3 class="modal-title">批改结果</h3>
          <button @click="showGradingResult = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="grading-content">
            <div class="result-message">批改已完成!</div>
            <div class="result-subtitle">请确认得分情况</div>

            <!-- 总体得分信息 -->
            <div class="overall-score">
              <div class="score-display">
                <div class="score-label">总分</div>
                <div class="score-value">
                  <span class="actual-score">{{ gradingResult.totalScore || 0 }}</span>
                  <span class="score-separator">/</span>
                  <span class="max-score">{{ gradingResult.maxScore || 0 }}</span>
                </div>
              </div>
              <div class="score-progress">
                <div 
                  class="progress-bar" 
                  :style="{ width: (gradingResult.totalScore / gradingResult.maxScore * 100) + '%' }"
                ></div>
              </div>
              <div class="score-percentage">
                得分率：{{ gradingResult.totalScore && gradingResult.maxScore ? Math.round(gradingResult.totalScore / gradingResult.maxScore * 100) : 0 }}%
              </div>
            </div>

            <!-- 题目得分详情 -->
            <div class="question-scores">
              <h4>各题得分详情</h4>
              <div class="scores-list">
                <div 
                  v-for="(score, index) in gradingResult.questionScores" 
                  :key="index"
                  class="score-item"
                  :class="{
                    'score-excellent': score.scoreRate >= 80,
                    'score-good': score.scoreRate >= 60 && score.scoreRate < 80,
                    'score-average': score.scoreRate >= 40 && score.scoreRate < 60,
                    'score-poor': score.scoreRate < 40
                  }"
                >
                  <div class="score-item-number">第{{ index + 1 }}题</div>
                  <div class="score-item-value">{{ score.score || 0 }}/{{ score.fullScore || 0 }}</div>
                  <div class="score-item-rate">{{ score.scoreRate || 0 }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 评测结束模态框 -->
    <div v-if="showAssessmentResult" class="modal-overlay" @click.self="showAssessmentResult = false">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3 class="modal-title">评测结束</h3>
          <button @click="showAssessmentResult = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="result-content">
            <div class="result-message">评测已提交完成！</div>
            <div class="result-subtitle">感谢参与</div>

            <div class="result-stats">
              <div class="stat-item">
                <div class="stat-label">答题情况</div>
                <div class="stat-value">{{ answeredCount }}/{{ questions.length }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">答题用时</div>
                <div class="stat-value">
                  {{ formatTime(elapsedTime) }}
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">总分</div>
                <div class="stat-value">{{ gradingResult.totalScore || 0 }}/{{ gradingResult.maxScore || 0 }}</div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn-view-report" @click="viewAssessmentReport">查看详细报告</button>
              <button class="btn-return" @click="returnToSelfExercise">返回评测列表</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交加载中 -->
    <div v-if="submitting" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在提交评测...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { getQuestionCategoryText } from "../utils/questionCategory";
import { markdownToHtml } from "../utils/markdownUtils";
import { getBeijingTime } from "../utils/chinaTime";
import LoadingOverlay from "../utils/LoadingOverlay.vue";

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ==================== 状态管理 ====================
const questions = ref([]);
const currentQuestionIndex = ref(0);
const userAnswers = ref({});
const markedQuestions = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showSubmitConfirm = ref(false);
const showAssessmentResult = ref(false);
const showGradingResult = ref(false);
const assessmentSubmitted = ref(false);
const autoSubmitTriggered = ref(false); // 标记是否已触发自动提交

// 评测信息
const assessmentInfo = ref({
  exam_name: "",
  start_time: "",
  duration: 0,
  exam_id: null,
  paper_id: null,
  exam_history_id: null,
});

// 批改结果
const gradingResult = ref({
  totalScore: 0,
  maxScore: 0,
  questionScores: [],
  answerRecords: [],
  autoMarkings: [],
  scores: [],
});

// 计时器相关
const elapsedTime = ref(0);
const remainingTime = ref(0);
let timer = null;
const startTime = ref(null);
const totalDuration = computed(() => assessmentInfo.value.duration * 60);

// ==================== 计算属性 ====================
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null;
});

const isQuestionAnswered = (questionId) => {
  const answer = userAnswers.value[questionId];
  return answer !== undefined && answer.trim() !== "";
};

const answeredCount = computed(() => {
  let count = 0;
  questions.value.forEach((question) => {
    if (isQuestionAnswered(question.id)) {
      count++;
    }
  });
  return count;
});

const isCurrentQuestionMarked = computed(() => {
  if (!currentQuestion.value) return false;
  return markedQuestions.value.includes(currentQuestion.value.id);
});

const timeProgress = computed(() => {
  return totalDuration.value > 0 ? (elapsedTime.value / totalDuration.value) * 100 : 0;
});

// ==================== 监听剩余时间变化 ====================
watch(remainingTime, (newVal, oldVal) => {
  // 当时间变为0且未触发过自动提交时
  if (newVal <= 0 && oldVal > 0 && !autoSubmitTriggered.value) {
    handleTimeExpired();
  }
  
  // 提前提醒
  if (newVal === 300) { // 最后5分钟
    showTimeWarning("距离评测结束还有5分钟，请及时完成答题！");
  } else if (newVal === 60) { // 最后1分钟
    showTimeWarning("距离评测结束还有1分钟，系统将在时间结束后自动提交！");
  } else if (newVal <= 10 && newVal > 0) { // 最后10秒倒计时
    showCountdown(newVal);
  }
});

// ==================== 时间到期处理函数 ====================
const handleTimeExpired = async () => {
  // 防止重复触发
  if (autoSubmitTriggered.value) return;
  
  autoSubmitTriggered.value = true;
  
  // 清除定时器
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  // 显示通知
  ElMessage.warning({
    message: '评测时间已结束，系统正在自动提交答案...',
    duration: 3000,
    showClose: true
  });
  
  // 自动提交
  await autoSubmitAssessment();
};

// ==================== 自动提交函数 ====================
const autoSubmitAssessment = async () => {
  try {
    submitting.value = true;
    
    // 先保存所有答案
    await autoSaveAnswers();
    
    // 提交考试
    const submitBeijingTime = getBeijingTime();
    const submitExamData = {
      id: assessmentInfo.value.exam_history_id,
      submit_time: formatDateTime(submitBeijingTime)
    };

    const response = await axios.post(`${API_BASE}/exam/submitExam`, submitExamData);

    if (response.data.code === 200) {
      // 获取批改结果
      await getGradingResult();
      
      // 提交批改结果
      try {
        const submitData = [{
          exam_history_id: assessmentInfo.value.exam_history_id,
          total_score: gradingResult.value.totalScore,
          examiner: "root",
          report_json: "系统自动批改完成",
          answer_record: gradingResult.value.answerRecords.map(record => ({
            id: record.id,
            exam_history_id: record.exam_history_id,
            question_id: record.question_id,
            student: record.student,
            is_correct: record.is_correct || 0,
            is_marked: record.is_marked || 0,
            score: record.score || 0,
            feedback: record.feedback || "系统自动批改",
            image_url: record.image_url,
          }))
        }];

        const resultResponse = await axios.post(`${API_BASE}/exam/submitAssessmentResult`, submitData);

        if (resultResponse.data.code === 200) {
          examSubmitted.value = true; // 标记为已提交
          cleanupAssessmentData();
          showAssessmentResult.value = true;
          
          ElMessage.success({
            message: '评测已自动提交并批改完成！',
            duration: 3000,
            showClose: true
          });
        } else {
          throw new Error(resultResponse.data.message);
        }
      } catch (resultError) {
        console.error("自动提交批改结果失败:", resultError);
        
        // 即使失败也清理数据并显示结果
        cleanupAssessmentData();
        showAssessmentResult.value = true;
        
        ElMessage.warning({
          message: '评测已自动提交，但批改结果保存失败',
          duration: 3000
        });
      }
    } else {
      throw new Error(response.data.message || "自动提交失败");
    }
  } catch (error) {
    console.error("自动提交失败:", error);
    
    cleanupAssessmentData();
    
    ElMessage.error({
      message: '自动提交失败，请联系管理员',
      duration: 3000,
      showClose: true
    });
    
    setTimeout(() => {
      router.push("/student/selfassessment");
    }, 3000);
  } finally {
    submitting.value = false;
  }
};

// ==================== 清理函数 ====================
const cleanupAssessmentData = () => {
  // 清除本地保存的数据
  if (assessmentInfo.value.exam_id) {
    localStorage.removeItem(`assessment_${assessmentInfo.value.exam_id}_answers`);
    localStorage.removeItem(`assessment_${assessmentInfo.value.exam_id}_marks`);
  }
  localStorage.removeItem('current_assessment');
  
  // 停止计时器
  if (timer) {
    clearInterval(timer);
  }
  
  assessmentSubmitted.value = true;
};

// ==================== 时间警告函数 ====================
const showTimeWarning = (message) => {
  ElMessage.warning({
    message: message,
    duration: 3000,
    showClose: true
  });
};

// ==================== 倒计时显示 ====================
const showCountdown = (seconds) => {
  // 在页面上显示倒计时
  const countdownElement = document.createElement('div');
  countdownElement.className = 'countdown-overlay';
  countdownElement.innerHTML = `
    <div class="countdown-content">
      <div class="countdown-number">${seconds}</div>
      <div class="countdown-text">秒后自动提交</div>
    </div>
  `;
  
  document.body.appendChild(countdownElement);
  
  // 1秒后移除
  setTimeout(() => {
    if (document.body.contains(countdownElement)) {
      document.body.removeChild(countdownElement);
    }
  }, 1000);
  
  // 同时显示ElMessage提示
  if (seconds <= 5) {
    ElMessage.warning({
      message: `${seconds}秒后自动提交`,
      duration: 1000,
      showClose: false
    });
  }
};

// ==================== 提交函数 ====================
const submitAssessment = async () => {
  // 如果是自动提交触发的，跳过
  if (autoSubmitTriggered.value) return;
  
  try {
    submitting.value = true;
    showSubmitConfirm.value = false;
    
    // 第一步：自动保存所有答案
    await autoSaveAnswers();
    
    // 第二步：提交考试
    const submitBeijingTime = getBeijingTime();
    const submitExamData = {
      id: assessmentInfo.value.exam_history_id,
      submit_time: formatDateTime(submitBeijingTime)
    };

    const response = await axios.post(`${API_BASE}/exam/submitExam`, submitExamData);

    if (response.data.code === 200) {
      // 第三步：获取自动批改结果
      await getGradingResult();
      
      // 第四步：提交批改结果
      try {
        // 构建提交数据
        const submitData = [{
          exam_history_id: assessmentInfo.value.exam_history_id,
          total_score: gradingResult.value.totalScore,
          examiner: "root", // 系统自动批改
          report_json: "暂无评语",
          answer_record: gradingResult.value.answerRecords.map(record => ({
            id: record.id,
            exam_history_id: record.exam_history_id,
            question_id: record.question_id,
            student: record.student,
            is_correct: record.is_correct || 0,
            is_marked: record.is_marked || 0,
            score: record.score || 0,
            feedback: record.feedback || "暂无本题评语",
            image_url: record.image_url,
          }))
        }];

        const resultResponse = await axios.post(`${API_BASE}/exam/submitAssessmentResult`, submitData);

        if (resultResponse.data.code === 200) {
          examSubmitted.value = true; // 标记为已提交
          // 清除本地保存的数据
          cleanupAssessmentData();

          // 直接显示评测结果页面，跳过批改结果确认
          showAssessmentResult.value = true;

          ElMessage.success("评测提交成功，批改结果已保存！");
        } else {
          throw new Error(resultResponse.data.message || "提交批改结果失败");
        }
      } catch (resultError) {
        console.error("提交批改结果失败:", resultError);
        
        // 即使批改结果提交失败，也显示评测结果，但给出提示
        cleanupAssessmentData();
        showAssessmentResult.value = true;
        
        ElMessage.warning({
          message: "评测已提交，但批改结果保存失败，请联系管理员",
          duration: 5000
        });
      }
    } else {
      throw new Error(response.data.message || "提交失败");
    }
  } catch (error) {
    console.error("提交评测失败:", error);
    ElMessage.error(error.message || "提交评测失败，请重试");
  } finally {
    submitting.value = false;
  }
};

// ==================== 计时器函数 ====================
const startTimer = () => {
  if (!startTime.value) {
    startTime.value = getBeijingTime();
    assessmentInfo.value.start_time = startTime.value.toISOString();
  }
  
  timer = setInterval(() => {
    const currentBeijingTime = getBeijingTime();
    elapsedTime.value = Math.floor((currentBeijingTime - startTime.value) / 1000);
    remainingTime.value = Math.max(0, totalDuration.value - elapsedTime.value);
  }, 1000);
};

// ==================== 加载函数 ====================
const loadAssessmentData = () => {
  try {
    const assessmentData = localStorage.getItem('current_assessment');
    
    if (assessmentData) {
      const data = JSON.parse(assessmentData);
      
      const currentBeijingTime = getBeijingTime();
      
      assessmentInfo.value = {
        exam_name: data.exam_name || "自我评测",
        start_time: data.start_time || currentBeijingTime.toISOString(),
        duration: data.duration || 60,
        exam_id: data.exam_id,
        paper_id: data.paper_id,
        exam_history_id: data.exam_history_id,
      };
      
      questions.value = data.questions || [];
      
      const savedAnswers = localStorage.getItem(`assessment_${data.exam_id}_answers`);
      if (savedAnswers) {
        userAnswers.value = JSON.parse(savedAnswers);
      }
      
      const savedMarks = localStorage.getItem(`assessment_${data.exam_id}_marks`);
      if (savedMarks) {
        markedQuestions.value = JSON.parse(savedMarks);
      }
      
      startTime.value = new Date(data.start_time || currentBeijingTime.toISOString());
      
      const currentBeijingTimeNow = getBeijingTime();
      elapsedTime.value = Math.floor((currentBeijingTimeNow - startTime.value) / 1000);
      remainingTime.value = Math.max(0, totalDuration.value - elapsedTime.value);
      
      // 检查是否已经超时
      if (remainingTime.value <= 0 && !autoSubmitTriggered.value) {
        // 立即触发自动提交
        setTimeout(() => {
          handleTimeExpired();
        }, 1000);
      }
      
      loading.value = false;
    } else {
      ElMessage.error("未找到评测数据");
      router.push("/student/selfassessment");
    }
  } catch (error) {
    console.error("加载评测数据失败:", error);
    ElMessage.error("加载评测数据失败");
    loading.value = false;
  }
};

// ==================== 其他函数 ====================
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `00:${secs.toString().padStart(2, '0')}`;
  }
};

const formatRemainingTime = (seconds) => {
  if (seconds <= 0) {
    return "00:00:00";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";

  const date = new Date(dateTime);

  const pad = (n) => String(n).padStart(2, '0');

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());

  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const goToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentQuestionIndex.value = index;
  }
};

const selectOption = (optionKey) => {
  if (!currentQuestion.value) return;

  const questionId = currentQuestion.value.id;
  const optionLetter = optionKey.replace('option_', '');
  
  if (currentQuestion.value.marking_type === 0) {
    userAnswers.value[questionId] = optionLetter;
  }

  saveAnswer(questionId);
};

const isOptionSelected = (optionKey) => {
  if (!currentQuestion.value) return false;

  const questionId = currentQuestion.value.id;
  const optionLetter = optionKey.replace('option_', '');
  const currentAnswer = userAnswers.value[questionId];

  if (!currentAnswer) return false;

  return currentAnswer.includes(optionLetter);
};

const toggleMarkCurrentQuestion = () => {
  if (!currentQuestion.value) return;

  const questionId = currentQuestion.value.id;
  const index = markedQuestions.value.indexOf(questionId);

  if (index === -1) {
    markedQuestions.value.push(questionId);
    ElMessage.success("题目已标记");
  } else {
    markedQuestions.value.splice(index, 1);
    ElMessage.info("已取消标记");
  }

  localStorage.setItem(
    `assessment_${assessmentInfo.value.exam_id}_marks`,
    JSON.stringify(markedQuestions.value)
  );
};

// ==================== 答案保存 ====================
const saveAnswer = (questionId) => {
  localStorage.setItem(
    `assessment_${assessmentInfo.value.exam_id}_answers`,
    JSON.stringify(userAnswers.value)
  );
};

// ==================== 自动保存所有答案 ====================
const autoSaveAnswers = async () => {
  try {
    // 构建保存数据数组
    const saveData = [];
    const userName = localStorage.getItem("userName");
    
    questions.value.forEach((question) => {
      const questionId = question.id;
      const studentAnswer = userAnswers.value[questionId] || "";
      
      // 构建保存数据对象
      const answerData = {
        exam_history_id: assessmentInfo.value.exam_history_id,
        question_id: questionId,
        student: userName,
        student_answer: studentAnswer.trim() !== "" ? studentAnswer : "未作答",
        image_url: "" // 如果有图片答案，可以在这里添加
      };
      
      saveData.push(answerData);
    });
    
    // 如果有答案需要保存
    if (saveData.length > 0) {
      const response = await axios.post(`${API_BASE}/exam/autosaveAnswer`, saveData);
      
      if (response.data.code === 200) {
      } else {
        console.warn("答案自动保存失败:", response.data.message);
      }
    }
  } catch (error) {
    console.error("自动保存答案失败:", error);
    // 这里不抛出错误，因为自动保存失败不应该阻止提交
    ElMessage.warning("答案保存失败，但不影响提交");
  }
};

// 获取批改结果
const getGradingResult = async () => {
  try {
    const response = await axios.get(`${API_BASE}/exam/getAnswerRecord/${assessmentInfo.value.exam_id}`);
    
    if (response.data.code === 200 && response.data.data) {
      const allRecords = response.data.data;
      
      // 获取用户名
      const userName = localStorage.getItem("userName");
      
      // 查找当前用户的记录
      let userRecord = null;
      for (const record of allRecords) {
        if (record.answer_records && record.answer_records.length > 0) {
          const firstRecord = record.answer_records[0];
          if (firstRecord.student === userName) {
            userRecord = record;
            break;
          }
        }
      }
      
      if (userRecord) {
        // 计算总分和最大分
        let totalScore = 0;
        let maxScore = 0;
        
        // 处理每道题的得分
        const processedAnswerRecords = userRecord.answer_records?.map((record, index) => {
          const autoMarking = userRecord.auto_markings?.[index] || 0;
          const questionScore = userRecord.scores?.[index] || 0;
          
          // 根据auto_markings确定最终得分
          let finalScore = 0;
          let isCorrect = null;
          
          if (autoMarking === 0) {
            // 0分
            finalScore = 0;
            isCorrect = 0; // 错误
          } else if (autoMarking > 0 && autoMarking <= questionScore) {
            // 其他值代表对应分数
            finalScore = autoMarking;
            isCorrect = autoMarking === questionScore ? 1 : 0; // 满分才算正确
          }
          
          // 更新总分
          totalScore += finalScore;
          maxScore += questionScore;
          
          // 构建处理后的记录
          return {
            ...record,
            is_correct: isCorrect,
            score: finalScore,
            feedback: finalScore === 0 ? "回答错误" : `得分：${finalScore}分`,
            fullScore: questionScore // 添加满分信息
          };
        }) || [];
        
        // 构建题目得分详情
        const questionScores = processedAnswerRecords.map((record, index) => {
          const score = record.score || 0;
          const fullScore = record.fullScore || 0;
          const scoreRate = fullScore > 0 ? Math.round((score / fullScore) * 100) : 0;
          
          return {
            score,
            fullScore,
            scoreRate,
            isCorrect: record.is_correct
          };
        });
        
        gradingResult.value = {
          totalScore,
          maxScore,
          questionScores,
          answerRecords: processedAnswerRecords,
          autoMarkings: userRecord.auto_markings || [],
          scores: userRecord.scores || []
        };
      }
    }
  } catch (error) {
    console.error("获取批改结果失败:", error);
    throw error;
  }
};

// ==================== 页面导航 ====================
const viewAssessmentReport = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  router.push({
    path: "/student/exammanagement/studentviewresults",
    query: {
      examId: assessmentInfo.value.exam_id,
      exam_name: assessmentInfo.value.exam_name,
      student: userInfo.account || localStorage.getItem("userName") || "",
    },
  });
};

const returnToSelfExercise = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  router.push({
    path: "/student/selfexercise",
    query: {
      examId: assessmentInfo.value.exam_id,
      exam_name: assessmentInfo.value.exam_name,
      student: userInfo.account || localStorage.getItem("userName") || "",
    },
  });
};

// ==================== 工具函数 ====================
const formatExamName = (name) => {
  if (!name) return name;

  return name.replace(
    /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).*/,
    '$1 $2'
  );
};

// ==================== 浏览器事件处理 ====================
const handleBeforeUnload = (e) => {
  if (assessmentSubmitted.value) return;

  if (questions.value.length > 0) {
    saveAnswer(currentQuestion.value.id);
    
    e.preventDefault();
    e.returnValue = "评测尚未提交，确定要离开吗？";
  }
};

const examSubmitted = ref(false); // 防止重复提交
// 添加路由守卫
onBeforeRouteLeave(async (to, from, next) => {
  if (examSubmitted.value) {
    next();
    return;
  }

  try {
    await autoSaveAnswers();

    await ElMessageBox.confirm(
      "正在离开考试，离开后将自动提交试卷。确定要离开吗？",
      "离开考试确认",
      {
        confirmButtonText: "确定离开并提交",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await autoSubmitAssessment();
    next(false);
  } catch {
    next(false);
  }
});

onMounted(() => {
  loadAssessmentData();
  startTimer();
  
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
  
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped>
.assessment-container {
  max-width: 2000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* ==================== 评测头部样式 ==================== */
.assessment-header {
  background: white;
  border-radius: 12px;
  padding: 20px 30px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}

.assessment-header-content {
  flex: 1;
}

.assessment-title {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.assessment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  color: #909399;
  font-size: 14px;
}

.meta-value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

/* 评测计时器 */
.assessment-timer {
  min-width: 220px;
  text-align: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  border-radius: 10px;
  padding: 15px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timer-display {
  margin-bottom: 10px;
}

.timer-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.timer-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  font-family: monospace;
}

.timer-value.time-warning {
  color: #e6a23c;
}

.timer-value.time-danger {
  color: #ff4d4f !important;
  animation: dangerPulse 0.5s infinite;
}

@keyframes dangerPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.timer-progress {
  height: 8px;
  background-color: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.timer-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #3375e0 100%);
  transition: width 1s linear;
}

.timer-progress-bar.progress-warning {
  background: linear-gradient(90deg, #e6a23c 0%, #d48806 100%);
}

.timer-progress-bar.progress-danger {
  background: linear-gradient(90deg, #ff4d4f 0%, #d9363e 100%) !important;
  animation: progressPulse 1s infinite;
}

@keyframes progressPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* ==================== 评测主体样式 ==================== */
.assessment-body {
  display: flex;
  gap: 24px;
}

.assessment-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e9f0;
}

.sidebar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.answered-count {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
  background-color: #ecf5ff;
  padding: 4px 10px;
  border-radius: 4px;
}

/* 题目导航 */
.question-nav {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  position: relative;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.nav-item:hover {
  background-color: #e4e8f0;
  transform: translateY(-2px);
}

.nav-item.current {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.nav-item.answered {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #e1f3d8;
}

.nav-item.marked {
  border-color: #e6a23c;
}

.nav-mark {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 12px;
  color: #e6a23c;
}

/* 侧边栏操作按钮 */
.sidebar-actions {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e6e9f0;
}

.btn-mark {
  width: 100%;
  padding: 10px;
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-mark:hover {
  background-color: #e4e8f0;
}

.btn-mark.active {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-color: #f5d8a8;
}

/* 侧边栏底部 */
.sidebar-footer {
  margin-top: auto;
}

.btn-submit-assessment {
  width: 100%;
  padding: 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.btn-submit-assessment:hover {
  background-color: #3375e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.legend {
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: #909399;
}

.legend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.legend-color.current {
  background-color: #409eff;
}

.legend-color.answered {
  background-color: #67c23a;
}

.legend-color.marked {
  background-color: #e6a23c;
}

/* ==================== 评测内容区域 ==================== */
.assessment-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 600px;
}

/* 题目区域 */
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e9f0;
}

.question-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.question-number {
  color: #409eff;
  white-space: nowrap;
}

.question-difficulty {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star {
  color: #dcdfe6;
  font-size: 16px;
  transition: color 0.2s;
}

.star.filled {
  color: #ffc107;
}

.star.half-filled {
  background: linear-gradient(90deg, #ffc107 50%, #dcdfe6 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.question-type {
  font-size: 14px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

.question-content {
  margin-bottom: 40px;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 30px;
  white-space: pre-wrap;
}

.question-image {
  margin: 20px 0;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 选项区域 */
.options-area {
  margin: 30px 0;
}

.option-item {
  margin-bottom: 15px;
  padding: 16px 20px;
  background-color: #f5f7fa;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background-color: #ecf5ff;
  border-color: #d9ecff;
  transform: translateY(-2px);
}

.option-item.selected {
  background-color: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.option-selector {
  display: flex;
  align-items: center;
}

.option-letter {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 50%;
  margin-right: 15px;
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
}

.option-item.selected .option-letter {
  background-color: #409eff;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
  color: #303133;
}

/* 题目操作按钮 */
.question-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

.btn-prev,
.btn-next {
  padding: 10px 20px;
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 120px;
}

.btn-prev:hover:not(:disabled),
.btn-next:hover:not(:disabled) {
  background-color: #e4e8f0;
}

.btn-prev:disabled,
.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

.large-modal {
  max-width: 600px;
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
  font-size: 20px;
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

/* 提交确认模态框 */
.submit-warning {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.warning-content p {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.warning-content p:first-child {
  font-weight: 600;
}

.time-remaining {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #409eff;
}

.time-overdue {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #f56c6c;
}

.answered-stats {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.answered-stats div {
  text-align: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-weight: 600;
  color: #409eff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-cancel:hover {
  background-color: #e4e8f0;
}

.btn-confirm {
  background-color: #409eff;
  color: white;
  border: none;
}

.btn-confirm:hover {
  background-color: #3375e0;
}

/* 评测结果模态框 */
.result-content {
  text-align: center;
  padding: 20px 0;
}

.result-message {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.result-subtitle {
  font-size: 16px;
  color: #909399;
  margin-bottom: 30px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 10px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-view-report,
.btn-return {
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-view-report {
  background-color: #409eff;
  color: white;
}

.btn-view-report:hover {
  background-color: #3375e0;
  transform: translateY(-2px);
}

.btn-return {
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-return:hover {
  background-color: #e4e8f0;
  transform: translateY(-2px);
}

/* 批改结果查看样式 */
.grading-content {
  text-align: center;
}

.overall-score {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  border: 1px solid #d9ecff;
}

.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.score-label {
  font-size: 16px;
  color: #606266;
}

.score-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.actual-score {
  font-size: 36px;
  font-weight: 700;
  color: #409eff;
}

.score-separator {
  font-size: 24px;
  color: #909399;
  margin: 0 4px;
}

.max-score {
  font-size: 24px;
  color: #303133;
}

.score-progress {
  height: 8px;
  background-color: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #3375e0 100%);
  border-radius: 4px;
  transition: width 1s ease;
}

.score-percentage {
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
}

.question-scores {
  text-align: left;
  margin: 24px 0;
}

.question-scores h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.scores-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.score-item {
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
  border: 1px solid #e6e9f0;
  text-align: center;
  transition: all 0.2s;
}

.score-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.score-excellent {
  background: #f0f9eb;
  border-color: #67c23a;
}

.score-good {
  background: #ecf5ff;
  border-color: #409eff;
}

.score-average {
  background: #fdf6ec;
  border-color: #e6a23c;
}

.score-poor {
  background: #fef0f0;
  border-color: #f56c6c;
}

.score-item-number {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.score-item-value {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 2px;
}

.score-item-rate {
  font-size: 12px;
  font-weight: 500;
}

.grading-details {
  text-align: left;
  margin-top: 24px;
  border-top: 1px solid #e6e9f0;
  padding-top: 20px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.details-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.btn-toggle-details {
  background: none;
  border: 1px solid #dcdfe6;
  color: #606266;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-toggle-details:hover {
  background-color: #f5f7fa;
}

.details-content {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  padding: 12px;
}

.detail-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e6e9f0;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e6e9f0;
}

.detail-number {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.detail-score {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.detail-correct {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.detail-correct.correct {
  background: #f0f9eb;
  color: #67c23a;
}

.detail-correct.incorrect {
  background: #fef0f0;
  color: #f56c6c;
}

.detail-body {
  font-size: 13px;
}

.detail-row {
  margin-bottom: 4px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #909399;
  font-weight: 500;
  min-width: 60px;
  display: inline-block;
}

.detail-value {
  color: #303133;
  word-break: break-all;
}

/* ==================== 倒计时样式 ==================== */
.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: none;
}

.countdown-content {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 30px 50px;
  border-radius: 20px;
  text-align: center;
  animation: countdownPulse 1s infinite;
}

@keyframes countdownPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 40px rgba(255, 0, 0, 0.8);
  }
}

.countdown-number {
  font-size: 48px;
  font-weight: bold;
  color: #ff4d4f;
  margin-bottom: 10px;
}

.countdown-text {
  font-size: 18px;
  color: #fff;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .assessment-body {
    flex-direction: column;
  }

  .assessment-sidebar {
    width: 100%;
    order: 2;
  }

  .assessment-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .assessment-container {
    padding: 16px;
  }

  .assessment-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .assessment-timer {
    width: 100%;
  }

  .assessment-content {
    padding: 20px;
  }

  .question-actions {
    flex-direction: column;
    gap: 15px;
  }

  .btn-prev,
  .btn-next {
    min-width: 100px;
  }

  .result-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .result-actions {
    flex-direction: column;
    gap: 15px;
  }

  .answered-stats {
    grid-template-columns: 1fr;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .question-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .timer-value {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .question-nav {
    grid-template-columns: repeat(4, 1fr);
  }

  .assessment-title {
    font-size: 20px;
  }

  .timer-value {
    font-size: 24px;
  }

  .modal-content {
    padding: 20px;
  }
}
</style>