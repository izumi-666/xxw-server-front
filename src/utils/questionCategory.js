/**
 * 获取题目类型文本
 * @param {number} question_category_id - 题目类型ID
 * @returns {string} 题目类型文本
 */
export function getQuestionCategoryText(question_category_id) {
  const categoryMap = {
    1: "单选题",
    2: "多选题",
    3: "证明题",
    4: "解答题",
    5: "填空题",
    6: "计算题",
    7: "判断题",
    8: "作图题",
  };
  return categoryMap[question_category_id] || "未知题型";
}