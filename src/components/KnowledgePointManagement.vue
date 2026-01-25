<template>
  <!-- 主容器 -->
  <div class="container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">知识点管理系统</h1>
      </div>
    </div>

    <!-- 筛选条件区域 -->
    <div class="filter-section">
      <h2>筛选条件</h2>
      <div class="filter-row">
        <!-- 年级选择 -->
        <div class="filter-item">
          <label class="filter-label">年级：</label>
          <select v-model="selectedGradeId" class="form-select" @change="onGradeChange">
            <option :value="null">请选择年级</option>
            <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
              {{ grade.name }}
            </option>
          </select>
        </div>

        <!-- 科目选择 -->
        <div class="filter-item">
          <label class="filter-label">科目：</label>
          <select
            v-model="selectedSubjectId"
            class="form-select"
            @change="onSubjectChange"
          >
            <option :value="null">请选择科目</option>
            <option v-for="subject in subjectList" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>

        <!-- 操作按钮组 -->
        <div class="filter-item">
          <div class="button-group">
            <button @click="loadKnowledgePoints" class="btn-primary" :disabled="!canLoad">
              加载知识点
            </button>
            <button
              @click="showUploadJsonModal"
              class="btn-secondary"
              :disabled="!canLoad"
            >
              上传JSON知识点
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 知识点管理区域 -->
    <div class="knowledge-management-section">
      <div class="knowledge-container">
        <!-- 左侧知识点树 -->
        <div class="knowledge-tree-section">
          <h3>知识点结构</h3>
          <div class="tree-header">
            <span class="tree-info" v-if="KnowledgePointTree.length">
              共 {{ totalCount }} 个知识点
            </span>
            <span class="tree-info" v-else> 请先选择年级和科目 </span>
          </div>
          <div class="tree-container" v-if="KnowledgePointTree.length">
            <!-- 知识点树组件 -->
            <button @click="expandAll" class="btn-small">展开所有</button>
            <button @click="collapseAll" class="btn-small">收起所有</button>
            <knowledge-tree
              :data="sortedKnowledgeTree"
              :selected-id="selectedKnowledgeId"
              @select="onSelectKnowledge"
              @toggle="onToggleNode"
            />
          </div>
          <div class="empty-tree" v-else-if="hasSelectedGradeAndSubject && !loading">
            <p>暂无知识点数据</p>
          </div>
          <div class="loading-tree" v-else-if="loading">
            <p>加载中...</p>
          </div>
        </div>

        <!-- 右侧知识点详情 -->
        <div class="knowledge-detail-section">
          <h3>知识点详情</h3>
          <div class="detail-content" v-if="selectedKnowledge">
            <!-- 基本信息 -->
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>知识点ID：</label>
                  <span>{{ selectedKnowledge.id }}</span>
                </div>
                <div class="detail-item">
                  <label>知识点名称：</label>
                  <span>{{ selectedKnowledge.name }}</span>
                </div>
                <div class="detail-item">
                  <label>排序序号：</label>
                  <span>{{ selectedKnowledge.sort_order }}</span>
                </div>
                <div class="detail-item">
                  <label>子知识点数量：</label>
                  <span>{{
                    selectedKnowledge.children ? selectedKnowledge.children.length : 0
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 操作区域 -->
            <div class="detail-section">
              <h4>操作</h4>
              <div class="action-buttons">
                <!-- 修改这里：按钮名称改为"更新知识点名称" -->
                <button
                  v-if="hasPermission('question:update')"
                  @click="updateKnowledgeName"
                  class="btn-primary"
                >
                  更新知识点名称
                </button>
                <button
                  v-if="hasPermission('question:delete')"
                  @click="confirmDeleteKnowledge"
                  class="btn-delete"
                >
                  删除知识点
                </button>
              </div>
            </div>

            <!-- 子知识点列表 -->
            <div
              class="detail-section"
              v-if="selectedKnowledge.children && selectedKnowledge.children.length"
            >
              <h4>子知识点列表</h4>
              <div class="children-list">
                <div
                  v-for="child in sortedChildren"
                  :key="child.id"
                  class="child-item"
                  @click="onSelectKnowledge(child)"
                >
                  <div class="child-content">
                    <span class="child-order">{{ child.sort_order }}</span>
                    <span class="child-name">{{ child.name }}</span>
                    <span
                      class="child-subcount"
                      v-if="child.children && child.children.length"
                    >
                      ({{ child.children.length }}个子项)
                    </span>
                  </div>
                  <div class="child-actions">
                    <!-- 修改这里：子知识点的按钮名称也改为"更新名称" -->
                    <button
                      v-if="hasPermission('question:update')"
                      @click.stop="updateChildKnowledgeName(child)"
                      class="btn-edit-small"
                    >
                      更新名称
                    </button>
                    <button
                      v-if="hasPermission('question:delete')"
                      @click.stop="confirmDeleteChildKnowledge(child)"
                      class="btn-remove-small"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 路径信息 -->
            <div class="detail-section">
              <h4>路径信息</h4>
              <div class="path-info">
                <div class="path-breadcrumb">
                  <span
                    v-for="(item, index) in knowledgePath"
                    :key="item.id"
                    class="path-item"
                    @click="onSelectPath(item)"
                  >
                    {{ item.name }}
                    <span v-if="index < knowledgePath.length - 1" class="path-separator">
                      >
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 未选择提示 -->
          <div class="no-selection" v-else>
            <p>请从左侧选择知识点</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 更新知识点名称模态框 ==================== -->
    <!-- 修改这里：模态框标题改为"更新知识点名称" -->
    <div v-if="showUpdateNameModal" class="modal-overlay">
      <div class="modal-content">
        <h3>更新知识点名称</h3>
        <div class="form-group">
          <label class="form-label required">知识点名称：</label>
          <input
            type="text"
            v-model="updatingKnowledge.name"
            placeholder="请输入新的知识点名称"
            class="form-input"
            :maxlength="50"
          />
          <div class="original-name" v-if="updatingKnowledge.originalName">
            原名称：{{ updatingKnowledge.originalName }}
          </div>
        </div>
        <div class="modal-actions">
          <button
            @click="saveUpdatedKnowledgeName"
            class="btn-primary"
            :disabled="!canSaveUpdatedName"
          >
            保存
          </button>
          <button @click="cancelUpdateName" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- ==================== 删除确认对话框 ==================== -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除知识点 "{{ deleteKnowledgeData?.name }}" 吗？</p>
        <div v-if="deleteKnowledgeData?.children?.length" class="delete-warning">
          <p>
            <strong>警告：</strong>该知识点有
            {{ deleteKnowledgeData.children.length }} 个子知识点，删除后将一并删除！
          </p>
        </div>
        <div class="modal-actions">
          <button @click="deleteKnowledge" class="btn-delete">确认删除</button>
          <button @click="cancelDelete" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- ==================== 上传JSON模态框 ==================== -->
    <div v-if="showUploadJsonModalVisible" class="modal-overlay">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>上传JSON格式知识点</h3>
          <button @click="closeUploadJsonModal" class="modal-close-btn">&times;</button>
        </div>

        <div class="form-group">
          <label class="form-label required">当前年级：</label>
          <div class="current-selection">
            <span class="selection-value">{{ selectedGradeName }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">当前科目：</label>
          <div class="current-selection">
            <span class="selection-value">{{ selectedSubjectName }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">JSON内容：</label>
          <div class="json-input-container">
            <textarea
              v-model="jsonContent"
              placeholder='请输入JSON格式的知识点结构，例如：
{
  "name": "第一章 有理数",
  "children": [
    {
      "name": "有理数的概念",
      "children": [
        { "name": "有理数的分类" },
        { "name": "整数的概念" }
      ]
    }
  ]
}

注意：JSON中不需要包含id字段，系统会自动生成'
              class="json-textarea"
              rows="15"
            ></textarea>
            <div class="json-preview">
              <h4>JSON格式说明：</h4>
              <ul>
                <li>根节点可以包含名称和子节点</li>
                <li>每个节点必须有"name"字段</li>
                <li>子节点通过"children"数组表示</li>
                <li>id字段不需要提供，系统会自动生成
                    (如果是已有知识点则使用其id)</li>
                <li>sort_order必须填写</li>
              </ul>
              <div class="json-example">
                <h5>示例：</h5>
                <pre>{{ jsonExample }}</pre>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            @click="uploadJsonKnowledge"
            class="btn-primary"
            :disabled="!canUploadJson || uploading"
          >
            <span v-if="uploading">上传中...</span>
            <span v-else>确认上传</span>
          </button>
          <button @click="closeUploadJsonModal" class="btn-secondary">取消</button>
          <button @click="loadJsonTemplate" class="btn-secondary" :disabled="uploading">
            加载示例
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import KnowledgeTree from "./KnowledgePointTree.vue";

// API基础URL
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ==================== 权限检查函数 ====================
const hasPermission = (permission) => {
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  if (permissions.includes(permission)) {
    return true;
  }

  const permissionParts = permission.split(":");
  if (permissionParts.length === 2) {
    const [resource, action] = permissionParts;
    if (permissions.includes(`${resource}:*`)) {
      return true;
    }
    if (permissions.includes(`*:${action}`)) {
      return true;
    }
    if (permissions.includes("*:*")) {
      return true;
    }
  }

  return false;
};

// ==================== 数据状态 ====================
const gradeList = ref([]); // 年级列表
const subjectList = ref([]); // 科目列表
const selectedGradeId = ref(null); // 选中的年级ID
const selectedSubjectId = ref(null); // 选中的科目ID
const KnowledgePointTree = ref([]); // 知识点树
const selectedKnowledgeId = ref(null); // 选中的知识点ID
const selectedKnowledge = ref(null); // 选中的知识点对象
const knowledgePath = ref([]); // 知识点路径
const loading = ref(false); // 加载状态

// 更新知识点名称相关状态
const showUpdateNameModal = ref(false); // 更新名称模态框显示状态
const updatingKnowledge = reactive({
  id: null,
  name: "",
  originalName: "", // 添加原名称字段
});

// 删除相关状态
const showDeleteConfirm = ref(false); // 删除确认框显示状态
const deleteKnowledgeData = ref(null); // 待删除的知识点数据

// ==================== JSON上传相关状态 ====================
const showUploadJsonModalVisible = ref(false); // 上传JSON模态框显示状态
const jsonContent = ref(""); // JSON内容
const uploading = ref(false); // 上传中状态

// JSON示例
const jsonExample = `{
  "name": "第一章 有理数",
  "children": [
    {
      "name": "有理数的概念",
      "children": [
        { "name": "有理数的分类" },
        { "name": "整数的概念" },
        { "name": "分数的定义" }
      ]
    },
    {
      "name": "正数和负数",
      "children": [
        { "name": "正数、负数和零的概念" },
        { "name": "零的特殊性" }
      ]
    },
    {
      "name": "数轴",
      "children": [
        { "name": "数轴的概念" },
        { "name": "数轴与有理数大小" },
        { "name": "数轴上的点的移动" },
        { "name": "数轴上两点间距离公式" },
        { "name": "中点坐标公式" }
      ]
    }
  ]
}`;

// ==================== 计算属性 ====================
// 是否可以加载知识点
const canLoad = computed(() => {
  return selectedGradeId.value !== null && selectedSubjectId.value !== null;
});

// 是否已选择年级和科目
const hasSelectedGradeAndSubject = computed(() => {
  return selectedGradeId.value !== null && selectedSubjectId.value !== null;
});

// 知识点总数
const totalCount = computed(() => {
  let count = 0;
  const countNodes = (nodes) => {
    nodes.forEach((node) => {
      count++;
      if (node.children && node.children.length) {
        countNodes(node.children);
      }
    });
  };
  countNodes(KnowledgePointTree.value);
  return count;
});

// 排序后的子知识点
const sortedChildren = computed(() => {
  if (!selectedKnowledge.value || !selectedKnowledge.value.children) return [];
  return [...selectedKnowledge.value.children].sort(
    (a, b) => a.sort_order - b.sort_order
  );
});

// 选中的年级名称
const selectedGradeName = computed(() => {
  const grade = gradeList.value.find((g) => g.id === selectedGradeId.value);
  return grade ? grade.name : "未选择";
});

// 选中的科目名称
const selectedSubjectName = computed(() => {
  const subject = subjectList.value.find((s) => s.id === selectedSubjectId.value);
  return subject ? subject.name : "未选择";
});

// 是否可以上传JSON
const canUploadJson = computed(() => {
  return canLoad.value && jsonContent.value.trim() !== "";
});

// 是否可以保存更新的名称
const canSaveUpdatedName = computed(() => {
  return (
    updatingKnowledge.name.trim() !== "" &&
    updatingKnowledge.name.trim() !== updatingKnowledge.originalName
  );
});

// 按sort_order排序的知识点树
const sortedKnowledgeTree = computed(() => {
  const sortTree = (nodes) => {
    if (!nodes || !nodes.length) return [];

    // 先对当前层级排序
    const sortedNodes = [...nodes].sort((a, b) => {
      // 确保sort_order是数字类型
      const orderA = Number(a.sort_order) || 0;
      const orderB = Number(b.sort_order) || 0;
      return orderA - orderB;
    });

    // 递归对子节点排序
    return sortedNodes.map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children) : [],
    }));
  };

  return sortTree(KnowledgePointTree.value);
});

