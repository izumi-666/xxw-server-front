<template>
  <div class="grading-container"
  tabindex="0"
  @keydown.enter="handleGlobalEnter">
    <!-- 头部信息 -->
    <div class="grading-header">
      <div class="header-content">
        <h1 class="page-title">{{ examName || '考试批改' }}</h1>
        <div class="header-actions">
          <button class="btn-primary" @click="saveAllGrading" :disabled="saving">
            {{ saving ? '保存中...' : '保存批改结果' }}
          </button>
          <button class="btn-secondary" @click="goBack">
            返回
          </button>
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
        <div class="student-switcher">
  <div
    v-for="(studentData, sIndex) in gradingData"
    :key="sIndex"
    class="student-item"
    :class="{ active: currentStudentIndex === sIndex }"
    @click="selectStudent(sIndex)"
  >
    学生 {{ sIndex + 1 }}：
    {{ studentData.answer_records?.[0]?.student || '未知' }}
  </div>
</div>

      <!-- 左侧：题目列表 -->
      <div class="left-panel">
        <div class="questions-sidebar">
          <div class="sidebar-header">
            <h3>题目列表</h3>
            <div class="student-info">
              <span class="student-label">学生：</span>
              <span class="student-name">{{ currentStudent }}</span>
            </div>
          </div>
          
          <div class="question-list">
            <div 
              v-for="(item, index) in currentQuestions" 
              :key="index"
              class="question-item"
              :class="{ 
                'active': currentQuestionIndex === index,
                'graded': isQuestionGraded(index),
                'ungraded': !isQuestionGraded(index)
              }"
              @click="selectQuestion(index)"
            >
              <div class="question-header">
                <span class="question-number">第{{ index + 1 }}题</span>
                <span class="question-type">{{ getQuestionType(item.question_category_id) }}</span>
                <span class="question-score">({{ getQuestionScore(index) }}分)</span>
              </div>
              <div class="question-status">
                <span class="status-badge" :class="getQuestionStatusClass(index)">
                  {{ getQuestionStatusText(index) }}
                </span>
                <span v-if="getAutoScore(index) >= 0" class="auto-score">
                  自动评分：{{ getAutoScore(index) }}分
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：题目详情和批改区 -->
      <div class="main-panel">
        <div class="question-detail">
          <!-- 题目内容 -->
          <div class="question-content">
            <div class="section-header">
              <h3>题目内容</h3>
              <div class="question-meta">
                <span class="meta-item">题型：{{ getQuestionType(currentQuestion.question_category_id) }}</span>
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
              <div class="question-title" v-html="markdownToHtml(currentQuestion.title)"></div>
              
              <!-- 选择题选项 -->
              <div v-if="[1, 2].includes(currentQuestion.question_category_id) && currentQuestion.options" 
                   class="question-options">
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
              <div v-if="currentAnswer.student_answer !== '未作答' && currentAnswer.student_answer">
                <div v-if="currentAnswer.image_url" class="answer-with-image">
                  <div class="text-answer" v-html="markdownToHtml(currentAnswer.student_answer)"></div>
                  <div class="image-answer">
                    <img :src="currentAnswer.image_url" alt="学生作答图片" class="answer-image" />
                  </div>
                </div>
                <div v-else class="text-answer" v-html="markdownToHtml(currentAnswer.student_answer)"></div>
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
                <span class="score-total">{{ getQuestionScore(currentQuestionIndex) }} 分</span>
              </div>
            </div>
            
            <div class="grading-form">
              <!-- 自动评分显示 -->
              <div v-if="getAutoScore(currentQuestionIndex) >= 0" class="auto-grading-info">
                <div class="info-item">
                  <span class="info-label">系统自动评分：</span>
                  <span class="info-value">{{ getAutoScore(currentQuestionIndex) }} 分</span>
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
                  <label class="feedback-label">评语：</label>
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
                  <button 
                    class="btn-secondary btn-sm"
                    @click="nextQuestion"
                  >
                    下一题
                  </button>
                </div>
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
            <div class="answer-content" v-html="markdownToHtml(currentQuestion.answer)"></div>
          </div>

          <!-- 题目解析 -->
          <div class="question-analysis">
            <div class="section-header">
              <h3>题目解析</h3>
            </div>
            <div class="analysis-content" v-html="markdownToHtml(currentQuestion.notes)"></div>
          </div>

          <!-- 备注 -->
          <div v-if="currentQuestion.remark" class="question-remark">
            <div class="section-header">
              <h3>备注</h3>
            </div>
            <div class="remark-content">{{ currentQuestion.remark }}</div>
          </div>

          <!-- 知识点 -->
          <div v-if="currentQuestion.sub_knowledge_point_ids && currentQuestion.sub_knowledge_point_ids.length > 0" 
               class="knowledge-points">
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

