<template>
  <div class="dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">教务管理首页</h1>
        
        <!-- 通知图标 -->
        <div class="notification-container">
          <div class="notification-icon" @click="toggleNotificationPanel">
            <span class="icon">🔔</span>
            <span v-if="unreadCount > 0" class="notification-badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 日历 -->
      <div class="calendar-card">
        <div class="calendar-header">
          <button @click="prevMonth">◀</button>
          <span>{{ currentYear }}年 {{ currentMonth + 1 }}月</span>
          <button @click="nextMonth">▶</button>
        </div>

        <div class="week-header">
          <span v-for="w in weeks" :key="w">{{ w }}</span>
        </div>

        <div class="calendar-grid">
          <span
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day"
            :class="[
              getDayTypeClass(day),
              { 
                today: isToday(day), 
                selected: day === selectedDate
              }
            ]"
            @click="selectDay(day)"
          >
            <div class="day-header">
              <em>{{ day || "" }}</em>
              <i v-if="hasMemo(day)" class="memo-icon">📝</i>
            </div>
            
            <div class="day-content">
              <!-- 节日名称 -->
              <small v-if="getFestivalName(day)" class="festival-name">
                {{ getFestivalName(day) }}
              </small>
            </div>
          </span>
        </div>
        
        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-color holiday"></span>
            <span>法定节假日</span>
          </div>
          <div class="legend-item">
            <span class="legend-color weekend"></span>
            <span>周末</span>
          </div>
          <div class="legend-item">
            <span class="memo-icon">📝</span>
            <span>有备忘</span>
          </div>
        </div>
      </div>

      <!-- 备忘录 -->
      <div class="memo-card">
        <div class="memo-header">
          <h2>📌 {{ selectedDateText }} 备忘录</h2>
          <div class="day-info">
            <span class="info-tag" :class="getDayTypeClass(selectedDate)">
              {{ getDayTypeText(getDayTypeClass(selectedDate)) }}
            </span>
            <span v-if="getFestivalName(selectedDate)" class="festival-tag">
              {{ getFestivalName(selectedDate) }}
            </span>
          </div>
        </div>

        <textarea 
          v-model="memoText" 
          placeholder="请输入备忘内容..."
          @keydown.enter.prevent="saveMemo"
        ></textarea>

        <button class="save-btn" @click="saveMemo">保存备忘录</button>

        <div class="memo-list-container">
          <h3 v-if="todayMemos.length > 0">已有备忘（{{ todayMemos.length }}条）</h3>
          <ul class="memo-list">
            <li v-for="(m, i) in todayMemos" :key="i">
              <span class="memo-content">{{ m }}</span>
              <span class="delete-btn" @click="deleteMemo(i)">❌</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 通知面板 -->
    <div v-if="showNotificationPanel" class="notification-panel-overlay" @click="closeNotificationPanel">
      <div class="notification-panel" @click.stop>
        <div class="notification-panel-header">
          <h3>审核通知</h3>
          <button class="close-btn" @click="closeNotificationPanel">×</button>
        </div>
        
        <div v-if="loading" class="loading">加载中...</div>
        
        <div v-else-if="reviewResults.length === 0" class="empty-notification">
          暂无审核通知
        </div>
        
        <div v-else class="notification-list">
          <div 
            v-for="(result, index) in reviewResults" 
            :key="index"
            class="notification-item"
            :class="{ unread: result.uploader_read === 0 }"
          >
            <div class="notification-header">
              <span class="question-title">题目: {{ result.question.title }}</span>
              <span class="status-badge" :class="getStatusClass(result.status)">
                {{ getStatusText(result.status) }}
              </span>
            </div>
            
            <div class="notification-content">
              <div class="question-info">
                <span class="info-item">科目ID: {{ result.question.subject_id }}</span>
                <span class="info-item">难度: {{ result.question.difficulty_level }}</span>
                <span class="info-item">上传人: {{ result.question.uploader }}</span>
              </div>
              
              <div v-if="result.status === 'REJECTED'" class="review-comment">
                <strong>审核意见:</strong> {{ result.comment }}
              </div>
              
              <div class="notification-actions">
                <button 
                  v-if="result.uploader_read === 0"
                  class="mark-read-btn"
                  @click="markAsRead(result.question.id)"
                >
                  标记为已读
                </button>
                <span v-else class="read-status">已读</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* 当前日期 */
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedDate = ref(today.getDate());

