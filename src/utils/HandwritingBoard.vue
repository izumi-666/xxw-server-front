<template>
  <div class="handwriting-board">
    <div class="board-toolbar">
      <div class="tool-group">
        <button 
          class="tool-btn" 
          @click="clearCanvas" 
          title="清空画板"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          清空
        </button>
        <button 
          class="tool-btn" 
          @click="undo" 
          :disabled="!canUndo"
          title="撤销"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
          撤销
        </button>
        <button 
          class="tool-btn" 
          @click="redo" 
          :disabled="!canRedo"
          title="重做"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
          </svg>
          重做
        </button>
      </div>
      
      <div class="tool-group">
        <span class="tool-label">
          <svg class="label-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
            <circle cx="12" cy="12" r="2.5"/>
          </svg>
          笔颜色：
        </span>
        <input 
          type="color" 
          v-model="penColor" 
          class="color-picker"
          title="选择笔颜色"
        />
        <span class="tool-label">
          <svg class="label-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M13 4v2h-2V4h2zm0 16v-2h-2v2h2zm6-8v-2h-2v2h2zM7 12v-2H5v2h2zm12 4v-2h-2v2h2zm0-8V6h-2v2h2zM7 8V6H5v2h2zm0 12v-2H5v2h2zm12 0v-2h-2v2h2zM3 20h2v-2H3v2zm0-8h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V6H3v2z"/>
          </svg>
          笔粗细：
        </span>
        <input 
          type="range" 
          v-model="penWidth" 
          min="2" 
          max="30" 
          class="width-slider"
        />
        <span class="width-value">{{ penWidth }}px</span>
      </div>
      
      <div class="tool-group">
        <button 
          class="tool-btn btn-save" 
          @click="saveAsImage" 
          title="保存手写答案"
          :disabled="isUploading"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          {{ isUploading ? '上传中...' : '保存答案' }}
        </button>
      </div>
    </div>
    
    <div class="canvas-container">
      <canvas
        ref="canvas"
        class="draw-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="startDrawingTouch"
        @touchmove="drawTouch"
        @touchend="stopDrawing"
        @touchcancel="stopDrawing"
      ></canvas>
    </div>
    
    <div class="board-info">
      <span class="info-text">
        <svg class="info-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"/>
        </svg>
        在区域内使用鼠标或手指书写
      </span>
      <span class="info-text">
        <svg class="info-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M4 6h16v2H4V6zm2-4h12v2H6V2zm16 4H2v16h20V6zM4 8h16v10H4V8z"/>
        </svg>
        支持触屏设备
      </span>
      <span class="info-text">
        <svg class="info-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm10 2h2v10h-2V7zM7 7h2v10H7V7z"/>
        </svg>
        画布尺寸：{{ canvasWidth }} × {{ canvasHeight }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import ImageUploadTool from '../utils/imageUpload';

const props = defineProps({
  width: {
    type: Number,
    default: 1000  // 扩大画布宽度
  },
  height: {
    type: Number,
    default: 500   // 扩大画布高度
  },
  initialImage: {
    type: String,
    default: null
  },
  questionId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['save', 'clear', 'update', 'uploaded']);

const canvas = ref(null);
let ctx = null;
let drawing = false;
let history = [];
let historyIndex = -1;
let loadingInstance = null;

const canvasWidth = ref(props.width);
const canvasHeight = ref(props.height);
const penColor = ref('#000000');
const penWidth = ref(4);  // 稍微增大默认笔触
const canUndo = ref(false);
const canRedo = ref(false);
const isUploading = ref(false);

// 初始化画布
const initCanvas = () => {
  if (!canvas.value) return;
  
  ctx = canvas.value.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 设置白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 添加浅色网格线
  drawGrid();
  
  // 保存初始状态
  saveState();
  
  // 如果有初始图片，加载它
  if (props.initialImage) {
    loadImage(props.initialImage);
  }
};

// 绘制网格线（更细更淡）
const drawGrid = () => {
  if (!ctx) return;
  
  ctx.save();
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 0.5;
  
  // 绘制垂直线（更密集）
  const step = 25;
  for (let x = step; x < canvasWidth.value; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight.value);
    ctx.stroke();
  }
  
  // 绘制水平线
  for (let y = step; y < canvasHeight.value; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth.value, y);
    ctx.stroke();
  }
  
  ctx.restore();
};

// 保存状态用于撤销/重做
const saveState = () => {
  if (!canvas.value) return;
  
  history = history.slice(0, historyIndex + 1);
  
  const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
  history.push(imageData);
  historyIndex++;
  
  if (history.length > 50) {
    history.shift();
    historyIndex--;
  }
  
  updateUndoRedoState();
};

const undo = () => {
  if (historyIndex > 0) {
    historyIndex--;
    const imageData = history[historyIndex];
    ctx.putImageData(imageData, 0, 0);
    updateUndoRedoState();
    emit('update', getImageData());
  }
};

const redo = () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const imageData = history[historyIndex];
    ctx.putImageData(imageData, 0, 0);
    updateUndoRedoState();
    emit('update', getImageData());
  }
};

const updateUndoRedoState = () => {
  canUndo.value = historyIndex > 0;
  canRedo.value = historyIndex < history.length - 1;
};

