

  <script>
  // 导入Vue相关功能和依赖
  import { reactive, ref, onMounted, computed, watch, nextTick } from "vue";
  import axios from "axios";
  import { useRouter } from "vue-router";

  // 导入富文本编辑器
  import { QuillEditor } from '@vueup/vue-quill'
  import '@vueup/vue-quill/dist/vue-quill.snow.css';

  // 从环境变量获取API基础URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  export default {
    components: {
      QuillEditor
    },
    setup() {
      const router = useRouter();

      // ==================== 富文本编辑器配置 ====================
      const editorOptions = ref({
        modules: {
          toolbar: {
            container: [
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              [{ 'header': 1 }, { 'header': 2 }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'script': 'sub'}, { 'script': 'super' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              [{ 'direction': 'rtl' }],
              [{ 'size': ['small', false, 'large', 'huge'] }],
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'font': [] }],
              [{ 'align': [] }],
              ['clean'],
              ['link', 'image', 'video']
            ],
            handlers: {
              // 重写图片处理逻辑 - 使用本地预览
              image: function() {
                // 创建文件输入元素
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.style.display = 'none';
                document.body.appendChild(input);

                input.addEventListener('change', async () => {
                  const file = input.files[0];
                  if (file) {
                    // 验证文件类型
                    if (!file.type.startsWith('image/')) {
                      showAlert('文件错误', '请选择图片文件');
                      document.body.removeChild(input);
                      return;
                    }

                    // 验证文件大小（5MB限制）
                    if (file.size > 5 * 1024 * 1024) {
                      showAlert('文件过大', '图片大小不能超过5MB');
                      document.body.removeChild(input);
                      return;
                    }

                    try {
                      // 生成blob URL用于预览
                      const blobUrl = URL.createObjectURL(file);
                      
                      // 获取当前编辑器实例和光标位置
                      const quill = this.quill;
                      const range = quill.getSelection();
                      
                      if (range) {
                        // 在光标位置插入图片（使用blob URL预览）
                        quill.insertEmbed(range.index, 'image', blobUrl);
                        
                        // 保存图片信息到待上传列表
                        const editorType = getEditorType(quill);
                        addPendingImage(editorType, blobUrl, file);
                        
                        showAlert('图片已插入', '图片将在提交时上传到图床');
                      } else {
                        // 如果没有选中范围，在末尾插入
                        quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                        
                        // 保存图片信息到待上传列表
                        const editorType = getEditorType(quill);
                        addPendingImage(editorType, blobUrl, file);
                        
                        showAlert('图片已插入', '图片将在提交时上传到图床');
                      }
                    } catch (error) {
                      console.error('图片插入失败:', error);
                      showAlert('插入失败', '图片插入失败，请重试');
                    }
                  }
                  // 移除输入元素
                  document.body.removeChild(input);
                });

                // 触发文件选择
                input.click();
              }
            }
          }
        },
        placeholder: '请输入内容...',
        theme: 'snow'
      });

      // ==================== 图片上传相关状态 ====================
      // 待上传的图片列表
      const pendingUploadImages = reactive({
        // 上传界面的图片
        title: [], // { blobUrl, file, editorType }
        answer: [],
        notes: [],
        remark: [],
        options: [], // 数组，每个选项对应一个列表
        
        // 更新界面的图片
        updateTitle: [],
        updateAnswer: [],
        updateNotes: [],
        updateRemark: [],
        updateOptions: [] // 数组，每个选项对应一个列表
      });

      // 图片上传配置
      const IMAGE_BED_CONFIG = {
        apiUrl: "https://xxwpic.flito.art/api/index.php",
        token: "1c17b11693cb5ec63859b091c5b9c1b2",
      };

      // ==================== 图片处理相关方法 ====================
      /**
       * 获取编辑器类型
       * @param {Object} quill - Quill编辑器实例
       * @returns {string} 编辑器类型
       */
      const getEditorType = (quill) => {
        // 这里需要根据实际DOM结构来判断编辑器类型
        // 这是一个简化的实现，实际使用时可能需要根据具体情况调整
        const editorElement = quill.root;
        if (editorElement.closest('.update-form')) {
          // 更新表单中的编辑器
          if (editorElement.closest('.form-group:has(.form-label:contains("题目内容"))')) {
            return 'updateTitle';
          } else if (editorElement.closest('.form-group:has(.form-label:contains("参考答案"))')) {
            return 'updateAnswer';
          } else if (editorElement.closest('.form-group:has(.form-label:contains("解析"))')) {
            return 'updateNotes';
          } else if (editorElement.closest('.form-group:has(.form-label:contains("备注"))')) {
            return 'updateRemark';
          } else if (editorElement.closest('.option-editor')) {
            const optionIndex = Array.from(editorElement.closest('.option-item').parentNode.children).indexOf(editorElement.closest('.option-item'));
            return `updateOptions-${optionIndex}`;
          }
        } else {
          // 上传表单中的编辑器
          if (editorElement.closest('.form-group:has(.form-label:contains("题目内容"))')) {
            return 'title';
          } else if (editorElement.closest('.form-group:has(.form-label:contains("参考答案"))')) {
            return 'answer';
          } else if (editorElement.closest('.form-group:has(.form-label:contains("解析"))')) {
            return 'notes';
          } else if (editorElement.closest('.form-group:has(.form-label:contains("备注"))')) {
            return 'remark';
          } else if (editorElement.closest('.option-editor')) {
            const optionIndex = Array.from(editorElement.closest('.option-item').parentNode.children).indexOf(editorElement.closest('.option-item'));
            return `options-${optionIndex}`;
          }
        }
        return 'unknown';
      };

      /**
       * 添加待上传图片
       * @param {string} editorType - 编辑器类型
       * @param {string} blobUrl - blob URL
       * @param {File} file - 图片文件
       */
      const addPendingImage = (editorType, blobUrl, file) => {
        const imageInfo = { blobUrl, file, editorType };
        
        if (editorType.startsWith('update')) {
          // 更新界面的图片
          if (editorType === 'updateTitle') {
            pendingUploadImages.updateTitle.push(imageInfo);
          } else if (editorType === 'updateAnswer') {
            pendingUploadImages.updateAnswer.push(imageInfo);
          } else if (editorType === 'updateNotes') {
            pendingUploadImages.updateNotes.push(imageInfo);
          } else if (editorType === 'updateRemark') {
            pendingUploadImages.updateRemark.push(imageInfo);
          } else if (editorType.startsWith('updateOptions-')) {
            const index = parseInt(editorType.split('-')[1]);
            if (!pendingUploadImages.updateOptions[index]) {
              pendingUploadImages.updateOptions[index] = [];
            }
            pendingUploadImages.updateOptions[index].push(imageInfo);
          }
        } else {
          // 上传界面的图片
          if (editorType === 'title') {
            pendingUploadImages.title.push(imageInfo);
          } else if (editorType === 'answer') {
            pendingUploadImages.answer.push(imageInfo);
          } else if (editorType === 'notes') {
            pendingUploadImages.notes.push(imageInfo);
          } else if (editorType === 'remark') {
            pendingUploadImages.remark.push(imageInfo);
          } else if (editorType.startsWith('options-')) {
            const index = parseInt(editorType.split('-')[1]);
            if (!pendingUploadImages.options[index]) {
              pendingUploadImages.options[index] = [];
            }
            pendingUploadImages.options[index].push(imageInfo);
          }
        }
      };

      /**
       * 处理编辑器粘贴事件
       * @param {Event} event - 粘贴事件
       * @param {string} type - 编辑器类型
       */
      const handleEditorPaste = async (event, type) => {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        // 检查是否有图片数据
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            event.preventDefault(); // 阻止默认粘贴行为

            const file = items[i].getAsFile();
            if (!file) return;

            // 验证文件类型
            if (!file.type.startsWith("image/")) {
              showAlert("文件错误", "请粘贴图片文件");
              return;
            }

            // 验证文件大小（5MB限制）
            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              // 生成blob URL用于预览
              const blobUrl = URL.createObjectURL(file);
              
              // 获取对应的编辑器实例
              let quill;
              if (type.startsWith('update')) {
                const editorType = type.replace('update', '').toLowerCase();
                if (editorType === 'title') quill = updateTitleEditor.value?.getQuill();
                else if (editorType === 'answer') quill = updateAnswerEditor.value?.getQuill();
                else if (editorType === 'notes') quill = updateNotesEditor.value?.getQuill();
                else if (editorType === 'remark') quill = updateRemarkEditor.value?.getQuill();
              } else {
                if (type === 'title') quill = titleEditor.value?.getQuill();
                else if (type === 'answer') quill = answerEditor.value?.getQuill();
                else if (type === 'notes') quill = notesEditor.value?.getQuill();
                else if (type === 'remark') quill = remarkEditor.value?.getQuill();
              }

              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                // 保存图片信息到待上传列表
                addPendingImage(type, blobUrl, file);
                
                showAlert('图片已粘贴', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("粘贴图片失败:", error);
              showAlert("粘贴失败", "图片粘贴失败");
            }
            break;
          }
        }
      };

      /**
       * 处理编辑器拖拽事件
       * @param {Event} event - 拖拽事件
       * @param {string} type - 编辑器类型
       */
      const handleEditorDrop = async (event, type) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              // 生成blob URL用于预览
              const blobUrl = URL.createObjectURL(file);
              
              // 获取对应的编辑器实例
              let quill;
              if (type.startsWith('update')) {
                const editorType = type.replace('update', '').toLowerCase();
                if (editorType === 'title') quill = updateTitleEditor.value?.getQuill();
                else if (editorType === 'answer') quill = updateAnswerEditor.value?.getQuill();
                else if (editorType === 'notes') quill = updateNotesEditor.value?.getQuill();
                else if (editorType === 'remark') quill = updateRemarkEditor.value?.getQuill();
              } else {
                if (type === 'title') quill = titleEditor.value?.getQuill();
                else if (type === 'answer') quill = answerEditor.value?.getQuill();
                else if (type === 'notes') quill = notesEditor.value?.getQuill();
                else if (type === 'remark') quill = remarkEditor.value?.getQuill();
              }

              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                // 保存图片信息到待上传列表
                addPendingImage(type, blobUrl, file);
                
                showAlert('图片已插入', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("拖拽图片失败:", error);
              showAlert("插入失败", "图片插入失败");
            }
          }
        }
      };

      /**
       * 处理选项编辑器粘贴事件
       * @param {Event} event - 粘贴事件
       * @param {number} index - 选项索引
       */
      const handleOptionEditorPaste = async (event, index) => {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            event.preventDefault();

            const file = items[i].getAsFile();
            if (!file) return;

            if (!file.type.startsWith("image/")) {
              showAlert("文件错误", "请粘贴图片文件");
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              const blobUrl = URL.createObjectURL(file);
              const quill = optionEditors.value[index]?.getQuill();
              
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                addPendingImage(`options-${index}`, blobUrl, file);
                showAlert('图片已粘贴', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("粘贴图片失败:", error);
              showAlert("粘贴失败", "图片粘贴失败");
            }
            break;
          }
        }
      };

      /**
       * 处理选项编辑器拖拽事件
       * @param {Event} event - 拖拽事件
       * @param {number} index - 选项索引
       */
      const handleOptionEditorDrop = async (event, index) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              const blobUrl = URL.createObjectURL(file);
              const quill = optionEditors.value[index]?.getQuill();
              
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                addPendingImage(`options-${index}`, blobUrl, file);
                showAlert('图片已插入', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("拖拽图片失败:", error);
              showAlert("插入失败", "图片插入失败");
            }
          }
        }
      };

      /**
       * 处理更新界面选项编辑器粘贴事件
       * @param {Event} event - 粘贴事件
       * @param {number} index - 选项索引
       */
      const handleUpdateOptionEditorPaste = async (event, index) => {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            event.preventDefault();

            const file = items[i].getAsFile();
            if (!file) return;

            if (!file.type.startsWith("image/")) {
              showAlert("文件错误", "请粘贴图片文件");
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              const blobUrl = URL.createObjectURL(file);
              const quill = updateOptionEditors.value[index]?.getQuill();
              
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                addPendingImage(`updateOptions-${index}`, blobUrl, file);
                showAlert('图片已粘贴', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("粘贴图片失败:", error);
              showAlert("粘贴失败", "图片粘贴失败");
            }
            break;
          }
        }
      };

      /**
       * 处理更新界面选项编辑器拖拽事件
       * @param {Event} event - 拖拽事件
       * @param {number} index - 选项索引
       */
      const handleUpdateOptionEditorDrop = async (event, index) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              const blobUrl = URL.createObjectURL(file);
              const quill = updateOptionEditors.value[index]?.getQuill();
              
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                addPendingImage(`updateOptions-${index}`, blobUrl, file);
                showAlert('图片已插入', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("拖拽图片失败:", error);
              showAlert("插入失败", "图片插入失败");
            }
          }
        }
      };

      /**
       * 处理更新界面编辑器粘贴事件
       * @param {Event} event - 粘贴事件
       * @param {string} type - 编辑器类型
       */
      const handleUpdateEditorPaste = async (event, type) => {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            event.preventDefault();

            const file = items[i].getAsFile();
            if (!file) return;

            if (!file.type.startsWith("image/")) {
              showAlert("文件错误", "请粘贴图片文件");
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              const blobUrl = URL.createObjectURL(file);
              let quill;
              
              if (type === 'title') quill = updateTitleEditor.value?.getQuill();
              else if (type === 'answer') quill = updateAnswerEditor.value?.getQuill();
              else if (type === 'notes') quill = updateNotesEditor.value?.getQuill();
              else if (type === 'remark') quill = updateRemarkEditor.value?.getQuill();

              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                addPendingImage(`update${type.charAt(0).toUpperCase() + type.slice(1)}`, blobUrl, file);
                showAlert('图片已粘贴', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("粘贴图片失败:", error);
              showAlert("粘贴失败", "图片粘贴失败");
            }
            break;
          }
        }
      };

      /**
       * 处理更新界面编辑器拖拽事件
       * @param {Event} event - 拖拽事件
       * @param {string} type - 编辑器类型
       */
      const handleUpdateEditorDrop = async (event, type) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
              showAlert("文件过大", "图片大小不能超过5MB");
              return;
            }

            try {
              const blobUrl = URL.createObjectURL(file);
              let quill;
              
              if (type === 'title') quill = updateTitleEditor.value?.getQuill();
              else if (type === 'answer') quill = updateAnswerEditor.value?.getQuill();
              else if (type === 'notes') quill = updateNotesEditor.value?.getQuill();
              else if (type === 'remark') quill = updateRemarkEditor.value?.getQuill();

              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.insertEmbed(range.index, 'image', blobUrl);
                } else {
                  quill.insertEmbed(quill.getLength(), 'image', blobUrl);
                }
                
                addPendingImage(`update${type.charAt(0).toUpperCase() + type.slice(1)}`, blobUrl, file);
                showAlert('图片已插入', '图片将在提交时上传到图床');
              }
            } catch (error) {
              console.error("拖拽图片失败:", error);
              showAlert("插入失败", "图片插入失败");
            }
          }
        }
      };

      // ==================== 图片上传处理 ====================
      /**
       * 上传图片到图床
       * @param {File} file - 图片文件
       * @returns {Promise<string>} 图片URL
       */
      const uploadToImageBed = async (file) => {
        try {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("token", IMAGE_BED_CONFIG.token);

          const response = await fetch(IMAGE_BED_CONFIG.apiUrl, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`上传失败: ${response.status}`);
          }

          const result = await response.json();

          if (result.code === 200 && result.result === "success") {
            return result.url; // 返回图片URL
          } else {
            throw new Error("图床返回错误");
          }
        } catch (error) {
          console.error("图片上传失败:", error);
          throw new Error("图片上传失败，请重试");
        }
      };

      /**
       * 处理富文本编辑器中的图片上传和替换
       * @param {string} content - 富文本内容
       * @param {Array} pendingImages - 待上传的图片列表
       * @returns {Promise<string>} 处理后的内容
       */
      const processEditorImages = async (content, pendingImages) => {
        if (!content || !pendingImages || pendingImages.length === 0) {
          return content;
        }

        let processedContent = content;
        
        for (const imageInfo of pendingImages) {
          const { blobUrl, file } = imageInfo;
          
          try {
            showAlert("上传中", "图片正在上传到图床...");
            
            // 上传图片到图床
            const remoteUrl = await uploadToImageBed(file);
            
            // 替换内容中的blob URL为远程URL
            processedContent = processedContent.replace(
              new RegExp(blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              remoteUrl
            );
            
            // 释放blob URL
            URL.revokeObjectURL(blobUrl);
            
          } catch (error) {
            console.error("图片上传失败:", error);
            // 如果上传失败，保留blob URL，但用户可能会看到图片无法加载
            showAlert("上传失败", `图片上传失败: ${error.message}`);
          }
        }
        
        return processedContent;
      };

      /**
       * 处理所有编辑器的图片上传
       * @param {string} mode - 模式：'upload' 或 'update'
       * @returns {Promise<boolean>} 是否全部上传成功
       */
      const processAllEditorImages = async (mode) => {
        try {
          if (mode === 'upload') {
            // 处理上传界面的图片
            form.title = await processEditorImages(form.title, pendingUploadImages.title);
            form.answer = await processEditorImages(form.answer, pendingUploadImages.answer);
            form.notes = await processEditorImages(form.notes, pendingUploadImages.notes);
            form.remark = await processEditorImages(form.remark, pendingUploadImages.remark);
            
            // 处理选项中的图片
            for (let i = 0; i < form.options.length; i++) {
              if (pendingUploadImages.options[i] && pendingUploadImages.options[i].length > 0) {
                form.options[i].text = await processEditorImages(
                  form.options[i].text, 
                  pendingUploadImages.options[i]
                );
              }
            }
            
            // 清空已处理的图片列表
            pendingUploadImages.title = [];
            pendingUploadImages.answer = [];
            pendingUploadImages.notes = [];
            pendingUploadImages.remark = [];
            pendingUploadImages.options = [];
            
          } else {
            // 处理更新界面的图片
            updateForm.title = await processEditorImages(updateForm.title, pendingUploadImages.updateTitle);
            updateForm.answer = await processEditorImages(updateForm.answer, pendingUploadImages.updateAnswer);
            updateForm.notes = await processEditorImages(updateForm.notes, pendingUploadImages.updateNotes);
            updateForm.remark = await processEditorImages(updateForm.remark, pendingUploadImages.updateRemark);
            
            // 处理选项中的图片
            for (let i = 0; i < updateForm.options.length; i++) {
              if (pendingUploadImages.updateOptions[i] && pendingUploadImages.updateOptions[i].length > 0) {
                updateForm.options[i].text = await processEditorImages(
                  updateForm.options[i].text, 
                  pendingUploadImages.updateOptions[i]
                );
              }
            }
            
            // 清空已处理的图片列表
            pendingUploadImages.updateTitle = [];
            pendingUploadImages.updateAnswer = [];
            pendingUploadImages.updateNotes = [];
            pendingUploadImages.updateRemark = [];
            pendingUploadImages.updateOptions = [];
          }
          
          return true;
        } catch (error) {
          console.error("处理编辑器图片失败:", error);
          return false;
        }
      };

      // ==================== 其他现有代码（保持原样） ====================
      // 这里应该包含您原有的所有代码，包括：
      // - 编辑器引用
      // - 状态变量
      // - 表单数据
      // - 方法函数
      // - 计算属性
      // - 生命周期钩子
      
      // 为了保持代码简洁，这里只展示修改的部分，您需要将这部分整合到您的现有代码中

      // 示例：修改handleSubmit和handleUpdateSubmit方法，在提交前处理图片
      /**
       * 处理题目提交
       */
      const handleSubmit = async () => {
        if (!form.question_category_id) {
          showAlert("输入错误", "请选择问题类别");
          return;
        }

        try {
          submitting.value = true;

          // 先处理富文本编辑器中的图片
          const imageProcessSuccess = await processAllEditorImages('upload');
          if (!imageProcessSuccess) {
            submitting.value = false;
            return;
          }

          // 然后继续原有的提交逻辑...
          // ... 您原有的handleSubmit代码

        } catch (err) {
          console.error("提交失败:", err);
          showAlert("提交失败", err.response?.data?.message || err.message);
        } finally {
          submitting.value = false;
        }
      };

      /**
       * 处理题目更新提交
       */
      const handleUpdateSubmit = async () => {
        if (!updateForm.question_category_id) {
          showAlert("验证错误", "请选择问题类别");
          return;
        }

        try {
          submitting.value = true;

          // 先处理富文本编辑器中的图片
          const imageProcessSuccess = await processAllEditorImages('update');
          if (!imageProcessSuccess) {
            submitting.value = false;
            return;
          }

          // 然后继续原有的提交逻辑...
          // ... 您原有的handleUpdateSubmit代码

        } catch (err) {
          console.error("更新失败:", err);
          showAlert("更新失败", err.response?.data?.message || err.message);
        } finally {
          submitting.value = false;
        }
      };

      // ==================== 返回所有响应式数据和方法 ====================
      return {
        // ... 您原有的所有返回内容
        
        // 新增的图片处理方法
        handleEditorPaste,
        handleEditorDrop,
        handleOptionEditorPaste,
        handleOptionEditorDrop,
        handleUpdateEditorPaste,
        handleUpdateEditorDrop,
        handleUpdateOptionEditorPaste,
        handleUpdateOptionEditorDrop,

        // 编辑器选项
        editorOptions,

        // 其他原有方法...
      };
    },
  };
  </script>

  <style scoped>
  /* 您的原有样式代码保持不变 */
  /* ... */
  </style>