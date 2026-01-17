import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL

// 知识点映射（从API获取后会更新）
let KNOWLEDGE_POINT_MAP = {};

/**
 * 获取知识点列表
 * @returns {Promise<void>}
 */
export const fetchKnowledgePointList = async () => {
  try {
    const response = await axios.get(`${API_BASE}/questions/getKnowledgePointList`);
    if (response.data && response.data.code === 200) {
      KNOWLEDGE_POINT_MAP = response.data.data;
    }
  } catch (error) {
    console.error("获取知识点列表失败:", error);
    KNOWLEDGE_POINT_MAP = {};
  }
};

/**
 * 获取知识点名称
 * @param {number|string|Array} knowledgePointIds - 知识点ID或ID数组
 * @returns {Array<string>} 知识点名称数组
 */
export const getKnowledgePointNames = (knowledgePointIds) => {
  if (!knowledgePointIds) return [];

  // 处理数字类型的单个ID
  if (typeof knowledgePointIds === 'number') {
    return [
      KNOWLEDGE_POINT_MAP[knowledgePointIds] || `知识点${knowledgePointIds}`,
    ];
  }

  // 处理字符串类型的ID
  if (typeof knowledgePointIds === 'string') {
    // 如果是逗号分隔的字符串
    if (knowledgePointIds.includes(',')) {
      const ids = knowledgePointIds.split(',').map(id => id.trim());
      return ids.map(id => KNOWLEDGE_POINT_MAP[id] || `知识点${id}`);
    }
    // 单个字符串ID
    return [
      KNOWLEDGE_POINT_MAP[knowledgePointIds] || `知识点${knowledgePointIds}`,
    ];
  }

  // 处理数组类型的ID
  if (Array.isArray(knowledgePointIds)) {
    return knowledgePointIds.map(
      (id) => KNOWLEDGE_POINT_MAP[id] || `知识点${id}`
    );
  }

  return [];
};

/**
 * 获取单个知识点名称
 * @param {number|string} knowledgePointId - 知识点ID
 * @returns {string} 知识点名称
 */
export const getKnowledgePointName = (knowledgePointId) => {
  if (!knowledgePointId) return '';
  return KNOWLEDGE_POINT_MAP[knowledgePointId] || `知识点${knowledgePointId}`;
};