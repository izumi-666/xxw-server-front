<template>
  <div class="exam-container">
    <!-- 考试头部信息 -->
    <div class="exam-header card">
      <div class="exam-header-content">
        <h1 class="exam-title">{{ examInfo.examName || "在线考试" }}</h1>
        <div class="exam-meta">
          <div class="meta-item">
            <span class="meta-label">试卷：</span>
            <span class="meta-value">{{ examInfo.paperName || "未命名试卷" }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">总分：</span>
            <span class="meta-value">{{ totalScore }}分</span>
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
              answered: userAnswers[question.id],
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
              {{ getQuestionTypeText(currentQuestion.marking_type) }}
            </div>
          </div>

          <div class="question-content">
            <div
              class="question-text"
              v-html="markdownToHtml(currentQuestion.title)"
            ></div>

            <!-- 题目图片（如果有） -->
            <div class="question-image" v-if="currentQuestion.img_url">
              <img :src="currentQuestion.img_url" alt="题目图片" />
            </div>

            <!-- 选项区域 -->
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
                  correct:
                    showAnswer &&
                    currentQuestion.answer &&
                    currentQuestion.answer.includes(key),
                }"
                @click="selectOption(key)"
              >
                <div class="option-selector">
                  <div class="option-letter">{{ key }}</div>
                  <div class="option-text" v-html="markdownToHtml(option)"></div>
                </div>
              </div>
            </div>

            <!-- 简答题输入 + Markdown 预览 -->
<div class="short-answer-area" v-if="currentQuestion.marking_type === 1">
  <!-- 公式工具栏 -->
  <div class="formula-toolbar">
    <button
      v-for="formula in commonFormulas"
      :key="formula.label"
      class="formula-btn"
      @click="insertFormula(formula.value)"
      type="button"
    >
      {{ formula.label }}
    </button>
  </div>

  <div class="markdown-answer">
    <!-- 输入区 -->
    <textarea
      ref="answerTextarea"
      v-model="userAnswers[currentQuestion.id]"
      placeholder="支持 Markdown 与 LaTeX 数学公式，例如 $x^2 + y^2 = 1$"
      rows="8"
      class="short-answer-input"
    ></textarea>

    <!-- 预览区 -->
    <div class="markdown-preview">
      <div class="preview-title">预览</div>
      <div
        class="preview-content"
        v-html="markdownToHtml(userAnswers[currentQuestion.id])"
      ></div>
    </div>
  </div>
</div>

            <!-- 答案解析（仅当showAnswer为true时显示） -->
            <div class="answer-analysis" v-if="showAnswer && currentQuestion.notes">
              <div class="analysis-title">答案解析</div>
              <div
                class="analysis-content"
                v-html="markdownToHtml(currentQuestion.notes)"
              ></div>
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
                  {{ formatTime(examDurationSeconds - remainingTime) }}
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">标记题目</div>
                <div class="stat-value">{{ markedQuestions.length }}</div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn-review" @click="reviewAnswers">查看答案</button>
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
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

const route = useRoute();
const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 数据状态 ==================== */
const questions = ref([]); // 题目列表
const currentQuestionIndex = ref(0); // 当前题目索引
const userAnswers = ref({}); // 用户答案 {题目id: 答案}
const markedQuestions = ref([]); // 标记的题目id列表
const loading = ref(true); // 加载状态
const showSubmitConfirm = ref(false); // 显示提交确认
const showExamResult = ref(false); // 显示考试结果
const showAnswer = ref(false); // 是否显示答案（用于查看答案模式）
const examInfo = ref({
  examName: "",
  paperName: "",
  examId: "",
  paper_id: "",
  start_time: "",
  duration: 0,
});

// 考试时间相关
const examDurationSeconds = ref(0);
const remainingTime = ref(0);
const timeProgress = computed(() => {
  return (
    ((examDurationSeconds.value - remainingTime.value) / examDurationSeconds.value) * 100
  );
});
let timer = null; // 计时器

/* ==================== 计算属性 ==================== */
// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null;
});

// 已答题数
const answeredCount = computed(() => {
  return Object.keys(userAnswers.value).length;
});

// 当前题目是否被标记
const isCurrentQuestionMarked = computed(() => {
  if (!currentQuestion.value) return false;
  return markedQuestions.value.includes(currentQuestion.value.id);
});

// 考试时长文本
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

// 总分
const totalScore = computed(() => {
  return questions.value.reduce((sum, question) => sum + (question.score || 0), 0);
});