const route = useRoute()
const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL

// ==================== 数据状态 ====================
const examId = ref(route.query.examId)
const examName = ref('')
const loading = ref(false)
const saving = ref(false)
const gradingData = ref([]) // 批改数据
const knowledgePoints = ref({}) // 知识点映射

// 当前显示的学生和题目索引
const currentStudentIndex = ref(0)
const currentQuestionIndex = ref(0)

// 当前批改数据
const currentGrading = ref({
  score: 0,
  feedback: ''
})

// ==================== 计算属性 ====================
// 当前学生数据
const currentStudentData = computed(() => {
  return gradingData.value[currentStudentIndex.value] || {}
})

// 当前学生名称
const currentStudent = computed(() => {
  const student = currentStudentData.value.answer_records?.[0]?.student
  return student || '未知学生'
})

// 当前题目列表
const currentQuestions = computed(() => {
  return currentStudentData.value.questions || []
})

// 当前答案记录
const currentAnswerRecords = computed(() => {
  return currentStudentData.value.answer_records || []
})

// 当前自动评分
const currentAutoMarkings = computed(() => {
  return currentStudentData.value.auto_markings || []
})

// 当前题目
const currentQuestion = computed(() => {
  return currentQuestions.value[currentQuestionIndex.value] || {}
})

// 当前答案
const currentAnswer = computed(() => {
  return currentAnswerRecords.value[currentQuestionIndex.value] || {}
})

// 总题目数
const totalQuestions = computed(() => {
  return currentQuestions.value.length || 0
})

// 已批改题目数
const gradedCount = computed(() => {
  return currentQuestions.value.filter((_, index) => {
    const answer = currentAnswerRecords.value[index]
    const autoScore = getAutoScore(index)

    return answer?.manual_override === true || autoScore >= 0
  }).length
})

// 批改进度百分比
const progressPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((gradedCount.value / totalQuestions.value) * 100)
})

// 是否可以保存当前批改
const canSaveGrading = computed(() => {
  const maxScore = getQuestionScore(currentQuestionIndex.value)
  return currentGrading.value.score >= 0 && currentGrading.value.score <= maxScore
})

// ==================== 数据加载 ====================
// 加载考试名称
const loadExamName = async () => {
  try {
    const userInfo = getUserInfo()
    if (!userInfo) return

    const res = await axios.get(`${API_BASE}/exam/getExamList/staff/${userInfo.account}`)
    const exams = res.data.data || []
    const exam = exams.find(e => e.id == examId.value)
    if (exam) {
      examName.value = exam.name
    }
  } catch (error) {
    console.error('加载考试名称失败:', error)
  }
}

// 加载批改数据
const loadGradingData = async () => {
  if (!examId.value) {
    console.error('考试ID不存在')
    return
  }

  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/exam/getAnswerRecord/${examId.value}`)
    
    if (res.data.code === 200 && res.data.data) {
      gradingData.value = res.data.data
      
      // 加载知识点
      await loadKnowledgePoints()
      
      // 初始化当前批改数据
      if (gradingData.value.length > 0) {
        initializeCurrentGrading()
      }
    } else {
      console.error('获取批改数据失败:', res.data.message)
    }
  } catch (error) {
    console.error('加载批改数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载知识点
const loadKnowledgePoints = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getKnowledgePointList`)

    if (res.data.code === 200 && res.data.data) {
      knowledgePoints.value = res.data.data
    }
  } catch (error) {
    console.warn('加载知识点失败:', error)
  }
}

