import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

// 配置marked
marked.setOptions({
  breaks: true, // 转换换行符为<br>
  gfm: true, // 使用GitHub风格的Markdown
});

/**
 * 将Markdown文本转换为HTML，支持数学公式渲染
 * @param {string} text - Markdown文本
 * @returns {string} HTML字符串
 */
export const markdownToHtml = (text) => {
  if (!text) return "";

  try {
    let content = text;

    // 块级公式 $$...$$
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    });

    // 行内公式 $...$
    content = content.replace(/\$([\s\S]+?)\$/g, (_, formula) => {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    });

    // 直接返回 marked 结果
    return marked(content);
  } catch (err) {
    console.error("Markdown 渲染失败:", err);
    return text;
  }
};