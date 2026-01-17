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

  return {
    gradeList,
    filterGrades,
    loading,
    loadGradeList,
  }
}
