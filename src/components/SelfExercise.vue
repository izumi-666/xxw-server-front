<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">自我练习</h1>
      </div>
    </div>

    <!-- 主要操作区域 -->
    <div class="main-content">
      <!-- 配置区域 -->
      <div class="config-section card">
        <div class="card-header">
          <h2 class="section-title">练习配置</h2>
        </div>

        <div class="config-form">
          <!-- 年级选择（单选） -->
          <div class="form-group">
            <label class="form-label">选择年级</label>
            <select
              v-model="selectedGradeId"
              class="form-select"
              @change="onGradeChange"
            >
              <option :value="null">请选择年级</option>
              <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
          </div>

          <!-- 科目选择（单选） -->
          <div class="form-group">
            <label class="form-label">选择科目</label>
            <select
              v-model="selectedSubjectId"
              class="form-select"
              @change="onSubjectChange"
            >
              <option :value="null">请选择科目</option>
              <option v-for="(name, id) in SUBJECT_MAP" :key="id" :value="id">
                {{ name }}
              </option>
            </select>
          </div>

          <!-- 知识点选择（多选） -->
          <div class="form-group">
            <label class="form-label">选择知识点</label>
            <div class="current-selection-hint" v-if="hasSelectedGradeAndSubject">
              当前：{{ selectedSubjectName }} · {{ selectedGradeName }}
            </div>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleKnowledgeDropdown" :disabled="!canLoadKnowledgePoints">
                <span class="placeholder" v-if="selectedKnowledgePoints.length === 0">
                  {{ knowledgePlaceholder }}
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="kp in selectedKnowledgePoints"
                    :key="kp.id"
                    class="selected-tag"
                    @click.stop="removeKnowledgePoint(kp.id)"
                  >
                    {{ kp.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showKnowledgeDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="knowledgeSearch"
                    placeholder="搜索知识点..."
                    class="search-input"
                    @input="filterKnowledgePoints"
                  />
                </div>
                
                <!-- 知识点树展示区域 -->
                <div class="knowledge-tree-container" v-if="knowledgeTreeData.length > 0">
                  <div class="tree-controls">
                    <button @click="expandAllKnowledge" class="btn-small">展开所有</button>
                    <button @click="collapseAllKnowledge" class="btn-small">收起所有</button>
                    <span class="tree-info">
                      共 {{ flattenedKnowledgePoints.length }} 个知识点（{{ selectedGradeName }}）
                    </span>
                  </div>
                  
                  <div class="knowledge-tree-options">
                    <knowledge-tree
                      :data="sortedKnowledgeTree"
                      :multi-selected-ids="selectedKnowledgeIds"
                      @select="toggleKnowledgeSelection"
                      :show-grade="false"
                      @toggle="onToggleNode"
                    />
                  </div>
                </div>
                
                <div v-else-if="knowledgeTreeData.length === 0 && hasSelectedGradeAndSubject && !loadingKnowledgePoints" class="no-options">
                  暂无知识点数据
                </div>
                <div v-else-if="loadingKnowledgePoints" class="loading-options">
                  加载中...
                </div>
                <div v-else class="no-options">
                  请先选择年级和科目
                </div>
              </div>
            </div>
            <div class="form-hint" v-if="hasSelectedGradeAndSubject">
              已选 {{ selectedKnowledgePoints.length }} 个知识点（可多选）
            </div>
            <div class="form-hint" v-else>
              请先选择年级和科目以加载知识点
            </div>
          </div>

          <!-- 难度筛选（多选） -->
          <div class="form-group">
            <label class="form-label">难度</label>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleDifficultyDropdown">
                <span class="placeholder" v-if="selectedDifficulties.length === 0">
                  选择难度
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="diff in selectedDifficulties"
                    :key="diff.value"
                    class="selected-tag"
                    @click.stop="removeDifficulty(diff.value)"
                  >
                    {{ diff.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showDifficultyDropdown">
                <div class="dropdown-options">
                  <div
                    v-for="diff in difficultyList"
                    :key="diff.value"
                    class="dropdown-option"
                    @click="toggleDifficulty(diff)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isDifficultySelected(diff.value) }"
                    >
                      {{ isDifficultySelected(diff.value) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ diff.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-hint">可多选难度等级</div>
          </div>

          <!-- 当前学生信息（只读） -->
          <div class="form-group">
            <label class="form-label">当前学生</label>
            <div class="form-input read-only">
              {{ studentInfo }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button
              @click="startExcise"
              class="btn-primary"
              :disabled="!canstartExcise"
            >
              <span class="btn-icon">▶</span>
              开始评估
            </button>
            <button @click="resetForm" class="btn-secondary">
              <span class="btn-icon">↺</span>
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在加载,请稍候...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useGradeList } from "../utils/gradeList";
import { SUBJECT_MAP, initSubjectData } from "../utils/subjectList";
import KnowledgeTree from "../components/KnowledgePointTree.vue";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();

// ==================== 状态管理 ====================
const { gradeList, loadGradeList } = useGradeList();
const selectedGradeId = ref(null);
const selectedSubjectId = ref(null);
const studentInfo = ref("");

// 下拉框状态
const showKnowledgeDropdown = ref(false);
const showDifficultyDropdown = ref(false);
const knowledgeSearch = ref("");

// 难度等级列表
const difficultyList = ref([
  { value: 1, name: '⭐' },
  { value: 2, name: '⭐⭐' },
  { value: 3, name: '⭐⭐⭐' },
  { value: 4, name: '⭐⭐⭐⭐' },
  { value: 5, name: '⭐⭐⭐⭐⭐' }
]);

// 过滤后的列表
const filteredKnowledgeTree = ref([]);

// 难度选择相关状态
const selectedDifficulties = ref([]);

// 知识点相关状态
const knowledgeTreeData = ref([]);
const selectedKnowledgePoints = ref([]);
const loadingKnowledgePoints = ref(false);
const isLoading = ref(false);

// ==================== 监听器 ====================
// 添加对年级和科目变化的监听
watch([selectedGradeId, selectedSubjectId], ([gradeId, subjectId]) => {
  if (gradeId !== null && subjectId !== null) {
    selectedKnowledgePoints.value = [];
    knowledgeTreeData.value = [];
    showKnowledgeDropdown.value = false;
    loadKnowledgePoints();
  }
}, { deep: true });

// 监听知识点搜索
watch(knowledgeSearch, (searchTerm) => {
  filterKnowledgePoints(searchTerm);
});

// ==================== 计算属性 ====================
const loadCurrentStudent = () => {
  const userName = localStorage.getItem("userName");
  if (!userName) {
    return;
  }
  studentInfo.value = userName;
};

const canLoadKnowledgePoints = computed(() => {
  return selectedGradeId.value !== null && selectedSubjectId.value !== null;
});

const hasSelectedGradeAndSubject = computed(() => {
  return selectedGradeId.value !== null && selectedSubjectId.value !== null;
});

const knowledgePlaceholder = computed(() => {
  if (!hasSelectedGradeAndSubject.value) {
    return "请先选择年级和科目";
  }
  if (loadingKnowledgePoints.value) {
    return "加载知识点中...";
  }
  if (knowledgeTreeData.value.length === 0) {
    return "暂无知识点数据";
  }
  return "请选择知识点";
});

const selectedKnowledgeIds = computed(() => {
  return selectedKnowledgePoints.value.map(kp => kp.id);
});

// 使用独立的搜索过滤方法
const sortedKnowledgeTree = computed(() => {
  const sortTree = (nodes) => {
    if (!nodes || !nodes.length) return nodes;

    nodes.sort((a, b) => {
      const orderA = Number(a.sort_order) || 0;
      const orderB = Number(b.sort_order) || 0;
      return orderA - orderB;
    });

    nodes.forEach(node => {
      if (node.children?.length) {
        sortTree(node.children);
      }
    });

    return nodes;
  };

  return sortTree(knowledgeTreeData.value);
});

// 扁平化的知识点列表（仅用于显示数量）
const flattenedKnowledgePoints = computed(() => {
  const flatten = (nodes) => {
    let result = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length) {
        result = result.concat(flatten(node.children));
      }
    });
    return result;
  };
  
  // 如果没有搜索，使用原始数据；如果有搜索，使用过滤后的数据
  const sourceData = knowledgeSearch.value.trim() ? filteredKnowledgeTree.value : sortedKnowledgeTree.value;
  return flatten(sourceData);
});

const selectedGradeName = computed(() => {
  const grade = gradeList.value.find(g => g.id === selectedGradeId.value);
  return grade ? grade.name : '';
});

const selectedSubjectName = computed(() => {
  return selectedSubjectId.value ? SUBJECT_MAP[selectedSubjectId.value] : '';
});

const canstartExcise = computed(() => {
  return (
    selectedGradeId.value !== null &&
    selectedSubjectId.value !== null &&
    selectedKnowledgePoints.value.length > 0 &&
    selectedDifficulties.value.length > 0 &&
    !!studentInfo.value
  );
});

// ==================== 方法 ====================
const onGradeChange = () => {
  // 切换年级时知识点会自动由watch监听器处理
};

// 难度选择相关方法
const toggleDifficultyDropdown = () => {
  showDifficultyDropdown.value = !showDifficultyDropdown.value;
};

const toggleDifficulty = (diff) => {
  const index = selectedDifficulties.value.findIndex((d) => d.value === diff.value);
  if (index > -1) {
    selectedDifficulties.value.splice(index, 1);
  } else {
    selectedDifficulties.value.push(diff);
  }
};

const removeDifficulty = (value) => {
  selectedDifficulties.value = selectedDifficulties.value.filter((d) => d.value !== value);
};

const isDifficultySelected = (value) => {
  return selectedDifficulties.value.some((d) => d.value === value);
};

const toggleKnowledgeDropdown = async () => {
  if (!canLoadKnowledgePoints.value) {
    ElMessage.warning("请先选择年级和科目");
    return;
  }

  showKnowledgeDropdown.value = !showKnowledgeDropdown.value;
  
  if (showKnowledgeDropdown.value && knowledgeTreeData.value.length === 0 && !loadingKnowledgePoints.value) {
    await loadKnowledgePoints();
  }
};

// 知识点的搜索过滤方法
const filterKnowledgePoints = (searchTerm = null) => {
  const term = searchTerm || knowledgeSearch.value;
  
  if (!term.trim()) {
    // 如果搜索词为空，恢复原始树结构
    filteredKnowledgeTree.value = sortedKnowledgeTree.value;
    return;
  }
  
  const searchText = term.toLowerCase();
  
  const filterTree = (nodes) => {
    if (!nodes || !nodes.length) return [];
    
    const result = [];
    
    nodes.forEach(node => {
      const name = node.displayName || node.name || '';
      const originalName = node.originalName || '';
      
      const isMatch = name.toLowerCase().includes(searchText) ||
                     originalName.toLowerCase().includes(searchText);
      
      // 如果有子节点，先过滤子节点
      let filteredChildren = [];
      if (node.children && node.children.length) {
        filteredChildren = filterTree(node.children);
      }
      
      // 如果当前节点匹配或者子节点有匹配，则保留该节点
      if (isMatch || filteredChildren.length > 0) {
        const newNode = { ...node };
        newNode.children = filteredChildren;
        if (filteredChildren.length > 0 && !isMatch) {
          newNode.expanded = true;
        }
        result.push(newNode);
      }
    });
    
    return result;
  };
  
  filteredKnowledgeTree.value = filterTree(sortedKnowledgeTree.value);
};

const toggleKnowledgeSelection = (knowledge) => {
  const index = selectedKnowledgePoints.value.findIndex(kp => kp.id === knowledge.id);
  if (index > -1) {
    selectedKnowledgePoints.value.splice(index, 1);
  } else {
    selectedKnowledgePoints.value.push({
      id: knowledge.id,
      name: knowledge.displayName || knowledge.name,
      originalName: knowledge.originalName || knowledge.name
    });
  }
};

const removeKnowledgePoint = (id) => {
  selectedKnowledgePoints.value = selectedKnowledgePoints.value.filter(kp => kp.id !== id);
};

const expandAllKnowledge = () => {
  const expandNodes = (nodes) => {
    nodes.forEach((node) => {
      node.expanded = true;
      if (node.children && node.children.length) {
        expandNodes(node.children);
      }
    });
  };
  expandNodes(knowledgeTreeData.value);
  // 同时更新过滤后的树
  expandNodes(filteredKnowledgeTree.value);
};

const collapseAllKnowledge = () => {
  const collapseNodes = (nodes) => {
    nodes.forEach((node) => {
      node.expanded = false;
      if (node.children && node.children.length) {
        collapseNodes(node.children);
      }
    });
  };
  collapseNodes(knowledgeTreeData.value);
  // 同时更新过滤后的树
  collapseNodes(filteredKnowledgeTree.value);
};

// 展开/收起节点
const onToggleNode = (knowledge) => {
  // 切换当前节点的展开状态
  knowledge.expanded = !knowledge.expanded;
  
  // 递归设置所有子节点的展开状态
  const setChildrenExpanded = (node, expanded) => {
    if (node.children && node.children.length) {
      node.children.forEach((child) => {
        child.expanded = expanded;
        if (child.children && child.children.length) {
          setChildrenExpanded(child, expanded);
        }
      });
    }
  };

  setChildrenExpanded(knowledge, knowledge.expanded);
};

// 加载知识点树
const loadKnowledgePoints = async () => {
  if (!canLoadKnowledgePoints.value) return;

  loadingKnowledgePoints.value = true;
  knowledgeTreeData.value = [];
  filteredKnowledgeTree.value = []; // 清空过滤结果
  
  try {
    const gradeId = selectedGradeId.value;
    const subjectId = selectedSubjectId.value;
    const grade = gradeList.value.find(g => g.id === gradeId);
    
    const response = await axios.get(
      `${API_BASE}/questions/getKnowledgePointJson/${subjectId}/${gradeId}`
    );

    const data = response.data;
    
    if (data.code === 200 && data.data && data.data.length > 0) {
      const addGradeInfo = (nodes) => {
        return nodes.map(node => {
          const currentNode = {
            ...node,
            gradeId,
            gradeName: grade?.name || '',
            displayName: node.name,
            originalName: node.name,
            expanded: true
          };
          
          if (node.children && node.children.length) {
            currentNode.children = addGradeInfo(node.children);
          }
          
          return currentNode;
        });
      };
      
      const gradeKnowledge = addGradeInfo(data.data || []);
      knowledgeTreeData.value = gradeKnowledge;
      filteredKnowledgeTree.value = sortedKnowledgeTree.value; // 初始时显示全部
    } else {
      ElMessage.warning("该年级和科目暂无知识点数据");
      knowledgeTreeData.value = [];
      filteredKnowledgeTree.value = [];
    }
    
  } catch (err) {
    console.error("加载知识点失败:", err);
    ElMessage.error("加载知识点失败，请稍后重试");
    knowledgeTreeData.value = [];
    filteredKnowledgeTree.value = [];
  } finally {
    loadingKnowledgePoints.value = false;
  }
};

const onSubjectChange = () => {
  // 切换科目时知识点会自动由watch监听器处理
};

// 开始评估
const startExcise = async () => {
  if (!canstartExcise.value) return;

  isLoading.value = true;

  try {
    const { data: res } = await axios.post(
      `${API_BASE}/learning/selfExercise`,
      {
        subject_id: selectedSubjectId.value,
        grade_id: selectedGradeId.value,
        knowledge_point_ids: selectedKnowledgePoints.value.map(kp => kp.id),
        difficulty_levels: selectedDifficulties.value.map(d => d.value),
        student: studentInfo.value,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.code !== 200) {
      ElMessage.error(
        res.code === 500 ? "暂无相应题目" : res.message || "评估失败"
      );
      return;
    }

    const assessmentData = res.data;
    if (!assessmentData) {
      ElMessage.error("评测数据为空");
      return;
    }

    localStorage.setItem(
      "current_assessment",
      JSON.stringify({
        ...assessmentData,
        subject_name: SUBJECT_MAP[selectedSubjectId.value] || selectedSubjectId.value,
        grade_name: selectedGradeName.value,
        difficulty_names: selectedDifficulties.value.map(d => d.name).join(", "),
        knowledge_point_names: selectedKnowledgePoints.value.map(kp => kp.originalName || kp.name).join(", "),
      })
    );

    router.push({
      path: "/student/selfexercise/selftakeexercise",
      query: {
        exam_history_id: assessmentData.exam_history_id,
        exam_id: assessmentData.exam_id,
        subject_name: SUBJECT_MAP[selectedSubjectId.value],
        grade_name: selectedGradeName.value,
        difficulty_names: selectedDifficulties.value.map(d => d.name).join(", "),
        knowledge_point_names: selectedKnowledgePoints.value.map(kp => kp.originalName || kp.name).join(", "),
      },
    });
  } catch (err) {
    console.error("评估请求失败:", err);
    ElMessage.error(
      err.response?.data?.message || "网络或服务器异常，请稍后重试"
    );
  } finally {
    isLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  selectedGradeId.value = null;
  selectedSubjectId.value = null;
  selectedDifficulties.value = [];
  selectedKnowledgePoints.value = [];
  knowledgeTreeData.value = [];
  filteredKnowledgeTree.value = [];
  knowledgeSearch.value = "";
};

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  if (!event.target.closest(".multi-select-wrapper")) {
    showKnowledgeDropdown.value = false;
    showDifficultyDropdown.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  loadGradeList();
  initSubjectData();
  loadCurrentStudent();
  document.addEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
* {
  box-sizing: border-box;
}

.container {
  max-width: 2000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
}

/* ==================== 页面头部样式 ==================== */
.page-header {
  background: linear-gradient(135deg, #409eff 0%, #3375e0 100%);
  border-radius: 12px;
  padding: 20px 30px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
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
  gap: 10px;
}

/* ==================== 卡片通用样式 ==================== */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  border: 1px solid #e6e9f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6e9f0;
}

.section-title {
  font-size: 20px;
  margin: 0;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 配置区域样式 ==================== */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 当前选择提示 */
.current-selection-hint {
  font-size: 12px;
  color: #67c23a;
  background-color: #f0f9eb;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  border: 1px solid #e1f3d8;
}

/* ==================== 多选下拉框样式 ==================== */
.multi-select-wrapper {
  position: relative;
  width: 100%;
}

.multi-select-trigger {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  min-height: 46px;
}

.multi-select-trigger:hover {
  border-color: #c0c4cc;
}

.multi-select-trigger:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.multi-select-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f7fa;
}

.placeholder {
  color: #c0c4cc;
  font-size: 14px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.selected-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #d9ecff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-tag:hover {
  background: #d9ecff;
  transform: translateY(-1px);
}

.remove-icon {
  font-weight: bold;
  font-size: 14px;
  color: #f56c6c;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s;
}

.remove-icon:hover {
  background-color: rgba(245, 108, 108, 0.1);
}

.dropdown-arrow {
  color: #c0c4cc;
  font-size: 12px;
  transition: transform 0.3s;
}

.multi-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input-container {
  padding: 8px;
  border-bottom: 1px solid #e6e9f0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.dropdown-options {
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.dropdown-option:hover {
  background-color: #f5f7fa;
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.checkbox.checked {
  background-color: #409eff;
  border-color: #409eff;
}

.option-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.no-options {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* ==================== 表单控件样式 ==================== */
.form-select,
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  background-color: white;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input.read-only {
  background-color: #f5f7fa;
  color: #606266;
  cursor: not-allowed;
}

/* ==================== 按钮样式 ==================== */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

.btn-secondary {
  background-color: #f4f4f5;
  color: #606266;
  border: 1px solid #d3d4d6;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover {
  background-color: #e9e9eb;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 16px;
}

/* 小按钮样式 */
.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-small:hover {
  background: #409eff;
  color: white;
}

/* ==================== 知识点树容器样式 ==================== */
.knowledge-tree-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tree-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.tree-info {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.knowledge-tree-options {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

/* 知识点树节点样式 */
:deep(.knowledge-tree-node .node-content) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

:deep(.knowledge-tree-node .node-content:hover) {
  background-color: #f5f7fa;
}

.loading-options {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* ==================== 加载状态样式 ==================== */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .main-content {
    padding: 0;
  }

  .card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .knowledge-tree-options {
    max-height: 300px;
  }
  
  .tree-controls {
    flex-wrap: wrap;
  }
  
  .tree-info {
    margin-left: 0;
    width: 100%;
    text-align: center;
    margin-top: 4px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }
  
  .dropdown-option {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>