const startDrawing = (event) => {
  drawing = true;
  const pos = getCanvasCoordinates(event);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const draw = (event) => {
  if (!drawing) return;
  event.preventDefault();
  
  const pos = getCanvasCoordinates(event);
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = penWidth.value;
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const startDrawingTouch = (event) => {
  event.preventDefault();
  drawing = true;
  const pos = getCanvasCoordinates(event);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const drawTouch = (event) => {
  event.preventDefault();
  if (!drawing) return;
  
  const pos = getCanvasCoordinates(event);
  ctx.strokeStyle = penColor.value;
  ctx.lineWidth = penWidth.value;
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const stopDrawing = () => {
  if (drawing) {
    drawing = false;
    saveState();
    emit('update', getImageData());
  }
};

const getCanvasCoordinates = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  
  let clientX, clientY;
  
  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  
  let x = (clientX - rect.left) * scaleX;
  let y = (clientY - rect.top) * scaleY;
  
  x = Math.max(0, Math.min(x, canvasWidth.value));
  y = Math.max(0, Math.min(y, canvasHeight.value));
  
  return { x, y };
};

const clearCanvas = () => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  drawGrid();
  saveState();
  emit('clear', props.questionId);
  emit('update', getImageData());
  ElMessage.info('画板已清空');
};

const canvasToBlob = () => {
  return new Promise((resolve) => {
    canvas.value.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/png',
      0.95  // 提高图片质量
    );
  });
};

const hasCanvasContent = () => {
  const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
  const pixels = imageData.data;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r !== 255 || g !== 255 || b !== 255) {
      return true;
    }
  }
  return false;
};

const saveAsImage = async () => {
  if (isUploading.value) {
    ElMessage.warning('正在上传中，请稍候...');
    return;
  }
  
  if (!hasCanvasContent()) {
    ElMessage.warning('请先在画板上书写内容');
    return;
  }
  
  isUploading.value = true;
  
  try {
    loadingInstance = ElMessage({
      message: '正在上传手写答案...',
      type: 'info',
      duration: 0,
    });
    
    const blob = await canvasToBlob();
    const file = new File([blob], `handwriting_${props.questionId || Date.now()}.png`, { type: 'image/png' });
    
    const imageUrl = await ImageUploadTool.uploadImage(file);
    
    if (loadingInstance) {
      loadingInstance.close();
    }
    
    ElMessage.success('手写答案已保存并上传');
    
    emit('save', imageUrl, props.questionId);
    emit('uploaded', imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('上传失败:', error);
    
    if (loadingInstance) {
      loadingInstance.close();
    }
    
    ElMessage.error(error.message || '上传失败，请重试');
    return null;
  } finally {
    isUploading.value = false;
  }
};

const saveToLocal = () => {
  const imageData = getImageData();
  emit('save', imageData, props.questionId);
  ElMessage.success('已保存到本地');
  return imageData;
};

const loadImage = (imageUrl) => {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    // 图片自适应画布大小
    const scale = Math.min(canvasWidth.value / img.width, canvasHeight.value / img.height);
    const x = (canvasWidth.value - img.width * scale) / 2;
    const y = (canvasHeight.value - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    drawGrid(); // 重新绘制网格线
    saveState();
  };
  img.onerror = () => {
    console.error('加载图片失败:', imageUrl);
  };
  img.src = imageUrl;
};

const getImageData = () => {
  return canvas.value.toDataURL('image/png');
};

const resetCanvas = () => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  drawGrid();
  saveState();
};

defineExpose({
  clearCanvas,
  saveAsImage,
  saveToLocal,
  getImageData,
  loadImage,
  resetCanvas,
  canvasToBlob,
  hasCanvasContent
});

watch([penColor, penWidth], () => {
  if (ctx) {
    ctx.strokeStyle = penColor.value;
    ctx.lineWidth = penWidth.value;
  }
});

onMounted(() => {
  initCanvas();
});

onBeforeUnmount(() => {
  if (loadingInstance) {
    loadingInstance.close();
  }
  
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  }
});
</script>

<style scoped>
.handwriting-board {
  border: 2px solid #e4e7ed;
  border-radius: 16px;
  background: white;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.board-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-bottom: 1px solid #e4e7ed;
  align-items: center;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-right: 1px solid #dcdfe6;
}

.tool-group:last-child {
  border-right: none;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  transition: all 0.2s ease;
}

.tool-btn:hover:not(:disabled) {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.tool-btn:active:not(:disabled) {
  transform: translateY(0);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  flex-shrink: 0;
}

.btn-save {
  background: #67c23a;
  color: white;
  border-color: #67c23a;
}

.btn-save:hover:not(:disabled) {
  background: #5daf34;
  border-color: #5daf34;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.tool-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.label-icon {
  opacity: 0.7;
}

.color-picker {
  width: 40px;
  height: 36px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: white;
  transition: border-color 0.2s;
}

.color-picker:hover {
  border-color: #409eff;
}

.width-slider {
  width: 120px;
  cursor: pointer;
  height: 4px;
  border-radius: 2px;
  background: #dcdfe6;
}

.width-slider::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
  border: none;
}

.width-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.width-value {
  font-size: 12px;
  color: #409eff;
  min-width: 45px;
  font-weight: 500;
}

.canvas-container {
  background: #fafbfc;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow-x: auto;
}

.draw-canvas {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  cursor: crosshair;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  height: auto;
  transition: box-shadow 0.2s;
}

.draw-canvas:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.board-info {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 20px;
  background: #f9fafc;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
}

.info-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  opacity: 0.6;
}

@media (max-width: 768px) {
  .board-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .tool-group {
    justify-content: center;
    border-right: none;
    border-bottom: 1px solid #dcdfe6;
    padding-bottom: 10px;
    flex-wrap: wrap;
  }
  
  .tool-group:last-child {
    border-bottom: none;
  }
  
  .board-info {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .info-text {
    font-size: 11px;
  }
  
  .width-slider {
    width: 100px;
  }
}
</style>