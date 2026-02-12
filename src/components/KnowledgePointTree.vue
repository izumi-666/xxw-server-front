<template>
  <div class="tree-container" :key="renderKey">
    <div
      v-for="node in data"
      :key="node.id"
      class="tree-node"
    >
      <div
        class="tree-node-header"
        :class="{
          selected: node.id === selectedId,
          'multi-selected': isMultiSelected(node.id)
        }"
        @click="handleSelect(node)"
      >
        <div
          class="tree-toggle"
          v-if="node.children && node.children.length"
          @click.stop="handleToggle(node)"
        >
          <span class="tree-toggle-icon" :class="{ expanded: node.expanded }">
            ▶
          </span>
        </div>
        <div class="tree-toggle-placeholder" v-else style="width: 24px; margin-right: 8px;"></div>
        <span class="tree-node-name">{{ node.name }}</span>
        <span class="tree-node-count" v-if="node.children && node.children.length">
          {{ node.children.length }}
        </span>
        
        <!-- 多选标记 -->
        <span v-if="isMultiSelected(node.id)" class="multi-select-checkmark">
          ✓
        </span>
      </div>
      
      <div
        v-if="node.expanded && node.children && node.children.length"
        class="tree-children"
      >
        <KnowledgeTree
          :data="node.children"
          :selected-id="selectedId"
          :multi-selected-ids="multiSelectedIds"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineOptions, computed, watch, ref } from 'vue';

defineOptions({
  name: 'KnowledgeTree'
});

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedId: {
    type: Number,
    default: null
  },
  multiSelectedIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select', 'toggle']);

// 添加一个内部状态来强制重新渲染
const renderKey = ref(0);

// 监听 selectedId 变化，强制组件重新评估选中状态
watch(
  () => props.selectedId,
  (newId) => {
    if (newId) {
      // 触发重新渲染
      renderKey.value += 1;
      
      // 自动展开包含选中节点的路径
      const expandPathToNode = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return true;
          }
          if (node.children && node.children.length) {
            if (expandPathToNode(node.children, targetId)) {
              node.expanded = true;
              return true;
            }
          }
        }
        return false;
      };
      
      // 注意：这里需要能够访问到原始的树数据
      // 如果 props.data 是响应式的，可以直接修改
      if (props.data && props.data.length) {
        expandPathToNode(props.data, newId);
      }
    }
  },
  { immediate: true, deep: true }
);

// 检查节点是否在多选列表中
const isMultiSelected = (id) => {
  return props.multiSelectedIds.includes(id);
};

const handleSelect = (node) => {
  emit('select', node);
};

const handleToggle = (node) => {
  emit('toggle', node);
};
</script>

<style scoped>
.tree-node {
  margin-left: 20px;
  padding: 5px 0;
}

.tree-node-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 2px;
  position: relative;
}

.tree-node-header:hover {
  background-color: #f0f9ff;
}

.tree-node-header.selected {
  background-color: #e6f7ff;
  border-left: 3px solid #409eff;
}

.tree-node-header.multi-selected {
  background-color: #f0f9ff;
  border-left: 3px solid #67c23a;
  border-right: 2px solid #67c23a;
}

.tree-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tree-toggle:hover {
  background: #d9ecff;
}

.tree-toggle-icon {
  transition: transform 0.3s;
}

.tree-toggle-icon.expanded {
  transform: rotate(90deg);
}

.tree-node-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.tree-node-count {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 10px;
}

.tree-children {
  margin-left: 24px;
  border-left: 1px dashed #dcdfe6;
  padding-left: 16px;
}

.multi-select-checkmark {
  position: absolute;
  right: 10px;
  color: #67c23a;
  font-weight: bold;
  font-size: 16px;
}
</style>