const weeks = ["日", "一", "二", "三", "四", "五", "六"];

/* 通知相关状态 */
const showNotificationPanel = ref(false);
const reviewResults = ref([]);
const loading = ref(false);
const unreadCount = ref(0);
const currentUser = localStorage.getItem("userName");

/* 节日数据 */
const holidayMap = ref({});

/* 自定义节日数据（补充API可能缺失的节日） */
const customFestivals = {
  // 格式: '月-日': { name: '节日名称', isHoliday: 是否法定假日 }
  '1-1': { name: '元旦', isHoliday: true },
  '2-14': { name: '情人节', isHoliday: false },
  '3-8': { name: '妇女节', isHoliday: false },
  '3-12': { name: '植树节', isHoliday: false },
  '4-4': { name: '清明节', isHoliday: true },
  '5-1': { name: '劳动节', isHoliday: true },
  '5-4': { name: '青年节', isHoliday: false },
  '6-1': { name: '儿童节', isHoliday: false },
  '6-10': { name: '端午节', isHoliday: true },
  '7-1': { name: '建党节', isHoliday: false },
  '8-1': { name: '建军节', isHoliday: false },
  '9-10': { name: '教师节', isHoliday: false },
  '10-1': { name: '国庆节', isHoliday: true },
  '12-13': { name: '国家公祭日', isHoliday: false },
  '12-24': { name: '平安夜', isHoliday: false },
  '12-25': { name: '圣诞节', isHoliday: false },
};

/* 备忘录数据 */
const memos = ref(JSON.parse(localStorage.getItem("edu-memos") || "{}"));
const memoText = ref("");

/* 生成日历 */
const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();

  const days = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  return days;
});

const dateKey = computed(
  () => `${currentYear.value}-${currentMonth.value + 1}-${selectedDate.value}`
);

const todayMemos = computed(() => memos.value[dateKey.value] || []);

const selectedDateText = computed(
  () => `${currentYear.value}年${currentMonth.value + 1}月${selectedDate.value}日`
);

/* 获取审核结果列表 */
const fetchReviewResults = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE}/questions/getQuestionReviewResultList/${currentUser}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    reviewResults.value = Array.isArray(data) ? data : [];
    
    // 计算未读数量
    unreadCount.value = reviewResults.value.filter(item => item.uploader_read === 0).length;
  } catch (error) {
    console.error("获取审核结果失败:", error);
    // 模拟数据用于测试
    reviewResults.value = [
      {
        question: {
          id: 123,
          title: "下列选项中，哪个是 Java 的基本数据类型？",
          subject_id: 2,
          difficulty_level: 2,
          uploader: "teacher_zhang"
        },
        status: "REJECTED",
        comment: "答案解析不完整，请补充详细说明",
        uploader_read: 0
      },
      {
        question: {
          id: 124,
          title: "Python中列表和元组的区别是什么？",
          subject_id: 3,
          difficulty_level: 1,
          uploader: "teacher_zhang"
        },
        status: "APPROVED",
        comment: "审核通过",
        uploader_read: 1
      }
    ];
    unreadCount.value = reviewResults.value.filter(item => item.uploader_read === 0).length;
  } finally {
    loading.value = false;
  }
};

/* 标记为已读 */
const markAsRead = async (questionId) => {
  try {
    const response = await fetch(`${API_BASE}/questions/setRead/${currentUser}/${questionId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 更新本地状态
    const item = reviewResults.value.find(r => r.question.id === questionId);
    if (item) {
      item.uploader_read = 1;
      unreadCount.value = reviewResults.value.filter(r => r.uploader_read === 0).length;
    }
  } catch (error) {
    console.error("标记已读失败:", error);
    alert("标记已读失败，请稍后重试");
  }
};

/* 获取节假日数据 */
const fetchHolidays = async () => {
  try {
    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${currentYear.value}/CN`
    );
    const data = await res.json();

    const map = {};
    data.forEach((item) => {
      map[item.date] = {
        name: item.localName,
        isHoliday: true
      };
    });

    holidayMap.value = map;
  } catch (e) {
    console.error("获取节假日失败", e);
    // 使用默认节假日数据
    holidayMap.value = {};
  }
};

