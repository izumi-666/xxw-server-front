<template>
  <div class="exam-container">
    <!-- 考试头部信息 -->
    <div class="exam-header card">
      <div class="exam-header-content">
        <h1 class="exam-title">{{ examInfo.examName || "在线考试" }}</h1>
        <div class="exam-meta">
          <div class="meta-item">
            <span class="meta-label">试卷：</span>
            <span class="meta-value">{{ examInfo.paperName || "-" }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">总分：</span>
            <span class="meta-value">{{ examInfo.paperScore }}分</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">题量：</span>
            <span class="meta-value">{{ questions.length }}题</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">考试时长：</span>
            <span class="meta-value">{{ examDuration }}</span>
          </div>
        </div>
      </div>

      <!-- 考试计时器 -->
      <div class="exam-timer">
        <div class="timer-display">
          <div class="timer-label">剩余时间</div>
          <div
            class="timer-value"
            :class="{ warning: remainingTime < 300 && remainingTime > 0 }"
          >
            {{ formatTime(remainingTime) }}
          </div>
        </div>
        <div class="timer-progress">
          <div
            class="timer-progress-bar"
            :style="{ width: timeProgress + '%' }"
            :class="{ warning: remainingTime < 300 && remainingTime > 0 }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 考试主体 -->
    <div class="exam-body">
      <!-- 左侧题目导航 -->
      <div class="exam-sidebar card">
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
          <button class="btn-submit-exam" @click="showSubmitConfirm = true">
            提交试卷
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
      <div class="exam-content card">
        <!-- 题目显示区域 -->
        <div class="question-area" v-if="questions.length > 0 && currentQuestion">
          <div class="question-header">
            <div class="question-title">
              <span class="question-number">第{{ currentQuestionIndex + 1 }}题</span>
              <span class="question-score" v-if="currentQuestion.score"
                >（{{ currentQuestion.score }}分）</span
              >
            </div>
            <div class="question-type">
              {{ getQuestionCategoryText(currentQuestion.question_category_id) }}
            </div>
          </div>

          <div class="question-content">
            <div
              class="question-text"
              v-html="markdownToHtml(currentQuestion.title)"
            ></div>

            <!-- 题目图片（如果有） -->
            <div class="question-image" v-if="currentQuestion.image_url">
              <img :src="currentQuestion.image_url" alt="题目图片" />
            </div>

            <!-- 选项区域 -->
            <div
              class="options-area"
              v-if="
                currentQuestion.options && Object.keys(currentQuestion.options).length > 0
              "
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
                  <div class="option-letter">{{ key }}</div>
                  <div class="option-text" v-html="markdownToHtml(option)"></div>
                </div>
              </div>
            </div>

            <!-- 简答题区域 - 使用手写板 -->
            <div
              class="short-answer-area"
              v-if="
                currentQuestion.question_category_id === 3 ||
                currentQuestion.question_category_id === 4 ||
                currentQuestion.question_category_id === 5 ||
                currentQuestion.question_category_id === 6
              "
            >
              <!-- 输入方式选择 -->
              <div class="input-method-selector">
                <label
                  class="method-option"
                  :class="{ active: inputMethod === 'handwriting' }"
                >
                  <input
                    type="radio"
                    v-model="inputMethod"
                    value="handwriting"
                    @change="onInputMethodChange"
                  />
                  <span>手写输入</span>
                </label>
                <label class="method-option" :class="{ active: inputMethod === 'upload' }">
                  <input
                    type="radio"
                    v-model="inputMethod"
                    value="upload"
                    @change="onInputMethodChange"
                  />
                  <span>上传图片</span>
                </label>
              </div>

              <!-- 手写板输入 -->
              <div v-if="inputMethod === 'handwriting'" class="handwriting-section">
                <HandwritingBoard
                  ref="handwritingBoardRef"
                  :question-id="currentQuestion.id"
                  :initial-image="getCurrentQuestionImage()"
                  :key="`handwriting_${currentQuestion.id}_${userImages[currentQuestion.id] || 'empty'}`"
                  :width="1000"
                  :height="500"
                  @save="handleHandwritingSave"
                  @clear="handleHandwritingClear"
                  @uploaded="handleHandwritingUploaded"
                />
              </div>

              <!-- 图片上传输入 -->
              <div v-else-if="inputMethod === 'upload'" class="image-upload-section">
                <div class="section-title">
                  <span>图片答案</span>
                  <span class="upload-tip">（支持 JPG、PNG 格式，最大5MB）</span>
                </div>

                <div class="upload-area">
                  <div
                    class="upload-btn"
                    @click="triggerImageUpload"
                    :class="{ 'has-image': hasImageForCurrentQuestion }"
                  >
                    <div v-if="!hasImageForCurrentQuestion" class="upload-placeholder">
                      <i class="el-icon-picture"></i>
                      <div class="upload-text">点击上传图片</div>
                      <div class="upload-hint">支持 JPG、PNG 格式，最大5MB</div>
                    </div>
                    <div v-else class="image-preview">
                      <img :src="getCurrentQuestionImage()" alt="上传的图片" />
                      <div class="image-overlay">
                        <button class="btn-change" @click.stop="triggerImageUpload">
                          更换图片
                        </button>
                        <button class="btn-remove" @click.stop="removeCurrentImage">
                          删除
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref="imageInput"
                    @change="handleImageUpload"
                    accept="image/*"
                    style="display: none"
                  />
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

            <div class="question-nav-buttons">
              <button
                v-if="currentQuestionIndex > 0"
                class="btn-nav"
                @click="goToQuestion(0)"
              >
                第一题
              </button>
              <button
                class="btn-mark-bottom"
                :class="{ active: isCurrentQuestionMarked }"
                @click="toggleMarkCurrentQuestion"
              >
                {{ isCurrentQuestionMarked ? "取消标记" : "标记" }}
              </button>
              <button
                v-if="currentQuestionIndex < questions.length - 1"
                class="btn-nav"
                @click="goToQuestion(questions.length - 1)"
              >
                最后一题
              </button>
            </div>

            <button
              class="btn-next"
              :disabled="currentQuestionIndex === questions.length - 1"
              @click="goToQuestion(currentQuestionIndex + 1)"
            >
              下一题 →
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div class="loading-area" v-else-if="loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载试题...</div>
        </div>

        <!-- 无题目状态 -->
        <div class="empty-area" v-else>
          <div class="empty-text">暂无试题</div>
        </div>
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
          <h3 class="modal-title">提交试卷</h3>
          <button @click="showSubmitConfirm = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="submit-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <p>您确定要提交试卷吗？</p>
              <p>提交后无法继续答题</p>
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
                <div>
                  上传图片：<span class="stat-value">{{ totalUploadedImages }}张</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showSubmitConfirm = false">取消</button>
          <button class="btn-confirm" @click="submitExam">确认提交</button>
        </div>
      </div>
    </div>

    <!-- 考试结束模态框 -->
    <div v-if="showExamResult" class="modal-overlay" @click.self="showExamResult = false">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3 class="modal-title">考试结束</h3>
          <button @click="showExamResult = false" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <div class="result-content">
            <div class="result-icon">🎉</div>
            <div class="result-message">您已成功提交试卷！</div>

            <div class="result-stats">
              <div class="stat-item">
                <div class="stat-label">答题情况</div>
                <div class="stat-value">{{ answeredCount }}/{{ questions.length }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">考试用时</div>
                <div class="stat-value">
                  {{ formatTime(displayExamDuration) }}
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">标记题目</div>
                <div class="stat-value">{{ markedQuestions.length }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">上传图片</div>
                <div class="stat-value">{{ totalUploadedImages }}张</div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn-return" @click="returnToExamList">返回考试列表</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { onBeforeRouteLeave } from "vue-router";
import { getBeijingTime } from "../utils/chinaTime";
import { getQuestionCategoryText } from "../utils/questionCategory";
import ImageUploadTool from "../utils/imageUpload";
import { markdownToHtml } from "../utils/markdownUtils";
import HandwritingBoard from "../utils/HandwritingBoard.vue";

const route = useRoute();
const router = useRouter();
const examHistoryId = ref(route.query.examHistoryId);
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 数据状态 ==================== */
const questions = ref([]);
const currentQuestionIndex = ref(0);
const userAnswers = ref({});
const userImages = ref({});
const markedQuestions = ref([]);
const loading = ref(true);
const showSubmitConfirm = ref(false);
const showExamResult = ref(false);
const inputMethod = ref("handwriting");
const handwritingBoardRef = ref(null);
const imageInput = ref(null);
const isUploading = ref(false);
const isSwitchingMethod = ref(false);

const examInfo = ref({
  examName: "",
  paperName: "",
  paperScore: 0,
  examId: "",
  paper_id: "",
  start_time: "",
  duration: 0,
});

// 考试时间相关
const examDurationSeconds = ref(0);
const remainingTime = ref(0);
const examStartTime = ref(null);
const actualExamDuration = ref(0);

const timeProgress = computed(() => {
  if (examDurationSeconds.value === 0) return 0;
  return (
    ((examDurationSeconds.value - remainingTime.value) / examDurationSeconds.value) * 100
  );
});
let timer = null;
let autoSaveTimer = null;
const examSubmitted = ref(false);

/* ==================== 计算属性 ==================== */
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null;
});

const hasImageForCurrentQuestion = computed(() => {
  if (!currentQuestion.value) return false;
  return !!userImages.value[currentQuestion.value.id];
});

const totalUploadedImages = computed(() => {
  return Object.keys(userImages.value).length;
});

const isQuestionAnswered = (questionId) => {
  const question = questions.value.find((q) => q.id === questionId);
  if (question && [3, 4, 5, 6].includes(question.question_category_id)) {
    return !!userImages.value[questionId];
  }
  const hasAnswer =
    userAnswers.value[questionId] && userAnswers.value[questionId].trim() !== "";
  return hasAnswer || !!userImages.value[questionId];
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

const examDuration = computed(() => {
  const hours = Math.floor(examDurationSeconds.value / 3600);
  const minutes = Math.floor((examDurationSeconds.value % 3600) / 60);

  if (hours === 0) {
    return `${minutes}分钟`;
  } else if (minutes === 0) {
    return `${hours}小时`;
  } else {
    return `${hours}小时${minutes}分钟`;
  }
});

// 显示用的考试用时（已用时间）
const displayExamDuration = computed(() => {
  // 如果已经提交，使用 actualExamDuration
  if (examSubmitted.value && actualExamDuration.value > 0) {
    return actualExamDuration.value;
  }
  // 如果还没有提交，计算当前已用时间
  if (examStartTime.value) {
    const now = getBeijingTime();
    const elapsed = Math.floor((now - examStartTime.value) / 1000);
    return Math.min(Math.max(0, elapsed), examDurationSeconds.value);
  }
  // 降级方案：用总时长减去剩余时间
  const elapsed = examDurationSeconds.value - remainingTime.value;
  return Math.max(0, elapsed);
});

/* ==================== 清除当前题目答案 ==================== */
const clearCurrentQuestionAnswer = async () => {
  const questionId = currentQuestion.value.id;
  
  if (userImages.value[questionId]) {
    delete userImages.value[questionId];
  }
  
  if (userAnswers.value[questionId]) {
    userAnswers.value[questionId] = "";
  }
  
  saveImageToLocalStorage();
  saveAnswer(questionId);
  await autoSaveSingleAnswer(questionId);
};

/* ==================== 手写板相关方法 ==================== */
const onInputMethodChange = async () => {
  const oldMethod = inputMethod.value === "handwriting" ? "upload" : "handwriting";
  const newMethod = inputMethod.value;
  const hasExistingAnswer = hasImageForCurrentQuestion.value;
  
  if (hasExistingAnswer && !isSwitchingMethod.value) {
    isSwitchingMethod.value = true;
    
    try {
      await ElMessageBox.confirm(
        `切换输入方式将会清空当前题目的已有答案，确定要切换到${newMethod === "handwriting" ? "手写输入" : "图片上传"}吗？`,
        "切换确认",
        {
          confirmButtonText: "确定切换",
          cancelButtonText: "取消",
          type: "warning",
        }
      );
      
      await clearCurrentQuestionAnswer();
      ElMessage.info(`已切换到${newMethod === "handwriting" ? "手写输入" : "图片上传"}，原有答案已清空`);
      
    } catch {
      inputMethod.value = oldMethod;
      isSwitchingMethod.value = false;
      return;
    }
    
    isSwitchingMethod.value = false;
  }
  
  nextTick(() => {
    if (inputMethod.value === "handwriting" && handwritingBoardRef.value) {
      const currentImage = getCurrentQuestionImage();
      if (currentImage) {
        handwritingBoardRef.value.loadImage(currentImage);
      } else {
        handwritingBoardRef.value.resetCanvas();
      }
    }
  });
};

const handleHandwritingSave = async (imageUrl, questionId) => {
  if (!imageUrl) {
    ElMessage.error("保存失败：未获取到图片地址");
    return;
  }

  userAnswers.value[questionId] = "";
  userImages.value[questionId] = imageUrl;

  saveImageToLocalStorage();
  await autoSaveSingleAnswer(questionId);

  ElMessage.success("答案已保存");
};

const handleHandwritingUploaded = (imageUrl) => {
  const questionId = currentQuestion.value.id;
  userImages.value[questionId] = imageUrl;
  saveImageToLocalStorage();
};

const handleHandwritingClear = (questionId) => {
  if (userImages.value[questionId]) {
    delete userImages.value[questionId];
    saveImageToLocalStorage();
  }
};

/* ==================== 图片上传相关方法 ==================== */
const triggerImageUpload = () => {
  if (!currentQuestion.value) return;
  if (isUploading.value) {
    ElMessage.warning("正在上传图片，请稍候");
    return;
  }
  imageInput.value.click();
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isUploading.value = true;

  try {
    ElMessage.info("图片正在上传...");
    const imageUrl = await ImageUploadTool.uploadImage(file);

    const questionId = currentQuestion.value.id;
    userImages.value[questionId] = imageUrl;
    userAnswers.value[questionId] = "";

    saveImageToLocalStorage();
    await autoSaveSingleAnswer(questionId);

    ElMessage.success("图片上传成功");
  } catch (error) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请重试");
  } finally {
    isUploading.value = false;
    event.target.value = "";
  }
};

const getCurrentQuestionImage = () => {
  if (!currentQuestion.value) return "";
  return userImages.value[currentQuestion.value.id] || "";
};

const removeCurrentImage = async () => {
  if (!currentQuestion.value) return;
  const questionId = currentQuestion.value.id;
  if (userImages.value[questionId]) {
    delete userImages.value[questionId];
    saveImageToLocalStorage();
    await autoSaveSingleAnswer(questionId);
    ElMessage.success("图片已移除");
  }
};

const saveImageToLocalStorage = () => {
  localStorage.setItem(
    `exam_${examInfo.value.examId}_images`,
    JSON.stringify(userImages.value)
  );
};

const loadImagesFromLocalStorage = () => {
  const savedImages = localStorage.getItem(`exam_${examInfo.value.examId}_images`);
  if (savedImages) {
    try {
      userImages.value = JSON.parse(savedImages);
    } catch (e) {
      console.error("加载图片数据失败:", e);
      userImages.value = {};
    }
  }
};

/* ==================== 数据加载 ==================== */
const loadPaperInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE}/paper/getPaperList`);
    if (response.data.code === 200) {
      const paperList = response.data.data || [];
      const paperId = parseInt(examInfo.value.paper_id);
      const currentPaper = paperList.find((paper) => paper.id === paperId);
      if (currentPaper) {
        examInfo.value.paperName = currentPaper.name;
        examInfo.value.paperScore = currentPaper.total_score;
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("获取试卷信息失败:", error);
    return false;
  }
};

const loadQuestions = async () => {
  try {
    loading.value = true;
    await loadPaperInfo();

    const res = await axios.get(
      `${API_BASE}/paper/getQuestionsByPaperId/${examInfo.value.paper_id}`
    );

    if (res.data.code === 200) {
      let questionsData = res.data.data || [];
      questionsData = questionsData.map((question) => {
        if (question.options && typeof question.options === "string") {
          try {
            question.options = JSON.parse(question.options);
          } catch (e) {
            question.options = {};
          }
        }
        if (question.options && typeof question.options === "object") {
          const formattedOptions = {};
          Object.keys(question.options).forEach((key, index) => {
            const letter = String.fromCharCode(65 + index);
            formattedOptions[letter] = question.options[key];
          });
          question.options = formattedOptions;
        }
        question.score = Number(question.score) || 0;
        return question;
      });

      questions.value = questionsData;
      const answers = {};
      questions.value.forEach((question) => {
        const savedAnswer = localStorage.getItem(
          `exam_${examInfo.value.examId}_answer_${question.id}`
        );
        if (savedAnswer !== null) {
          answers[question.id] = savedAnswer;
        }
      });
      userAnswers.value = answers;

      const savedMarks = localStorage.getItem(`exam_${examInfo.value.examId}_marks`);
      if (savedMarks) {
        markedQuestions.value = JSON.parse(savedMarks);
      }

      loadImagesFromLocalStorage();

      if (route.query.paperName) {
        examInfo.value.paperName = decodeURIComponent(route.query.paperName);
      }
    } else {
      ElMessage.error("加载试题失败: " + (res.data.message || "未知错误"));
    }
  } catch (error) {
    console.error("加载试题失败:", error);
    ElMessage.error("加载试题失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

/* ==================== 计时器相关 ==================== */
const initExamTimer = () => {
  examDurationSeconds.value = examInfo.value.duration * 60;

  if (examInfo.value.start_time) {
    const startTime = new Date(examInfo.value.start_time);
    const now = getBeijingTime();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    remainingTime.value = Math.max(examDurationSeconds.value - elapsedSeconds, 0);
    examStartTime.value = startTime;
    if (remainingTime.value <= 0) {
      autoSubmitExam();
      return;
    }
  } else {
    examInfo.value.start_time = new Date().toISOString();
    examStartTime.value = new Date();
    remainingTime.value = examDurationSeconds.value;
  }

  startTimer();
};

const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--;
      if (remainingTime.value === 300) {
        ElMessage.warning("距离考试结束还有5分钟，请尽快完成答题！");
      }
      if (remainingTime.value === 0) {
        clearInterval(timer);
        autoSubmitExam();
      }
    }
  }, 1000);
};

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === undefined || seconds === null) {
    seconds = 0;
  }
  seconds = Math.max(0, Number(seconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatDateTimeToYMDHMS = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

/* ==================== 题目操作 ==================== */
const goToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentQuestionIndex.value = index;

    nextTick(() => {
      if (inputMethod.value === "handwriting" && handwritingBoardRef.value) {
        const currentImage = getCurrentQuestionImage();
        if (currentImage) {
          handwritingBoardRef.value.loadImage(currentImage);
        } else {
          handwritingBoardRef.value.resetCanvas();
        }
      }
    });
  }
};

const selectOption = (optionKey) => {
  if (!currentQuestion.value) return;
  const questionId = currentQuestion.value.id;
  const optionValue = optionKey;

  if (currentQuestion.value.question_category_id === 1) {
    userAnswers.value[questionId] = optionValue;
  } else if (currentQuestion.value.question_category_id === 2) {
    const currentAnswer = userAnswers.value[questionId] || "";
    if (currentAnswer.includes(optionValue)) {
      userAnswers.value[questionId] = currentAnswer.replace(optionValue, "");
    } else {
      userAnswers.value[questionId] = currentAnswer + optionValue;
    }
  }
  saveAnswer(questionId);
};

const isOptionSelected = (optionKey) => {
  if (!currentQuestion.value) return false;
  const questionId = currentQuestion.value.id;
  const optionValue = optionKey;
  const currentAnswer = userAnswers.value[questionId];
  if (!currentAnswer) return false;
  return currentAnswer.includes(optionValue);
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
    `exam_${examInfo.value.examId}_marks`,
    JSON.stringify(markedQuestions.value)
  );
};

/* ==================== 答案保存相关 ==================== */
const saveAnswer = (questionId) => {
  localStorage.setItem(
    `exam_${examInfo.value.examId}_answer_${questionId}`,
    userAnswers.value[questionId] || ""
  );
};

const getCurrentStudent = () => {
  return localStorage.getItem("userName") || "unknown_student";
};

const autoSaveSingleAnswer = async (questionId) => {
  try {
    const student = getCurrentStudent();
    const answer = userAnswers.value[questionId] || "";
    const imageUrl = userImages.value[questionId] || null;

    const saveData = {
      exam_history_id: examHistoryId.value,
      question_id: questionId,
      student: student,
      student_answer: answer.trim() !== "" ? answer : (imageUrl ? " " : "未作答"),
      image_url: imageUrl,
    };

    await axios.post(`${API_BASE}/exam/autosaveSingleAnswer`, saveData, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("保存答案失败:", error);
  }
};

const autoSaveAnswers = async () => {
  try {
    const student = getCurrentStudent();
    const saveData = [];
    questions.value.forEach((question) => {
      const questionId = question.id;
      const answer = userAnswers.value[questionId] || "";
      const imageUrl = userImages.value[questionId] || null;
      saveData.push({
        exam_history_id: examHistoryId.value,
        question_id: questionId,
        student: student,
        student_answer: answer.trim() !== "" ? answer : (imageUrl ? " " : "未作答"),
        image_url: imageUrl,
      });
    });
    await axios.post(`${API_BASE}/exam/autosaveAnswer`, saveData, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("自动保存失败:", error);
  }
};

const startAutoSaveTimer = () => {
  autoSaveTimer = setInterval(async () => {
    try {
      await autoSaveAnswers();
    } catch (error) {
      console.error("自动保存失败:", error);
    }
  }, 5 * 60 * 1000);
};

/* ==================== 考试提交相关 ==================== */
const submitExam = async () => {
  try {
    // 计算实际考试用时
    if (examStartTime.value) {
      const submitTime = getBeijingTime();
      actualExamDuration.value = Math.floor((submitTime - examStartTime.value) / 1000);
      actualExamDuration.value = Math.max(0, actualExamDuration.value);
      actualExamDuration.value = Math.min(actualExamDuration.value, examDurationSeconds.value);
    } else if (remainingTime.value > 0) {
      actualExamDuration.value = examDurationSeconds.value - remainingTime.value;
      actualExamDuration.value = Math.max(0, actualExamDuration.value);
    } else {
      actualExamDuration.value = examDurationSeconds.value;
    }
    
    await autoSaveAnswers();
    const response = await axios.post(`${API_BASE}/exam/submitExam`, {
      id: examHistoryId.value,
      submit_time: formatDateTimeToYMDHMS(),
    });
    if (response.data.code === 200) {
      questions.value.forEach((question) => {
        localStorage.removeItem(`exam_${examInfo.value.examId}_answer_${question.id}`);
      });
      localStorage.removeItem(`exam_${examInfo.value.examId}_marks`);
      localStorage.removeItem(`exam_${examInfo.value.examId}_images`);
      if (timer) clearInterval(timer);
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      showSubmitConfirm.value = false;
      showExamResult.value = true;
      examSubmitted.value = true;
      ElMessage.success("试卷提交成功！");
    } else {
      ElMessage.error("提交试卷失败: " + response.data.message);
    }
  } catch (error) {
    console.error("提交试卷失败:", error);
    ElMessage.error("提交试卷失败");
  }
};

const autoSubmitExam = async () => {
  if (examSubmitted.value) return;
  examSubmitted.value = true;
  try {
    await ElMessageBox.alert("考试时间到，系统将自动提交试卷", "考试结束", {
      confirmButtonText: "确定",
    });
    if (timer) clearInterval(timer);
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    await submitExam();
  } catch (error) {
    await submitExam();
  }
};

const returnToExamList = () => {
  router.push("/student/exammanagement");
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  examInfo.value.examId = route.query.examId;
  examInfo.value.paper_id = route.query.paper_id;
  examInfo.value.start_time = route.query.start_time;
  examInfo.value.duration = parseInt(route.query.duration) || 120;
  
  // 初始化 examStartTime
  if (examInfo.value.start_time) {
    examStartTime.value = new Date(examInfo.value.start_time);
  } else {
    examStartTime.value = new Date();
  }
  
  if (route.query.exam_name) {
    examInfo.value.examName = decodeURIComponent(route.query.exam_name);
  }
  if (!examInfo.value.paper_id) {
    ElMessage.error("试卷ID不存在");
    router.push("/student/exammanagement");
    return;
  }
  loadQuestions();
  initExamTimer();
  startAutoSaveTimer();
  window.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("visibilitychange", handleVisibilityChange);
});

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
    await submitExam();
    next();
  } catch {
    next(false);
  }
});

const handleBeforeUnload = (e) => {
  if (examSubmitted.value) return;
  if (questions.value.length > 0 && remainingTime.value > 0) {
    saveImageToLocalStorage();
    e.preventDefault();
    e.returnValue = "";
  }
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    ElMessage.warning("检测到您切换了标签页，请专注考试！");
    saveImageToLocalStorage();
  }
};
</script>

<style scoped>
.exam-container {
  max-width: 2000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.exam-header {
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

.exam-header-content {
  flex: 1;
}

.exam-title {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.exam-meta {
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

.exam-timer {
  min-width: 200px;
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

.timer-value.warning {
  color: #e6a23c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
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

.timer-progress-bar.warning {
  background: linear-gradient(90deg, #e6a23c 0%, #d48806 100%);
}

.exam-body {
  display: flex;
  gap: 24px;
}

.exam-sidebar {
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

.sidebar-footer {
  margin-top: auto;
}

.btn-submit-exam {
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

.btn-submit-exam:hover {
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

.exam-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 600px;
}

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
}

.question-number {
  color: #409eff;
}

.question-score {
  color: #e6a23c;
}

.question-type {
  font-size: 14px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 4px 10px;
  border-radius: 4px;
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

.short-answer-area {
  margin: 30px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-method-selector {
  display: flex;
  gap: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 10px;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  border: 1px solid #dcdfe6;
}

.method-option:hover {
  border-color: #409eff;
  transform: translateY(-1px);
}

.method-option.active {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.method-option input {
  margin: 0;
  cursor: pointer;
}

.method-option span {
  font-size: 14px;
  font-weight: 500;
}

.handwriting-section {
  margin-top: 10px;
}

.image-upload-section {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 20px;
  background-color: #fafafa;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-tip {
  font-size: 13px;
  font-weight: normal;
  color: #909399;
}

.upload-area {
  margin-top: 10px;
}

.upload-btn {
  border: 2px dashed #dcdfe6;
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: white;
  position: relative;
  overflow: hidden;
}

.upload-btn:hover:not(.has-image) {
  border-color: #409eff;
  background-color: #f5faff;
}

.upload-btn.has-image {
  border-style: solid;
  border-color: #67c23a;
  padding: 0;
}

.upload-placeholder {
  color: #909399;
}

.upload-placeholder .el-icon-picture {
  font-size: 48px;
  margin-bottom: 10px;
  color: #c0c4cc;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #606266;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
}

.image-preview {
  width: 100%;
  height: 300px;
  position: relative;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f5f7fa;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-btn.has-image:hover .image-overlay {
  opacity: 1;
}

.btn-change,
.btn-remove {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-change {
  background-color: #409eff;
  color: white;
}

.btn-change:hover {
  background-color: #3375e0;
}

.btn-remove {
  background-color: #f56c6c;
  color: white;
}

.btn-remove:hover {
  background-color: #d62e2e;
}

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

.question-nav-buttons {
  display: flex;
  gap: 10px;
}

.btn-nav,
.btn-mark-bottom {
  padding: 8px 16px;
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-nav:hover,
.btn-mark-bottom:hover {
  background-color: #e4e8f0;
}

.btn-mark-bottom.active {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-color: #f5d8a8;
}

.loading-area,
.empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
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
  font-size: 16px;
}

.empty-text {
  font-size: 18px;
}

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

.answered-stats {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.result-content {
  text-align: center;
  padding: 20px 0;
}

.result-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.result-message {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 30px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.btn-return {
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-return:hover {
  background-color: #e4e8f0;
  transform: translateY(-2px);
}

@media (max-width: 1200px) {
  .exam-body {
    flex-direction: column;
  }
  .exam-sidebar {
    width: 100%;
    order: 2;
  }
  .exam-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .exam-container {
    padding: 16px;
  }
  .exam-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  .exam-timer {
    width: 100%;
  }
  .exam-content {
    padding: 20px;
  }
  .question-actions {
    flex-direction: column;
    gap: 15px;
  }
  .question-nav-buttons {
    order: 2;
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
  .image-preview {
    height: 200px;
  }
  .upload-btn {
    padding: 30px 15px;
  }
  .input-method-selector {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .question-nav {
    grid-template-columns: repeat(4, 1fr);
  }
  .exam-title {
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