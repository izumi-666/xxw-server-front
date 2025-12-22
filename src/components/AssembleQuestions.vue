<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">手动组题系统</h1>
        <button @click="goBack" class="back-btn">返回</button>
      </div>
    </div>

    <!-- 组题模式选择 -->
    <div class="mode-selector">
      <div class="mode-tabs">
        <button
          :class="{ active: !showPaperPreview }"
          @click="showPaperPreview = false"
          type="button"
          class="mode-tab"
        >
          题目检索
        </button>
        <button
          :class="{ active: showPaperPreview }"
          @click="showPaperPreview = true"
          type="button"
          class="mode-tab"
        >
          试卷预览
          <span class="question-count">{{ selectedQuestions.length }}</span>
        </button>
      </div>
    </div>

    <!-- ==================== 题目检索界面 ==================== -->
    <section v-if="!showPaperPreview" class="search-section">
      <!-- 检索条件区域 -->
      <div class="search-criteria card">
        <div class="card-header">
          <h2 class="section-title">检索题目</h2>
          <div class="header-actions">
            <button @click="findQuestions" class="btn-primary search-btn">检索</button>
            <button @click="clearSearchCriteria" class="btn-secondary">重置</button>
          </div>
        </div>

        <div class="criteria-grid">
          <!-- 年级筛选 -->
          <div class="criteria-item">
            <label class="criteria-label">年级</label>
            <select v-model="searchCriteria.grade_id" class="form-select">
              <option :value="null">全部</option>
              <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
          </div>

          <!-- 科目筛选 -->
          <div class="criteria-item">
            <label class="criteria-label">科目</label>
            <select v-model="searchCriteria.subject_id" class="form-select">
              <option :value="null">全部</option>
              <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>

          <!-- 难度筛选 -->
          <div class="criteria-item">
            <label class="criteria-label">难度</label>
            <select v-model="searchCriteria.difficulty_level" class="form-select">
              <option :value="null">全部</option>
              <option v-for="n in 5" :key="n" :value="n">
                <span v-for="i in n" :key="i">⭐</span>
              </option>
            </select>
          </div>

          <!-- 题目内容关键词搜索 -->
          <div class="criteria-item full-width">
            <label class="criteria-label">题目内容</label>
            <input
              type="text"
              v-model="searchCriteria.title"
              placeholder="输入题目关键词"
              class="form-input"
            />
          </div>

          <!-- 问题类别筛选（多选） -->
          <div class="criteria-item">
            <label class="criteria-label">问题类别</label>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleQuestionCategoryDropdown">
                <span class="placeholder" v-if="selectedQuestionCategories.length === 0">
                  选择问题类别
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="item in selectedQuestionCategories"
                    :key="item.id"
                    class="selected-tag"
                    @click.stop="removeQuestionCategory(item.id)"
                  >
                    {{ item.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showQuestionCategoryDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="questionCategorySearch"
                    placeholder="搜索问题类别..."
                    class="search-input"
                    @input="filterQuestionCategories"
                  />
                </div>
                <div class="dropdown-options">
                  <div
                    v-for="item in filteredQuestionCategories"
                    :key="item.id"
                    class="dropdown-option"
                    @click="toggleQuestionCategory(item)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isQuestionCategorySelected(item.id) }"
                    >
                      {{ isQuestionCategorySelected(item.id) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ item.name }}</span>
                  </div>
                  <div v-if="filteredQuestionCategories.length === 0" class="no-options">
                    无匹配选项
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 知识点筛选（多选） -->
          <div class="criteria-item">
            <label class="criteria-label">知识点</label>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleKnowledgeDropdown">
                <span class="placeholder" v-if="selectedKnowledgePoints.length === 0">
                  选择知识点
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="kp in selectedKnowledgePoints"
                    :key="kp.id"
                    class="selected-tag"
                    @click.stop="removeKnowledgePoint(kp.id)"
                  >
                    {{ kp.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showKnowledgeDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="knowledgeSearch"
                    placeholder="搜索知识点..."
                    class="search-input"
                    @input="filterKnowledgePoints"
                  />
                </div>
                <div class="dropdown-options">
                  <div
                    v-for="kp in filteredKnowledgePoints"
                    :key="kp.id"
                    class="dropdown-option"
                    @click="toggleKnowledgePoint(kp)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isKnowledgeSelected(kp.id) }"
                    >
                      {{ isKnowledgeSelected(kp.id) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ kp.name }}</span>
                  </div>
                  <div v-if="filteredKnowledgePoints.length === 0" class="no-options">
                    无匹配选项
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 副知识点筛选（多选） -->
          <div class="criteria-item">
            <label class="criteria-label">副知识点</label>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleSubKnowledgeDropdown">
                <span class="placeholder" v-if="selectedSubKnowledgePoints.length === 0">
                  选择副知识点
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="kp in selectedSubKnowledgePoints"
                    :key="kp.id"
                    class="selected-tag"
                    @click.stop="removeSubKnowledgePoint(kp.id)"
                  >
                    {{ kp.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showSubKnowledgeDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="subKnowledgeSearch"
                    placeholder="搜索副知识点..."
                    class="search-input"
                    @input="filterSubKnowledgePoints"
                  />
                </div>
                <div class="dropdown-options">
                  <div
                    v-for="kp in filteredSubKnowledgePoints"
                    :key="kp.id"
                    class="dropdown-option"
                    @click="toggleSubKnowledgePoint(kp)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isSubKnowledgeSelected(kp.id) }"
                    >
                      {{ isSubKnowledgeSelected(kp.id) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ kp.name }}</span>
                  </div>
                  <div v-if="filteredSubKnowledgePoints.length === 0" class="no-options">
                    无匹配选项
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 解题思想筛选（多选） -->
          <div class="criteria-item">
            <label class="criteria-label">解题思想</label>
            <div class="multi-select-wrapper">
              <div class="multi-select-trigger" @click="toggleSolutionIdeaDropdown">
                <span class="placeholder" v-if="selectedSolutionIdeas.length === 0">
                  选择解题思想
                </span>
                <span class="selected-tags" v-else>
                  <span
                    v-for="item in selectedSolutionIdeas"
                    :key="item.id"
                    class="selected-tag"
                    @click.stop="removeSolutionIdea(item.id)"
                  >
                    {{ item.name }}
                    <span class="remove-icon">×</span>
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>

              <div class="multi-select-dropdown" v-if="showSolutionIdeaDropdown">
                <div class="search-input-container">
                  <input
                    type="text"
                    v-model="solutionIdeaSearch"
                    placeholder="搜索解题思想..."
                    class="search-input"
                    @input="filterSolutionIdeas"
                  />
                </div>
                <div class="dropdown-options">
                  <div
                    v-for="item in filteredSolutionIdeas"
                    :key="item.id"
                    class="dropdown-option"
                    @click="toggleSolutionIdea(item)"
                  >
                    <span
                      class="checkbox"
                      :class="{ checked: isSolutionIdeaSelected(item.id) }"
                    >
                      {{ isSolutionIdeaSelected(item.id) ? "✓" : "" }}
                    </span>
                    <span class="option-text">{{ item.name }}</span>
                  </div>
                  <div v-if="filteredSolutionIdeas.length === 0" class="no-options">
                    无匹配选项
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 检索结果区域 -->
      <div v-if="questionList.length" class="search-results card">
        <div class="results-header">
          <div class="results-title">
            <h3 class="section-title">检索结果 (共 {{ totalItems }} 条)</h3>

            <!-- 批量操作工具栏 -->
            <div class="batch-actions" v-if="selectedQuestionIds.length > 0">
              <span class="batch-count"
                >已选择 {{ selectedQuestionIds.length }} 个题目</span
              >
              <button @click="batchAddToPaper" class="btn-primary">
                <span class="btn-icon">+</span>
                添加
              </button>
              <button @click="clearSelection" class="btn-secondary">
                <span class="btn-icon">×</span>
                清除
              </button>
            </div>
          </div>
        </div>

        <!-- 题目列表 -->
        <div class="questions-grid">
          <div
            v-for="q in questionList"
            :key="q.id"
            class="question-card"
            :class="{
              selected: isQuestionSelected(q.id),
              'batch-selected': isBatchSelected(q.id),
              disabled: isQuestionSelected(q.id),
            }"
            @click="!isQuestionSelected(q.id) && handleQuestionCardClick(q.id, $event)"
          >
            <div class="question-header">
              <div class="question-meta">
                <!-- 多选复选框 -->
                <label class="batch-select-checkbox" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isBatchSelected(q.id)"
                    @change="toggleBatchSelection(q.id)"
                  />
                  <span class="checkmark"></span>
                </label>

                <span class="question-id">ID: {{ q.id }}</span>
                <span class="question-type">{{
                  getQuestionCategoryName(q.question_category_id)
                }}</span>
                <div class="difficulty-stars">
                  <span
                    v-for="n in 5"
                    :key="n"
                    :class="['star', n <= q.difficulty_level ? 'active' : '']"
                  >
                    ⭐
                  </span>
                </div>
              </div>
              <div class="question-actions">
                <button
                  v-if="!isQuestionSelected(q.id)"
                  @click.stop="addToPaper(q)"
                  class="btn-primary btn-add"
                >
                  <span class="btn-icon">+</span>
                  添加
                </button>
                <button
                  v-else
                  @click.stop="removeFromPaper(q.id)"
                  class="btn-secondary btn-remove"
                >
                  <span class="btn-icon">−</span>
                  移除
                </button>
              </div>
            </div>

            <div class="question-content">
              <!-- 题目内容，支持展开/收起 -->
              <div
                class="question-text-container"
                :class="{ expanded: expandedQuestions[q.id] }"
              >
                <div class="question-text" v-html="renderMarkdown(q.title)"></div>
                <div
                  class="expand-overlay"
                  v-if="!expandedQuestions[q.id] && isContentOverflowing(q.id)"
                ></div>
              </div>

              <!-- 展开/收起按钮 -->
              <button
                v-if="isContentOverflowing(q.id)"
                @click.stop="toggleExpand(q.id)"
                class="expand-btn"
              >
                {{ expandedQuestions[q.id] ? "收起" : "展开" }}
                <span class="expand-icon">{{ expandedQuestions[q.id] ? "▲" : "▼" }}</span>
              </button>

              <!-- 题目图片 -->
              <div v-if="q.img_url" class="question-image">
                <img
                  :src="q.img_url"
                  alt="题目图片"
                  class="thumbnail-image"
                  @click.stop="previewImage(q.img_url)"
                />
                <div class="image-hint">点击图片查看大图</div>
              </div>

              <!-- 选择题选项 -->
              <div
                v-if="
                  q.question_category_id &&
                  (getQuestionCategoryName(q.question_category_id) === '单选题' ||
                    getQuestionCategoryName(q.question_category_id).includes('单选') ||
                    getQuestionCategoryName(q.question_category_id) === '多选题' ||
                    getQuestionCategoryName(q.question_category_id).includes('多选'))
                "
                class="question-options"
              >
                <div
                  v-for="(option, index) in getOptionsArray(q.options)"
                  :key="index"
                  class="option-item"
                  :class="{ correct: isOptionCorrect(q, index) }"
                >
                  <span class="option-label">{{ getOptionLabel(index) }}.</span>
                  <span class="option-text" v-html="renderMarkdown(option)"></span>
                </div>
              </div>

              <!-- 主观题答案 -->
              <div v-else-if="q.answer" class="question-answer">
                <div class="answer-label">参考答案：</div>
                <div class="answer-text" v-html="renderMarkdown(q.answer)"></div>
              </div>
            </div>

            <div class="question-footer">
              <div class="question-tags">
                <span class="tag">{{ getGradeName(q.grade_id) }}</span>
                <span class="tag">{{ getSubjectName(q.subject_id) }}</span>
                <span class="tag">{{ getKnowledgePointName(q.knowledge_point_id) }}</span>
                <span
                  v-for="subId in q.sub_knowledge_point_ids || []"
                  :key="subId"
                  class="tag sub-tag"
                >
                  {{ getKnowledgePointName(subId) }}
                </span>
                <span
                  v-for="ideaId in q.solution_idea_ids || []"
                  :key="ideaId"
                  class="tag idea-tag"
                >
                  {{ getSolutionIdeaName(ideaId) }}
                </span>
              </div>
            </div>

            <!-- 选择指示器 -->
            <div class="selection-indicator" v-if="isBatchSelected(q.id)">
              <span class="indicator-icon">✓</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="questionList.length" class="pagination-controls">
        <button
          @click="goToFirstPage"
          :disabled="searchCriteria.page_num <= 1"
          class="pagination-btn"
        >
          首页
        </button>

        <button
          @click="changePage(searchCriteria.page_num - 1)"
          :disabled="searchCriteria.page_num <= 1"
          class="pagination-btn"
        >
          上一页
        </button>

        <span class="pagination-info">
          第 {{ searchCriteria.page_num }} 页，共 {{ totalPages }} 页
        </span>

        <button
          @click="changePage(searchCriteria.page_num + 1)"
          :disabled="searchCriteria.page_num >= totalPages"
          class="pagination-btn"
        >
          下一页
        </button>

        <button
          @click="goToLastPage"
          :disabled="searchCriteria.page_num >= totalPages"
          class="pagination-btn"
        >
          末页
        </button>

        <input
          type="number"
          v-model.number="pageInput"
          min="1"
          :max="totalPages"
          placeholder="页码"
          @keyup.enter="goToPage"
          class="page-input"
        />
        <button @click="goToPage" class="pagination-btn">跳转</button>
      </div>

      <!-- 无结果提示 -->
      <div v-else-if="hasSearched" class="no-results card">
        <div class="no-results-content">
          <p>暂无相关题目</p>
          <p class="no-results-tip">请尝试调整搜索条件</p>
        </div>
      </div>
    </section>

    <!-- ==================== 试卷预览界面 ==================== -->
    <section v-if="showPaperPreview" class="paper-preview-section">
      <div class="paper-header card">
        <h2 class="section-title">试卷预览</h2>
        <div class="paper-actions">
          <!-- 题型分值批量设置 -->
          <button @click="showBatchScoreModal = true" class="btn-primary">
            批量设置分值
          </button>
          <button @click="exportPaper" class="btn-primary">导出试卷</button>
          <button @click="uploadPaper" class="btn-primary">上传试卷</button>
          <button @click="clearPaper" class="btn-secondary">清空试卷</button>
        </div>
      </div>

      <div v-if="selectedQuestions.length" class="paper-content">
        <!-- 试卷统计 -->
        <div class="paper-stats card">
          <h3 class="section-title">试卷统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">题目总数</span>
              <span class="stat-value">{{ selectedQuestions.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">试卷总分</span>
              <span class="stat-value">{{ totalScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">选择题</span>
              <span class="stat-value">{{ getQuestionTypeCount("选择题") }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">主观题</span>
              <span class="stat-value">{{ getQuestionTypeCount("主观题") }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均难度</span>
              <span class="stat-value">{{ getAverageDifficulty.toFixed(1) }}星</span>
            </div>
          </div>

          <!-- 题型分值分布（可视化） -->
          <div class="type-score-distribution">
            <h4 class="distribution-title">题型分值分布</h4>
            <div ref="typeScoreChartRef" class="type-score-chart"></div>
          </div>
        </div>

        <!-- 试卷题目列表 -->
        <div class="paper-questions card">
          <h3 class="section-title">试卷内容</h3>
          <div class="questions-list">
            <div
              v-for="(q, index) in selectedQuestions"
              :key="q.id"
              class="paper-question"
            >
              <!-- 左侧：只保留题号 -->
              <div class="question-left">
                <div class="question-number">{{ index + 1 }}.</div>
              </div>

              <!-- 右侧：题目内容 -->
              <div class="question-content">
                <!-- 题干 -->
                <div class="question-text" v-html="renderMarkdown(q.title)"></div>

                <!-- 分值区域（题目下方） -->
                <div class="score-area">
                  <label class="score-label">分值</label>
                  <input
                    type="number"
                    v-model.number="q.score"
                    @input="validateScore(q, $event)"
                    min="0"
                    max="100"
                    class="score-input"
                    :class="{ 'score-error': q.scoreError }"
                    @blur="formatScore(q)"
                  />
                  <span class="score-error-text" v-if="q.scoreError">
                    {{ q.scoreError }}
                  </span>
                </div>

                <!-- 题目图片 -->
                <div v-if="q.img_url" class="question-image">
                  <img
                    :src="q.img_url"
                    alt="题目图片"
                    class="thumbnail-image"
                    @click="previewImage(q.img_url)"
                  />
                  <div class="image-hint">点击图片查看大图</div>
                </div>

                <!-- 选择题选项 -->
                <div
                  v-if="
                    q.question_category_id &&
                    (getQuestionCategoryName(q.question_category_id) === '单选题' ||
                      getQuestionCategoryName(q.question_category_id).includes('单选') ||
                      getQuestionCategoryName(q.question_category_id) === '多选题' ||
                      getQuestionCategoryName(q.question_category_id).includes('多选'))
                  "
                  class="question-options"
                >
                  <div
                    v-for="(option, optIndex) in getOptionsArray(q.options)"
                    :key="optIndex"
                    class="option-item"
                  >
                    <span class="option-label">{{ getOptionLabel(optIndex) }}.</span>
                    <span class="option-text" v-html="renderMarkdown(option)"></span>
                  </div>
                </div>

                <!-- 答案（试卷预览时显示） -->
                <div v-if="q.answer" class="question-answer">
                  <div class="answer-label">参考答案：</div>
                  <div class="answer-text" v-html="renderMarkdown(q.answer)"></div>
                </div>

                <div class="question-actions">
                  <button
                    @click="moveQuestionUp(index)"
                    class="btn-secondary"
                    :disabled="index === 0"
                  >
                    <span class="btn-icon">↑</span>
                    上移
                  </button>
                  <button
                    @click="moveQuestionDown(index)"
                    class="btn-secondary"
                    :disabled="index === selectedQuestions.length - 1"
                  >
                    <span class="btn-icon">↓</span>
                    下移
                  </button>
                  <button @click="removeFromPaper(q.id)" class="btn-delete">
                    <span class="btn-icon">×</span>
                    移除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-paper card">
        <div class="empty-content">
          <p>试卷为空，请先添加题目</p>
          <button @click="showPaperPreview = false" class="btn-primary">
            去添加题目
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== 图片预览模态框 ==================== -->
    <div v-if="showImagePreview" class="modal-overlay" @click="closeImagePreview">
      <div class="image-preview-modal" @click.stop>
        <img :src="previewImageUrl" alt="预览" class="full-size-image" />
        <button @click="closeImagePreview" class="btn-close">关闭</button>
      </div>
    </div>

    <!-- ==================== 统一弹窗提示 ==================== -->
    <div v-if="showAlertModal" class="modal-overlay">
      <div class="alert-modal-content">
        <h3 class="alert-modal-title">{{ alertModalTitle }}</h3>
        <p class="alert-modal-message">{{ alertModalMessage }}</p>
      </div>
    </div>

    <!-- ==================== 试卷上传模态框 ==================== -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">上传试卷</h3>

        <div class="form-group">
          <label for="paperTitle" class="form-label">试卷标题</label>
          <input
            type="text"
            id="paperTitle"
            v-model="paperTitle"
            placeholder="请输入试卷标题"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label">年级</label>
          <select v-model="paperGradeId" class="form-select">
            <option :value="null">请选择年级</option>
            <option v-for="g in gradeList" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">学科</label>
          <select v-model="paperSubjectId" class="form-select">
            <option :value="null">请选择学科</option>
            <option v-for="s in subjectList" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>

        <!-- 试卷信息预览 -->
        <div class="preview-section">
          <h4 class="preview-title">试卷信息预览</h4>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">题目总数:</span>
              <span class="preview-value">{{ selectedQuestions.length }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">试卷总分:</span>
              <span class="preview-value">{{ totalScore }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">选择题:</span>
              <span class="preview-value">{{ getQuestionTypeCount("选择题") }}题</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">主观题:</span>
              <span class="preview-value">{{ getQuestionTypeCount("主观题") }}题</span>
            </div>

            <!-- 题型分值分布 -->
            <div class="score-distribution-preview">
              <h5 class="distribution-preview-title">题型分值分布</h5>
              <div class="distribution-preview-list">
                <div
                  v-for="(dist, index) in typeScoreDistribution"
                  :key="index"
                  class="distribution-preview-item"
                >
                  <div class="distribution-preview-header">
                    <span class="dist-type">{{ dist.type }}</span>
                    <span class="dist-info"
                      >{{ dist.count }}题 / {{ dist.totalScore }}分</span
                    >
                  </div>
                  <div class="distribution-preview-bar">
                    <div
                      class="distribution-preview-fill"
                      :style="{ width: dist.percentage + '%' }"
                    ></div>
                  </div>
                  <span class="dist-percentage">{{ dist.percentage }}%</span>
                </div>
              </div>
            </div>

            <!-- 各题分值详情 -->
            <div class="question-scores-preview">
              <h5 class="scores-preview-title">各题分值</h5>
              <div class="scores-preview-grid">
                <div
                  v-for="(q, index) in selectedQuestions"
                  :key="q.id"
                  class="score-preview-item"
                  :class="{ 'even-item': index % 2 === 0 }"
                >
                  <span class="score-question-number">第{{ index + 1 }}题</span>
                  <span class="score-question-type">{{
                    getQuestionCategoryName(q.question_category_id)
                  }}</span>
                  <span class="score-question-value">{{ q.score }}分</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="confirmUpload" class="btn-primary" :disabled="!canUpload">
            {{ isUploading ? "上传中..." : "确认上传" }}
          </button>
          <button @click="closeUploadModal" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- ==================== 批量设置分值模态框 ==================== -->
    <div v-if="showBatchScoreModal" class="modal-overlay" @click="closeBatchScoreModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">批量设置分值</h3>

        <div class="batch-score-form">
          <div class="batch-score-group">
            <label class="form-label">设置方式</label>
            <select v-model="batchScoreMode" class="form-select">
              <option value="single">单题分值</option>
              <option value="type">按题型设置</option>
              <option value="all">所有题目</option>
            </select>
          </div>

          <!-- 按题型设置 -->
          <div v-if="batchScoreMode === 'type'" class="type-score-settings">
            <div
              class="type-score-item"
              v-for="type in availableQuestionTypes"
              :key="type"
            >
              <span class="type-score-label">{{ type }}</span>
              <input
                type="number"
                v-model.number="typeScores[type]"
                placeholder="分值"
                class="type-score-input"
                min="0"
                max="100"
              />
              <span class="type-score-count">({{ getTypeCount(type) }}题)</span>
            </div>
          </div>

          <!-- 单题设置 -->
          <div v-if="batchScoreMode === 'single'" class="single-score-setting">
            <div class="form-group">
              <label class="form-label">题目编号</label>
              <input
                type="text"
                v-model="singleQuestionIndex"
                placeholder="如: 1,3-5,7"
                class="form-input"
              />
              <div class="input-hint">支持单个数字或范围，如: 1,3-5,7</div>
            </div>
            <div class="form-group">
              <label class="form-label">分值</label>
              <input
                type="number"
                v-model.number="singleQuestionScore"
                placeholder="分值"
                class="form-input"
                min="0"
                max="100"
              />
            </div>
          </div>

          <!-- 所有题目设置 -->
          <div v-if="batchScoreMode === 'all'" class="all-score-setting">
            <div class="form-group">
              <label class="form-label">所有题目分值</label>
              <input
                type="number"
                v-model.number="allQuestionsScore"
                placeholder="分值"
                class="form-input"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div class="batch-score-summary">
            <p>影响题目数量: {{ getAffectedQuestionCount }}题</p>
            <p v-if="batchScoreMode === 'type'">预计总分: {{ getTypeScoreTotal }}分</p>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="applyBatchScores" class="btn-primary">应用设置</button>
          <button @click="closeBatchScoreModal" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed, nextTick, watch } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { marked } from "marked";
import * as echarts from "echarts";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  setup() {
    const router = useRouter();

    // ==================== 状态管理 ====================
    const showPaperPreview = ref(false);
    const selectedQuestions = ref([]);
    const showUploadModal = ref(false);
    const showBatchScoreModal = ref(false);
    const paperTitle = ref("");
    const isUploading = ref(false);

    // 批量分值设置
    const batchScoreMode = ref("type"); // single, type, all
    const typeScores = reactive({});
    const singleQuestionIndex = ref("");
    const singleQuestionScore = ref(5);
    const allQuestionsScore = ref(5);

    // 数据列表状态
    const schoolList = ref([]);
    const gradeList = ref([]);
    const subjectList = ref([]);
    const knowledgePointList = ref([]);
    const solutionIdeaList = ref([]);
    const questionCategoryList = ref([]);

    // 检索条件
    const searchCriteria = reactive({
      grade_id: null,
      subject_id: null,
      question_category_ids: [],
      knowledge_point_ids: [],
      sub_knowledge_point_ids: [],
      solution_idea_ids: [],
      difficulty_level: null,
      title: "",
      page_num: 1,
      page_size: 12,
    });

    // 搜索结果
    const questionList = ref([]);
    const totalPages = ref(1);
    const totalItems = ref(0);
    const pageInput = ref(1);
    const hasSearched = ref(false);

    // 搜索关键词状态
    const knowledgeSearch = ref("");
    const subKnowledgeSearch = ref("");
    const solutionIdeaSearch = ref("");
    const questionCategorySearch = ref("");

    // 下拉框显示状态
    const showKnowledgeDropdown = ref(false);
    const showSubKnowledgeDropdown = ref(false);
    const showSolutionIdeaDropdown = ref(false);
    const showQuestionCategoryDropdown = ref(false);

    // 过滤后的列表状态
    const filteredKnowledgePoints = ref([]);
    const filteredSubKnowledgePoints = ref([]);
    const filteredSolutionIdeas = ref([]);
    const filteredQuestionCategories = ref([]);

    // 弹窗状态
    const showAlertModal = ref(false);
    const alertModalTitle = ref("");
    const alertModalMessage = ref("");
    const alertModalTimer = ref(null);
    const showImagePreview = ref(false);
    const previewImageUrl = ref("");

    // ==================== 多选和展开功能 ====================
    const selectedQuestionIds = ref([]);
    const expandedQuestions = ref({});
    const contentOverflowing = ref({});

    // ==================== 计算属性 ====================
    const selectedKnowledgePoints = computed(() => {
      return searchCriteria.knowledge_point_ids
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    const selectedSubKnowledgePoints = computed(() => {
      return searchCriteria.sub_knowledge_point_ids
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    const selectedSolutionIdeas = computed(() => {
      return searchCriteria.solution_idea_ids
        .map((id) => solutionIdeaList.value.find((s) => s.id === id))
        .filter(Boolean);
    });

    const selectedQuestionCategories = computed(() => {
      return searchCriteria.question_category_ids
        .map((id) => questionCategoryList.value.find((c) => c.id === id))
        .filter(Boolean);
    });

    const getAverageDifficulty = computed(() => {
      if (selectedQuestions.value.length === 0) return 0;
      const sum = selectedQuestions.value.reduce(
        (total, q) => total + (q.difficulty_level || 0),
        0
      );
      return sum / selectedQuestions.value.length;
    });

    // 试卷总分计算
    const totalScore = computed(() => {
      return selectedQuestions.value.reduce((sum, q) => {
        const score = Number(q.score) || 0;
        return sum + (isNaN(score) ? 0 : score);
      }, 0);
    });

    // 题型分值分布
    const typeScoreDistribution = computed(() => {
      const distribution = {};

      selectedQuestions.value.forEach((q) => {
        const type = getQuestionCategoryName(q.question_category_id);
        const score = Number(q.score) || 0;

        if (!distribution[type]) {
          distribution[type] = {
            type: type,
            count: 0,
            totalScore: 0,
          };
        }

        distribution[type].count++;
        distribution[type].totalScore += score;
      });

      // 转换为数组并计算百分比
      return Object.values(distribution)
        .map((dist) => ({
          ...dist,
          percentage:
            totalScore.value > 0
              ? Math.round((dist.totalScore / totalScore.value) * 100)
              : 0,
        }))
        .sort((a, b) => b.totalScore - a.totalScore);
    });

    // 可用的题型列表
    const availableQuestionTypes = computed(() => {
      const types = new Set();
      selectedQuestions.value.forEach((q) => {
        const type = getQuestionCategoryName(q.question_category_id);
        types.add(type);
      });
      return Array.from(types);
    });

    const canUpload = computed(() => {
      return (
        paperTitle.value.trim() &&
        paperSubjectId.value !== null &&
        paperGradeId.value !== null &&
        !isUploading.value
      );
    });

    // 批量设置相关的计算属性
    const getAffectedQuestionCount = computed(() => {
      if (batchScoreMode.value === "all") {
        return selectedQuestions.value.length;
      } else if (batchScoreMode.value === "type") {
        return selectedQuestions.value.length;
      } else if (batchScoreMode.value === "single") {
        if (!singleQuestionIndex.value.trim()) return 0;
        return getQuestionIndicesFromString(singleQuestionIndex.value).length;
      }
      return 0;
    });

    const getTypeScoreTotal = computed(() => {
      if (batchScoreMode.value !== "type") return 0;

      let total = 0;
      selectedQuestions.value.forEach((q) => {
        const type = getQuestionCategoryName(q.question_category_id);
        const score = typeScores[type] || 0;
        total += score;
      });
      return total;
    });

    //试卷学科&年级
    const paperSubjectId = ref(null);
    const paperGradeId = ref(null);

    // ==================== 方法 ====================
    // 根据字符串获取题目索引数组
    const getQuestionIndicesFromString = (str) => {
      if (!str.trim()) return [];

      const indices = new Set();
      const parts = str.split(",");

      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.includes("-")) {
          // 处理范围
          const [start, end] = trimmed.split("-").map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              indices.add(i - 1); // 转换为0-based索引
            }
          }
        } else {
          // 处理单个数字
          const num = Number(trimmed);
          if (!isNaN(num)) {
            indices.add(num - 1); // 转换为0-based索引
          }
        }
      });

      // 过滤有效的索引
      return Array.from(indices).filter(
        (index) => index >= 0 && index < selectedQuestions.value.length
      );
    };

    // 获取题型题目数量
    const getTypeCount = (type) => {
      return selectedQuestions.value.filter(
        (q) => getQuestionCategoryName(q.question_category_id) === type
      ).length;
    };

    // 应用批量分值设置
    const applyBatchScores = () => {
      if (batchScoreMode.value === "all") {
        selectedQuestions.value.forEach((q) => {
          q.score = allQuestionsScore.value;
          q.scoreError = "";
        });
      } else if (batchScoreMode.value === "type") {
        selectedQuestions.value.forEach((q) => {
          const type = getQuestionCategoryName(q.question_category_id);
          if (typeScores[type] !== undefined) {
            q.score = typeScores[type];
            q.scoreError = "";
          }
        });
      } else if (batchScoreMode.value === "single") {
        const indices = getQuestionIndicesFromString(singleQuestionIndex.value);
        indices.forEach((index) => {
          if (index >= 0 && index < selectedQuestions.value.length) {
            selectedQuestions.value[index].score = singleQuestionScore.value;
            selectedQuestions.value[index].scoreError = "";
          }
        });
      }

      showAlert("设置成功", "分值已更新");
      closeBatchScoreModal();
    };

    // 关闭批量设置模态框
    const closeBatchScoreModal = () => {
      showBatchScoreModal.value = false;
      // 重置设置
      batchScoreMode.value = "type";
      singleQuestionIndex.value = "";
      singleQuestionScore.value = 5;
      allQuestionsScore.value = 5;
    };

    // 验证分数输入
    const validateScore = (question, event) => {
      const value = event.target.value;
      const numValue = Number(value);

      if (value === "") {
        question.scoreError = "分数不能为空";
      } else if (isNaN(numValue)) {
        question.scoreError = "请输入有效的数字";
      } else if (numValue < 0) {
        question.scoreError = "分数不能为负数";
      } else if (numValue > 100) {
        question.scoreError = "单题分数不能超过100分";
      } else if (!Number.isInteger(numValue) && numValue % 0.5 !== 0) {
        question.scoreError = "分数应为整数或0.5的倍数";
      } else {
        question.scoreError = "";
      }
    };

    // 格式化分数
    const formatScore = (question) => {
      if (
        question.score === undefined ||
        question.score === null ||
        question.score === ""
      ) {
        question.score = 0;
      } else {
        const numValue = Number(question.score);
        // 保留一位小数
        question.score = Math.round(numValue * 2) / 2;
        if (question.score < 0) question.score = 0;
        if (question.score > 100) question.score = 100;
      }
      question.scoreError = "";
    };

    // ==================== Markdown 渲染函数 ====================
    const renderMarkdown = (text) => {
      if (!text) return "";

      const processedText = text
        .replace(/\$\$(.+?)\$\$/g, (match, formula) => {
          try {
            return katex.renderToString(formula, {
              displayMode: true,
              throwOnError: false,
            });
          } catch (error) {
            return match;
          }
        })
        .replace(/\$(.+?)\$/g, (match, formula) => {
          try {
            return katex.renderToString(formula, {
              displayMode: false,
              throwOnError: false,
            });
          } catch (error) {
            return match;
          }
        });

      return marked(processedText);
    };

    // ==================== 试卷上传相关方法 ====================
    const uploadPaper = () => {
      if (selectedQuestions.value.length === 0) {
        showAlert("上传失败", "试卷为空，无法上传");
        return;
      }

      // 检查是否有分数未设置
      const hasInvalidScores = selectedQuestions.value.some(
        (q) => q.score === undefined || q.score === null || q.score === "" || q.scoreError
      );

      if (hasInvalidScores) {
        showAlert("上传失败", "请先设置所有题目的分数");
        return;
      }

      showUploadModal.value = true;
    };

    const closeUploadModal = () => {
      showUploadModal.value = false;
      paperTitle.value = "";
    };

    const confirmUpload = async () => {
      if (!canUpload.value) return;

      isUploading.value = true;

      try {
        const question_ids = selectedQuestions.value.map((q) => q.id);
        const scores = selectedQuestions.value.map((q) => Number(q.score) || 0);

        const payload = {
          name: paperTitle.value.trim(),
          subject_id: paperSubjectId.value,
          grade_id: paperGradeId.value,
          question_count: selectedQuestions.value.length,
          total_score: totalScore.value,
          question_ids,
          scores,
        };

        await axios.post(`${API_BASE}/paper/uploadPaper`, payload);

        showAlert("上传成功", "试卷已成功创建");
        closeUploadModal();
      } catch (err) {
        console.error(err);
        showAlert("上传失败", err.response?.data?.message || "试卷上传失败");
      } finally {
        isUploading.value = false;
      }
    };

    // ==================== 其他方法 ====================
    const showAlert = (title, message) => {
      alertModalTitle.value = title;
      alertModalMessage.value = message;
      showAlertModal.value = true;

      if (alertModalTimer.value) {
        clearTimeout(alertModalTimer.value);
      }

      alertModalTimer.value = setTimeout(() => {
        showAlertModal.value = false;
      }, 1000);
    };

    const previewImage = (url) => {
      previewImageUrl.value = url;
      showImagePreview.value = true;
    };

    const closeImagePreview = () => {
      showImagePreview.value = false;
      previewImageUrl.value = "";
    };

    const getOptionLabel = (index) => {
      let label = "";
      let n = index;
      while (n >= 0) {
        label = String.fromCharCode((n % 26) + 65) + label;
        n = Math.floor(n / 26) - 1;
      }
      return label;
    };

    const getOptionsArray = (options) => {
      if (!options || typeof options !== "object") return [];
      return Object.values(options);
    };

    const isOptionCorrect = (question, index) => {
      const optionLabel = getOptionLabel(index);
      const questionCategoryName = getQuestionCategoryName(question.question_category_id);

      if (questionCategoryName === "单选题" || questionCategoryName.includes("单选")) {
        return question.answer === optionLabel;
      } else if (
        questionCategoryName === "多选题" ||
        questionCategoryName.includes("多选")
      ) {
        if (question.answer) {
          const answers = question.answer.split(",").map((a) => a.trim());
          return answers.includes(optionLabel);
        }
      }
      return false;
    };

    const isQuestionSelected = (questionId) => {
      return selectedQuestions.value.some((q) => q.id === questionId);
    };

    const addToPaper = (question) => {
      if (!isQuestionSelected(question.id)) {
        // 添加默认分数
        const questionWithScore = {
          ...question,
          score: 5, // 默认5分
          scoreError: "",
        };
        selectedQuestions.value.push(questionWithScore);
        showAlert("添加成功", "题目已添加到试卷");
      }
    };

    const removeFromPaper = (questionId) => {
      selectedQuestions.value = selectedQuestions.value.filter(
        (q) => q.id !== questionId
      );
    };

    const moveQuestionUp = (index) => {
      if (index <= 0) return;
      const temp = selectedQuestions.value[index];
      selectedQuestions.value[index] = selectedQuestions.value[index - 1];
      selectedQuestions.value[index - 1] = temp;
    };

    const moveQuestionDown = (index) => {
      if (index >= selectedQuestions.value.length - 1) return;
      const temp = selectedQuestions.value[index];
      selectedQuestions.value[index] = selectedQuestions.value[index + 1];
      selectedQuestions.value[index + 1] = temp;
    };

    const clearPaper = () => {
      selectedQuestions.value = [];
      showAlert("清空成功", "试卷已清空");
    };

    const exportPaper = () => {
      if (selectedQuestions.value.length === 0) {
        showAlert("导出失败", "试卷为空，无法导出");
        return;
      }
      showAlert("导出成功", "试卷导出功能待实现");
    };

    const getQuestionTypeCount = (type) => {
      if (type === "选择题") {
        return selectedQuestions.value.filter((q) => {
          const categoryName = getQuestionCategoryName(q.question_category_id);
          return (
            categoryName === "单选题" ||
            categoryName.includes("单选") ||
            categoryName === "多选题" ||
            categoryName.includes("多选")
          );
        }).length;
      } else if (type === "主观题") {
        return selectedQuestions.value.filter((q) => {
          const categoryName = getQuestionCategoryName(q.question_category_id);
          return !(
            categoryName === "单选题" ||
            categoryName.includes("单选") ||
            categoryName === "多选题" ||
            categoryName.includes("多选")
          );
        }).length;
      }
      return 0;
    };

    const isBatchSelected = (questionId) => {
      return selectedQuestionIds.value.includes(questionId);
    };

    const selectedQuestionMap = ref(new Map());

    const toggleBatchSelection = (questionId) => {
      const index = selectedQuestionIds.value.indexOf(questionId);

      if (index > -1) {
        // 取消选中
        selectedQuestionIds.value.splice(index, 1);
        selectedQuestionMap.value.delete(questionId);
      } else {
        selectedQuestionIds.value.push(questionId);

        // 把完整题目存起来
        const q = questionList.value.find((item) => item.id === questionId);
        if (q) {
          selectedQuestionMap.value.set(questionId, q);
        }
      }
    };

    const batchAddToPaper = () => {
      const questionsToAdd = Array.from(selectedQuestionMap.value.values()).filter(
        (q) => !isQuestionSelected(q.id)
      );

      if (questionsToAdd.length === 0) {
        showAlert("提示", "没有可以添加的新题目");
        return;
      }

      const questionsWithScores = questionsToAdd.map((q) => ({
        ...q,
        score: 5,
        scoreError: "",
      }));

      selectedQuestions.value.push(...questionsWithScores);

      showAlert("批量添加成功", `已添加 ${questionsToAdd.length} 个题目`);
      clearSelection();
    };

    const clearSelection = () => {
      selectedQuestionIds.value = [];
      selectedQuestionMap.value.clear();
    };

    const toggleExpand = (questionId) => {
      expandedQuestions.value[questionId] = !expandedQuestions.value[questionId];
    };

    const isContentOverflowing = (questionId) => {
      return contentOverflowing.value[questionId] || false;
    };

    const checkContentOverflow = () => {
      nextTick(() => {
        const questionElements = document.querySelectorAll(".question-text-container");
        questionElements.forEach((el) => {
          const questionId = el
            .closest(".question-card")
            .querySelector(".question-id")
            .textContent.split(": ")[1];
          contentOverflowing.value[questionId] = el.scrollHeight > el.clientHeight;
        });
      });
    };

    const handleQuestionCardClick = (questionId, event) => {
      const ignoreElements = [
        ".batch-select-checkbox",
        ".btn-add",
        ".btn-remove",
        ".expand-btn",
        ".thumbnail-image",
        ".question-actions button",
      ];

      const isIgnoredElement = ignoreElements.some((selector) =>
        event.target.closest(selector)
      );

      if (isIgnoredElement) {
        return;
      }

      toggleBatchSelection(questionId);
    };

    const clearSearchCriteria = () => {
      Object.assign(searchCriteria, {
        grade_id: null,
        subject_id: null,
        question_category_ids: [],
        knowledge_point_ids: [],
        sub_knowledge_point_ids: [],
        solution_idea_ids: [],
        difficulty_level: null,
        title: "",
        page_num: 1,
      });

      knowledgeSearch.value = "";
      subKnowledgeSearch.value = "";
      solutionIdeaSearch.value = "";
      questionCategorySearch.value = "";

      questionList.value = [];
      hasSearched.value = false;
      clearSelection();
    };

    const toggleQuestionCategoryDropdown = () => {
      showQuestionCategoryDropdown.value = !showQuestionCategoryDropdown.value;
      if (showQuestionCategoryDropdown.value) {
        filterQuestionCategories();
      }
    };

    const toggleKnowledgeDropdown = () => {
      showKnowledgeDropdown.value = !showKnowledgeDropdown.value;
      if (showKnowledgeDropdown.value) {
        filterKnowledgePoints();
      }
    };

    const toggleSubKnowledgeDropdown = () => {
      showSubKnowledgeDropdown.value = !showSubKnowledgeDropdown.value;
      if (showSubKnowledgeDropdown.value) {
        filterSubKnowledgePoints();
      }
    };

    const toggleSolutionIdeaDropdown = () => {
      showSolutionIdeaDropdown.value = !showSolutionIdeaDropdown.value;
      if (showSolutionIdeaDropdown.value) {
        filterSolutionIdeas();
      }
    };

    const toggleQuestionCategory = (item) => {
      const index = searchCriteria.question_category_ids.indexOf(item.id);
      if (index > -1) {
        searchCriteria.question_category_ids.splice(index, 1);
      } else {
        searchCriteria.question_category_ids.push(item.id);
      }
    };

    const toggleKnowledgePoint = (kp) => {
      const index = searchCriteria.knowledge_point_ids.indexOf(kp.id);
      if (index > -1) {
        searchCriteria.knowledge_point_ids.splice(index, 1);
      } else {
        searchCriteria.knowledge_point_ids.push(kp.id);
      }
    };

    const toggleSubKnowledgePoint = (kp) => {
      const index = searchCriteria.sub_knowledge_point_ids.indexOf(kp.id);
      if (index > -1) {
        searchCriteria.sub_knowledge_point_ids.splice(index, 1);
      } else {
        searchCriteria.sub_knowledge_point_ids.push(kp.id);
      }
    };

    const toggleSolutionIdea = (item) => {
      const index = searchCriteria.solution_idea_ids.indexOf(item.id);
      if (index > -1) {
        searchCriteria.solution_idea_ids.splice(index, 1);
      } else {
        searchCriteria.solution_idea_ids.push(item.id);
      }
    };

    const removeQuestionCategory = (id) => {
      searchCriteria.question_category_ids = searchCriteria.question_category_ids.filter(
        (itemId) => itemId !== id
      );
    };

    const removeKnowledgePoint = (id) => {
      searchCriteria.knowledge_point_ids = searchCriteria.knowledge_point_ids.filter(
        (kp) => kp !== id
      );
    };

    const removeSubKnowledgePoint = (id) => {
      searchCriteria.sub_knowledge_point_ids = searchCriteria.sub_knowledge_point_ids.filter(
        (kp) => kp !== id
      );
    };

    const removeSolutionIdea = (id) => {
      searchCriteria.solution_idea_ids = searchCriteria.solution_idea_ids.filter(
        (itemId) => itemId !== id
      );
    };

    const isKnowledgeSelected = (id) => {
      return searchCriteria.knowledge_point_ids.includes(id);
    };

    const isSubKnowledgeSelected = (id) => {
      return searchCriteria.sub_knowledge_point_ids.includes(id);
    };

    const isSolutionIdeaSelected = (id) => {
      return searchCriteria.solution_idea_ids.includes(id);
    };

    const isQuestionCategorySelected = (id) => {
      return searchCriteria.question_category_ids.includes(id);
    };

    const filterKnowledgePoints = () => {
      if (!knowledgeSearch.value) {
        filteredKnowledgePoints.value = knowledgePointList.value;
      } else {
        filteredKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
          kp.name.toLowerCase().includes(knowledgeSearch.value.toLowerCase())
        );
      }
    };

    const filterSubKnowledgePoints = () => {
      if (!subKnowledgeSearch.value) {
        filteredSubKnowledgePoints.value = knowledgePointList.value;
      } else {
        filteredSubKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
          kp.name.toLowerCase().includes(subKnowledgeSearch.value.toLowerCase())
        );
      }
    };

    const filterSolutionIdeas = () => {
      if (!solutionIdeaSearch.value) {
        filteredSolutionIdeas.value = solutionIdeaList.value;
      } else {
        filteredSolutionIdeas.value = solutionIdeaList.value.filter((item) =>
          item.name.toLowerCase().includes(solutionIdeaSearch.value.toLowerCase())
        );
      }
    };

    const filterQuestionCategories = () => {
      if (!questionCategorySearch.value) {
        filteredQuestionCategories.value = questionCategoryList.value;
      } else {
        filteredQuestionCategories.value = questionCategoryList.value.filter((item) =>
          item.name.toLowerCase().includes(questionCategorySearch.value.toLowerCase())
        );
      }
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest(".multi-select-wrapper")) {
        showKnowledgeDropdown.value = false;
        showSubKnowledgeDropdown.value = false;
        showSolutionIdeaDropdown.value = false;
        showQuestionCategoryDropdown.value = false;
      }
    };

    onMounted(() => {
      loadLists();

      document.addEventListener("click", handleClickOutside);
    });

    const loadLists = async () => {
      try {
        const [s, g, sub, kp, si, qc] = await Promise.all([
          axios.get(`${API_BASE}/questions/getSchoolList`),
          axios.get(`${API_BASE}/questions/getGradeList`),
          axios.get(`${API_BASE}/questions/getSubjectList`),
          axios.get(`${API_BASE}/questions/getKnowledgePointList`),
          axios.get(`${API_BASE}/questions/getSolutionIdeaList`),
          axios.get(`${API_BASE}/questions/getQuestionCategoryList`),
        ]);

        schoolList.value = Object.entries(s.data.data || {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }));

        gradeList.value = Object.entries(g.data.data || {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }));

        subjectList.value = Object.entries(sub.data.data || {}).map(([id, name]) => ({
          id: Number(id),
          name,
        }));

        knowledgePointList.value = Object.entries(
          kp.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));

        solutionIdeaList.value = Object.entries(si.data.data || {}).map(([id, name]) => ({
          id: parseInt(id),
          name,
        }));

        questionCategoryList.value = Object.entries(
          qc.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));

        filteredKnowledgePoints.value = knowledgePointList.value;
        filteredSubKnowledgePoints.value = knowledgePointList.value;
        filteredSolutionIdeas.value = solutionIdeaList.value;
        filteredQuestionCategories.value = questionCategoryList.value;
      } catch (err) {
        console.error("获取列表失败:", err);
        showAlert("加载失败", "获取列表失败");
      }
    };

    const findQuestions = async () => {
      try {
        searchCriteria.page_num = 1;
        pageInput.value = 1;
        const payload = { ...searchCriteria };

        if (searchCriteria.grade_id !== null)
          payload.grade_id = Number(searchCriteria.grade_id);
        if (searchCriteria.subject_id !== null)
          payload.subject_id = Number(searchCriteria.subject_id);
        if (searchCriteria.question_category_ids.length > 0)
          payload.question_category_ids = searchCriteria.question_category_ids.map((id) =>
            Number(id)
          );
        if (searchCriteria.knowledge_point_ids.length > 0)
          payload.knowledge_point_ids = searchCriteria.knowledge_point_ids.map((id) =>
            Number(id)
          );
        if (searchCriteria.sub_knowledge_point_ids.length > 0)
          payload.sub_knowledge_point_ids = searchCriteria.sub_knowledge_point_ids.map(
            (id) => Number(id)
          );
        if (searchCriteria.solution_idea_ids.length > 0)
          payload.solution_idea_ids = searchCriteria.solution_idea_ids.map((id) =>
            Number(id)
          );
        if (searchCriteria.difficulty_level !== null)
          payload.difficulty_level = Number(searchCriteria.difficulty_level);
        if (searchCriteria.title.trim()) payload.title = searchCriteria.title.trim();

        const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
        const responseData = res.data.data;

        questionList.value = responseData?.data_info || [];

        if (responseData) {
          searchCriteria.page_num = responseData.page_num || 1;
          searchCriteria.page_size = responseData.page_size || 12;
          totalPages.value = responseData.total_pages || 1;
          totalItems.value = responseData.total_items || 0;
          pageInput.value = responseData.page_num || 1;
        }

        hasSearched.value = true;

        setTimeout(checkContentOverflow, 100);

        if (!questionList.value.length) {
          showAlert("检索结果", "未找到符合条件的题目");
        } else {
          showAlert("检索成功", `找到 ${totalItems.value} 条题目`);
        }
      } catch (err) {
        console.error("检索失败:", err);
        showAlert("检索失败", "检索失败");
        questionList.value = [];
        hasSearched.value = true;
      }
    };

    const changePage = (newPage) => {
      if (newPage < 1 || newPage > totalPages.value) {
        return;
      }
      searchCriteria.page_num = newPage;
      pageInput.value = newPage;
      silentFindQuestions();
    };

    const goToFirstPage = () => {
      changePage(1);
    };

    const goToLastPage = () => {
      changePage(totalPages.value);
    };

    const goToPage = () => {
      const page = parseInt(pageInput.value);
      if (page >= 1 && page <= totalPages.value) {
        changePage(page);
      } else {
        showAlert("输入错误", `请输入 1 到 ${totalPages.value} 之间的页码`);
      }
    };

    const silentFindQuestions = async () => {
      try {
        const payload = { ...searchCriteria };

        if (searchCriteria.grade_id !== null)
          payload.grade_id = Number(searchCriteria.grade_id);
        if (searchCriteria.subject_id !== null)
          payload.subject_id = Number(searchCriteria.subject_id);
        if (searchCriteria.question_category_ids.length > 0)
          payload.question_category_ids = searchCriteria.question_category_ids.map((id) =>
            Number(id)
          );
        if (searchCriteria.knowledge_point_ids.length > 0)
          payload.knowledge_point_ids = searchCriteria.knowledge_point_ids.map((id) =>
            Number(id)
          );
        if (searchCriteria.solution_idea_ids.length > 0)
          payload.solution_idea_ids = searchCriteria.solution_idea_ids.map((id) =>
            Number(id)
          );
        if (searchCriteria.difficulty_level !== null)
          payload.difficulty_level = Number(searchCriteria.difficulty_level);
        if (searchCriteria.title.trim()) payload.title = searchCriteria.title.trim();

        const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
        const responseData = res.data.data;

        questionList.value = responseData?.data_info || [];

        if (responseData) {
          searchCriteria.page_num = responseData.page_num || 1;
          searchCriteria.page_size = responseData.page_size || 12;
          totalPages.value = responseData.total_pages || 1;
          totalItems.value = responseData.total_items || 0;
          pageInput.value = responseData.page_num || 1;
        }

        hasSearched.value = true;

        setTimeout(checkContentOverflow, 100);
      } catch (err) {
        console.error("检索失败:", err);
        questionList.value = [];
        hasSearched.value = true;
      }
    };

    const getSchoolName = (id) => {
      if (id === null) return "-";
      const school = schoolList.value.find((s) => s.id === Number(id));
      return school ? school.name : "-";
    };

    const getGradeName = (id) => {
      if (id === null) return "-";
      const grade = gradeList.value.find((g) => g.id === Number(id));
      return grade ? grade.name : "-";
    };

    const getSubjectName = (id) => {
      if (id === null) return "-";
      const subject = subjectList.value.find((s) => s.id === Number(id));
      return subject ? subject.name : "-";
    };

    const getKnowledgePointName = (id) => {
      if (id === null) return "-";
      const kp = knowledgePointList.value.find((k) => k.id === Number(id));
      return kp ? kp.name : "-";
    };

    const getSolutionIdeaName = (id) => {
      if (id === null) return "-";
      const item = solutionIdeaList.value.find((s) => s.id === Number(id));
      return item ? item.name : "-";
    };

    const getQuestionCategoryName = (id) => {
      if (id === null) return "-";
      const item = questionCategoryList.value.find((c) => c.id === Number(id));
      return item ? item.name : "-";
    };

    const goBack = () => {
      router.go(-1);
    };

    const typeScoreChartRef = ref(null);
    let typeScoreChart = null;

    //可视化图
    const renderTypeScoreChart = () => {
      if (!typeScoreChartRef.value) return;

      if (!typeScoreChart) {
        typeScoreChart = echarts.init(typeScoreChartRef.value);
      }

      typeScoreChart.setOption(
        {
          tooltip: {
            trigger: "item",
            formatter: "{b}<br/>分值：{c}分<br/>占比：{d}%",
          },
          series: [
            {
              type: "pie",
              radius: ["45%", "70%"],
              data: typeScoreDistribution.value.map((d) => ({
                name: d.type,
                value: d.totalScore,
              })),
            },
          ],
        },
        true
      );
    };

    watch(showPaperPreview, (val) => {
      if (val) {
        nextTick(() => {
          renderTypeScoreChart();
        });
      } else {
        //切走时销毁实例
        if (typeScoreChart) {
          typeScoreChart.dispose();
          typeScoreChart = null;
        }
      }
    });
    watch(
      () => typeScoreDistribution.value,
      () => {
        if (showPaperPreview.value) {
          nextTick(() => {
            renderTypeScoreChart();
          });
        }
      },
      { deep: true }
    );

    return {
      showPaperPreview,
      selectedQuestions,
      showUploadModal,
      showBatchScoreModal,
      paperTitle,
      isUploading,

      batchScoreMode,
      typeScores,
      singleQuestionIndex,
      singleQuestionScore,
      allQuestionsScore,

      schoolList,
      gradeList,
      subjectList,
      knowledgePointList,
      solutionIdeaList,
      questionCategoryList,

      searchCriteria,
      questionList,
      totalPages,
      totalItems,
      pageInput,
      hasSearched,

      knowledgeSearch,
      subKnowledgeSearch,
      solutionIdeaSearch,
      questionCategorySearch,

      filteredKnowledgePoints,
      filteredSubKnowledgePoints,
      filteredSolutionIdeas,
      filteredQuestionCategories,

      selectedKnowledgePoints,
      selectedSubKnowledgePoints,
      selectedSolutionIdeas,
      selectedQuestionCategories,

      selectedQuestionIds,
      expandedQuestions,
      contentOverflowing,

      showKnowledgeDropdown,
      showSubKnowledgeDropdown,
      showSolutionIdeaDropdown,
      showQuestionCategoryDropdown,

      getAverageDifficulty,
      totalScore,
      typeScoreDistribution,
      availableQuestionTypes,
      canUpload,
      getAffectedQuestionCount,
      getTypeScoreTotal,

      showAlert,
      previewImage,
      closeImagePreview,
      renderMarkdown,
      getOptionLabel,
      getOptionsArray,
      isOptionCorrect,
      isQuestionSelected,
      addToPaper,
      removeFromPaper,
      moveQuestionUp,
      moveQuestionDown,
      clearPaper,
      exportPaper,
      uploadPaper,
      closeUploadModal,
      confirmUpload,
      getQuestionTypeCount,
      clearSearchCriteria,

      toggleQuestionCategoryDropdown,
      toggleKnowledgeDropdown,
      toggleSubKnowledgeDropdown,
      toggleSolutionIdeaDropdown,
      toggleQuestionCategory,
      toggleKnowledgePoint,
      toggleSubKnowledgePoint,
      toggleSolutionIdea,
      removeQuestionCategory,
      removeKnowledgePoint,
      removeSubKnowledgePoint,
      removeSolutionIdea,
      isKnowledgeSelected,
      isSubKnowledgeSelected,
      isSolutionIdeaSelected,
      isQuestionCategorySelected,

      filterKnowledgePoints,
      filterSubKnowledgePoints,
      filterSolutionIdeas,
      filterQuestionCategories,
      loadLists,
      findQuestions,
      changePage,
      goToFirstPage,
      goToLastPage,
      goToPage,
      silentFindQuestions,
      getSchoolName,
      getGradeName,
      getSubjectName,
      getKnowledgePointName,
      getSolutionIdeaName,
      getQuestionCategoryName,

      isBatchSelected,
      toggleBatchSelection,
      batchAddToPaper,
      clearSelection,
      toggleExpand,
      isContentOverflowing,
      checkContentOverflow,
      handleQuestionCardClick,

      showAlertModal,
      alertModalTitle,
      alertModalMessage,
      showImagePreview,
      previewImageUrl,

      getTypeCount,
      applyBatchScores,
      closeBatchScoreModal,
      validateScore,
      formatScore,

      goBack,

      typeScoreChartRef,
      paperSubjectId, //试卷学科
      paperGradeId, //试卷年级
    };
  },
};
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
* {
  box-sizing: border-box;
}

.container {
  max-width: 2000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
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
  align-items: center;
}

.page-title {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 32px;
}

.back-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(5px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateX(-2px);
}

.back-icon {
  font-size: 16px;
  font-weight: bold;
}

/* 可视化图表 */
.type-score-chart {
  width: 100%;
  height: 300px;
}
/* ==================== Markdown内容样式 ==================== */
.question-text :deep(h1),
.question-text :deep(h2),
.question-text :deep(h3),
.question-text :deep(h4),
.question-text :deep(h5),
.question-text :deep(h6) {
  margin: 1em 0 0.5em 0;
  color: #303133;
  line-height: 1.25;
}

.question-text :deep(p) {
  margin: 0 0 1em 0;
  line-height: 1.6;
}

.question-text :deep(ul),
.question-text :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.question-text :deep(li) {
  margin: 0.25em 0;
}

.question-text :deep(code) {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.9em;
}

.question-text :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
  margin: 1em 0;
}

.question-text :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.question-text :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
}

.question-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.question-text :deep(th),
.question-text :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5em;
  text-align: left;
}

