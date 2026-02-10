<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-button 
            type="primary" 
            @click="goBack" 
            size="small" 
            circle
            class="back-button"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          错题分析
        </h1>
        <div class="header-actions">
          <button 
            class="btn-primary" 
            @click="fetchData" 
            :disabled="loading"
          >
            <span v-if="loading">刷新中...</span>
            <span v-else>刷新数据</span>
          </button>
        </div>
      </div>
    </div>

     <!-- 内容区域 -->
    <div class="content-wrapper">
      <!-- 数据概览卡片 -->
      <div class="card overview-section" :class="{ 'loading-overlay': loading }">
        <!-- 局部加载遮罩 -->
        <div v-if="loading" class="content-loading">
          <div class="loading-spinner"></div>
        </div>
        
        <h2 class="section-title">学习概况</h2>
        <div class="overview-grid">
          <div class="overview-card">
            <div class="overview-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overview.totalMistakes }}</div>
              <div class="overview-label">总错题数</div>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon subject">
              <el-icon><Reading /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overview.subjectCount }}</div>
              <div class="overview-label">涉及科目</div>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon recent">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overview.weekMistakes }}</div>
              <div class="overview-label">本周新增</div>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon accuracy">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overview.reviewAccuracy }}%</div>
              <div class="overview-label">复习正确率</div>
            </div>
          </div>
        </div>
      </div>

     <!-- 图表区域 -->
      <div class="charts-container" :class="{ 'loading-overlay': loading }">
        <!-- 局部加载遮罩 -->
        <div v-if="loading" class="content-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
        
        <!-- 第一行：科目分布和错误趋势 -->
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">错题科目分布</h3>
              <el-select v-model="subjectChartType" size="small" class="chart-select">
                <el-option label="饼图" value="pie" />
                <el-option label="柱状图" value="bar" />
              </el-select>
            </div>
            <div class="chart-content">
              <div v-if="subjectChartType === 'pie'" ref="subjectPieChart" class="chart-canvas"></div>
              <div v-else ref="subjectBarChart" class="chart-canvas"></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">错题趋势分析</h3>
              <el-select v-model="trendPeriod" size="small" class="chart-select">
                <el-option label="近7天" value="7" />
                <el-option label="近30天" value="30" />
                <el-option label="近90天" value="90" />
              </el-select>
            </div>
            <div class="chart-content">
              <div ref="trendChart" class="chart-canvas"></div>
            </div>
          </div>
        </div>

        <!-- 第二行：题型分析和知识点分布 -->
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">错题题型分布</h3>
            </div>
            <div class="chart-content">
              <div ref="questionTypeChart" class="chart-canvas"></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">知识点薄弱点</h3>
            </div>
            <div class="chart-content">
              <div ref="knowledgeChart" class="chart-canvas"></div>
            </div>
          </div>
        </div>

        <!-- 第三行：年级分布和难度分布 -->
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">错题年级分布</h3>
              <el-select v-model="gradeChartType" size="small" class="chart-select">
                <el-option label="饼图" value="pie" />
                <el-option label="柱状图" value="bar" />
              </el-select>
            </div>
            <div class="chart-content">
              <div v-if="gradeChartType === 'pie'" ref="gradePieChart" class="chart-canvas"></div>
              <div v-else ref="gradeBarChart" class="chart-canvas"></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">错题难度分布</h3>
              <el-select v-model="difficultyChartType" size="small" class="chart-select">
                <el-option label="饼图" value="pie" />
                <el-option label="柱状图" value="bar" />
              </el-select>
            </div>
            <div class="chart-content">
              <div v-if="difficultyChartType === 'pie'" ref="difficultyPieChart" class="chart-canvas"></div>
              <div v-else ref="difficultyBarChart" class="chart-canvas"></div>
            </div>
          </div>
        </div>

        <!-- 第四行：综合能力雷达图 -->
        <div class="chart-row full-width">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">能力维度雷达图</h3>
            </div>
            <div class="chart-content">
              <div ref="radarChart" class="chart-canvas"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { ElMessage, ElSelect, ElOption, ElButton } from 'element-plus';