/* 初始化数据 */
onMounted(() => {
  fetchHolidays();
  fetchReviewResults(); // 加载通知数据
});

watch(currentYear, () => {
  fetchHolidays();
});

/* 判断是否是法定节假日 */
const isHoliday = (day) => {
  if (!day) return false;
  
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  
  // 检查节假日API
  if (holidayMap.value[dateStr]) {
    return true;
  }
  
  // 检查自定义节假日
  const customKey = `${currentMonth.value + 1}-${day}`;
  if (customFestivals[customKey] && customFestivals[customKey].isHoliday) {
    return true;
  }
  
  return false;
};

/* 判断是否是周末 */
const isWeekend = (day) => {
  if (!day) return false;
  
  const date = new Date(currentYear.value, currentMonth.value, day);
  const week = date.getDay();
  return week === 0 || week === 6;
};

/* 获取日期类型（用于CSS类名） */
const getDayTypeClass = (day) => {
  if (!day) return '';
  
  if (isHoliday(day)) {
    return 'holiday';
  } else if (isWeekend(day)) {
    return 'weekend';
  } else {
    return 'weekday';
  }
};

/* 获取节日名称 */
const getFestivalName = (day) => {
  if (!day) return '';
  
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  
  // 首先检查节假日API
  if (holidayMap.value[dateStr]) {
    return holidayMap.value[dateStr].name;
  }
  
  // 然后检查自定义节日
  const customKey = `${currentMonth.value + 1}-${day}`;
  if (customFestivals[customKey]) {
    return customFestivals[customKey].name;
  }
  
  return '';
};

/* 获取日期类型文本 */
const getDayTypeText = (type) => {
  const typeMap = {
    'holiday': '法定节假日',
    'weekend': '周末',
    'weekday': '工作日'
  };
  return typeMap[type] || '工作日';
};

/* 获取状态文本和样式 */
const getStatusText = (status) => {
  const statusMap = {
    'REJECTED': '未通过',
    'APPROVED': '已通过',
    'PENDING': '待审核'
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const classMap = {
    'REJECTED': 'status-rejected',
    'APPROVED': 'status-approved',
    'PENDING': 'status-pending'
  };
  return classMap[status] || '';
};

/* 通知面板相关方法 */
const toggleNotificationPanel = () => {
  showNotificationPanel.value = !showNotificationPanel.value;
  if (showNotificationPanel.value) {
    fetchReviewResults(); // 打开面板时刷新数据
  }
};

const closeNotificationPanel = () => {
  showNotificationPanel.value = false;
};

/* 日历相关方法 */
const selectDay = (day) => {
  if (!day) return;
  selectedDate.value = day;
};

const saveMemo = () => {
  if (!memoText.value.trim()) {
    alert('请输入备忘内容');
    return;
  }

  if (!memos.value[dateKey.value]) {
    memos.value[dateKey.value] = [];
  }

  memos.value[dateKey.value].push(memoText.value);
  memoText.value = "";
  persist();
};

const deleteMemo = (index) => {
  if (confirm('确定删除这条备忘吗？')) {
    memos.value[dateKey.value].splice(index, 1);
    persist();
  }
};

const persist = () => {
  localStorage.setItem("edu-memos", JSON.stringify(memos.value));
};

const hasMemo = (day) => {
  if (!day) return false;
  const key = `${currentYear.value}-${currentMonth.value + 1}-${day}`;
  return memos.value[key]?.length > 0;
};

const isToday = (day) =>
  day === today.getDate() &&
  currentMonth.value === today.getMonth() &&
  currentYear.value === today.getFullYear();

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};
</script>

<style scoped>
/* ==================== 页面整体 ==================== */
.dashboard {
  max-width: 2000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
  position: relative;
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
  gap: 12px;
}

/* ==================== 通知图标 ==================== */
.notification-container {
  position: relative;
}