// ==================== 初始化 ====================
// 初始化当前批改数据
const initializeCurrentGrading = () => {
  const answer = currentAnswer.value
  const questionIndex = currentQuestionIndex.value

  let score = 0

  if (answer && answer.score !== null && answer.score !== undefined) {
    // 老师已经评过分 → 最高优先级
    score = answer.score
  } else {
    const autoScore = getAutoScore(questionIndex)
    // 没有老师评分 → 用自动评分（如果有）
    score = autoScore >= 0 ? autoScore : 0
  }

  currentGrading.value = {
    score,
    feedback: answer?.feedback || ''
  }
}

// ==================== 工具函数 ====================
// 获取用户信息
const getUserInfo = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    return userInfoStr ? JSON.parse(userInfoStr) : null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 获取题目类型
const getQuestionType = (typeId) => {
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '证明题',
    4: '解答题',
    5: '填空题',
    6: '计算题',
    7: "判断题",
    8: "作图题"
  }
  return typeMap[typeId] || '未知题型'
}

// 难度
const maxDifficulty = 5

// 获取知识点名称
const getKnowledgePointName = (pointId) => {
  return knowledgePoints.value[pointId] || `知识点${pointId}`
}

// 获取题目分值
const getQuestionScore = (questionIndex) => {
  // 这里需要根据实际情况调整，可能需要从其他接口获取
  // 暂时返回默认值
  return 5
}

// 获取自动评分
const getAutoScore = (questionIndex) => {
  const autoScore = currentAutoMarkings.value[questionIndex]
  // auto_markings 中 -1 代表需要手动评分，其他数字代表自动评分值
  if (autoScore === undefined || autoScore === null) {
    return -1 // 默认需要手动评分
  }
  return parseFloat(autoScore)
}

// 是否可以手动评分
const canGradeManually = () => {
  return true
}

// 获取题目状态
const isQuestionGraded = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex]
  const autoScore = getAutoScore(questionIndex)

  return answer?.manual_override === true || autoScore >= 0
}

const getQuestionStatusClass = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex]
  const autoScore = getAutoScore(questionIndex)

  if (answer?.manual_override) return 'status-graded'
  if (autoScore >= 0) return 'status-auto-graded'
  return 'status-ungraded'
}

const getQuestionStatusText = (questionIndex) => {
  const answer = currentAnswerRecords.value[questionIndex]
  const autoScore = getAutoScore(questionIndex)

  if (answer?.manual_override) return '已批改'
  if (autoScore >= 0) return '系统已评分'
  return '待批改'
}

// 获取答案状态
const getAnswerStatusClass = (answer) => {
  if (!answer.student_answer || answer.student_answer === '未作答') {
    return 'status-no-answer'
  } else if (answer.is_correct === 1) {
    return 'status-correct'
  } else if (answer.is_correct === 0) {
    return 'status-incorrect'
  } else {
    return 'status-unknown'
  }
}

const getAnswerStatusText = (answer) => {
  if (!answer.student_answer || answer.student_answer === '未作答') {
    return '未作答'
  } else if (answer.is_correct === 1) {
    return '正确'
  } else if (answer.is_correct === 0) {
    return '错误'
  } else {
    return '未知'
  }
}

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

    // 块级公式 $$...$$
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    });

    // 行内公式 $...$
    content = content.replace(/\$([\s\S]+?)\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    });

    // 直接返回 marked 结果
    return marked(content);
  } catch (err) {
    console.error("Markdown 渲染失败:", err);
    return text;
  }
};

// ==================== 题目操作 ====================
// 选择题目
const selectQuestion = (index) => {
  currentQuestionIndex.value = index
  initializeCurrentGrading()
}

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
    initializeCurrentGrading()
  }
}

// ==================== 批改操作 ====================
// 保存当前题目批改
const saveCurrentGrading = () => {
  const answer = currentAnswer.value
  if (!answer) return

  answer.score = Number(currentGrading.value.score)
  answer.feedback = currentGrading.value.feedback
  answer.manual_override = true
}

const nextStudent = () => {
  if (currentStudentIndex.value < gradingData.value.length - 1) {
    selectStudent(currentStudentIndex.value + 1)
  } else {
    alert('所有学生已批改完成')
  }
}