.question-text :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
}

.question-text :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.question-text :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.question-text :deep(a:hover) {
  text-decoration: underline;
}

.math-formula {
  font-style: italic;
  color: #409eff;
}

.math-formula-block {
  margin: 1em 0;
  text-align: center;
  padding: 1em;
  background-color: #f9fafb;
  border-radius: 6px;
}

.math-error {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 2px 4px;
  border-radius: 3px;
}

/* ==================== 模式选择器样式 ==================== */
.mode-selector {
  margin-bottom: 30px;
}

.mode-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s;
}

.mode-tab.active {
  background: #409eff;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.mode-tab:hover:not(.active) {
  background: #f5f7fa;
}

.question-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
}

.mode-tab:not(.active) .question-count {
  background: #e6e9f0;
  color: #606266;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6e9f0;
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

/* ==================== 试卷预览新增样式 ==================== */

/* 题型分值分布 */
.type-score-distribution {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

.distribution-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.distribution-type {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.distribution-count,
.distribution-score,
.distribution-percentage {
  margin-left: 12px;
  font-size: 14px;
  color: #606266;
}

.distribution-percentage {
  color: #409eff;
  font-weight: 500;
}

/* 题目左侧区域 */
.paper-question {
  display: flex;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
  gap: 15px;
}

.paper-question:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.question-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.question-number {
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
  text-align: center;
}

.score-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.score-area .score-label {
  font-size: 13px;
  color: #000000;
}

.score-area .score-input {
  width: 80px;
  text-align: center;
}

.score-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  transition: all 0.3s;
}

.score-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.score-input.score-error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.score-error-text {
  font-size: 12px;
  color: #f56c6c;
  text-align: center;
  max-width: 80px;
}

/* ==================== 上传模态框预览样式 ==================== */
.preview-section {
  margin: 20px 0;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e6e9f0;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e6e9f0;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.preview-value {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

/* 分值分布预览 */
.score-distribution-preview {
  margin-top: 16px;
  padding: 16px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e6e9f0;
}

.distribution-preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.distribution-preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.distribution-preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.distribution-preview-header {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 150px;
}

.dist-type {
  font-weight: 500;
  color: #303133;
}

.dist-info {
  font-size: 12px;
  color: #909399;
}

.distribution-preview-bar {
  flex: 2;
  height: 8px;
  background-color: #e6e9f0;
  border-radius: 4px;
  overflow: hidden;
}

.distribution-preview-fill {
  height: 100%;
  background-color: #409eff;
  border-radius: 4px;
  transition: width 0.3s;
}

.dist-percentage {
  width: 40px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
}

/* 各题分值预览 */
.question-scores-preview {
  margin-top: 16px;
}

.scores-preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.scores-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e6e9f0;
}

.score-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 4px;
  font-size: 13px;
}

.score-preview-item.even-item {
  background-color: #f0f9ff;
}

.score-question-number {
  color: #409eff;
  font-weight: 500;
}

.score-question-type {
  color: #606266;
  font-size: 12px;
}

.score-question-value {
  color: #303133;
  font-weight: 600;
}

/* ==================== 批量设置分值模态框样式 ==================== */
.batch-score-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.batch-score-group {
  margin-bottom: 10px;
}

.type-score-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.type-score-label {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.type-score-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.type-score-count {
  font-size: 12px;
  color: #909399;
  width: 60px;
  text-align: right;
}

.single-score-setting,
.all-score-setting {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.batch-score-summary {
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.batch-score-summary p {
  margin: 4px 0;
  color: #303133;
  font-size: 14px;
}

/* 搜索条件区域样式 */
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.criteria-item {
  display: flex;
  flex-direction: column;
}

.criteria-item.full-width {
  grid-column: 1 / -1;
}

.criteria-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 表单控件样式 */
.form-select,
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  background-color: white;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 多选下拉框样式 */
.multi-select-wrapper {
  position: relative;
  width: 100%;
}

.multi-select-trigger {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  min-height: 46px;
}

.multi-select-trigger:hover {
  border-color: #c0c4cc;
}

.multi-select-trigger:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.placeholder {
  color: #c0c4cc;
  font-size: 14px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.selected-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #d9ecff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-tag:hover {
  background: #d9ecff;
  transform: translateY(-1px);
}

.remove-icon {
  font-weight: bold;
  font-size: 14px;
  color: #f56c6c;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s;
}

.remove-icon:hover {
  background-color: rgba(245, 108, 108, 0.1);
}

.dropdown-arrow {
  color: #c0c4cc;
  font-size: 12px;
  transition: transform 0.3s;
}

.multi-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
  max-height: 250px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input-container {
  padding: 8px;
  border-bottom: 1px solid #e6e9f0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.dropdown-options {
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.dropdown-option:hover {
  background-color: #f5f7fa;
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.checkbox.checked {
  background-color: #409eff;
  border-color: #409eff;
}

.option-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.no-options {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* ==================== 按钮样式系统 ==================== */
.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #f4f4f5;
  color: #606266;
  border: 1px solid #d3d4d6;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e9e9eb;
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-delete {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
}

.btn-delete:hover {
  background-color: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.btn-icon {
  font-size: 16px;
}

/* ==================== 检索结果区域样式 ==================== */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.results-title {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* ==================== 批量操作工具栏样式 ==================== */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
}

.batch-count {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.batch-actions .btn-primary,
.batch-actions .btn-secondary {
  padding: 8px 16px;
  font-size: 13px;
}

/* ==================== 分页控件样式 ==================== */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  min-width: 60px;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f5f7fa;
  color: #c0c4cc;
}

.page-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  text-align: center;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
  margin: 0 10px;
}

/* ==================== 题目网格布局样式 ==================== */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 35px;
}

.question-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.question-card.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.question-card.batch-selected {
  border-color: #67c23a;
  background-color: #f0f9eb;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

/* ==================== 多选复选框样式 ==================== */
.batch-select-checkbox {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  margin-right: 8px;
}

.batch-select-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 18px;
  width: 18px;
  background-color: #fff;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.batch-select-checkbox:hover input ~ .checkmark {
  border-color: #409eff;
}

.batch-select-checkbox input:checked ~ .checkmark {
  background-color: #409eff;
  border-color: #409eff;
}

.checkmark:after {
  content: "";
  display: none;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

.batch-select-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.question-id {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.question-type {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.difficulty-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  opacity: 0.3;
}

.star.active {
  opacity: 1;
  color: #e6a23c;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.btn-add,
.btn-remove {
  padding: 6px 12px;
  font-size: 12px;
  white-space: nowrap;
}

/* ==================== 题目内容样式 ==================== */
.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-text-container {
  position: relative;
  max-height: 120px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-bottom: 10px;
}

.question-text-container.expanded {
  max-height: none;
}

.question-text {
  line-height: 1.6;
  color: #303133;
  margin-bottom: 15px;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 10px;
}

.expand-btn:hover {
  background-color: #ecf5ff;
}

.expand-icon {
  font-size: 12px;
}

.expand-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, white);
  pointer-events: none;
}

/* ==================== 图片显示优化 ==================== */
.question-image {
  margin: 10px 0;
  text-align: center;
  position: relative;
}

.thumbnail-image {
  max-width: 100%;
  max-height: 250px;
  width: auto;
  height: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.image-hint {
  color: #909399;
  margin-top: 5px;
  font-style: italic;
}

/* ==================== 选项样式 ==================== */
.question-options {
  margin-top: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 6px;
  background: #ffffff;
  transition: background 0.2s;
}

.option-item.correct {
  background: #f0f9ff;
  border-left: 3px solid #409eff;
}

.option-label {
  font-weight: 500;
  min-width: 30px;
  color: #409eff;
  margin-right: 8px;
}

.option-text {
  flex: 1;
  line-height: 1.5;
  color: #606266;
}

/* ==================== 答案样式 ==================== */
.question-answer {
  margin-top: 10px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.answer-label {
  font-weight: 500;
  color: #409eff;
  margin-bottom: 5px;
}

.answer-text {
  line-height: 1.5;
  color: #303133;
}

/* ==================== 题目底部样式 ==================== */
.question-footer {
  border-top: 1px solid #e4e7ed;
  padding-top: 15px;
  margin-top: auto;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f4f4f5;
  color: #909399;
}

.sub-tag {
  background: #ecf5ff;
  color: #409eff;
}

.idea-tag {
  background: #f0f9eb;
  color: #67c23a;
}

/* ==================== 选择指示器样式 ==================== */
.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background-color: #67c23a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.indicator-icon {
  line-height: 1;
}

/* ==================== 无结果提示样式 ==================== */
.no-results-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.no-results p {
  margin: 0;
  font-size: 16px;
}

.no-results-tip {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.7;
}

/* ==================== 试卷预览区域样式 ==================== */
.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.paper-actions {
  display: flex;
  gap: 12px;
}

/* ==================== 试卷统计样式 ==================== */
.paper-stats {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
  transition: all 0.3s;
}

.stat-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.stat-label {
  font-weight: 500;
  color: #606266;
}

.stat-value {
  font-weight: 600;
  color: #409eff;
  font-size: 18px;
}

/* ==================== 试卷题目样式 ==================== */
.paper-questions {
  margin-bottom: 30px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paper-question .question-content {
  flex: 1;
}

.paper-question .question-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.paper-question .question-actions button {
  padding: 6px 12px;
  font-size: 12px;
}

/* ==================== 空试卷提示样式 ==================== */
.empty-content {
  text-align: center;
  padding: 60px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

.empty-content p {
  margin: 0 0 20px;
  font-size: 16px;
}

/* ==================== 模态框样式 ==================== */
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-title {
  margin-bottom: 24px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  background-color: white;
  resize: vertical;
  min-height: 80px;
}

.form-textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.modal-actions button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

/* ==================== 图片预览模态框样式 ==================== */
.image-preview-modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

.full-size-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-close {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  min-width: 100px;
  transition: background-color 0.3s;
}

.btn-close:hover {
  background-color: #f78989;
}

/* ==================== 统一弹窗提示样式 ==================== */
.alert-modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: modalAppear 0.3s ease-out;
}

.alert-modal-title {
  margin-bottom: 20px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.alert-modal-message {
  margin-bottom: 0;
  color: #606266;
  font-size: 18px;
  line-height: 1.5;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .questions-grid {
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

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .page-title {
    font-size: 24px;
  }

  .mode-tabs {
    flex-direction: column;
  }

  .card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .criteria-grid {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-controls {
    width: 100%;
    justify-content: center;
  }

  .batch-actions {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .question-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .paper-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .paper-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .paper-question {
    flex-direction: column;
  }

  .question-left {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
  }

  .question-number {
    margin-bottom: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .modal-content,
  .alert-modal-content {
    padding: 30px 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .scores-preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
