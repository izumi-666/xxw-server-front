<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          自我分析
        </h1>
        <div class="header-actions">
          <button 
            class="btn-primary" 
            @click="analyze" 
            :disabled="loading || chapterLoading || dataLoading || !selectedSubject || !selectedGrade || !selectedChapter"
          >
            <el-icon><Search /></el-icon>
            <span v-if="loading">分析中...</span>
            <span v-else-if="chapterLoading">加载章节中...</span>
            <span v-else-if="dataLoading">加载基础数据...</span>
            <span v-else>开始分析</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-wrapper">
      <!-- 筛选条件区域 -->
      <div class="card filter-section">
        <h2 class="section-title">
          <el-icon><Filter /></el-icon>
          筛选条件
        </h2>
        <div class="filter-grid">
          <!-- 科目选择 -->
          <div class="filter-item">
            <label class="filter-label">选择科目</label>
            <el-select 
              v-model="selectedSubject" 
              placeholder="请选择科目" 
              clearable
              size="large"
              class="filter-select"
              :loading="subjectLoading || dataLoading"
              @change="handleSubjectChange"
              :disabled="subjectLoading || dataLoading"
            >
              <el-option
                v-for="subject in subjectOptions"
                :key="subject.value"
                :label="subject.label"
                :value="subject.value"
              />
              <template #prefix>
                <el-icon v-if="subjectLoading || dataLoading"><Loading /></el-icon>
              </template>
            </el-select>
          </div>

          <!-- 年级选择 -->
          <div class="filter-item">
            <label class="filter-label">选择年级</label>
            <el-select 
              v-model="selectedGrade" 
              placeholder="请选择年级" 
              clearable
              size="large"
              class="filter-select"
              @change="handleGradeChange"
              :loading="gradeLoading || dataLoading"
              :disabled="gradeLoading || dataLoading"
            >
              <el-option
                v-for="grade in gradeList"
                :key="grade.id"
                :label="grade.name"
                :value="grade.id"
              />
              <template #prefix>
                <el-icon v-if="gradeLoading || dataLoading"><Loading /></el-icon>
              </template>
            </el-select>
          </div>

          <!-- 章节选择 -->
          <div class="filter-item full-width">
            <label class="filter-label">选择章节</label>
            <div class="chapter-select-container">
              <el-select 
                v-model="selectedChapter" 
                :placeholder="getChapterPlaceholder()"
                clearable
                size="large"
                class="chapter-select"
                @change="handleChapterChange"
                :loading="chapterLoading"
                :disabled="loading || chapterLoading || !selectedSubject || !selectedGrade || dataLoading"
              >
                <el-option
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  :label="chapter.name"
                  :value="chapter.id"
                />
                <template #prefix>
                  <el-icon v-if="chapterLoading"><Loading /></el-icon>
                </template>
              </el-select>
            </div>
            
            <!-- 章节加载状态提示 -->
            <div v-if="chapterLoading" class="loading-tips">
              <el-icon class="loading-icon"><Loading /></el-icon>
              正在加载章节数据...
            </div>
            <div v-else-if="chapterError" class="error-tips">
              <el-icon><Warning /></el-icon>
              加载失败，请重试
            </div>
            <div v-else-if="chapters.length === 0 && selectedSubject && selectedGrade && !chapterLoading" class="no-data-tips">
              <el-icon><InfoFilled /></el-icon>
              该科目和年级暂无章节数据
            </div>
            <!-- 数据加载提示 -->
            <div v-if="dataLoading" class="loading-tips">
              <el-icon class="loading-icon"><Loading /></el-icon>
              正在加载基础数据...
            </div>
          </div>
        </div>

        <!-- 当前选择显示 -->
        <div v-if="currentSelection.length > 0" class="selection-display">
          <div class="selection-title">
            <el-icon><InfoFilled /></el-icon>
            当前分析范围：
          </div>
          <div class="selection-tags">
            <el-tag 
              v-for="item in currentSelection" 
              :key="item.type"
              :type="item.type"
              size="large"
              closable
              @close="removeSelection(item.removeType)"
            >
              {{ item.label }}: {{ item.value }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 分析结果区域 -->
      <div class="card result-section" :class="{ 'loading-overlay': loading }">
        <!-- 局部加载遮罩 -->
        <div v-if="loading" class="content-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在分析知识掌握情况...</div>
        </div>
        
        <div class="result-header">
          <h2 class="section-title">
            <el-icon><TrendCharts /></el-icon>
            分析结果
          </h2>
          <div v-if="hasResults" class="result-summary">
            <div class="summary-item">
              <span class="summary-label">分析知识点：</span>
              <span class="summary-value">{{ analysisResults.length }} 个</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均掌握率：</span>
              <span class="summary-value">{{ averageRate }}%</span>
            </div>
          </div>
        </div>

        <!-- 雷达图区域 -->
        <div v-if="hasResults" class="chart-container">
          <div class="chart-wrapper">
            <div ref="radarChart" class="radar-chart"></div>
          </div>
          
          <!-- 图例说明 -->
          <div class="chart-legend">
            <div class="legend-title">掌握程度说明：</div>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-color" style="background-color: #1890ff;"></span>
                <span class="legend-text">掌握程度 (0-100%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #52c41a;"></span>
                <span class="legend-text">优秀 (≥80%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #faad14;"></span>
                <span class="legend-text">良好 (60-79%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #ff4d4f;"></span>
                <span class="legend-text">需加强 (<60%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div v-else-if="!loading" class="no-data">
          <el-empty description="请选择科目、年级和章节开始分析" />
        </div>

        <!-- 详细数据表格 -->
        <div v-if="hasResults" class="detail-table">
          <h3 class="table-title">知识点详细分析</h3>
          <el-table 
            :data="analysisResults" 
            border 
            stripe
            :default-sort="{ prop: 'rate', order: 'descending' }"
          >
            <el-table-column prop="knowledge_point_name" label="知识点" min-width="200">
              <template #default="{ row }">
                <div class="knowledge-cell">
                  <span class="knowledge-name">{{ row.knowledge_point_name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="rate" label="掌握率" width="120" sortable>
              <template #default="{ row }">
                <div class="rate-cell">
                  <el-progress 
                    :percentage="row.rate * 100" 
                    :show-text="false"
                    :stroke-width="8"
                    :color="getRateColor(row.rate)"
                  />
                  <span class="rate-text">{{ (row.rate * 100).toFixed(1) }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="掌握程度" width="120">
              <template #default="{ row }">
                <el-tag :type="getLevelType(row.rate)" size="small">
                  {{ getLevelText(row.rate) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  link 
                  @click="viewDetails(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { 
  ElMessage, 
  ElSelect, 
  ElOption, 
  ElButton,
  ElInput,
  ElTag,
  ElTable,
  ElTableColumn,
  ElProgress,
  ElEmpty
} from 'element-plus';
import {
  Search,
  Filter,
  Check,
  InfoFilled,
  TrendCharts,
  Loading,
  Warning
} from '@element-plus/icons-vue';
import axios from 'axios';

// 导入科目工具函数
import { 
  getSubjectName,
  initSubjectData,
  getAllSubjects,
  getSubjectIdByName,
  subjectLoading
} from '../utils/subjectList';

// 导入年级工具函数
import { useGradeList } from '../utils/gradeList';

// 导入知识点工具函数
import { 
  fetchKnowledgePointList, 
  getKnowledgePointName, 
  getKnowledgePointNames 
} from '../utils/knowledgeList';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'KnowledgeAnalysis',
  components: {
    ElSelect,
    ElOption,
    ElButton,
    ElInput,
    ElTag,
    ElTable,
    ElTableColumn,
    ElProgress,
    ElEmpty,
    Search,
    Filter,
    Check,
    InfoFilled,
    TrendCharts,
    Loading,
    Warning
  },
  setup() {
    const router = useRouter();
    
    // 状态管理
    const loading = ref(false);
    const dataLoading = ref(true); // 控制整体数据加载状态
    const selectedSubject = ref('');
    const selectedGrade = ref('');
    const selectedChapter = ref('');
    const analysisResults = ref([]);
    
    // 章节加载相关状态
    const chapterLoading = ref(false);
    const chapterError = ref(false);
    const chapters = ref([]);
    
    // 使用 gradeList.js 中的年级数据
    const { gradeList, loading: gradeLoading, loadGradeList, getGradeName } = useGradeList();
    
    // 从subjectList导入的科目数据
    const subjectOptions = computed(() => {
      try {
        const allSubjects = getAllSubjects();
        return allSubjects.map(subjectName => {
          const subjectId = getSubjectIdByName(subjectName);
          return {
            label: subjectName,
            value: subjectId || ''
          };
        }).filter(option => option.value);
      } catch (error) {
        console.error('获取科目选项失败:', error);
        return [];
      }
    });
    
    // 图表引用
    const radarChart = ref(null);
    let chartInstance = null;

    // 计算属性
    const hasResults = computed(() => analysisResults.value.length > 0);
    
    const averageRate = computed(() => {
      if (analysisResults.value.length === 0) return 0;
      const total = analysisResults.value.reduce((sum, item) => sum + item.rate, 0);
      return (total / analysisResults.value.length * 100).toFixed(1);
    });
    
    const currentSelection = computed(() => {
      const selections = [];
      
      // 科目选择显示
      if (selectedSubject.value) {
        try {
          const subjectName = getSubjectName(selectedSubject.value);
          selections.push({
            type: 'primary',
            label: '科目',
            value: subjectName || `科目${selectedSubject.value}`,
            removeType: 'subject'
          });
        } catch (error) {
          console.error('获取科目名称失败:', error);
        }
      }
      
      // 年级选择显示
      if (selectedGrade.value) {
        const gradeName = getGradeName(selectedGrade.value);
        selections.push({
          type: 'success',
          label: '年级',
          value: gradeName,
          removeType: 'grade'
        });
      }
      
      // 章节选择显示
      if (selectedChapter.value) {
        const chapterValue = selectedChapter.value;
        const chapter = selectedChapter.value 
          ? chapters.value.find(c => c.id === chapterValue)
          : null;
        selections.push({
          type: 'warning',
          label: '章节',
          value: chapter ? chapter.name : chapterValue,
          removeType: 'chapter'
        });
      }
      
      return selections;
    });

    // 方法
    const getChapterPlaceholder = () => {
      if (dataLoading.value) {
        return '正在加载基础数据...';
      }
      if (chapterLoading.value) {
        return '正在加载章节...';
      }
      if (!selectedSubject.value || !selectedGrade.value) {
        return '请先选择科目和年级';
      }
      if (chapterError.value) {
        return '加载失败，请重试';
      }
      return '请选择章节';
    };

    const handleSubjectChange = () => {
      // 如果数据还在加载中，不允许改变选择
      if (dataLoading.value) {
        ElMessage.warning('数据正在加载中，请稍候');
        return;
      }
      
      if (selectedSubject.value) {
        try {
          const subjectName = getSubjectName(selectedSubject.value);
          ElMessage.success(`已选择科目: ${subjectName}`);
          
          // 科目改变时，清空年级和章节
          selectedGrade.value = '';
          selectedChapter.value = '';
          chapters.value = [];
          chapterError.value = false;
        } catch (error) {
          ElMessage.info(`已选择科目ID: ${selectedSubject.value}`);
        }
      }
    };

    const handleGradeChange = () => {
      // 如果数据还在加载中，不允许改变选择
      if (dataLoading.value) {
        ElMessage.warning('数据正在加载中，请稍候');
        return;
      }
      
      if (selectedGrade.value) {
        const gradeName = getGradeName(selectedGrade.value);
        ElMessage.success(`已选择年级: ${gradeName}`);
        
        // 年级改变时，清空章节并重新加载
        selectedChapter.value = '';
        chapters.value = [];
        chapterError.value = false;
        
        // 加载该科目和年级的章节
        loadChapters();
      } else {
        // 如果清空年级，同时清空章节
        selectedChapter.value = '';
        chapters.value = [];
        chapterError.value = false;
      }
    };

    const loadChapters = async () => {
      // 检查是否选择了科目和年级
      if (!selectedSubject.value || !selectedGrade.value) {
        return;
      }
      
      chapterLoading.value = true;
      chapterError.value = false;
      selectedChapter.value = '';
      chapters.value = [];
      
      try {
        const response = await axios.get(
          `${API_BASE}/analysis/getChapter/${selectedSubject.value}/${selectedGrade.value}`,
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data?.code === 200 && Array.isArray(response.data.data)) {
          // 直接使用API返回的字符串数组，不再进行复杂的转换
          chapters.value = response.data.data.map(chapterName => ({
            id: chapterName,  // 直接使用字符串作为id
            name: chapterName // 直接使用字符串作为显示名称
          }));
          
          if (chapters.value.length > 0) {
            ElMessage.success(`成功加载 ${chapters.value.length} 个章节`);
          } else {
            ElMessage.info('该科目和年级暂无章节数据');
          }
        } else {
          console.warn('章节数据格式异常:', response.data);
          chapters.value = [];
          chapterError.value = true;
          ElMessage.warning('章节数据格式错误，请稍后重试');
        }
      } catch (error) {
        console.error('加载章节数据失败:', error);
        chapterError.value = true;
        ElMessage.error('加载章节数据失败，请稍后重试');
        chapters.value = [];
      } finally {
        chapterLoading.value = false;
      }
    };

    const handleChapterChange = () => {
      if (selectedChapter.value) {
        const chapter = chapters.value.find(c => c.id === selectedChapter.value);
        if (chapter) {
          ElMessage.success(`已选择章节: ${chapter.name}`);
        }
      }
    };

    const removeSelection = (type) => {
      // 如果数据还在加载中，不允许删除选择
      if (dataLoading.value) {
        ElMessage.warning('数据正在加载中，请稍候');
        return;
      }
      
      switch (type) {
        case 'subject':
          selectedSubject.value = '';
          selectedGrade.value = '';
          selectedChapter.value = '';
          chapters.value = [];
          chapterError.value = false;
          break;
        case 'grade':
          selectedGrade.value = '';
          selectedChapter.value = '';
          chapters.value = [];
          chapterError.value = false;
          break;
        case 'chapter':
          selectedChapter.value = '';
          break;
      }
    };

    const getRateColor = (rate) => {
      if (rate >= 0.8) return '#52c41a';
      if (rate >= 0.6) return '#faad14';
      return '#ff4d4f';
    };

    const getLevelType = (rate) => {
      if (rate >= 0.8) return 'success';
      if (rate >= 0.6) return 'warning';
      return 'danger';
    };

    const getLevelText = (rate) => {
      if (rate >= 0.8) return '优秀';
      if (rate >= 0.6) return '良好';
      return '需加强';
    };

    const viewDetails = (row) => {
      ElMessage.info(`查看知识点 "${row.knowledge_point_name}" 的详细分析`);
      // 这里可以跳转到详细分析页面或显示模态框
    };

    // 主要分析方法
    const analyze = async () => {
      if (!selectedSubject.value) {
        ElMessage.warning('请选择科目');
        return;
      }
      if (!selectedGrade.value) {
        ElMessage.warning('请选择年级');
        return;
      }
      
      const chapter = selectedChapter.value;
      if (!chapter) {
        ElMessage.warning('请选择章节');
        return;
      }

      if (chapterLoading.value) {
        ElMessage.warning('章节数据正在加载中，请稍候');
        return;
      }

      loading.value = true;
      analysisResults.value = [];
      
      try {
        const studentName = localStorage.getItem('userName') || 'student';
        
        // 获取分析结果
        const response = await axios.post(`${API_BASE}/analysis/getKnowledgePointAnalysis`, {
          student: studentName,
          subject_id: selectedSubject.value,
          grade_id: selectedGrade.value,
          chapter: chapter
        }, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data?.code === 200 && Array.isArray(response.data.data)) {
          const knowledgePointsData = response.data.data;
          
          if (knowledgePointsData.length === 0) {
            ElMessage.warning('该章节没有找到知识点分析结果');
            return;
          }
          
          // 使用知识点工具函数获取名称
          const results = knowledgePointsData.map(kpData => {
            const knowledgePointName = getKnowledgePointName(kpData.knowledge_point_id);
            
            return {
              knowledge_point_id: kpData.knowledge_point_id,
              knowledge_point_name: knowledgePointName,
              rate: kpData.rate || 0,
              subject_name: getSubjectName(selectedSubject.value),
              grade_name: getGradeName(selectedGrade.value),
              chapter: chapter
            };
          });
          
          analysisResults.value = results;
          
          if (analysisResults.value.length === 0) {
            ElMessage.warning('未找到知识点分析结果');
          } else {
            const subjectName = getSubjectName(selectedSubject.value);
            const gradeName = getGradeName(selectedGrade.value);
            const chapterValue = selectedChapter.value;
            const chapterObj = selectedChapter.value 
              ? chapters.value.find(c => c.id === chapterValue)
              : null;
            const chapterName = chapterObj ? chapterObj.name : chapterValue;
            
            ElMessage.success(`成功分析 ${analysisResults.value.length} 个知识点（${subjectName} - ${gradeName} - ${chapterName}）`);
            
            saveAnalysisRecord();
            await nextTick();
            renderRadarChart();
          }
        } else {
          console.warn('分析结果格式异常:', response.data);
          ElMessage.warning('分析结果格式错误，请稍后重试');
        }
      } catch (error) {
        console.error('分析失败:', error);
        ElMessage.error('分析失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };

    // 保存分析记录到本地存储
    const saveAnalysisRecord = () => {
      try {
        const records = JSON.parse(localStorage.getItem('knowledgeAnalysisRecords') || '[]');
        const newRecord = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          subject_id: selectedSubject.value,
          subject_name: getSubjectName(selectedSubject.value),
          grade_id: selectedGrade.value,
          grade_name: getGradeName(selectedGrade.value),
          chapter: selectedChapter.value,
          total_points: analysisResults.value.length,
          average_rate: averageRate.value,
          results: analysisResults.value.slice(0, 10)
        };
        
        records.unshift(newRecord);
        if (records.length > 20) records.length = 20;
        
        localStorage.setItem('knowledgeAnalysisRecords', JSON.stringify(records));
      } catch (error) {
        console.error('保存分析记录失败:', error);
      }
    };

    // 渲染雷达图
    const renderRadarChart = () => {
      if (!radarChart.value || analysisResults.value.length === 0) return;
      
      if (chartInstance) {
        chartInstance.dispose();
      }
      
      chartInstance = echarts.init(radarChart.value);
      
      const displayResults = analysisResults.value.slice(0, 8);
      const indicators = displayResults.map(item => ({
        name: item.knowledge_point_name.length > 6 
          ? item.knowledge_point_name.substring(0, 6) + '...' 
          : item.knowledge_point_name,
        max: 1
      }));
      
      const data = displayResults.map(item => item.rate);
      
      const subjectName = getSubjectName(selectedSubject.value);
      const gradeName = getGradeName(selectedGrade.value);
      const chapterValue = selectedChapter.value;
      const chapterObj = selectedChapter.value 
        ? chapters.value.find(c => c.id === chapterValue)
        : null;
      const chapterName = chapterObj ? chapterObj.name : chapterValue;

      const option = {
        title: {
          text: `${subjectName} - ${gradeName} - ${chapterName}`,
          subtext: '知识点掌握情况雷达图',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          },
          subtextStyle: {
            fontSize: 14,
            color: '#666'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const fullName = displayResults[params.dataIndex].knowledge_point_name;
            const rate = (params.value * 100).toFixed(1);
            const level = getLevelText(params.value);
            return `${fullName}<br/>掌握率: ${rate}%<br/>掌握程度: ${level}`;
          }
        },
        radar: {
          indicator: indicators,
          center: ['50%', '55%'],
          radius: '65%',
          axisName: {
            color: '#666',
            fontSize: 12,
            borderRadius: 3,
            padding: [3, 5]
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(24, 144, 255, 0.1)', 'rgba(24, 144, 255, 0.05)']
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(24, 144, 255, 0.3)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(24, 144, 255, 0.2)'
            }
          }
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: data,
                name: '掌握率',
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                  width: 3,
                  color: '#1890ff'
                },
                areaStyle: {
                  color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                    { offset: 0, color: 'rgba(24, 144, 255, 0.6)' },
                    { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
                  ])
                },
                itemStyle: {
                  color: '#1890ff'
                },
                label: {
                  show: true,
                  formatter: function(params) {
                    return (params.value * 100).toFixed(0) + '%';
                  },
                  color: '#fff',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: [2, 5],
                  borderRadius: 3
                }
              }
            ]
          }
        ],
        grid: {
          top: '100',
          bottom: '80'
        }
      };
      
      chartInstance.setOption(option);
      
      const resizeHandler = () => chartInstance.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 初始化数据
    const initData = async () => {
      try {
        // 初始化科目数据
        await initSubjectData();
        
        // 加载年级数据
        await loadGradeList();
        
        // 加载知识点数据
        await fetchKnowledgePointList();
        
        ElMessage.success('数据加载完成');
        
        // 移除恢复上次选择的代码，每次都从空开始
        selectedSubject.value = '';
        selectedGrade.value = '';
        selectedChapter.value = '';
        analysisResults.value = [];
        
      } catch (error) {
        console.error('初始化数据失败:', error);
        ElMessage.warning('数据加载失败，请刷新页面重试');
      } finally {
        dataLoading.value = false; // 数据加载完成
      }
    };

    // 初始化
    onMounted(async () => {
      await initData();
    });

    // 清理
    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.dispose();
        window.removeEventListener('resize', resizeHandler);
      }
    });

    return {
      // 状态
      loading,
      dataLoading,
      subjectLoading,
      gradeLoading,
      chapterLoading,
      selectedSubject,
      selectedGrade,
      selectedChapter,
      analysisResults,
      chapters,
      chapterError,
      
      // 数据源
      subjectOptions,
      gradeList,
      
      // 引用
      radarChart,
      
      // 计算属性
      hasResults,
      averageRate,
      currentSelection,
      
      // 方法
      analyze,
      getChapterPlaceholder,
      handleSubjectChange,
      handleGradeChange,
      handleChapterChange,
      removeSelection,
      getRateColor,
      getLevelType,
      getLevelText,
      viewDetails,
      getSubjectName,
      getGradeName
    };
  }
};
</script>

<style scoped>
/* ==================== 全局容器样式 ==================== */
.container {
  max-width: 2000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
}

/* ==================== 内容包装器 ==================== */
.content-wrapper {
  position: relative;
}

/* ==================== 页面头部样式 ==================== */
.page-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 12px;
  padding: 20px 30px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
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
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ==================== 按钮样式 ==================== */
.btn-primary {
  background-color: white;
  color: #1890ff;
  border: 2px solid white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.section-title {
  font-size: 20px;
  margin: 0 0 16px 0;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 筛选条件区域 ==================== */
.filter-section {
  margin-bottom: 30px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item.full-width {
  grid-column: 1 / -1;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.filter-select {
  width: 100%;
}

.chapter-select-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}

.chapter-select {
  width: 100%;
}

/* ==================== 选择显示区域 ==================== */
.selection-display {
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

.selection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.selection-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ==================== 分析结果区域 ==================== */
.result-section {
  position: relative;
  min-height: 400px;
}

.content-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.result-summary {
  display: flex;
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

/* ==================== 雷达图区域 ==================== */
.chart-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-wrapper {
  height: 400px;
}

.radar-chart {
  width: 100%;
  height: 100%;
}

.chart-legend {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
}

.legend-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.legend-text {
  font-size: 14px;
  color: #606266;
}

/* ==================== 无数据提示 ==================== */
.no-data {
  padding: 40px 0;
}

/* ==================== 详细数据表格 ==================== */
.detail-table {
  margin-top: 24px;
}

.table-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.knowledge-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.knowledge-name {
  font-weight: 500;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-text {
  min-width: 60px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* ==================== 状态提示样式 ==================== */
.loading-tips,
.no-data-tips,
.error-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
}

.loading-tips {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.no-data-tips {
  color: #faad14;
  background-color: rgba(250, 173, 20, 0.1);
}

.error-tips {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .chart-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-header {
    padding: 16px 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chapter-select-container {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 300px;
  }

  .result-summary {
    flex-direction: column;
    gap: 12px;
  }

  .suggestions {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
    gap: 8px;
  }
  
  .btn-primary {
    padding: 8px 16px;
  }
}
</style>