/* ==================== 生命周期 ==================== */
onMounted(() => {
  // 从路由参数获取考试信息
  examInfo.value.examId = route.query.examId;
  examInfo.value.paper_id = route.query.paper_id;
  if (route.query.exam_name) {
    examInfo.value.examName = decodeURIComponent(route.query.exam_name);
  }

  if (!examInfo.value.paper_id) {
    ElMessage.error("试卷ID不存在");
    router.push("/student/exammanagement");
    return;
  }

  loadQuestions();

  // 从本地存储恢复考试开始时间（如果不存在则记录新开始时间）
  const examKey = `exam_${examInfo.value.examId}_start_time`;
  const savedStartTime = localStorage.getItem(examKey);
  
  if (savedStartTime) {
    // 恢复已存在的考试时间
    const startTime = parseInt(savedStartTime);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    
    // 从路由参数或examInfo获取考试总时长
    const totalDurationMinutes = route.query.duration ? 
      parseInt(route.query.duration) : examInfo.value.duration || 120;
    examDurationSeconds.value = totalDurationMinutes * 60;
    
    remainingTime.value = Math.max(examDurationSeconds.value - elapsedSeconds, 0);
    
    // 如果考试时间已用完，自动提交
    if (remainingTime.value <= 0) {
      autoSubmitExam();
      return;
    }
  } else {
    // 第一次进入，记录开始时间
    localStorage.setItem(examKey, Date.now().toString());
    
    // 设置总时长
    const totalDurationMinutes = route.query.duration ? 
      parseInt(route.query.duration) : examInfo.value.duration || 120;
    examDurationSeconds.value = totalDurationMinutes * 60;
    remainingTime.value = examDurationSeconds.value;
  }

  // 开始计时器（只调用一次）
  startTimer();

  // 监听浏览器标签页切换和关闭
  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  // 清理定时器
  if (timer) {
    clearInterval(timer);
  }

  // 移除事件监听
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("visibilitychange", handleVisibilityChange);
});

/* ==================== 数据加载 ==================== */
// 加载题目
const loadQuestions = async () => {
  try {
    loading.value = true;
    const res = await axios.get(
      `${API_BASE}/paper/getQuestionsByPaperId/${examInfo.value.paper_id}`
    );

    if (res.data.code === 200) {
      // 处理返回的数据
      let questionsData = res.data.data || [];

      // 确保每个题目都有完整的结构
      questionsData = questionsData.map((question) => {
        // 如果options是字符串，解析为对象
        if (question.options && typeof question.options === "string") {
          try {
            question.options = JSON.parse(question.options);
          } catch (e) {
            console.error("解析选项失败:", e);
            question.options = {};
          }
        }

        // 确保options对象有正确的键
        if (question.options && typeof question.options === "object") {
          // 重新格式化选项键，确保以A、B、C、D等形式
          const formattedOptions = {};
          Object.keys(question.options).forEach((key, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D...
            formattedOptions[letter] = question.options[key];
          });
          question.options = formattedOptions;
        }

        // 确保分数为数字
        question.score = Number(question.score) || 0;

        return question;
      });

      questions.value = questionsData;

      // 初始化用户答案
      const answers = {};
      questions.value.forEach((question) => {
        // 从本地存储恢复已保存的答案
        const savedAnswer = localStorage.getItem(
          `exam_${examInfo.value.examId}_answer_${question.id}`
        );
        if (savedAnswer !== null) {
          answers[question.id] = savedAnswer;
        }
      });
      userAnswers.value = answers;

      // 初始化标记题目
      const savedMarks = localStorage.getItem(`exam_${examInfo.value.examId}_marks`);
      if (savedMarks) {
        markedQuestions.value = JSON.parse(savedMarks);
      }

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
/* ==================== Markdown渲染函数 ==================== */
// 配置marked
marked.setOptions({
  breaks: true, // 转换换行符为<br>
  gfm: true, // 使用GitHub风格的Markdown
});

// Markdown转HTML
const markdownToHtml = (text) => {
  if (!text) return "";

  try {
    let content = text;

    // 先处理 $$...$$（显示公式，允许多行）
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    });

    // 再处理 $...$（允许多行，用 [\s\S]）
    content = content.replace(/\$([\s\S]+?)\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    });

    // 最后再交给 marked
    return marked(content);
  } catch (err) {
    console.error("Markdown + KaTeX 渲染失败:", err);
    return text;
  }
};

const answerTextarea = ref(null);

// 常用数学公式（LaTeX）
const commonFormulas = [
  { label: "分数", value: "\\frac{a}{b}" },
  { label: "幂", value: "x^i" },
  { label: "下标", value: "x_i" },
  { label: "根号", value: "\\sqrt[x]{y}" },
  { label: "大括号", value: "\\begin{cases} a \\\\ c \\end{cases}" },
  { label: "求和", value: "\\sum_{i=1}^n" },
  { label: "极限", value: "\\lim_{x \\to 0}" },
  { label: "绝对值", value: "\\left| x \\right|" },
  { label: "排列", value: "\{A}_x^y" },
  { label: "组合", value: "\{C}_x^y" },
  { label: "角度", value: "\\angle ABC" },
  { label: "向量", value: "\\vec{v}" },
  { label: "积分", value: "\\int_a^b f(x) dx" },
];

