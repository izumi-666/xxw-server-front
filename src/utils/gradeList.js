import { ref } from "vue"
import axios from "axios"
import { ElMessage } from "element-plus"

const API_BASE = import.meta.env.VITE_API_BASE_URL

/**
 * 年级列表通用逻辑
 */
export function useGradeList() {
  const gradeList = ref([])
  const filterGrades = ref([])
  const loading = ref(false)

  /**
   * 获取年级列表
   */
  const loadGradeList = async () => {
    loading.value = true
    try {
      const res = await axios.get(
        `${API_BASE}/questions/getGradeList`
      )

      gradeList.value = Object.entries(res.data.data || {}).map(
        ([id, name]) => ({
          id: Number(id),
          name,
        })
      )

      filterGrades.value = gradeList.value
    } catch (error) {
      console.error("加载年级列表失败:", error)
      ElMessage.error("加载年级列表失败")
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取年级名称
   * @param {string|number} gradeId - 年级ID
   * @returns {string} 年级名称
   */
  const getGradeName = (gradeId) => {
    if (gradeId === undefined || gradeId === null) return '未知年级'
    
    // 将 gradeId 转换为数字进行比较
    const id = Number(gradeId)
    
    // 在 gradeList 中查找对应的年级
    const grade = gradeList.value.find(item => item.id === id)
    
    return grade ? grade.name : `年级ID: ${gradeId}`
  }

  return {
    gradeList,
    filterGrades,
    loading,
    loadGradeList,
    getGradeName
  }
}