.notification-icon {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.notification-icon .icon {
  font-size: 20px;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* ==================== 通知面板 ==================== */
.notification-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  z-index: 1000;
  padding: 20px;
}

.notification-panel {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #409eff 0%, #3375e0 100%);
  color: white;
}

.notification-panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.empty-notification {
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 16px;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.notification-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.3s;
}

.notification-item.unread {
  background: #eff6ff;
  border-left-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.question-title {
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  margin-right: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-rejected {
  background: #fef2f2;
  color: #dc2626;
}

.status-approved {
  background: #f0fdf4;
  color: #16a34a;
}

.status-pending {
  background: #fffbeb;
  color: #d97706;
}

.notification-content {
  font-size: 14px;
  color: #4b5563;
}

.question-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
}

.review-comment {
  background: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #f87171;
}

.review-comment strong {
  color: #1f2937;
}

.notification-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 8px;
}

.mark-read-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.mark-read-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.read-status {
  color: #16a34a;
  font-size: 12px;
  font-weight: 500;
}

/* ==================== 内容区 ==================== */
.content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 28px;
  align-items: start;
}

/* ==================== 通用卡片 ==================== */
.calendar-card,
.memo-card {
  background: white;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: fit-content;
}

/* ==================== 日历区域 ==================== */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-header span {
  font-weight: 700;
  font-size: 18px;
  color: #1f2937;
}

.calendar-header button {
  background: #f3f4f6;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  color: #4b5563;
}

.calendar-header button:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

/* ==================== 日期格 ==================== */
.day {
  height: 56px;
  border-radius: 14px;
  background: #f9fafb;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.day:hover {
  background: #eef4ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.day-header em {
  font-style: normal;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.memo-icon {
  font-size: 14px;
  opacity: 0.8;
}

.day-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.day-content small {
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.festival-name {
  color: #dc2626;
  font-weight: 600;
}

/* ==================== 日期类型样式 ==================== */
.day.weekend {
  background: linear-gradient(135deg, #fff7ed, #fed7aa);
}

.day.weekend em {
  color: #ea580c;
}

.day.holiday {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  border-color: #fca5a5;
}

.day.holiday em {
  color: #dc2626;
}

.day.today {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.day.selected {
  background: linear-gradient(135deg, #3b82f6, #60a5fa) !important;
  border-color: #2563eb;
}

.day.selected em,
.day.selected .festival-name {
  color: white !important;
}

/* ==================== 日历图例 ==================== */
.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.holiday {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
}

.legend-color.weekend {
  background: linear-gradient(135deg, #fff7ed, #fed7aa);
}

/* ==================== 备忘录区域 ==================== */
.memo-header {
  margin-bottom: 20px;
}

.memo-header h2 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #1f2937;
}

.day-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.info-tag.holiday {
  background: #fef2f2;
  color: #dc2626;
}

.info-tag.weekend {
  background: #ffedd5;
  color: #ea580c;
}

.info-tag.weekday {
  background: #eff6ff;
  color: #3b82f6;
}

.festival-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  background: #fef2f2;
  color: #dc2626;
}

/* ==================== 文本区域 ==================== */
textarea {
  height: 100px;
  resize: none;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  padding: 14px;
  font-size: 14px;
  transition: all 0.3s;
  margin-bottom: 16px;
  font-family: inherit;
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ==================== 保存按钮 ==================== */
.save-btn {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 24px;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

/* ==================== 备忘录列表 ==================== */
.memo-list-container {
  flex: 1;
}

.memo-list-container h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #4b5563;
}

.memo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.memo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 10px;
  font-size: 14px;
  transition: all 0.3s;
  border-left: 4px solid #3b82f6;
}

.memo-list li:hover {
  background: #eef4ff;
  transform: translateX(4px);
}

.memo-content {
  flex: 1;
  word-break: break-word;
  padding-right: 12px;
}

.delete-btn {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s;
  font-size: 14px;
  padding: 4px;
}

.delete-btn:hover {
  opacity: 1;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .calendar-card,
  .memo-card {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .calendar-grid {
    gap: 6px;
  }
  
  .day {
    height: 80px;
    padding: 8px;
  }
  
  .calendar-legend {
    gap: 12px;
  }
  
  .notification-panel {
    width: 90vw;
    max-height: 90vh;
  }
  
  .notification-panel-overlay {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .notification-container {
    align-self: flex-end;
    margin-top: -40px;
  }
}
</style>