/* 插入公式到当前答案文本框(随光标变化) */
const insertFormula = async (formula) => {
  const textarea = answerTextarea.value;
  if (!textarea || !currentQuestion.value) return;

  const questionId = currentQuestion.value.id;
  const text = userAnswers.value[questionId] || "";

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  // 插入为行内公式 $...$
  const insertText = `$${formula}$`;

  userAnswers.value[questionId] =
    text.slice(0, start) + insertText + text.slice(end);

  await nextTick();

  // 重新聚焦并移动光标
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd =
    start + insertText.length;
};


/* ==================== 计时器相关 ==================== */
// 开始计时
const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--;

      // 每30秒保存一次答案
      if (remainingTime.value % 30 === 0) {
        saveAnswers();
      }

      // 最后5分钟提示
      if (remainingTime.value === 300) {
        ElMessage.warning("距离考试结束还有5分钟，请尽快完成答题！");
      }

      // 考试结束
      if (remainingTime.value === 0) {
        clearInterval(timer);
        autoSubmitExam();
      }
    }
  }, 1000);
};

// 格式化时间显示
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/* ==================== 题目操作 ==================== */
// 跳转到指定题目
const goToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentQuestionIndex.value = index;
  }
};

// 选择题选择选项
const selectOption = (optionKey) => {
  if (!currentQuestion.value) return;

  const questionId = currentQuestion.value.id;
  const optionValue = optionKey.replace("option_", "");

  // 如果是单选题
  if (currentQuestion.value.marking_type === 0) {
    userAnswers.value[questionId] = optionValue;
  }
  // 如果是多选题
  else if (currentQuestion.value.marking_type === 2) {
    const currentAnswer = userAnswers.value[questionId] || "";

    if (currentAnswer.includes(optionValue)) {
      // 如果已选中，则取消选中
      userAnswers.value[questionId] = currentAnswer.replace(optionValue, "");
    } else {
      // 如果未选中，则添加
      userAnswers.value[questionId] = currentAnswer + optionValue;
    }
  }

  // 保存答案
  saveAnswer(questionId);
};

// 检查选项是否被选中
const isOptionSelected = (optionKey) => {
  if (!currentQuestion.value) return false;

  const questionId = currentQuestion.value.id;
  const optionValue = optionKey.replace("option_", "");
  const currentAnswer = userAnswers.value[questionId];

  if (!currentAnswer) return false;

  // 多选题可能包含多个选项
  return currentAnswer.includes(optionValue);
};

// 标记/取消标记当前题目
const toggleMarkCurrentQuestion = () => {
  if (!currentQuestion.value) return;

  const questionId = currentQuestion.value.id;
  const index = markedQuestions.value.indexOf(questionId);

  if (index === -1) {
    // 标记题目
    markedQuestions.value.push(questionId);
    ElMessage.success("题目已标记");
  } else {
    // 取消标记
    markedQuestions.value.splice(index, 1);
    ElMessage.info("已取消标记");
  }

  // 保存标记
  localStorage.setItem(
    `exam_${examInfo.value.examId}_marks`,
    JSON.stringify(markedQuestions.value)
  );
};

/* ==================== 考试提交相关 ==================== */
// 保存单个答案
const saveAnswer = (questionId) => {
  localStorage.setItem(
    `exam_${examInfo.value.examId}_answer_${questionId}`,
    userAnswers.value[questionId]
  );
};

// 保存所有答案
const saveAnswers = () => {
  Object.keys(userAnswers.value).forEach((questionId) => {
    localStorage.setItem(
      `exam_${examInfo.value.examId}_answer_${questionId}`,
      userAnswers.value[questionId]
    );
  });
};

// 提交考试
const submitExam = async () => {
  try {
    // 这里应该调用提交考试的API
    // 例如: await axios.post(`${API_BASE}/exam/submit`, {
    //   examId: examInfo.value.examId,
    //   paper_id: examInfo.value.paper_id,
    //   answers: userAnswers.value
    // });

    // 清除本地保存的答案
    questions.value.forEach((question) => {
      localStorage.removeItem(`exam_${examInfo.value.examId}_answer_${question.id}`);
    });
    localStorage.removeItem(`exam_${examInfo.value.examId}_marks`);

    // 停止计时器
    if (timer) {
      clearInterval(timer);
    }

    showSubmitConfirm.value = false;
    showExamResult.value = true;

    ElMessage.success("试卷提交成功！");
  } catch (error) {
    console.error("提交试卷失败:", error);
    ElMessage.error("提交试卷失败");
  }
};

