import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// 创建响应式数据
const schoolList = ref([])
const loading = ref(false)

/**
 * 获取学校列表
 */
export const getSchoolList = async () => {
  loading.value = true
  
  try {
    const res = await axios.get(`${API_BASE}/questions/getSchoolList`)
    // 转换数据结构：{ id: name } -> [{ id, name }]
    schoolList.value = Object.entries(res.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }))
    
  } catch (error) {
    console.error("获取学校列表失败:", error)
    schoolList.value = []
    ElMessage.error("获取学校列表失败，请稍后重试")
    
  } finally {
    loading.value = false
  }
}

/**
 * 清空学校列表
 */
export const resetSchoolList = () => {
  schoolList.value = []
}