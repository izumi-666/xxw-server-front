/**
 * 图片上传工具
 */
class ImageUploadTool {
  // 图床配置
  static IMAGE_BED_CONFIG = {
    apiUrl: "https://xxwpic.flito.art/api/index.php",
    token: "1c17b11693cb5ec63859b091c5b9c1b2",
  };

  /**
   * 上传图片到图床
   * @param {File} file - 图片文件
   * @returns {Promise<string>} 图片URL
   */
  static async uploadImage(file) {
    try {
      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        throw new Error("请选择图片文件");
      }

      // 验证文件大小（5MB限制）
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("图片大小不能超过5MB");
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("token", this.IMAGE_BED_CONFIG.token);

      const response = await fetch(this.IMAGE_BED_CONFIG.apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.result === "success") {
        return result.url;
      } else {
        throw new Error("图床返回错误");
      }
    } catch (error) {
      console.error("图片上传失败:", error);
      throw new Error(error.message || "图片上传失败，请重试");
    }
  }
}

export default ImageUploadTool;