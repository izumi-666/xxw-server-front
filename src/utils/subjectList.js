import { ref } from 'vue';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 科目映射缓存
const SUBJECT_MAP = ref({});
// 加载状态
const loading = ref(false);
// 是否已初始化
let initialized = false;

/**
 * 获取科目列表
 */
const fetchSubjectList = async () => {
  if (initialized && Object.keys(SUBJECT_MAP.value).length > 0) {
    return SUBJECT_MAP.value;
  }

  try {
    loading.value = true;
    const response = await axios.get(`${API_BASE}/questions/getSubjectList`);
    if (response.data && response.data.code === 200) {
      SUBJECT_MAP.value = response.data.data;
      initialized = true;
      return SUBJECT_MAP.value;
    }
    return {};
  } catch (error) {
    console.error('获取科目列表失败:', error);
    return {};
  } finally {
    loading.value = false;
  }
};

/**
 * 获取科目名称
 * @param {string|number} subjectId - 科目ID
 * @returns {string} 科目名称
 */
const getSubjectName = (subjectId) => {
  if (!subjectId && subjectId !== 0) return '未知科目';
  const subjectIdStr = subjectId.toString();
  return SUBJECT_MAP.value[subjectIdStr] || `科目${subjectId}`;
};

/**
 * 初始化科目数据
 */
const initSubjectData = async () => {
  if (!initialized) {
    await fetchSubjectList();
  }
};

/**
 * 获取所有科目列表（用于下拉框）
 * @returns {Array} 科目名称数组
 */
const getAllSubjects = () => {
  const subjects = Object.values(SUBJECT_MAP.value);
  return [...new Set(subjects)].sort();
};

/**
 * 根据科目名称获取ID
 * @param {string} subjectName - 科目名称
 * @returns {string|null} 科目ID
 */
const getSubjectIdByName = (subjectName) => {
  if (!subjectName) return null;
  
  const entries = Object.entries(SUBJECT_MAP.value);
  const entry = entries.find(([id, name]) => name === subjectName);
  return entry ? entry[0] : null;
};

export {
  SUBJECT_MAP,
  loading as subjectLoading,
  fetchSubjectList,
  getSubjectName,
  initSubjectData,
  getAllSubjects,
  getSubjectIdByName,
};