// 自动提交考试（时间到）
const autoSubmitExam = () => {
  ElMessageBox.alert("考试时间到，系统将自动提交试卷", "考试结束", {
    confirmButtonText: "确定",
    callback: () => {
      submitExam();
    },
  });
};

// 查看答案
const reviewAnswers = () => {
  showAnswer.value = true;
  showExamResult.value = false;
};

// 返回考试列表
const returnToExamList = () => {
  router.push("/exam/list");
};

/* ==================== 浏览器事件处理 ==================== */
// 处理页面关闭/刷新
const handleBeforeUnload = (e) => {
  // 保存答案
  saveAnswers();

  // 显示警告信息
  e.preventDefault();
  e.returnValue = "离开页面会导致考试中断，确定要离开吗？";
  return e.returnValue;
};

// 处理标签页切换
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 页面被隐藏，可能是切换到了其他标签页
    ElMessage.warning("检测到您切换了标签页，请专注考试！");
  }
};

/* ==================== 工具函数 ==================== */
// 获取题目类型文本
const getQuestionTypeText = (markingType) => {
  const typeMap = {
    0: "单选题",
    1: "简答题",
    2: "多选题",
  };
  return typeMap[markingType] || "未知题型";
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

/* ==================== 考试头部样式 ==================== */
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

/* 考试计时器 */
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

/* ==================== 考试主体样式 ==================== */
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

/* ==================== 考试内容区域 ==================== */
.exam-content {
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
  padding: 4px 12px;
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

.option-item.correct {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
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

.option-item.correct .option-letter {
  background-color: #67c23a;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
  color: #303133;
}

/* 简答题输入框 */
.short-answer-area {
  margin: 30px 0;
}

.short-answer-input {
  width: 97%;
  padding: 16px;
  border: 2px solid #dcdfe6;
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.5;
  color: #303133;
  resize: vertical;
  transition: all 0.2s;
}

.short-answer-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.formula-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.formula-btn {
  padding: 6px 10px;
  font-size: 13px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  color: #303133;
  transition: all 0.2s;
}

.formula-btn:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* 答案解析 */
.answer-analysis {
  margin-top: 40px;
  padding: 20px;
  background-color: #f0f9eb;
  border-radius: 10px;
  border-left: 4px solid #67c23a;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 10px;
}

.analysis-content {
  font-size: 15px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
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

/* ==================== 加载和空状态 ==================== */
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

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 18px;
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

/* 考试结果模态框 */
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
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
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

.btn-review,
.btn-return {
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-review {
  background-color: #409eff;
  color: white;
  border: none;
}

.btn-review:hover {
  background-color: #3375e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
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
/* 数学公式样式 */
.math-formula {
  font-family: "Cambria Math", "Times New Roman", serif;
  text-align: center;
  margin: 10px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow-x: auto;
}

.inline-math {
  font-family: "Cambria Math", "Times New Roman", serif;
  font-style: italic;
}

/* 题目内容的样式增强 */
.question-text :deep(p) {
  margin-bottom: 10px;
  line-height: 1.6;
}

.question-text :deep(h1),
.question-text :deep(h2),
.question-text :deep(h3) {
  margin: 15px 0 10px 0;
  color: #303133;
}

.question-text :deep(ul),
.question-text :deep(ol) {
  margin: 10px 0;
  padding-left: 20px;
}

.question-text :deep(li) {
  margin-bottom: 5px;
}

.question-text :deep(code) {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
}

.question-text :deep(blockquote) {
  border-left: 4px solid #409eff;
  margin: 10px 0;
  padding-left: 15px;
  color: #606266;
  font-style: italic;
}

/* 答案显示样式增强 */
.answer-analysis :deep(pre) {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}

.answer-analysis :deep(table) {
  border-collapse: collapse;
  margin: 10px 0;
  width: 100%;
}

.answer-analysis :deep(th),
.answer-analysis :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px;
  text-align: left;
}

.answer-analysis :deep(th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

/* 多选题答案显示样式 */
.option-item.multi-selected {
  background-color: #f0f7ff;
}

/* 正确答案高亮 */
.option-item.correct {
  position: relative;
}

.option-item.correct::after {
  content: "✓";
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-weight: bold;
  font-size: 16px;
}
.markdown-answer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.markdown-preview {
  border: 2px solid #ebeef5;
  border-radius: 10px;
  padding: 16px;
  background-color: #fafafa;
  overflow-y: auto;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #909399;
  margin-bottom: 10px;
}

.preview-content {
  font-size: 15px;
  line-height: 1.6;
}


/* ==================== 响应式设计 ==================== */
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
    flex-direction: column;
    gap: 20px;
  }

  .result-actions {
    flex-direction: column;
    gap: 15px;
  }

  .answered-stats {
    grid-template-columns: 1fr;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .markdown-answer {
    grid-template-columns: 1fr;
  }
}
</style>