// ==================== 生命周期 ====================
onMounted(() => {
  loadGradeList();
  loadSubjectList();
});

// ==================== 数据加载方法 ====================
// 加载年级列表
const loadGradeList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getGradeList`);
    const data = res.data.data || {};
    gradeList.value = Object.entries(data).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
  } catch (err) {
    console.error("加载年级列表失败:", err);
    ElMessage.error("加载年级列表失败");
  }
};

// 加载科目列表
const loadSubjectList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getSubjectList`);
    const data = res.data.data || {};
    subjectList.value = Object.entries(data).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
  } catch (err) {
    console.error("加载科目列表失败:", err);
    ElMessage.error("加载科目列表失败");
  }
};

// 加载知识点树
const loadKnowledgePoints = async () => {
  if (!canLoad.value) {
    ElMessage.warning("请先选择年级和科目");
    return;
  }

  loading.value = true;
  try {
    const res = await axios.get(
      `${API_BASE}/questions/getKnowledgePointJson/${selectedSubjectId.value}/${selectedGradeId.value}`
    );

    if (res.data.code === 200) {
      // 添加排序处理函数
      const processTreeData = (nodes) => {
        if (!nodes || !nodes.length) return [];

        // 先排序当前层级
        const sortedNodes = [...nodes].sort((a, b) => {
          const orderA = Number(a.sort_order) || 0;
          const orderB = Number(b.sort_order) || 0;
          return orderA - orderB;
        });

        // 递归处理子节点
        return sortedNodes.map((node) => {
          const processedNode = {
            ...node,
            expanded: true,
          };

          if (node.children && node.children.length) {
            processedNode.children = processTreeData(node.children);
          }

          return processedNode;
        });
      };

      KnowledgePointTree.value = processTreeData(res.data.data || []);
      ElMessage.success("知识点加载成功");

      // 重置选择
      selectedKnowledgeId.value = null;
      selectedKnowledge.value = null;
      knowledgePath.value = [];
    } else {
      ElMessage.error(res.data.message || "加载失败");
    }
  } catch (err) {
    console.error("加载知识点失败:", err);
    ElMessage.error("加载知识点失败");
    KnowledgePointTree.value = [];
  } finally {
    loading.value = false;
  }
};