const saveAndNext = () => {
  saveCurrentGrading()

  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    nextQuestion()
  } else {
    nextStudent()
  }
}

// 回车保存并跳转到下一题
const handleGlobalEnter = (e) => {
  const tagName = e.target.tagName.toLowerCase()

  // 输入框里不触发
  if (tagName === 'input' || tagName === 'textarea') return

  e.preventDefault()
  saveAndNext()
}

// 保存所有批改
const saveAllGrading = async () => {
  saving.value = true
  try {
    // 收集所有批改数据
    const gradingResults = []
    
    gradingData.value.forEach((studentData, studentIndex) => {
      studentData.answer_records.forEach((record, questionIndex) => {
        if (record.score !== null && record.score !== undefined) {
          gradingResults.push({
            answer_record_id: record.id,
            score: record.score,
            feedback: record.feedback || ''
          })
        }
      })
    })
    
    // 发送到后端
    const res = await axios.post(`${API_BASE}/exam/saveGradingResults`, {
      exam_id: examId.value,
      grading_results: gradingResults
    })
    
    if (res.data.code === 200) {
      alert('批改结果保存成功！')
    } else {
      alert('保存失败：' + res.data.message)
    }
  } catch (error) {
    console.error('保存批改结果失败:', error)
    alert('保存批改结果失败，请重试')
  } finally {
    saving.value = false
  }
}

const selectStudent = (index) => {
  // 如果当前学生有未保存内容，这里以后可以加确认弹窗
  currentStudentIndex.value = index
  currentQuestionIndex.value = 0   // 切学生必须回到第 1 题
  initializeCurrentGrading()
}


// ==================== 页面导航 ====================
const goBack = () => {
  router.back()
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadExamName()
  const loadGradingData = async () => {
  if (!examId.value) return

  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/exam/getAnswerRecord/${examId.value}`)

    if (res.data.code === 200 && res.data.data) {
      gradingData.value = res.data.data
        // 重新格式化选择题选项
      gradingData.value.forEach(student => {
        student.questions.forEach(question => {
          if (
            question.options &&
            Object.keys(question.options).some(k => k.startsWith('option_'))
          ) {
            const formattedOptions = {}
            Object.keys(question.options).forEach(key => {
              const letter = key.replace(/^option_/, '')
              formattedOptions[letter] = question.options[key]
            })
            question.options = formattedOptions
          }
        })
      })

      await loadKnowledgePoints()

      if (gradingData.value.length > 0) {
        initializeCurrentGrading()
      }
    }
  } catch (error) {
    console.error('加载批改数据失败:', error)
  } finally {
    loading.value = false
  }
}
    loadGradingData()
})
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.grading-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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

.main-panel {
  flex: 1;
  min-width: 0;
}

.right-panel {
  width: 320px;
  flex-shrink: 0;
}

/* ==================== 左侧题目列表 ==================== */
.questions-sidebar {
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

.student-info {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.student-label {
  color: #909399;
}

.student-name {
  color: #303133;
  font-weight: 500;
}

.question-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
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

.question-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auto-score {
  font-size: 12px;
  color: #67c23a;
  font-weight: 500;
}

.student-switcher {
  padding: 12px;
  border-bottom: 1px solid #e6e9f0;
}

.student-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 14px;
  background: #f5f7fa;
}

.student-item.active {
  background: #409eff;
  color: #fff;
}

/* ==================== 中间题目详情 ==================== */
.question-detail {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  padding: 24px;
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

.question-content, .student-answer, .grading-section {
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


/* ==================== 右侧参考面板 ==================== */
.reference-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}

.reference-answer, .question-analysis, .question-remark, .knowledge-points {
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

.status-graded {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-ungraded {
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
.loading-container, .empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-content, .empty-content {
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
@media (max-width: 1200px) {
  .grading-content {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel,
  .right-panel {
    width: 100%;
  }
  
  .main-panel {
    order: 2;
  }
  
  .left-panel {
    order: 1;
  }
  
  .right-panel {
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
  
  .question-detail,
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
  
  .question-item {
    padding: 12px;
  }
  
  .grading-form {
    padding: 16px;
  }
}
</style>