import {
  Refresh,
  Download,
  Document,
  Reading,
  Clock,
  TrendCharts,
  ArrowLeft,
  DocumentCopy
} from '@element-plus/icons-vue';
import axios from 'axios';

// 导入工具函数
import { 
  fetchSubjectList, 
  getSubjectName, 
  getAllSubjects,
  initSubjectData
} from '../utils/subjectList';

import { getQuestionCategoryText } from '../utils/questionCategory';
import { 
  fetchKnowledgePointList, 
  getKnowledgePointNames 
} from '../utils/knowledgeList';

// 导入年级工具函数
import { useGradeList } from '../utils/gradeList';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'MistakesAnalysis',
  components: {
    ElSelect,
    ElOption,
    ElButton,
    Refresh,
    Download,
    Document,
    Reading,
    Clock,
    TrendCharts,
    ArrowLeft,
    DocumentCopy
  },
  setup() {
    const router = useRouter();
    
    // 初始化年级工具函数
    const gradeTools = useGradeList();
    
    // 状态管理
    const loading = ref(false);
    const loadingText = ref('正在加载错题分析...');
    const mistakes = ref([]);
    const questionDetails = ref(new Map());
    const overview = ref({
      totalMistakes: 0,
      subjectCount: 0,
      weekMistakes: 0,
      reviewAccuracy: 0
    });
    
    // 图表相关状态
    const subjectChartType = ref('pie');
    const difficultyChartType = ref('pie');
    const gradeChartType = ref('pie'); // 年级图表类型
    const trendPeriod = ref('30');
    
    // 图表引用
    const subjectPieChart = ref(null);
    const subjectBarChart = ref(null);
    const trendChart = ref(null);
    const questionTypeChart = ref(null);
    const knowledgeChart = ref(null);
    const radarChart = ref(null);
    const difficultyPieChart = ref(null);
    const difficultyBarChart = ref(null);
    const gradePieChart = ref(null); // 年级饼图引用
    const gradeBarChart = ref(null); // 年级柱状图引用
    
    // 图表实例
    let chartInstances = {};

    // 返回按钮功能
    const goBack = () => {
      router.push('/student/mistakesbook');
    };

    // 计算属性：年级分布
    const gradeDistribution = computed(() => {
      const distribution = {};
      
      if (mistakes.value.length > 0 && questionDetails.value.size > 0) {
        mistakes.value.forEach(mistake => {
          const questionDetail = questionDetails.value.get(mistake.question_id);
          if (questionDetail?.grade_id) {
            const gradeName = gradeTools.getGradeName(questionDetail.grade_id);
            distribution[gradeName] = (distribution[gradeName] || 0) + 1;
          } else {
            // 如果没有年级信息，归类为未知
            distribution['未知年级'] = (distribution['未知年级'] || 0) + 1;
          }
        });
      }
      
      return Object.entries(distribution)
        .map(([name, value]) => ({ 
          name, 
          value,
          color: getGradeColor(name)
        }))
        .sort((a, b) => b.value - a.value);
    });

    // 计算属性：难度分布
    const difficultyDistribution = computed(() => {
      const distribution = {
        '⭐': 0,
        '⭐⭐': 0,
        '⭐⭐⭐': 0,
        '⭐⭐⭐⭐': 0,
        '⭐⭐⭐⭐⭐': 0
      };
      
      if (mistakes.value.length > 0 && questionDetails.value.size > 0) {
        mistakes.value.forEach(mistake => {
          const questionDetail = questionDetails.value.get(mistake.question_id);
          if (questionDetail?.difficulty_level) {
            const level = questionDetail.difficulty_level;
            const starLevel = Math.min(Math.max(Math.round(level), 1), 5);
            const key = '⭐'.repeat(starLevel);
            distribution[key] = distribution[key] + 1;
          } else {
            distribution['⭐⭐⭐']++;
          }
        });
      }
      
      return Object.entries(distribution)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
    });

    // 计算属性：科目分布
    const subjectDistribution = computed(() => {
      const distribution = {};
      
      detailedData.value.forEach(data => {
        if (data.subject && data.mistakeCount > 0) {
          distribution[data.subject] = data.mistakeCount;
        }
      });
      
      const result = Object.entries(distribution)
        .map(([name, value]) => ({ 
          name, 
          value,
          color: getSubjectColor(name)
        }))
        .sort((a, b) => b.value - a.value);
      
      return result;
    });

    // 计算属性：题型分布
    const questionTypeDistribution = computed(() => {
      const distribution = {};
      mistakes.value.forEach(mistake => {
        const questionDetail = questionDetails.value.get(mistake.question_id);
        if (questionDetail) {
          const typeName = getQuestionCategoryText(questionDetail.question_category_id);
          distribution[typeName] = (distribution[typeName] || 0) + 1;
        }
      });
      return Object.entries(distribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    });

    // 详细数据相关
    const detailedData = ref([]);
    
    // 获取数据
    const fetchData = async () => {
      loading.value = true;
      
      try {
        const studentName = localStorage.getItem('userName') || 'student';
        
        // 初始化数据
        try {
          await initSubjectData();
        } catch (error) {
          console.error('初始化科目数据失败:', error);
        }
        
        try {
          await fetchKnowledgePointList();
        } catch (error) {
          console.error('初始化知识点数据失败:', error);
        }
        
        // 加载年级列表
        try {
          await gradeTools.loadGradeList();
        } catch (error) {
          console.error('加载年级列表失败:', error);
        }
        
        // 获取错题列表
        const mistakesResponse = await axios.get(
          `${API_BASE}/incorrectQuestion/getIncorrectQuestionByStudent/${encodeURIComponent(studentName)}`
        );
        
        if (mistakesResponse.data?.code === 200) {
          mistakes.value = mistakesResponse.data.data || [];
          
          // 获取题目详情
          await fetchQuestionDetails();
          
          // 计算统计数据
          calculateOverview();
          calculateDetailedData();
          
          // 渲染图表
          renderAllCharts();
          
          ElMessage.success('数据加载成功');
        } else {
          ElMessage.error('获取错题数据失败');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        ElMessage.error('获取数据失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    // 获取题目详情
    const fetchQuestionDetails = async () => {
      const questionIds = [...new Set(mistakes.value.map(m => m.question_id).filter(id => id))];
      
      if (questionIds.length === 0) return;
      
      try {
        const response = await axios.post(
          `${API_BASE}/questions/findQuestionById`,
          questionIds,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data?.code === 200) {
          const details = response.data.data || [];
          details.forEach(detail => {
            questionDetails.value.set(detail.id, detail);
          });
        }
      } catch (error) {
        console.error('获取题目详情失败:', error);
      }
    };

    // 计算概览数据
    const calculateOverview = () => {
      const totalMistakes = mistakes.value.length;
      
      let subjectCount = 0;
      try {
        const subjectSet = new Set();
        questionDetails.value.forEach(detail => {
          if (detail?.subject_id) {
            const subjectName = getSubjectName(detail.subject_id);
            subjectSet.add(subjectName);
          }
        });
        subjectCount = subjectSet.size;
      } catch (error) {
        subjectCount = mistakes.value.length > 0 ? 1 : 0;
      }
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekMistakes = mistakes.value.filter(m => {
        try {
          const mistakeDate = new Date(m.last_wrong_time);
          return mistakeDate >= oneWeekAgo;
        } catch (error) {
          return false;
        }
      }).length;
      
      const reviewedCount = mistakes.value.filter(m => m.status === 'reviewed' || m.status === 1).length;
      const reviewAccuracy = totalMistakes > 0 ? Math.round((reviewedCount / totalMistakes) * 100) : 0;
      
      overview.value = {
        totalMistakes,
        subjectCount,
        weekMistakes,
        reviewAccuracy
      };
    };

    // 计算详细数据
    const calculateDetailedData = () => {
      const dataBySubject = {};
      
      const initSubjectData = (subjectName) => {
        if (!dataBySubject[subjectName]) {
          dataBySubject[subjectName] = {
            subject: subjectName,
            mistakeCount: 0,
            totalKnowledgePoints: getSubjectTotalKPs(subjectName),
            uniqueKnowledgePoints: new Set(),
            totalQuestions: 0,
            errorRate: 0,
            avgDifficulty: 0,
            knowledgePoints: [],
            mistakes: [],
            difficultySum: 0,
            questionCount: 0
          };
        }
        return dataBySubject[subjectName];
      };
      
      const getSubjectTotalKPs = (subjectName) => {
        const kpMap = {
          '数学': 80,
          '语文': 60,
          '英语': 70,
          '物理': 40,
          '化学': 45,
          '生物': 35,
          '历史': 30,
          '地理': 35,
          '政治': 40,
          '未知科目': 50
        };
        return kpMap[subjectName] || 50;
      };
      
      mistakes.value.forEach(mistake => {
        try {
          let subjectName = '未知科目';
          
          if (mistake.subject_id) {
            subjectName = getSubjectName(mistake.subject_id);
          } else {
            const questionDetail = questionDetails.value.get(mistake.question_id);
            if (questionDetail?.subject_id) {
              subjectName = getSubjectName(questionDetail.subject_id);
            }
          }
          
          const data = initSubjectData(subjectName);
          const questionDetail = questionDetails.value.get(mistake.question_id);
          
          data.mistakeCount++;
          
          data.mistakes.push({
            question_id: mistake.question_id,
            title: questionDetail?.title || '未知题目',
            type: questionDetail ? getQuestionCategoryText(questionDetail.question_category_id) : '未知',
            difficulty: questionDetail?.difficulty_level || 3,
            lastWrongTime: mistake.last_wrong_time || new Date().toISOString(),
            wrongCount: mistake.wrong_count || 1,
            status: mistake.status || 'pending',
            knowledge_point_id: questionDetail?.knowledge_point_id || ''
          });
          
          if (questionDetail?.difficulty_level) {
            data.difficultySum += questionDetail.difficulty_level;
            data.questionCount++;
          }
          
          if (questionDetail?.knowledge_point_id) {
            try {
              const knowledgePoints = getKnowledgePointNames(questionDetail.knowledge_point_id);
              knowledgePoints.forEach(point => {
                data.uniqueKnowledgePoints.add(point);
                
                const existingKP = data.knowledgePoints.find(kp => kp.name === point);
                if (existingKP) {
                  existingKP.mistakeCount++;
                } else {
                  data.knowledgePoints.push({
                    name: point,
                    mistakeCount: 1
                  });
                }
              });
            } catch (error) {
              console.warn('获取知识点失败:', error);
            }
          }
        } catch (error) {
          console.error('处理错题时出错:', error, mistake);
        }
      });
      
      detailedData.value = Object.values(dataBySubject).map(data => {
        try {
          const errorRate = Math.min(Math.round((data.mistakeCount / Math.max(data.totalQuestions, 1)) * 100), 100);
          const avgDifficulty = data.questionCount > 0 ? data.difficultySum / data.questionCount : 3;
          
          const knowledgeCoverage = data.totalKnowledgePoints > 0 
            ? Math.min(Math.round((data.uniqueKnowledgePoints.size / data.totalKnowledgePoints) * 100), 100)
            : 0;
          
          const knowledgePoints = data.knowledgePoints
            .sort((a, b) => b.mistakeCount - a.mistakeCount)
            .map(kp => ({
              name: kp.name,
              mistakeCount: kp.mistakeCount,
              errorRate: Math.round((kp.mistakeCount / Math.max(data.mistakeCount, 1)) * 100)
            }));

          const mainWeakness = knowledgePoints.length > 0 ? knowledgePoints[0].name : '无';
          
          let lastMistakeTime = '无记录';
          if (data.mistakes.length > 0) {
            try {
              const latestDate = new Date(Math.max(...data.mistakes
                .filter(m => m.lastWrongTime)
                .map(m => new Date(m.lastWrongTime).getTime())
              ));
              if (!isNaN(latestDate.getTime())) {
                lastMistakeTime = latestDate.toLocaleDateString();
              }
            } catch (error) {
              console.warn('解析日期失败:', error);
            }
          }
          
          return {
            ...data,
            errorRate,
            avgDifficulty,
            knowledgeCoverage,
            knowledgePoint: mainWeakness,
            lastMistakeTime,
            totalQuestions: Math.max(data.mistakeCount * 5, 100),
            knowledgePoints
          };
        } catch (error) {
          console.error('处理科目数据时出错:', error, data);
          return {
            ...data,
            errorRate: 0,
            avgDifficulty: 3,
            knowledgeCoverage: 0,
            knowledgePoint: '未知',
            lastMistakeTime: '无记录',
            totalQuestions: 100,
            knowledgePoints: []
          };
        }
      }).sort((a, b) => b.errorRate - a.errorRate);
    };

    // 渲染所有图表
    const renderAllCharts = () => {
      // 清理之前的图表实例
      Object.values(chartInstances).forEach(instance => {
        if (instance && typeof instance.dispose === 'function') {
          instance.dispose();
        }
      });
      chartInstances = {};

      // 渲染科目分布图
      if (subjectChartType.value === 'pie') {
        renderSubjectPieChart();
      } else {
        renderSubjectBarChart();
      }

      // 渲染趋势图
      renderTrendChart();

      // 渲染题型分布图
      renderQuestionTypeChart();

      // 渲染知识点分布图
      renderKnowledgeChart();

      // 渲染年级分布图
      if (gradeChartType.value === 'pie') {
        renderGradePieChart();
      } else {
        renderGradeBarChart();
      }

      // 渲染难度分布图
      if (difficultyChartType.value === 'pie') {
        renderDifficultyPieChart();
      } else {
        renderDifficultyBarChart();
      }

      // 渲染雷达图
      renderRadarChart();
    };

    // 渲染科目饼图
    const renderSubjectPieChart = () => {
      if (!subjectPieChart.value || subjectDistribution.value.length === 0) return;
      
      const chart = echarts.init(subjectPieChart.value);
      chartInstances.subjectPie = chart;
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 20,
          bottom: 20,
        },
        series: [
          {
            name: '科目分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: subjectDistribution.value
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染科目柱状图
    const renderSubjectBarChart = () => {
      if (!subjectBarChart.value || subjectDistribution.value.length === 0) return;
      
      const chart = echarts.init(subjectBarChart.value);
      chartInstances.subjectBar = chart;
      
      const data = subjectDistribution.value;
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          boundaryGap: [0, 0.01]
        },
        yAxis: {
          type: 'category',
          data: data.map(item => item.name)
        },
        series: [
          {
            name: '错题数量',
            type: 'bar',
            data: data.map((item, index) => ({
              value: item.value,
              itemStyle: {
                color: getSubjectColor(item.name, index)
              }
            })),
            label: {
              show: true,
              position: 'right'
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染年级饼图
    const renderGradePieChart = () => {
      if (!gradePieChart.value || gradeDistribution.value.length === 0) return;
      
      const chart = echarts.init(gradePieChart.value);
      chartInstances.gradePie = chart;
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 20,
          bottom: 20,
        },
        series: [
          {
            name: '年级分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: gradeDistribution.value
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染年级柱状图
    const renderGradeBarChart = () => {
      if (!gradeBarChart.value || gradeDistribution.value.length === 0) return;
      
      const chart = echarts.init(gradeBarChart.value);
      chartInstances.gradeBar = chart;
      
      const data = gradeDistribution.value;
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          boundaryGap: [0, 0.01]
        },
        yAxis: {
          type: 'category',
          data: data.map(item => item.name)
        },
        series: [
          {
            name: '错题数量',
            type: 'bar',
            data: data.map((item, index) => ({
              value: item.value,
              itemStyle: {
                color: getGradeColor(item.name, index)
              }
            })),
            label: {
              show: true,
              position: 'right'
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染趋势图
    const renderTrendChart = () => {
      if (!trendChart.value || mistakes.value.length === 0) return;
      
      const chart = echarts.init(trendChart.value);
      chartInstances.trend = chart;
      
      const days = parseInt(trendPeriod.value);
      const dataMap = {};
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        dataMap[dateStr] = 0;
      }
      
      mistakes.value.forEach(mistake => {
        const mistakeDate = new Date(mistake.last_wrong_time);
        const now = new Date();
        const diffDays = Math.floor((now - mistakeDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < days) {
          const dateStr = mistakeDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
          if (dataMap[dateStr] !== undefined) {
            dataMap[dateStr]++;
          }
        }
      });
      
      const dates = Object.keys(dataMap);
      const counts = Object.values(dataMap);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}: {c} 道'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates
        },
        yAxis: {
          type: 'value',
          name: '错题数'
        },
        series: [
          {
            name: '错题数',
            type: 'line',
            smooth: true,
            data: counts,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(58, 77, 233, 0.8)' },
                { offset: 1, color: 'rgba(58, 77, 233, 0.1)' }
              ])
            },
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: '#3a4de9'
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染题型分布图
    const renderQuestionTypeChart = () => {
      if (!questionTypeChart.value || questionTypeDistribution.value.length === 0) return;
      
      const chart = echarts.init(questionTypeChart.value);
      chartInstances.questionType = chart;
      
      const data = questionTypeDistribution.value;
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '错题数'
        },
        series: [
          {
            name: '错题数',
            type: 'bar',
            data: data.map(item => item.value),
            itemStyle: {
              color: function(params) {
                const colorList = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];
                return colorList[params.dataIndex % colorList.length];
              }
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染知识点分布图
    const renderKnowledgeChart = () => {
      if (!knowledgeChart.value || mistakes.value.length === 0) return;
      
      const chart = echarts.init(knowledgeChart.value);
      chartInstances.knowledge = chart;
      
      const knowledgeMap = {};
      
      mistakes.value.forEach(mistake => {
        const questionDetail = questionDetails.value.get(mistake.question_id);
        if (questionDetail?.knowledge_point_id) {
          const knowledgePoints = getKnowledgePointNames(questionDetail.knowledge_point_id);
          knowledgePoints.forEach(point => {
            knowledgeMap[point] = (knowledgeMap[point] || 0) + 1;
          });
        }
      });
      
      const knowledgeData = Object.entries(knowledgeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} 次'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: knowledgeData.map(item => item.name),
          axisLabel: {
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          name: '错误次数'
        },
        series: [
          {
            name: '错误次数',
            type: 'bar',
            data: knowledgeData.map(item => item.value),
            itemStyle: {
              color: function(params) {
                const value = params.value;
                if (value > 10) return '#ff4d4f';
                if (value > 5) return '#faad14';
                return '#52c41a';
              }
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染难度饼图
    const renderDifficultyPieChart = () => {
      if (!difficultyPieChart.value || difficultyDistribution.value.length === 0) return;
      
      const chart = echarts.init(difficultyPieChart.value);
      chartInstances.difficultyPie = chart;
      
      const data = difficultyDistribution.value;
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c}题 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          bottom: 20,
        },
        series: [
          {
            name: '难度分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data.map((item) => ({
              ...item,
              itemStyle: {
                color: getDifficultyColor(item.name)
              }
            }))
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染难度柱状图
    const renderDifficultyBarChart = () => {
      if (!difficultyBarChart.value || difficultyDistribution.value.length === 0) return;
      
      const chart = echarts.init(difficultyBarChart.value);
      chartInstances.difficultyBar = chart;
      
      const data = difficultyDistribution.value;
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: '{b}: {c}题'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name),
          axisLabel: {
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          name: '题数'
        },
        series: [
          {
            name: '错题数',
            type: 'bar',
            data: data.map(item => ({
              value: item.value,
              itemStyle: {
                color: getDifficultyColor(item.name)
              }
            })),
            label: {
              show: true,
              position: 'top'
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 渲染雷达图
    const renderRadarChart = () => {
      if (!radarChart.value || detailedData.value.length === 0) return;
      
      const chart = echarts.init(radarChart.value);
      chartInstances.radar = chart;
      
      const topSubjects = detailedData.value.slice(0, 5);
      
      const indicators = [
        { name: '题目难度', max: 5 },
        { name: '知识点覆盖', max: 100 },
        { name: '复习进度', max: 100 },
        { name: '近期错题数' }
      ];
      
      const seriesData = topSubjects.map((subject, index) => {
        const errorRate = subject.errorRate;
        const difficulty = Math.round(subject.avgDifficulty * 100) / 100;
        
        const uniqueKnowledgePoints = new Set();
        
        subject.mistakes.forEach(mistake => {
          const allMistakes = mistakes.value;
          const foundMistake = allMistakes.find(m => 
            m.question_id === mistake.question_id || 
            m.title === mistake.title
          );
          
          if (foundMistake) {
            const questionDetail = questionDetails.value.get(foundMistake.question_id);
            if (questionDetail?.knowledge_point_id) {
              try {
                const knowledgePoints = getKnowledgePointNames(questionDetail.knowledge_point_id);
                knowledgePoints.forEach(point => uniqueKnowledgePoints.add(point));
              } catch (error) {
                console.warn('获取知识点名称失败:', error);
              }
            }
          }
        });
        
        let totalKnowledgePoints = 50;
        
        if (subject.subject.includes('数学')) totalKnowledgePoints = 80;
        else if (subject.subject.includes('语文')) totalKnowledgePoints = 60;
        else if (subject.subject.includes('英语')) totalKnowledgePoints = 70;
        else if (subject.subject.includes('物理')) totalKnowledgePoints = 40;
        else if (subject.subject.includes('化学')) totalKnowledgePoints = 45;
        else if (subject.subject.includes('生物')) totalKnowledgePoints = 35;
        else if (subject.subject.includes('历史')) totalKnowledgePoints = 30;
        else if (subject.subject.includes('地理')) totalKnowledgePoints = 35;
        else if (subject.subject.includes('政治')) totalKnowledgePoints = 40;
        
        const knowledgeCoverage = Math.min(
          Math.round((uniqueKnowledgePoints.size / totalKnowledgePoints) * 100),
          100
        );
        
        const reviewProgress = Math.round((subject.mistakes.filter(m => m.status === 'reviewed').length / subject.mistakeCount) * 100);
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentMistakesCount = subject.mistakes.filter(mistake => {
          try {
            const mistakeDate = new Date(mistake.lastWrongTime);
            return mistakeDate >= oneWeekAgo;
          } catch (error) {
            return false;
          }
        }).length;
        
        return {
          name: subject.subject,
          value: [difficulty, knowledgeCoverage, reviewProgress, recentMistakesCount],
          itemStyle: {
            color: getSubjectColor(subject.subject, index)
          }
        };
      });
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const values = params.value;
            return `
              <strong>${params.name}</strong><br/>
              题目难度: ${values[0]}星<br/>
              知识点覆盖: ${values[1]}%<br/>
              复习进度: ${values[2]}%<br/>
              近期错题: ${values[3]}道
            `;
          }
        },
        legend: {
          data: topSubjects.map(s => s.subject),
          bottom: 10
        },
        radar: {
          indicator: indicators,
          center: ['50%', '45%'],
          radius: '65%'
        },
        series: [
          {
            name: '能力维度',
            type: 'radar',
            data: seriesData,
            areaStyle: {
              opacity: 0.3
            },
            lineStyle: {
              width: 2
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const resizeHandler = () => chart.resize();
      window.addEventListener('resize', resizeHandler);
    };

    // 辅助函数：根据难度级别获取颜色
    const getDifficultyColor = (difficultyName) => {
      const colorMap = {
        '⭐': '#95de64',
        '⭐⭐': '#73c0de',
        '⭐⭐⭐': '#3ba272',
        '⭐⭐⭐⭐': '#faad14',
        '⭐⭐⭐⭐⭐': '#ff4d4f'
      };
      return colorMap[difficultyName] || '#5470c6';
    };

    // 辅助函数：获取年级颜色
    const getGradeColor = (gradeName, index = null) => {
      // 根据年级名称设置不同的颜色
      const colorMap = {
        '一年级': '#5470c6',
        '二年级': '#91cc75',
        '三年级': '#fac858',
        '四年级': '#ee6666',
        '五年级': '#73c0de',
        '六年级': '#3ba272',
        '初一': '#fc8452',
        '初二': '#9a60b4',
        '初三': '#ea7ccc',
        '高一': '#5470c6',
        '高二': '#91cc75',
        '高三': '#fac858',
        '七年级': '#5470c6',
        '八年级': '#91cc75',
        '九年级': '#fac858',
        '未知年级': '#cccccc'
      };
      
      if (colorMap[gradeName]) {
        return colorMap[gradeName];
      }
      
      // 如果不在预设的颜色中，使用默认颜色序列
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
                     '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#9c27b0'];
      return colors[(index || 0) % colors.length];
    };

    // 辅助函数：获取科目颜色
    const getSubjectColor = (subjectName, index = null) => {
      const colorMap = {
        '数学': '#5470c6',
        '语文': '#91cc75',
        '英语': '#fac858',
        '物理': '#ee6666',
        '化学': '#73c0de',
        '生物': '#3ba272',
        '历史': '#fc8452',
        '地理': '#9a60b4',
        '政治': '#ea7ccc'
      };
      
      if (colorMap[subjectName]) {
        return colorMap[subjectName];
      }
      
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
                     '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
      return colors[(index || 0) % colors.length];
    };

    // 监听图表类型变化
    watch(subjectChartType, async () => {
      await nextTick();
      if (subjectChartType.value === 'pie') {
        renderSubjectPieChart();
      } else {
        renderSubjectBarChart();
      }
    });

    // 监听年级图表类型变化
    watch(gradeChartType, async () => {
      await nextTick();
      if (gradeChartType.value === 'pie') {
        renderGradePieChart();
      } else {
        renderGradeBarChart();
      }
    });

    // 监听难度图表类型变化
    watch(difficultyChartType, async () => {
      await nextTick();
      if (difficultyChartType.value === 'pie') {
        renderDifficultyPieChart();
      } else {
        renderDifficultyBarChart();
      }
    });

    // 监听时间周期变化
    watch(trendPeriod, () => {
      renderTrendChart();
    });

    // 初始化
    onMounted(() => {
      fetchData();
    });

    // 清理
    onUnmounted(() => {
      Object.values(chartInstances).forEach(instance => {
        if (instance && typeof instance.dispose === 'function') {
          instance.dispose();
        }
      });
      chartInstances = {};
    });

    return {
      // 状态
      loading,
      loadingText,
      overview,
      subjectChartType,
      difficultyChartType,
      gradeChartType,
      trendPeriod,
      detailedData,
      
      // 引用
      subjectPieChart,
      subjectBarChart,
      trendChart,
      questionTypeChart,
      knowledgeChart,
      radarChart,
      difficultyPieChart,
      difficultyBarChart,
      gradePieChart,
      gradeBarChart,
      
      // 方法
      fetchData,
      goBack,
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

/* ==================== 局部加载遮罩 ==================== */
.loading-overlay {
  position: relative;
  min-height: 200px;
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

/* ==================== 页面头部样式 ==================== */
.page-header {
  background: linear-gradient(135deg, #409eff 0%, #3375e0 100%);
  border-radius: 12px;
  padding: 20px 30px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
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

.back-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  color: white;
  transition: all 0.3s;
}

.back-button:hover {
  background-color: white;
  color: #409eff;
  transform: scale(1.05);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ==================== 按钮样式 ==================== */
.btn-primary {
  background-color: white;
  color: #409eff;
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

/* ==================== 学习概况样式 ==================== */
.overview-section {
  margin-bottom: 30px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.overview-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #dee2e6;
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.overview-icon.total {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.overview-icon.subject {
  background: linear-gradient(135deg, #10b981, #059669);
}

.overview-icon.recent {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.overview-icon.accuracy {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 8px;
}

.overview-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* ==================== 图表区域样式 ==================== */
.charts-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-row.full-width {
  grid-template-columns: 1fr;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e6e9f0;
  transition: all 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e9f0;
}

.chart-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-select {
  width: 120px;
}

.chart-content {
  height: 350px;
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

/* 雷达图特殊高度 */
.chart-row.full-width .chart-content {
  height: 400px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .chart-row {
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

  .overview-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .overview-card {
    padding: 16px;
  }

  .overview-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }

  .overview-value {
    font-size: 28px;
  }

  .card {
    padding: 20px;
  }

  .chart-content {
    height: 300px;
  }

  .chart-row.full-width .chart-content {
    height: 350px;
  }
}

@media (max-width: 480px) {
  .chart-select {
    width: 100px;
  }
  
  .overview-value {
    font-size: 24px;
  }
  
  .page-title {
    font-size: 20px;
    gap: 8px;
  }
  
  .back-button {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
}
</style>