// ==================== 知识点选择方法 ====================
// 选择知识点
const onSelectKnowledge = (knowledge) => {
  selectedKnowledgeId.value = knowledge.id;
  selectedKnowledge.value = knowledge;

  // 构建路径
  buildKnowledgePath(knowledge.id);
};

// 构建知识点路径
const buildKnowledgePath = (knowledgeId) => {
  knowledgePath.value = [];

  const findPath = (nodes, targetId, path = []) => {
    for (const node of nodes) {
      const currentPath = [...path, node];
      if (node.id === targetId) {
        return currentPath;
      }
      if (node.children && node.children.length) {
        const found = findPath(node.children, targetId, currentPath);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const path = findPath(KnowledgePointTree.value, knowledgeId);
  if (path) {
    knowledgePath.value = path;
  }
};

// 选择路径中的知识点
const onSelectPath = (knowledge) => {
  onSelectKnowledge(knowledge);
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

// 展开所有节点
const expandAll = () => {
  const expandNodes = (nodes) => {
    nodes.forEach((node) => {
      node.expanded = true;
      if (node.children && node.children.length) {
        expandNodes(node.children);
      }
    });
  };
  expandNodes(KnowledgePointTree.value);
};

// 收起所有节点
const collapseAll = () => {
  const collapseNodes = (nodes) => {
    nodes.forEach((node) => {
      node.expanded = false;
      if (node.children && node.children.length) {
        collapseNodes(node.children);
      }
    });
  };
  collapseNodes(KnowledgePointTree.value);
};

// ==================== 更新知识点名称操作 ====================
// 更新知识点名称
const updateKnowledgeName = () => {
  if (!selectedKnowledge.value) return;

  // 设置更新数据
  updatingKnowledge.id = selectedKnowledge.value.id;
  updatingKnowledge.name = selectedKnowledge.value.name;
  updatingKnowledge.originalName = selectedKnowledge.value.name; // 保存原名称

  showUpdateNameModal.value = true;
};

// 更新子知识点名称
const updateChildKnowledgeName = (child) => {
  updatingKnowledge.id = child.id;
  updatingKnowledge.name = child.name;
  updatingKnowledge.originalName = child.name; // 保存原名称

  showUpdateNameModal.value = true;
};

// 保存更新的知识点名称
const saveUpdatedKnowledgeName = async () => {
  if (!updatingKnowledge.name.trim()) {
    ElMessage.error("请输入知识点名称");
    return;
  }

  // 如果名称没有变化，不进行保存
  if (updatingKnowledge.name.trim() === updatingKnowledge.originalName) {
    ElMessage.warning("知识点名称没有变化");
    return;
  }

  try {
    // 调用更新接口
    const response = await axios.post(`${API_BASE}/questions/updateKnowledgePointName`, {
      id: updatingKnowledge.id,
      name: updatingKnowledge.name.trim(),
    });

    if (response.data.code === 200) {
      ElMessage.success("知识点名称更新成功");

      // 重新加载知识点树
      await loadKnowledgePoints();

      // 如果更新的是当前选中的知识点，需要更新选中状态
      if (selectedKnowledgeId.value === updatingKnowledge.id) {
        // 重新查找当前知识点
        const findKnowledge = (nodes, id) => {
          for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children && node.children.length) {
              const found = findKnowledge(node.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const updatedKnowledge = findKnowledge(
          KnowledgePointTree.value,
          updatingKnowledge.id
        );
        if (updatedKnowledge) {
          onSelectKnowledge(updatedKnowledge);
        }
      }

      showUpdateNameModal.value = false;
      resetUpdatingForm();
    } else if (response.data.code === 409) {
      ElMessage.error("知识点已存在");
    } else {
      ElMessage.error(response.data.message || "更新失败");
    }
  } catch (err) {
    console.error("更新知识点名称失败:", err);
    if (err.response?.data?.code === 409) {
      ElMessage.error("知识点已存在");
    } else {
      ElMessage.error("更新知识点名称失败");
    }
  }
};

// 取消更新
const cancelUpdateName = () => {
  showUpdateNameModal.value = false;
  resetUpdatingForm();
};

// 重置更新表单
const resetUpdatingForm = () => {
  updatingKnowledge.id = null;
  updatingKnowledge.name = "";
  updatingKnowledge.originalName = "";
};

// ==================== 删除操作 ====================
// 确认删除知识点
const confirmDeleteKnowledge = () => {
  if (!selectedKnowledge.value) return;

  deleteKnowledgeData.value = selectedKnowledge.value;
  showDeleteConfirm.value = true;
};

// 确认删除子知识点
const confirmDeleteChildKnowledge = (child) => {
  deleteKnowledgeData.value = child;
  showDeleteConfirm.value = true;
};

// 删除知识点
const deleteKnowledge = async () => {
  if (!deleteKnowledgeData.value) return;

  try {
    await axios.delete(
      `${API_BASE}/questions/deleteKnowledgePoint/${deleteKnowledgeData.value.id}`
    );
    ElMessage.success("知识点删除成功");

    // 重新加载知识点树
    await loadKnowledgePoints();

    // 如果删除的是当前选中的知识点，清空选择
    if (selectedKnowledgeId.value === deleteKnowledgeData.value.id) {
      selectedKnowledgeId.value = null;
      selectedKnowledge.value = null;
      knowledgePath.value = [];
    }

    showDeleteConfirm.value = false;
    deleteKnowledgeData.value = null;
  } catch (err) {
    console.error("删除知识点失败:", err);
    showDeleteConfirm.value = false;
    if (err.response?.data?.code === 409) {
      ElMessage.error("该知识点已被使用，无法删除");
    } else {
      ElMessage.error("删除知识点失败");
    }
  }
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteKnowledgeData.value = null;
};

// ==================== JSON上传相关方法 ====================
// 显示上传JSON模态框
const showUploadJsonModal = () => {
  if (!canLoad.value) {
    ElMessage.warning("请先选择年级和科目");
    return;
  }
  jsonContent.value = "";
  showUploadJsonModalVisible.value = true;
};

// 关闭上传JSON模态框
const closeUploadJsonModal = () => {
  showUploadJsonModalVisible.value = false;
  jsonContent.value = "";
  uploading.value = false;
};

// 加载JSON模板
const loadJsonTemplate = () => {
  jsonContent.value = jsonExample;
};

// 上传JSON知识点 - 最简化版本
const uploadJsonKnowledge = async () => {
  if (!jsonContent.value.trim()) {
    ElMessage.warning("请输入JSON内容");
    return;
  }

  uploading.value = true;

  try {
    const response = await axios.post(
      `${API_BASE}/questions/uploadKnowledgePointByJson/${selectedSubjectId.value}/${selectedGradeId.value}`,
      jsonContent.value,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.code === 200) {
      ElMessage.success("知识点上传成功");
      closeUploadJsonModal();
      await loadKnowledgePoints();

      // 清空当前选择
      selectedKnowledgeId.value = null;
      selectedKnowledge.value = null;
      knowledgePath.value = [];
    } else {
      ElMessage.error(response.data.message || "上传失败");
    }
  } catch (error) {
    console.error("上传知识点失败:", error);
    ElMessage.error(error.response?.data?.message || "上传失败");
  } finally {
    uploading.value = false;
  }
};

// ==================== 筛选条件变化处理 ====================
const onGradeChange = () => {
  // 切换年级时清空知识点数据
  KnowledgePointTree.value = [];
  selectedKnowledgeId.value = null;
  selectedKnowledge.value = null;
  knowledgePath.value = [];
};

const onSubjectChange = () => {
  // 切换科目时清空知识点数据
  KnowledgePointTree.value = [];
  selectedKnowledgeId.value = null;
  selectedKnowledge.value = null;
  knowledgePath.value = [];
};
</script>

<style scoped>
/* ==================== 全局容器样式 ==================== */
.container {
  max-width: 1800px;
  margin: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

/* ==================== 筛选区域样式 ==================== */
.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.filter-section h2 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  min-width: 200px;
}

.filter-item:last-child {
  flex: none;
  min-width: auto;
}

.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 24px; /* 与输入框对齐 */
}

/* ==================== 知识点管理区域样式 ==================== */
.knowledge-management-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.knowledge-container {
  display: flex;
  gap: 30px;
  min-height: 600px;
}

/* ==================== 左侧知识点树样式 ==================== */
.knowledge-tree-section {
  flex: 1;
  min-width: 400px;
  max-width: 500px;
  border-right: 1px solid #e4e7ed;
  padding-right: 30px;
}

.knowledge-tree-section h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.tree-info {
  font-size: 14px;
  color: #909399;
}

.tree-container {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px;
  background: #fafafa;
}

.empty-tree,
.loading-tree {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  color: #909399;
  font-size: 16px;
}

/* ==================== 右侧知识点详情样式 ==================== */
.knowledge-detail-section {
  flex: 2;
  min-width: 500px;
}

.knowledge-detail-section h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.detail-content {
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.no-selection {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 16px;
}

/* ==================== 详情区块样式 ==================== */
.detail-section {
  margin-bottom: 25px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: #409eff;
  font-size: 16px;
  border-bottom: 1px solid #dcdfe6;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  margin-bottom: 5px;
  font-size: 14px;
}

.detail-item span {
  color: #303133;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

/* ==================== 操作按钮样式 ==================== */
.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-buttons button {
  min-width: 120px;
}

.tree-controls {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: #ecf5ff;
  border: 1px solid #ffffff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-small:hover {
  background: #409eff;
  color: white;
}

/* ==================== 子知识点列表样式 ==================== */
.children-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.child-item:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.child-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.child-order {
  background: #409eff;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.child-name {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.child-subcount {
  font-size: 12px;
  color: #909399;
}

.child-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.child-item:hover .child-actions {
  opacity: 1;
}

/* ==================== 路径信息样式 ==================== */
.path-info {
  background: #ecf5ff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #d9ecff;
}

.path-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.path-item {
  color: #409eff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.path-item:hover {
  background-color: #d9ecff;
}

.path-separator {
  color: #c0c4cc;
  margin-left: 5px;
}

/* ==================== 更新知识点名称模态框样式 ==================== */
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
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
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

.modal-content h3 {
  margin-bottom: 25px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.modal-content p {
  margin-bottom: 20px;
  color: #606266;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;
}

/* ==================== 表单控件样式 ==================== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
}

.form-label.required::after {
  content: " *";
  color: #f56c6c;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.original-name {
  margin-top: 8px;
  padding: 8px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  color: #909399;
}

.form-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: white;
}

.form-select:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.form-select:focus {
  border-color: #409eff;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.parent-info {
  padding: 10px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  color: #303133;
}

.no-parent {
  color: #909399;
  font-style: italic;
}

/* ==================== 按钮样式 ==================== */
.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #85ce61;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

.btn-secondary:disabled {
  background-color: #a4da89;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-delete {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-delete:hover {
  background-color: #f78989;
}

.btn-edit-small {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.btn-edit-small:hover {
  background-color: #66b1ff;
}

.btn-remove-small {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.btn-remove-small:hover {
  background-color: #f78989;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.modal-actions button {
  min-width: 100px;
  padding: 10px 20px;
}

.delete-warning {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  padding: 10px;
  margin: 15px 0;
}

.delete-warning p {
  margin: 0;
  color: #f56c6c;
  font-size: 14px;
  text-align: left;
}

/* ==================== 上传JSON模态框样式 ==================== */
.large-modal {
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.modal-header h3 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.modal-close-btn:hover {
  background-color: #f5f7fa;
  color: #f56c6c;
}

.current-selection {
  padding: 10px 15px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.selection-value {
  color: #409eff;
}

.json-input-container {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.json-textarea {
  flex: 1;
  padding: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  font-family: "Courier New", Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.3s;
  min-height: 300px;
}

.json-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.json-textarea::placeholder {
  color: #c0c4cc;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.json-preview {
  flex: 1;
  max-width: 300px;
  padding: 15px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow-y: auto;
  max-height: 400px;
}

.json-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #409eff;
  font-size: 14px;
}

.json-preview ul {
  margin: 0 0 15px 0;
  padding-left: 20px;
}

.json-preview li {
  margin-bottom: 5px;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.json-example {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
}

.json-example h5 {
  margin: 0 0 10px 0;
  color: #67c23a;
  font-size: 13px;
}

.json-example pre {
  margin: 0;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  font-size: 12px;
  line-height: 1.3;
  color: #5d6d7e;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
}

.json-validation {
  margin-top: 10px;
}

.error-text {
  color: #f56c6c;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.error-text::before {
  content: "⚠";
  font-size: 14px;
}

/* ==================== 响应式调整 ==================== */
@media (max-width: 1200px) {
  .json-input-container {
    flex-direction: column;
  }

  .json-preview {
    max-width: none;
  }
}

/* 按钮组调整 */
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.modal-actions button {
  min-width: 100px;
}

/* 上传按钮状态 */
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
