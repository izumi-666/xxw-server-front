<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">试卷管理</h1>
      </div>
    </div>

    <!-- 顶部操作区 - 有创建权限时才显示 -->
    <div v-if="hasCreatePermission" class="action-bar card">
      <div class="action-buttons">
        <button class="btn-primary" @click="goManualCreate">手动组卷</button>
        <button class="btn-success" @click="goAutoCreate">自动组卷</button>
      </div>
    </div>

    <!-- 查询条件 -->
    <div class="search-bar card">
      <div class="card-header">
        <h2 class="section-title">筛选条件</h2>
        <div class="header-actions">
          <button class="btn-primary search-btn" @click="searchPaper">查询</button>
          <button class="btn-secondary" @click="resetSearch">重置</button>
        </div>
      </div>

      <div class="criteria-grid">
        <!-- 试卷名称 -->
        <div class="criteria-item">
          <label class="criteria-label">试卷名称</label>
          <input
            type="text"
            v-model="searchForm.name"
            placeholder="请输入试卷名称"
            class="form-input"
          />
        </div>

        <!-- 科目筛选 -->
        <div class="criteria-item">
          <label class="criteria-label">科目</label>
          <div class="multi-select-wrapper">
            <div class="multi-select-trigger" @click="toggleSubjectDropdown">
              <span class="placeholder" v-if="searchForm.subject_ids.length === 0">
                请选择科目
              </span>
              <span class="selected-tags" v-else>
                <span
                  v-for="subject in selectedSubjects"
                  :key="subject.id"
                  class="selected-tag"
                  @click.stop="removeSubject(subject.id)"
                >
                  {{ subject.name }}
                  <span class="remove-icon">×</span>
                </span>
              </span>
              <span class="dropdown-arrow">▼</span>
            </div>

            <div class="multi-select-dropdown" v-if="showSubjectDropdown">
              <div class="search-input-container">
                <input
                  type="text"
                  v-model="subjectSearch"
                  placeholder="搜索科目..."
                  class="search-input"
                  @input="filterSubjects"
                />
              </div>
              <div class="dropdown-options">
                <div
                  v-for="subject in filteredSubjects"
                  :key="subject.id"
                  class="dropdown-option"
                  @click="toggleSubject(subject)"
                >
                  <span
                    class="checkbox"
                    :class="{ checked: isSubjectSelected(subject.id) }"
                  >
                    {{ isSubjectSelected(subject.id) ? "✓" : "" }}
                  </span>
                  <span class="option-text">{{ subject.name }}</span>
                </div>
                <div v-if="filteredSubjects.length === 0" class="no-options">
                  无匹配选项
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年级筛选 -->
        <div class="criteria-item">
          <label class="criteria-label">年级</label>
          <div class="multi-select-wrapper">
            <div class="multi-select-trigger" @click="toggleGradeDropdown">
              <span class="placeholder" v-if="searchForm.grade_ids.length === 0">
                请选择年级
              </span>
              <span class="selected-tags" v-else>
                <span
                  v-for="grade in selectedGrades"
                  :key="grade.id"
                  class="selected-tag"
                  @click.stop="removeGrade(grade.id)"
                >
                  {{ grade.name }}
                  <span class="remove-icon">×</span>
                </span>
              </span>
              <span class="dropdown-arrow">▼</span>
            </div>

            <div class="multi-select-dropdown" v-if="showGradeDropdown">
              <div class="search-input-container">
                <input
                  type="text"
                  v-model="gradeSearch"
                  placeholder="搜索年级..."
                  class="search-input"
                  @input="filterGrades"
                />
              </div>
              <div class="dropdown-options">
                <div
                  v-for="grade in filteredGrades"
                  :key="grade.id"
                  class="dropdown-option"
                  @click="toggleGrade(grade)"
                >
                  <span class="checkbox" :class="{ checked: isGradeSelected(grade.id) }">
                    {{ isGradeSelected(grade.id) ? "✓" : "" }}
                  </span>
                  <span class="option-text">{{ grade.name }}</span>
                </div>
                <div v-if="filteredGrades.length === 0" class="no-options">
                  无匹配选项
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 试卷列表 - 有读权限时才显示 -->
    <div v-if="hasReadPermission">
      <div class="search-results card">
        <div class="results-header">
          <h2 class="section-title">试卷列表</h2>
          <div class="results-count" v-if="paperList.length">
            共 {{ paperList.length }} 份试卷
          </div>
        </div>

        <div v-if="paperList.length">
          <div class="papers-grid">
            <div v-for="paper in paperList" :key="paper.id" class="paper-card">
              <div class="paper-header">
                <div class="paper-title">{{ paper.name }}</div>
                <div class="paper-meta">
                  <span class="meta-item">
                    {{ getSubjectName(paper.subject_id) }}
                  </span>
                  <span class="meta-item">
                    {{ getGradeName(paper.grade_id) }}
                  </span>
                  <span class="meta-item">
                    共 {{ paper.question_count }} 题 / {{ paper.total_score }} 分
                  </span>
                </div>
              </div>

              <div class="paper-actions">
                <!-- 编辑按钮 - 需要更新权限 -->
                <button
                  v-if="hasUpdatePermission"
                  class="btn-secondary btn-sm"
                  @click="editPaper(paper)"
                >
                  编辑
                </button>

                <!-- 预览按钮 - 需要读权限 -->
                <button
                  v-if="hasReadPermission"
                  class="btn-info btn-sm"
                  @click="previewPaper(paper)"
                >
                  预览
                </button>

                <button
                  v-if="hasDownloadPermission"
                  class="btn-warning btn-sm"
                  @click="openDownloadPreview(paper)"
                >
                  下载
                </button>

                <!-- 删除按钮 - 需要删除权限 -->
                <button
                  v-if="hasDeletePermission"
                  class="btn-delete btn-sm"
                  @click="deletePaper(paper)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-results">
          <div class="no-results-content">
            <p>暂无试卷数据</p>
            <p class="no-results-tip">请创建新试卷或调整筛选条件</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================
          试卷编辑弹窗（集成试卷预览界面）
    ============================== -->
    <div v-if="editVisible" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content edit-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑试卷 - {{ currentPaper?.name }}</h3>
          <button @click="closeEditModal" class="btn-close">×</button>
        </div>

        <!-- 试卷编辑界面，集成试卷预览功能 -->
        <div class="paper-edit-container">
          <!-- 模式选择器 -->
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
                @click="openPreviewTab"
                class="mode-tab"
              >
                试卷预览
                <span class="question-count">{{ selectedQuestions.length }}</span>
              </button>
            </div>
          </div>

          <!-- 题目检索界面 -->
          <section v-if="!showPaperPreview" class="search-section">
            <!-- 检索条件区域 -->
            <div class="search-criteria card">
              <div class="card-header">
                <h4 class="section-title">检索题目</h4>
                <div class="header-actions">
                  <button @click="findQuestions" class="btn-primary search-btn">
                    检索
                  </button>
                  <button @click="clearSearchCriteria" class="btn-secondary">重置</button>
                </div>
              </div>

              <div class="criteria-grid">
                <!-- 年级筛选 -->
                <div class="criteria-item">
                  <label class="criteria-label">年级</label>
                  <select v-model="searchCriteria.grade_ids" class="form-select">
                    <option :value="null">全部</option>
                    <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                      {{ grade.name }}
                    </option>
                  </select>
                </div>

                <!-- 科目筛选 -->
                <div class="criteria-item">
                  <label class="criteria-label">科目</label>
                  <select v-model="searchCriteria.subject_ids" class="form-select">
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
              </div>
            </div>

            <!-- 检索结果区域 -->
            <div v-if="questionList.length" class="search-results card">
              <div class="results-header">
                <div class="results-title">
                  <h4 class="section-title">检索结果 (共 {{ totalItems }} 条)</h4>

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
                  @click="
                    !isQuestionSelected(q.id) && handleQuestionCardClick(q.id, $event)
                  "
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
                    <!-- 题目内容 -->
                    <div class="question-text" v-html="renderMarkdown(q.title)"></div>

                    <!-- 选择题选项 -->
                    <div
                      v-if="
                        q.question_category_id &&
                        (getQuestionCategoryName(q.question_category_id) === '单选题' ||
                          getQuestionCategoryName(q.question_category_id).includes(
                            '单选'
                          ) ||
                          getQuestionCategoryName(q.question_category_id) === '多选题' ||
                          getQuestionCategoryName(q.question_category_id).includes(
                            '多选'
                          ))
                      "
                      class="question-options"
                    >
                      <div
                        v-for="(option, index) in getOptionsArray(q.options)"
                        :key="index"
                        class="option-item"
                      >
                        <span class="option-label">{{ getOptionLabel(index) }}.</span>
                        <span class="option-text" v-html="renderMarkdown(option)"></span>
                      </div>
                    </div>
                  </div>

                  <div class="question-footer">
                    <div class="question-tags">
                      <span class="tag">{{ getGradeName(q.grade_ids) }}</span>
                      <span class="tag">{{ getSubjectName(q.subject_ids) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分页控件 -->
              <div class="pagination-controls">
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
              </div>
            </div>

            <!-- 无结果提示 -->
            <div v-else-if="hasSearched" class="no-results card">
              <div class="no-results-content">
                <p>暂无相关题目</p>
                <p class="no-results-tip">请尝试调整搜索条件</p>
              </div>
            </div>
          </section>

          <!-- 试卷预览界面 -->
          <section v-if="showPaperPreview" class="paper-preview-section">
            <div class="paper-header card">
              <h4 class="section-title">试卷预览</h4>
              <div class="paper-actions">
                <!-- 题型分值批量设置 -->
                <button @click="showBatchScoreModal = true" class="btn-primary">
                  批量设置分值
                </button>
                <button @click="clearPaper" class="btn-secondary">清空试卷</button>
              </div>
            </div>

            <div v-if="selectedQuestions.length" class="paper-content">
              <!-- 试卷统计 -->
              <div class="paper-stats card">
                <h4 class="section-title">试卷统计</h4>
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
                </div>
                <!-- 题型分值分布图 -->
                <div class="chart-container">
                  <div ref="typeScoreChartRef" class="chart"></div>
                </div>
              </div>

              <!-- 试卷题目列表 -->
              <div class="paper-questions card">
                <h4 class="section-title">试卷内容</h4>
                <div class="questions-list">
                  <div
                    v-for="(q, index) in selectedQuestions"
                    :key="q.id"
                    class="paper-question"
                  >
                    <!-- 左侧：题号 -->
                    <div class="question-left">
                      <div class="question-number">{{ index + 1 }}.</div>
                    </div>

                    <!-- 右侧：题目内容 -->
                    <div class="question-content">
                      <!-- 题干 -->
                      <div class="question-text" v-html="renderMarkdown(q.title)"></div>

                      <!-- 分值区域 -->
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

                      <!-- 选择题选项 -->
                      <div
                        v-if="
                          q.question_category_id &&
                          (getQuestionCategoryName(q.question_category_id) === '单选题' ||
                            getQuestionCategoryName(q.question_category_id).includes(
                              '单选'
                            ) ||
                            getQuestionCategoryName(q.question_category_id) ===
                              '多选题' ||
                            getQuestionCategoryName(q.question_category_id).includes(
                              '多选'
                            ))
                        "
                        class="question-options"
                      >
                        <div
                          v-for="(option, optIndex) in getOptionsArray(q.options)"
                          :key="optIndex"
                          class="option-item"
                        >
                          <span class="option-label"
                            >{{ getOptionLabel(optIndex) }}.</span
                          >
                          <span
                            class="option-text"
                            v-html="renderMarkdown(option)"
                          ></span>
                        </div>
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
        </div>

        <div class="modal-footer">
          <div class="edit-summary">
            <span>题目总数: {{ selectedQuestions.length }}</span>
            <span>试卷总分: {{ totalScore }}</span>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeEditModal">取消</button>
            <button class="btn-primary" @click="openConfirmModal">下一步</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量设置分值模态框 -->
    <div v-if="showBatchScoreModal" class="modal-overlay" @click="closeBatchScoreModal">
      <div class="modal-content batch-score-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">批量设置分值</h3>
          <button @click="closeBatchScoreModal" class="btn-close">×</button>
        </div>

        <div class="batch-score-form">
          <!-- 设置方式选择 -->
          <div class="form-group">
            <label class="form-label">设置方式</label>
            <div class="batch-mode-selector">
              <button
                v-for="mode in batchModes"
                :key="mode.value"
                :class="{ active: batchScoreMode === mode.value }"
                @click="batchScoreMode = mode.value"
                class="mode-btn"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <!-- 按题型设置 -->
          <div v-if="batchScoreMode === 'type'" class="type-score-settings">
            <div class="setting-title">
              <span class="title-text">按题型设置分值</span>
              <span class="title-hint">系统会自动应用对应题型的所有题目</span>
            </div>
            <div class="type-score-grid">
              <div
                class="type-score-item"
                v-for="type in availableQuestionTypes"
                :key="type"
              >
                <div class="type-score-header">
                  <span class="type-score-label">{{ type }}</span>
                  <span class="type-score-count">{{ getTypeCount(type) }}题</span>
                </div>
                <div class="type-score-input-wrapper">
                  <input
                    type="number"
                    v-model.number="typeScores[type]"
                    placeholder="请输入分值"
                    class="type-score-input"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span class="unit">分</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 单题设置 -->
          <div v-if="batchScoreMode === 'single'" class="single-score-setting">
            <div class="setting-title">
              <span class="title-text">指定题目设置分值</span>
              <span class="title-hint">支持单个数字或范围，例如：1,3-5,8</span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">题目编号</label>
                <input
                  type="text"
                  v-model="singleQuestionIndex"
                  placeholder="如：1,3-5,7"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label class="form-label">设置分值</label>
                <div class="score-input-wrapper">
                  <input
                    type="number"
                    v-model.number="singleQuestionScore"
                    placeholder="分值"
                    class="form-input"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span class="unit">分</span>
                </div>
              </div>
            </div>
            <div class="preview-indices" v-if="singleQuestionIndex">
              将应用于:
              {{
                getQuestionIndicesFromString(singleQuestionIndex)
                  .map((i) => i + 1)
                  .join(", ")
              }}
              题
            </div>
          </div>

          <!-- 所有题目设置 -->
          <div v-if="batchScoreMode === 'all'" class="all-score-setting">
            <div class="setting-title">
              <span class="title-text">统一设置所有题目分值</span>
              <span class="title-hint">将应用到试卷中的所有题目</span>
            </div>
            <div class="form-group">
              <label class="form-label">统一分值</label>
              <div class="score-input-wrapper">
                <input
                  type="number"
                  v-model.number="allQuestionsScore"
                  placeholder="请输入统一分值"
                  class="form-input"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <span class="unit">分</span>
              </div>
            </div>
          </div>

          <!-- 统计预览 -->
          <div class="score-preview card" v-if="batchScoreMode === 'type'">
            <div class="preview-header">
              <h4 class="preview-title">分值设置预览</h4>
              <span class="preview-total">总分: {{ calculatePreviewTotal() }} 分</span>
            </div>
            <div class="preview-grid">
              <div
                class="preview-item"
                v-for="type in availableQuestionTypes"
                :key="type"
              >
                <span class="preview-type">{{ type }}</span>
                <span class="preview-count">{{ getTypeCount(type) }}题</span>
                <span class="preview-score">{{ typeScores[type] || 0 }}分/题</span>
                <span class="preview-subtotal"
                  >{{ getTypeCount(type) * (typeScores[type] || 0) }}分</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button @click="closeBatchScoreModal" class="btn-secondary">取消</button>
            <button @click="applyBatchScores" class="btn-primary">应用设置</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认并保存试卷弹窗 -->
    <div v-if="confirmVisible" class="modal-overlay" @click="confirmVisible = false">
      <div class="modal-content confirm-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">确认并保存试卷</h3>
          <button @click="confirmVisible = false" class="btn-close">×</button>
        </div>

        <div class="confirm-content">
          <!-- 试卷基本信息表单 -->
          <div class="basic-info card">
            <h4 class="section-title">试卷基本信息</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">试卷名称</label>
                <input
                  v-model="confirmForm.name"
                  class="form-input"
                  placeholder="请输入试卷名称"
                  :class="{ 'input-error': !confirmForm.name }"
                />
                <div class="form-hint" v-if="!confirmForm.name">试卷名称不能为空</div>
              </div>

              <div class="form-group">
                <label class="form-label required">科目</label>
                <select
                  v-model="confirmForm.subject_id"
                  class="form-select"
                  :class="{ 'input-error': !confirmForm.subject_id }"
                >
                  <option value="" disabled>请选择科目</option>
                  <option v-for="s in subjectList" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
                <div class="form-hint" v-if="!confirmForm.subject_id">请选择科目</div>
              </div>

              <div class="form-group">
                <label class="form-label required">年级</label>
                <select
                  v-model="confirmForm.grade_id"
                  class="form-select"
                  :class="{ 'input-error': !confirmForm.grade_id }"
                >
                  <option value="" disabled>请选择年级</option>
                  <option v-for="g in gradeList" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
                <div class="form-hint" v-if="!confirmForm.grade_id">请选择年级</div>
              </div>
            </div>
          </div>

          <!-- 试卷统计信息 -->
          <div class="stats-summary card">
            <h4 class="section-title">试卷统计信息</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-content">
                  <div class="stat-value">{{ selectedQuestions.length }}</div>
                  <div class="stat-label">题目总数</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-content">
                  <div class="stat-value">{{ totalScore }}</div>
                  <div class="stat-label">试卷总分</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-content">
                  <div class="stat-value">{{ getQuestionTypeCount("选择题") }}</div>
                  <div class="stat-label">选择题</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-content">
                  <div class="stat-value">{{ getQuestionTypeCount("主观题") }}</div>
                  <div class="stat-label">主观题</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分值预览表格 -->
          <div class="score-preview-table card">
            <h4 class="section-title">题目分值详情</h4>
            <div class="table-container">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>题号</th>
                    <th>题型</th>
                    <th>分值</th>
                    <th>难度</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(q, index) in selectedQuestions.slice(
                      0,
                      selectedQuestions.length
                    )"
                    :key="q.id"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>{{ getQuestionCategoryName(q.question_category_id) }}</td>
                    <td class="score-cell">{{ q.score }} 分</td>
                    <td>
                      <span class="difficulty-stars">
                        <span
                          v-for="n in 5"
                          :key="n"
                          :class="['star', n <= q.difficulty_level ? 'active' : '']"
                        >
                          ⭐
                        </span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="confirm-summary">
            <div class="summary-item">
              <span class="summary-label">试卷名称:</span>
              <span class="summary-value">{{ confirmForm.name || "未填写" }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">科目:</span>
              <span class="summary-value">{{
                getSubjectName(confirmForm.subject_id)
              }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">年级:</span>
              <span class="summary-value">{{ getGradeName(confirmForm.grade_id) }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="confirmVisible = false">取消</button>
            <button
              class="btn-primary"
              @click="submitUpdate"
              :disabled="
                !confirmForm.name || !confirmForm.subject_id || !confirmForm.grade_id
              "
            >
              确认保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 试卷预览弹窗 -->
    <div
      v-if="previewVisible"
      class="modal-overlay preview-modal"
      @click="previewVisible = false"
    >
      <div class="modal-content preview-modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">预览试卷 - {{ previewPaperData?.name }}</h3>
          <button @click="previewVisible = false" class="btn-close">×</button>
        </div>

        <div class="preview-content">
          <!-- 试卷头部信息 -->
          <div class="paper-header-info card">
            <div class="paper-title-section">
              <h2 class="paper-title">{{ previewPaperData?.name }}</h2>
              <div class="paper-subtitle">
                {{ getSubjectName(previewPaperData?.subject_id) }} ·
                {{ getGradeName(previewPaperData?.grade_id) }}
              </div>
            </div>
            <div class="paper-meta-grid">
              <div class="meta-card">
                <div class="meta-content">
                  <div class="meta-value">{{ previewTotalItems }}</div>
                  <div class="meta-label">题目总数</div>
                </div>
              </div>
              <div class="meta-card">
                <div class="meta-content">
                  <div class="meta-value">{{ previewPaperData?.total_score || 0 }}</div>
                  <div class="meta-label">试卷总分</div>
                </div>
              </div>
              <div class="meta-card">
                <div class="meta-content">
                  <div class="meta-value">
                    {{ previewCurrentPage }}/{{ previewTotalPages }}
                  </div>
                  <div class="meta-label">当前页码</div>
                </div>
              </div>
              <div class="meta-card">
                <div class="meta-content">
                  <div class="meta-value">
                    {{ previewPaperData?.questions?.length || 0 }}
                  </div>
                  <div class="meta-label">本页题目</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isPreviewLoading" class="loading-state card">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <p>正在加载题目数据...</p>
            </div>
          </div>

          <!-- 试卷题目列表 -->
          <div
            v-else-if="
              previewPaperData &&
              Array.isArray(previewPaperData.questions) &&
              previewPaperData.questions.length > 0
            "
            class="questions-preview"
          >
            <div class="page-indicator" v-if="previewTotalPages > 1">
              <span class="current-page">第 {{ previewCurrentPage }} 页</span>
              <span class="total-pages">共 {{ previewTotalPages }} 页</span>
            </div>

            <div class="questions-container">
              <div
                v-for="question in previewPaperData.questions"
                :key="question.id"
                class="preview-question-item card"
              >
                <div class="question-header">
                  <div class="question-number-container">
                    <span class="question-number">{{ question.globalIndex }}.</span>
                    <span class="question-score">（{{ question.score || 0 }} 分）</span>
                  </div>
                  <div class="question-tags">
                    <span class="tag type-tag">{{
                      getQuestionCategoryName(question.question_category_id)
                    }}</span>
                    <span class="tag difficulty-tag">
                      <span class="difficulty-stars">
                        <span
                          v-for="n in 5"
                          :key="n"
                          :class="[
                            'star',
                            n <= question.difficulty_level ? 'active' : '',
                          ]"
                        >
                          ⭐
                        </span>
                      </span>
                    </span>
                  </div>
                </div>

                <!-- 题目内容 -->
                <div class="question-content">
                  <div
                    class="question-text"
                    v-html="renderMarkdown(question.title || '')"
                  ></div>

                  <!-- 选择题选项 -->
                  <div
                    v-if="question.options && Object.keys(question.options).length > 0"
                    class="question-options-preview"
                  >
                    <div
                      v-for="(optionValue, optionKey) in question.options"
                      :key="optionKey"
                      class="option-item-preview"
                    >
                      <span class="option-label"
                        >{{ optionKey.replace("option_", "") }}.</span
                      >
                      <span
                        class="option-content"
                        v-html="renderMarkdown(optionValue)"
                      ></span>
                    </div>
                  </div>

                  <!-- 题目图片 -->
                  <div
                    v-if="
                      question.img_url && question.img_url !== 'https://pathToImg.org'
                    "
                    class="question-image"
                  >
                    <img
                      :src="question.img_url"
                      alt="题目图片"
                      class="img-preview"
                      @error="handleImageError"
                    />
                  </div>

                  <!-- 答案（可选显示） -->
                  <div v-if="question.answer" class="question-answer">
                    <div class="answer-header">
                      <span class="answer-label">参考答案</span>
                    </div>
                    <div
                      class="answer-content"
                      v-html="renderMarkdown(question.answer)"
                    ></div>
                  </div>
                </div>

                <!-- 分隔线 -->
                <div class="question-divider"></div>
              </div>
            </div>

            <!-- 分页控件 -->
            <div v-if="previewTotalPages > 1" class="preview-pagination-controls card">
              <div class="pagination-info">
                <span class="current-page">第 {{ previewCurrentPage }} 页</span>
                <span class="separator">/</span>
                <span class="total-pages">共 {{ previewTotalPages }} 页</span>
                <span class="total-items">（共 {{ previewTotalItems }} 题）</span>
              </div>
              <div class="pagination-buttons">
                <button
                  @click="goToFirstPreviewPage"
                  :disabled="previewCurrentPage <= 1"
                  class="pagination-btn first"
                  title="第一页"
                >
                  <span class="btn-icon">首页</span>
                </button>
                <button
                  @click="changePreviewPage(previewCurrentPage - 1)"
                  :disabled="previewCurrentPage <= 1"
                  class="pagination-btn prev"
                  title="上一页"
                >
                  <span class="btn-icon">上一页</span>
                </button>

                <div class="page-input-container">
                  <input
                    type="number"
                    v-model.number="inputPage"
                    @keyup.enter="goToInputPage"
                    min="1"
                    :max="previewTotalPages"
                    class="page-input"
                    placeholder="页码"
                  />
                  <button @click="goToInputPage" class="btn-secondary jump-btn">
                    跳转
                  </button>
                </div>

                <button
                  @click="changePreviewPage(previewCurrentPage + 1)"
                  :disabled="previewCurrentPage >= previewTotalPages"
                  class="pagination-btn next"
                  title="下一页"
                >
                  <span class="btn-icon">下一页</span>
                </button>
                <button
                  @click="goToLastPreviewPage"
                  :disabled="previewCurrentPage >= previewTotalPages"
                  class="pagination-btn last"
                  title="最后一页"
                >
                  <span class="btn-icon">末页</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="!isPreviewLoading" class="no-questions card">
            <div class="empty-content">
              <h3>此试卷暂无题目</h3>
              <p>该试卷还没有添加任何题目内容</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-label">总题数:</span>
              <span class="stat-value">{{ previewTotalItems }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总分:</span>
              <span class="stat-value">{{ previewPaperData?.total_score || 0 }} 分</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">当前页:</span>
              <span class="stat-value"
                >{{ previewPaperData?.questions?.length || 0 }} 题</span
              >
            </div>
          </div>
          <div class="preview-actions">
            <button class="btn-secondary" @click="previewVisible = false">
              关闭预览
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="downloadVisible" class="modal-overlay">
    <div class="modal-content download-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">下载试卷</h3>
        <button class="btn-close" @click="downloadVisible = false">×</button>
      </div>

      <!-- PDF 内容区域 -->
      <div ref="pdfContentRef" class="pdf-content-wrapper">
        <div class="pdf-header">
          <div class="pdf-title-section">
            <h1 class="pdf-paper-title">{{ downloadPaperData.name }}</h1>
            <div class="pdf-subtitle">
              <span class="pdf-meta-item">{{
                getSubjectName(downloadPaperData.subject_id)
              }}</span>
              <span class="pdf-meta-divider">|</span>
              <span class="pdf-meta-item">{{
                getGradeName(downloadPaperData.grade_id)
              }}</span>
              <span class="pdf-meta-divider">|</span>
              <span class="pdf-meta-item"
                >总分：{{ downloadPaperData.total_score }} 分</span
              >
              <span class="pdf-meta-divider">|</span>
              <span class="pdf-meta-item">共 {{ downloadQuestions.length }} 题</span>
            </div>
          </div>
          <div class="pdf-header-divider"></div>
        </div>

        <div class="pdf-questions">
          <div
            v-for="(q, index) in downloadQuestions"
            :key="q.id"
            class="pdf-question-item"
          >
            <div class="pdf-question-header">
              <div class="pdf-question-number">{{ index + 1 }}.</div>
              <div class="pdf-question-meta">
                <span class="pdf-question-type">{{
                  getQuestionCategoryName(q.question_category_id)
                }}</span>
              </div>
            </div>

            <div class="pdf-question-content">
              <div class="pdf-question-text" v-html="renderMarkdown(q.title)"></div>

              <div
                v-if="q.options && Object.keys(q.options).length"
                class="pdf-question-options"
              >
                <div v-for="(opt, key) in q.options" :key="key" class="pdf-option-item">
                  <span class="pdf-option-label">{{ key.replace("option_", "") }}.</span>
                  <span class="pdf-option-text" v-html="renderMarkdown(opt)"></span>
                </div>
              </div>

              <!-- 图片 -->
              <div
                v-if="q.img_url && q.img_url !== 'https://pathToImg.org'"
                class="pdf-question-image"
              >
                <img
                  :src="q.img_url"
                  alt="题目图片"
                  class="pdf-img-preview"
                  @error="handleImageError"
                />
              </div>

              <!-- 答案区域（可选） -->
              <div v-if="q.answer && showAnswerInPdf" class="pdf-answer-area">
                <div class="pdf-answer-label">【答案】</div>
                <div class="pdf-answer-text" v-html="renderMarkdown(q.answer)"></div>
              </div>

              <!-- 解析区域（可选） -->
              <div v-if="q.notes && showAnalysisInPdf" class="pdf-analysis-area">
                <div class="pdf-analysis-label">【解析】</div>
                <div class="pdf-analysis-text" v-html="renderMarkdown(q.notes)"></div>
              </div>
            </div>

            <div class="pdf-question-divider"></div>
          </div>
        </div>

        <div class="pdf-footer">
          <div class="pdf-footer-info">
            <div class="pdf-footer-left">
              <div class="pdf-footer-stat">
                试卷总分：<span class="pdf-footer-value"
                  >{{ downloadPaperData.total_score }} 分</span
                >
              </div>
              <div class="pdf-footer-stat">
                题目总数：<span class="pdf-footer-value"
                  >{{ downloadQuestions.length }} 题</span
                >
              </div>
            </div>
            <div class="pdf-footer-right">
              <div class="pdf-footer-page">
                第 <span class="pdf-page-number">1</span> 页
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pdf-options-bar">
        <div class="pdf-options-left">
          <div class="pdf-option-group">
            <label class="pdf-option-label">
              <input
                type="checkbox"
                v-model="showAnswerInPdf"
                class="pdf-option-checkbox"
              />
              显示答案
            </label>
            <label class="pdf-option-label">
              <input
                type="checkbox"
                v-model="showAnalysisInPdf"
                class="pdf-option-checkbox"
              />
              显示解析
            </label>
          </div>
        </div>
        <div class="pdf-options-right">
          <div class="pdf-format-options"></div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="downloadVisible = false">取消</button>
        <button class="btn-primary" @click="downloadPdf">下载</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import { useRouter } from "vue-router";
import { marked } from "marked";
import * as echarts from "echarts";
import katex from "katex";
import "katex/dist/katex.min.css";
import html2pdf from "html2pdf.js";

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 权限相关 ==================== */
const getUserPermissions = () => {
  try {
    const permissionsStr = localStorage.getItem("userPermissions");
    return permissionsStr ? JSON.parse(permissionsStr) : [];
  } catch (error) {
    console.error("解析权限信息失败:", error);
    return [];
  }
};

const hasPermission = (permission) => {
  const userPermissions = getUserPermissions();
  return userPermissions.includes(permission) || userPermissions.includes("paper:*");
};

const hasReadPermission = computed(() => hasPermission("paper:read"));
const hasCreatePermission = computed(() => hasPermission("paper:create"));
const hasUpdatePermission = computed(() => hasPermission("paper:update"));
const hasDeletePermission = computed(() => hasPermission("paper:delete"));
const hasDownloadPermission = computed(() => hasPermission("paper:download"));

const hasAnyPaperPermission = computed(() => {
  const perms = [
    "paper:read",
    "paper:create",
    "paper:update",
    "paper:delete",
    "paper:download",
  ];
  return perms.some((perm) => hasPermission(perm));
});

/* ==================== 数据状态 ==================== */
const paperList = ref([]);
const subjectList = ref([]);
const gradeList = ref([]);
const previewVisible = ref(false);
const previewPaperData = ref(null);
const editVisible = ref(false);
const currentPaper = ref(null);
const isSaving = ref(false);

// 试卷编辑相关状态
const showPaperPreview = ref(true);
const selectedQuestions = ref([]);
const showBatchScoreModal = ref(false);
const allQuestionsForEdit = ref([]);
const fetchAllQuestionsByIds = async (ids) => {
  const pageSize = 10;
  let page = 1;
  let totalPages = 1;
  const result = [];

  do {
    const res = await axios.post(`${API_BASE}/questions/findQuestions`, {
      ids,
      page_num: page,
      page_size: pageSize,
    });

    const data = res.data.data;
    result.push(...(data.data_info || []));
    totalPages = data.total_pages || 1;
    page++;
  } while (page <= totalPages);

  return result;
};

// 批量分值设置
const batchScoreMode = ref("type");
const batchModes = [
  { value: "type", label: "按题型设置" },
  { value: "single", label: "指定题目" },
  { value: "all", label: "全部题目" },
];
const typeScores = reactive({});
const singleQuestionIndex = ref("");
const singleQuestionScore = ref(5);
const allQuestionsScore = ref(5);

// 题目检索相关状态
const searchCriteria = reactive({
  grade_ids: null,
  subject_ids: null,
  question_category_ids: [],
  knowledge_point_ids: [],
  sub_knowledge_point_ids: [],
  solution_idea_ids: [],
  difficulty_level: null,
  title: "",
  page_num: 1,
  page_size: 10,
});

const questionList = ref([]);
const totalPages = ref(1);
const totalItems = ref(0);
const hasSearched = ref(false);
const selectedQuestionIds = ref([]);
const selectedQuestionMap = ref(new Map());

// 多选下拉框相关
const subjectSearch = ref("");
const gradeSearch = ref("");
const showSubjectDropdown = ref(false);
const showGradeDropdown = ref(false);
const filteredSubjects = ref([]);
const filteredGrades = ref([]);

/* ==================== 搜索相关 ==================== */
const searchForm = ref({
  name: "",
  subject_ids: [],
  grade_ids: [],
});

const selectedSubjects = computed(() => {
  return searchForm.value.subject_ids
    .map((id) => subjectList.value.find((s) => s.id === id))
    .filter(Boolean);
});

const selectedGrades = computed(() => {
  return searchForm.value.grade_ids
    .map((id) => gradeList.value.find((g) => g.id === id))
    .filter(Boolean);
});

const toggleSubjectDropdown = () => {
  showSubjectDropdown.value = !showSubjectDropdown.value;
  if (showSubjectDropdown.value) {
    filterSubjects();
  }
};

const toggleGradeDropdown = () => {
  showGradeDropdown.value = !showGradeDropdown.value;
  if (showGradeDropdown.value) {
    filterGrades();
  }
};

const filterSubjects = () => {
  if (!subjectSearch.value) {
    filteredSubjects.value = subjectList.value;
  } else {
    filteredSubjects.value = subjectList.value.filter((subject) =>
      subject.name.toLowerCase().includes(subjectSearch.value.toLowerCase())
    );
  }
};

const filterGrades = () => {
  if (!gradeSearch.value) {
    filteredGrades.value = gradeList.value;
  } else {
    filteredGrades.value = gradeList.value.filter((grade) =>
      grade.name.toLowerCase().includes(gradeSearch.value.toLowerCase())
    );
  }
};

const toggleSubject = (subject) => {
  const index = searchForm.value.subject_ids.indexOf(subject.id);
  if (index > -1) {
    searchForm.value.subject_ids.splice(index, 1);
  } else {
    searchForm.value.subject_ids.push(subject.id);
  }
};

const toggleGrade = (grade) => {
  const index = searchForm.value.grade_ids.indexOf(grade.id);
  if (index > -1) {
    searchForm.value.grade_ids.splice(index, 1);
  } else {
    searchForm.value.grade_ids.push(grade.id);
  }
};

const removeSubject = (id) => {
  searchForm.value.subject_ids = searchForm.value.subject_ids.filter(
    (subjectId) => subjectId !== id
  );
};

const removeGrade = (id) => {
  searchForm.value.grade_ids = searchForm.value.grade_ids.filter(
    (gradeId) => gradeId !== id
  );
};

const isSubjectSelected = (id) => {
  return searchForm.value.subject_ids.includes(id);
};

const isGradeSelected = (id) => {
  return searchForm.value.grade_ids.includes(id);
};

const handleClickOutside = (event) => {
  if (!event.target.closest(".multi-select-wrapper")) {
    showSubjectDropdown.value = false;
    showGradeDropdown.value = false;
  }
};

// 预览分页相关状态
const previewCurrentPage = ref(1);
const previewPageSize = ref(10);
const previewTotalPages = ref(1);
const previewTotalItems = ref(0);
const isPreviewLoading = ref(false);
const inputPage = ref(1);

/* ==================== 计算属性 ==================== */
const totalScore = computed(() => {
  return selectedQuestions.value.reduce((sum, q) => {
    const score = Number(q.score) || 0;
    return sum + (isNaN(score) ? 0 : score);
  }, 0);
});

const availableQuestionTypes = computed(() => {
  const types = new Set();
  selectedQuestions.value.forEach((q) => {
    const type = getQuestionCategoryName(q.question_category_id);
    types.add(type);
  });
  return Array.from(types);
});

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

const getTypeCount = (type) => {
  return selectedQuestions.value.filter(
    (q) => getQuestionCategoryName(q.question_category_id) === type
  ).length;
};

/* ==================== 试卷编辑相关方法 ==================== */
const editPaper = async (paper) => {
  if (!hasUpdatePermission.value) {
    ElMessage.warning("您没有编辑试卷的权限");
    return;
  }

  try {
    currentPaper.value = paper;

    // 按后端要求传完整查询体
    const paperRes = await axios.post(`${API_BASE}/paper/findPaper`, {
      name: "",
      subject_ids: [],
      grade_ids: [],
    });

    const paperList = paperRes.data?.data || [];

    // 从列表中找到当前试卷
    const paperDetail = paperList.find((p) => p.id === paper.id);
    if (!paperDetail) {
      ElMessage.error("未找到试卷详情");
      return;
    }

    // 处理题目（question_ids + scores）
    if (paperDetail.question_ids?.length > 0) {
      const ids = paperDetail.question_ids;

      // 一次性拉取所有分页的题目
      const allQuestionList = await fetchAllQuestionsByIds(ids);

      // 建立 id -> 题目 映射
      const questionMap = new Map(allQuestionList.map((q) => [q.id, q]));
      allQuestionsForEdit.value = ids.map((id, index) => ({
        ...questionMap.get(id),
        score: paperDetail.scores[index],
        globalIndex: index + 1,
      }));

      selectedQuestions.value = ids.map((id, index) => {
        const q = questionMap.get(id);

        return q
          ? {
              ...q,
              score: paperDetail.scores[index],
              scoreError: "",
              globalIndex: index + 1,
            }
          : {
              id,
              title: `题目ID ${id}（未找到）`,
              score: paperDetail.scores[index],
              scoreError: "",
              options: {},
              globalIndex: index + 1,
            };
      });
    } else {
      selectedQuestions.value = [];
    }

    // ④ 设置当前试卷基础信息
    searchCriteria.subject_id = paperDetail.subject_id;
    searchCriteria.grade_id = paperDetail.grade_id;

    // ⑤ 打开编辑预览
    showPaperPreview.value = true;
    editVisible.value = true;
  } catch (error) {
    console.error("加载试卷失败:", error);
    ElMessage.error("加载试卷失败");
  }
};

const openPreviewTab = async () => {
  showPaperPreview.value = true;
  await nextTick();
  renderTypeScoreChart();
};
watch(showPaperPreview, async (val) => {
  if (val) {
    await nextTick();
    renderTypeScoreChart();
  }
});

const closeEditModal = () => {
  editVisible.value = false;
  currentPaper.value = null;
  selectedQuestions.value = [];
  clearSelection();
  resetSearchCriteria();
};

/* ==================== 题目检索相关方法 ==================== */
const findQuestions = async () => {
  try {
    const payload = {
      page_num: searchCriteria.page_num,
      page_size: searchCriteria.page_size || 10,
    };

    if (searchCriteria.grade_ids !== null)
      payload.grade_id = Number(searchCriteria.grade_ids);

    if (searchCriteria.subject_ids !== null)
      payload.subject_id = Number(searchCriteria.subject_ids);

    if (searchCriteria.question_category_ids.length > 0)
      payload.question_category_ids = searchCriteria.question_category_ids.map(Number);

    if (searchCriteria.knowledge_point_ids.length > 0)
      payload.knowledge_point_ids = searchCriteria.knowledge_point_ids.map(Number);

    if (searchCriteria.sub_knowledge_point_ids.length > 0)
      payload.sub_knowledge_point_ids = searchCriteria.sub_knowledge_point_ids.map(
        Number
      );

    if (searchCriteria.solution_idea_ids.length > 0)
      payload.solution_idea_ids = searchCriteria.solution_idea_ids.map(Number);

    if (searchCriteria.difficulty_level !== null)
      payload.difficulty_level = Number(searchCriteria.difficulty_level);

    if (searchCriteria.title.trim()) payload.title = searchCriteria.title.trim();

    const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);

    const responseData = res.data.data;

    questionList.value = responseData?.data_info || [];
    totalPages.value = responseData?.total_pages || 1;
    totalItems.value = responseData?.total_items || 0;

    hasSearched.value = true;
  } catch (err) {
    console.error("检索失败:", err);
    ElMessage.error("检索失败");
  }
};

const clearSearchCriteria = () => {
  Object.assign(searchCriteria, {
    grade_ids: null,
    subject_ids: null,
    question_category_ids: [],
    knowledge_point_ids: [],
    sub_knowledge_point_ids: [],
    solution_idea_ids: [],
    difficulty_level: null,
    title: "",
    page_num: 1,
  });

  questionList.value = [];
  hasSearched.value = false;
  clearSelection();
};

const resetSearchCriteria = () => {
  Object.assign(searchCriteria, {
    grade_ids: null,
    subject_ids: null,
    question_category_ids: [],
    knowledge_point_ids: [],
    sub_knowledge_point_ids: [],
    solution_idea_ids: [],
    difficulty_level: null,
    title: "",
    page_num: 1,
  });
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) {
    return;
  }
  searchCriteria.page_num = newPage;
  findQuestions();
};

const goToFirstPage = () => {
  changePage(1);
};

const goToLastPage = () => {
  changePage(totalPages.value);
};

/* ==================== 试卷操作相关方法 ==================== */
const isQuestionSelected = (questionId) => {
  return selectedQuestions.value.some((q) => q.id === questionId);
};

const addToPaper = (question) => {
  if (!isQuestionSelected(question.id)) {
    const questionWithScore = {
      ...question,
      score: 5,
      scoreError: "",
    };
    selectedQuestions.value.push(questionWithScore);
    ElMessage.success("题目已添加到试卷");
  }
};

const removeFromPaper = (questionId) => {
  selectedQuestions.value = selectedQuestions.value.filter((q) => q.id !== questionId);
  ElMessage.success("题目已移除");
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
  ElMessage.success("试卷已清空");
};

const isBatchSelected = (questionId) => {
  return selectedQuestionIds.value.includes(questionId);
};

const toggleBatchSelection = (questionId) => {
  const index = selectedQuestionIds.value.indexOf(questionId);

  if (index > -1) {
    selectedQuestionIds.value.splice(index, 1);
    selectedQuestionMap.value.delete(questionId);
  } else {
    selectedQuestionIds.value.push(questionId);
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
    ElMessage.info("没有可以添加的新题目");
    return;
  }

  const questionsWithScores = questionsToAdd.map((q) => ({
    ...q,
    score: 5,
    scoreError: "",
  }));

  selectedQuestions.value.push(...questionsWithScores);
  ElMessage.success(`已添加 ${questionsToAdd.length} 个题目`);
  clearSelection();
};

const clearSelection = () => {
  selectedQuestionIds.value = [];
  selectedQuestionMap.value.clear();
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

/* ==================== 批量分值设置方法 ==================== */
const getQuestionIndicesFromString = (str) => {
  if (!str.trim()) return [];

  const indices = new Set();
  const parts = str.split(",");

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        indices.add(num - 1);
      }
    }
  });

  return Array.from(indices).filter(
    (index) => index >= 0 && index < selectedQuestions.value.length
  );
};

const calculatePreviewTotal = () => {
  if (batchScoreMode.value === "all") {
    return selectedQuestions.value.length * allQuestionsScore.value;
  } else if (batchScoreMode.value === "type") {
    let total = 0;
    availableQuestionTypes.value.forEach((type) => {
      total += getTypeCount(type) * (typeScores[type] || 0);
    });
    return total;
  }
  return 0;
};

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
    if (indices.length === 0) {
      ElMessage.warning("请输入有效的题目编号");
      return;
    }
    indices.forEach((index) => {
      if (index >= 0 && index < selectedQuestions.value.length) {
        selectedQuestions.value[index].score = singleQuestionScore.value;
        selectedQuestions.value[index].scoreError = "";
      }
    });
  }

  ElMessage.success("分值已更新");
  closeBatchScoreModal();
};

const closeBatchScoreModal = () => {
  showBatchScoreModal.value = false;
  batchScoreMode.value = "type";
  singleQuestionIndex.value = "";
  singleQuestionScore.value = 5;
  allQuestionsScore.value = 5;
};

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

const formatScore = (question) => {
  if (question.score === undefined || question.score === null || question.score === "") {
    question.score = 0;
  } else {
    const numValue = Number(question.score);
    question.score = Math.round(numValue * 2) / 2;
    if (question.score < 0) question.score = 0;
    if (question.score > 100) question.score = 100;
  }
  question.scoreError = "";
};

/* ==================== 工具函数 ==================== */
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

const questionCategoryMap = ref({});

const loadQuestionCategoryList = async () => {
  const res = await axios.get(`${API_BASE}/questions/getQuestionCategoryList`);
  questionCategoryMap.value = res.data.data || {};
};

const getQuestionCategoryName = (id) => {
  if (id == null) return "未分类";
  const key = String(id);
  return questionCategoryMap.value[key] || `未定义题型(${id})`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ==================== 试卷管理相关方法 ==================== */
const loadPapers = async () => {
  try {
    const res = await axios.get(`${API_BASE}/paper/getPaperList`);
    paperList.value = res.data.data || [];
  } catch (error) {
    console.error("加载试卷列表失败:", error);
  }
};

const loadSubjectList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getSubjectList`);
    subjectList.value = Object.entries(res.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
    filteredSubjects.value = subjectList.value;
  } catch (error) {
    console.error("加载科目列表失败:", error);
  }
};

const loadGradeList = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions/getGradeList`);
    gradeList.value = Object.entries(res.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
    filteredGrades.value = gradeList.value;
  } catch (error) {
    console.error("加载年级列表失败:", error);
  }
};

const searchPaper = async () => {
  if (!hasReadPermission.value) return;

  try {
    const res = await axios.post(`${API_BASE}/paper/findPaper`, searchForm.value);
    paperList.value = res.data.data || [];
  } catch (error) {
    console.error("搜索试卷失败:", error);
    ElMessage.error("搜索试卷失败");
  }
};

const resetSearch = () => {
  searchForm.value = {
    name: "",
    subject_idss: [],
    grade_idss: [],
  };
  loadPapers();
};

const goManualCreate = () => {
  if (!hasCreatePermission.value) {
    ElMessage.warning("您没有创建试卷的权限");
    return;
  }
  router.push("/teacher/paper/assemblequestion");
};

const goAutoCreate = () => {
  if (!hasCreatePermission.value) {
    ElMessage.warning("您没有创建试卷的权限");
    return;
  }
  // router.push("/teacher/paper/autoassemblequestion");
  ElMessage.info("自动组卷功能开发中...");
};

const previewPaper = async (paper) => {
  if (!hasReadPermission.value) {
    ElMessage.warning("您没有预览试卷的权限");
    return;
  }

  try {
    // 重置分页状态
    previewCurrentPage.value = 1;
    previewPageSize.value = 10;
    inputPage.value = 1;
    isPreviewLoading.value = true;

    // 设置基本信息
    previewPaperData.value = {
      ...paper,
      question_ids: Array.isArray(paper.question_ids) ? paper.question_ids : [],
      subject: getSubjectName(paper.subject_id),
      grade: getGradeName(paper.grade_id),
      questions: [],
    };

    // 设置预览弹窗可见
    previewVisible.value = true;

    // 加载第一页题目
    await loadPreviewQuestions(1);
  } catch (error) {
    console.error("预览试卷失败:", error);
    ElMessage.error("预览试卷失败");
    isPreviewLoading.value = false;
  }
};

const loadPreviewQuestions = async (page) => {
  if (!previewPaperData.value?.question_ids?.length) return;

  try {
    isPreviewLoading.value = true;

    const res = await axios.post(`${API_BASE}/questions/findQuestions`, {
      ids: previewPaperData.value.question_ids,
      page_num: page,
      page_size: 10,
    });

    const data = res.data.data;
    const list = data.data_info || [];

    const pageIds = previewPaperData.value.question_ids.slice(
      (page - 1) * previewPageSize.value,
      page * previewPageSize.value
    );

    // 建立 id -> 题目 映射
    const map = new Map(list.map((q) => [q.id, q]));

    // pageIds 强制重排（保持 ids[] 顺序）
    const orderedList = pageIds.map((id) => map.get(id)).filter(Boolean);

    // 再赋值到页面（globalIndex 连续）
    previewPaperData.value.questions = orderedList.map((q, index) => ({
      ...q,
      score: q.score ?? 0,
      globalIndex: (page - 1) * previewPageSize.value + index + 1,
    }));

    previewTotalItems.value = data.total_items || 0;
    previewTotalPages.value = data.total_pages || 1;
    previewCurrentPage.value = page;
    inputPage.value = page;

    await nextTick();

    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  } finally {
    isPreviewLoading.value = false;
  }
};

const changePreviewPage = (page) => {
  if (page < 1 || page > previewTotalPages.value) return;
  previewCurrentPage.value = page;
  loadPreviewQuestions(page);
};

const goToFirstPreviewPage = () => {
  changePreviewPage(1);
};

const goToLastPreviewPage = () => {
  changePreviewPage(previewTotalPages.value);
};

const goToInputPage = () => {
  if (inputPage.value < 1) inputPage.value = 1;
  if (inputPage.value > previewTotalPages.value)
    inputPage.value = previewTotalPages.value;
  changePreviewPage(inputPage.value);
};

//计算属性
const typeScoreDistribution = computed(() => {
  const map = {};

  selectedQuestions.value.forEach((q) => {
    const type = getQuestionCategoryName(q.question_category_id);
    map[type] = (map[type] || 0) + (Number(q.score) || 0);
  });

  return Object.entries(map).map(([type, score]) => ({
    type,
    score,
  }));
});

const typeScoreChartRef = ref(null);
let typeScoreChart = null;

watch(
  typeScoreDistribution,
  async () => {
    await nextTick();
    renderTypeScoreChart();
  },
  { immediate: true }
);

const renderTypeScoreChart = () => {
  if (!typeScoreChartRef.value) return;

  if (typeScoreChart) {
    typeScoreChart.dispose();
    typeScoreChart = null;
  }

  typeScoreChart = echarts.init(typeScoreChartRef.value);

  typeScoreChart.setOption(
    {
      tooltip: {
        trigger: "item",
        formatter: "{b}<br/>分值：{c} 分",
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          data: typeScoreDistribution.value.map((d) => ({
            name: d.type,
            value: d.score,
          })),
        },
      ],
    },
    true
  );
};

const confirmVisible = ref(false);

const confirmForm = reactive({
  name: "",
  subject_id: null,
  grade_id: null,
});

const openConfirmModal = () => {
  confirmForm.name = currentPaper.value.name;
  confirmForm.subject_id = currentPaper.value.subject_id;
  confirmForm.grade_id = currentPaper.value.grade_id;
  confirmVisible.value = true;
};

const submitUpdate = async () => {
  if (!confirmForm.name || !confirmForm.subject_id || !confirmForm.grade_id) {
    ElMessage.warning("请填写完整的试卷信息");
    return;
  }

  const payload = {
    id: currentPaper.value.id,
    name: confirmForm.name,
    subject_id: confirmForm.subject_id,
    grade_id: confirmForm.grade_id,
    question_count: selectedQuestions.value.length,
    total_score: totalScore.value,
    question_ids: selectedQuestions.value.map((q) => q.id),
    scores: selectedQuestions.value.map((q) => q.score),
  };

  try {
    await axios.post(`${API_BASE}/paper/updatePaper`, payload);
    ElMessage.success("试卷保存成功");
    confirmVisible.value = false;
    editVisible.value = false;
    loadPapers();
  } catch (error) {
    console.error("保存试卷失败:", error);
    ElMessage.error("保存失败");
  }
};

// 下载
const downloadVisible = ref(false);
const downloadPaperData = ref(null);
const downloadQuestions = ref([]);
const showAnswerInPdf = ref(false);
const showAnalysisInPdf = ref(false);
const openDownloadPreview = async (paper) => {
  if (!hasDownloadPermission.value) {
    ElMessage.warning("您没有下载权限");
    return;
  }

  try {
    // 找到完整试卷详情
    const res = await axios.post(`${API_BASE}/paper/findPaper`, {
      name: "",
      subject_ids: [],
      grade_ids: [],
    });

    const paperDetail = res.data.data.find((p) => p.id === paper.id);
    if (!paperDetail) {
      ElMessage.error("试卷不存在");
      return;
    }

    // 拉取全部题目
    const allQuestions = await fetchAllQuestionsByIds(paperDetail.question_ids);

    // 按试卷顺序重排
    const map = new Map(allQuestions.map((q) => [q.id, q]));

    downloadQuestions.value = paperDetail.question_ids.map((id, index) => ({
      ...map.get(id),
      globalIndex: index + 1,
    }));

    downloadPaperData.value = paperDetail;
    downloadVisible.value = true;
    showAnswerInPdf.value = false;
    showAnalysisInPdf.value = false;
  } catch (e) {
    console.error(e);
    ElMessage.error("加载下载预览失败");
  }
};

const pdfContentRef = ref(null);

const downloadPdf = async () => {
  await nextTick()

  const element = pdfContentRef.value

  // 临时解除高度/滚动
  const oldStyle = {
    maxHeight: element.style.maxHeight,
    overflow: element.style.overflow,
    height: element.style.height
  }

  element.style.maxHeight = "none"
  element.style.height = "auto"
  element.style.overflow = "visible"

  await nextTick()

  await html2pdf()
      .set({
    margin: [15, 15, 15, 15],
    filename: `${downloadPaperData.value.name}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ["css", "legacy"],
      avoid: [
        ".pdf-question-item",
        ".pdf-question-content",
        ".pdf-question-options",
        ".pdf-question-image",
      ],
    },
  })
  .from(pdfContentRef.value)
  .save();
  downloadVisible.value = false;

  // 还原样式
  Object.assign(element.style, oldStyle)
}

const deletePaper = (paper) => {
  if (!hasDeletePermission.value) {
    ElMessage.warning("您没有删除试卷的权限");
    return;
  }

  ElMessageBox.confirm(`确定要删除试卷《${paper.name}》吗？删除后无法恢复！`, "警告", {
    type: "warning",
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      try {
        await axios.delete(`${API_BASE}/paper/deletePaper/${paper.id}`);
        paperList.value = paperList.value.filter((p) => p.id !== paper.id);
        ElMessage.success("删除成功！");
      } catch (error) {
        console.error("删除试卷失败:", error);
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {});
};

const handleImageError = (event) => {
  event.target.style.display = "none";
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  loadPapers();
  loadSubjectList();
  loadGradeList();
  document.addEventListener("click", handleClickOutside);
  loadQuestionCategoryList();
});
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

/* ==================== 操作栏样式 ==================== */
.action-bar {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* ==================== 搜索栏样式 ==================== */
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.criteria-item {
  display: flex;
  flex-direction: column;
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

/* ==================== 表单控件样式 ==================== */
.form-group {
  padding: 12px 16px;
}
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

.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  background-color: white;
}

.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* ==================== 多选下拉框样式 ==================== */
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

.btn-success {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}

.btn-success:hover:not(:disabled) {
  background-color: #85ce61;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.btn-info {
  background-color: #909399;
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
}

.btn-info:hover:not(:disabled) {
  background-color: #a6a9ad;
  transform: translateY(-1px);
}

.btn-warning {
  background-color: #e6a23c;
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
  box-shadow: 0 2px 4px rgba(230, 162, 60, 0.2);
}

.btn-warning:hover:not(:disabled) {
  background-color: #ebb563;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(230, 162, 60, 0.3);
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

.btn-sm {
  padding: 6px 20px;
  font-size: 14px;
}

.btn-icon {
  font-size: 16px;
}

/* ==================== 试卷列表样式 ==================== */
.search-results {
  margin-bottom: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-count {
  font-size: 14px;
  color: #909399;
  background: #f4f4f5;
  padding: 6px 12px;
  border-radius: 4px;
}

.papers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.paper-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.paper-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #409eff;
}

.paper-header {
  flex: 1;
  margin-bottom: 15px;
  text-align: center;
}

.paper-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  line-height: 1.4;
  text-align: center;
}

.paper-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  justify-content: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.paper-actions {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  justify-content: center;
}

/* ==================== 无结果提示样式 ==================== */
.no-results-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.no-results-tip {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.7;
}

/* ==================== 无权限提示样式 ==================== */
.no-permission-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.no-permission-text {
  font-size: 16px;
  margin: 0;
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
  border-radius: 12px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

.edit-modal {
  max-width: 1200px;
  width: 95%;
  padding: 30px;
}

.batch-score-modal,
.confirm-modal {
  max-width: 800px;
  width: 90%;
  padding: 30px;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6e9f0;
}

.modal-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f4f4f5;
  color: #606266;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e6e9f0;
}

.edit-summary {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

/* ==================== 试卷编辑容器样式 ==================== */
.paper-edit-container {
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
}

/* ==================== 模式选择器样式 ==================== */
.mode-selector {
  margin-bottom: 20px;
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

/* ==================== 检索条件区域样式 ==================== */
.search-section .card {
  margin-bottom: 20px;
}

.criteria-item.full-width {
  grid-column: 1 / -1;
}

/* ==================== 题目网格布局样式 ==================== */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.question-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
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
  margin-bottom: 10px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

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
  padding: 2px 6px;
  border-radius: 4px;
}

.question-type {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
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
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
}

/* 可视化图形 */
.chart-container {
  width: 100%;
  height: 320px;
  margin-top: 16px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* ==================== 题目内容样式 ==================== */
.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.question-text {
  line-height: 1.6;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
}

.question-options {
  margin-top: 5px;
}

.option-item {
  display: flex;
  align-items: baseline; 
  margin-bottom: 4px;
  padding: 6px;
  border-radius: 4px;
  background: #ffffff;
  transition: background 0.2s;
}

.option-label {
  font-weight: 500;
  min-width: 24px;
  color: #409eff;
  margin-right: 6px;
  font-size: 13px;
}

.option-text {
  flex: 1;
  line-height: 1.5;
  color: #606266;
  font-size: 13px;
}

/* ==================== 题目底部样式 ==================== */
.question-footer {
  border-top: 1px solid #e4e7ed;
  padding-top: 10px;
  margin-top: auto;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f4f4f5;
  color: #909399;
}

/* ==================== 批量操作工具栏样式 ==================== */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
}

.batch-count {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

.batch-actions .btn-primary,
.batch-actions .btn-secondary {
  padding: 6px 12px;
  font-size: 12px;
}

/* ==================== 分页控件样式 ==================== */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.pagination-btn {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  min-width: 100px;
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

.pagination-info {
  font-size: 13px;
  color: #606266;
  margin: 0 10px;
}

/* ==================== 试卷预览区域样式 ==================== */
.paper-preview-section .card {
  margin-bottom: 20px;
}

.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.paper-actions {
  display: flex;
  gap: 8px;
}

/* ==================== 试卷统计样式 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
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
  font-size: 13px;
}

.stat-value {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

/* ==================== 试卷题目样式 ==================== */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paper-question {
  display: flex;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
  gap: 12px;
}

.paper-question:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.question-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.question-number {
  font-weight: bold;
  font-size: 16px;
  color: #409eff;
  text-align: center;
  min-width: 24px;
}

.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.score-area .score-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.score-area .score-input {
  width: 70px;
  text-align: center;
}

.score-input {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
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
  font-size: 11px;
  color: #f56c6c;
  max-width: 120px;
}

.paper-question .question-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.paper-question .question-actions button {
  padding: 4px 8px;
  font-size: 12px;
}

/* ==================== 空试卷提示样式 ==================== */
.empty-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.empty-content p {
  margin: 0 0 20px;
  font-size: 16px;
}

/* ==================== 批量设置分值模态框样式 ==================== */
.batch-score-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 设置方式选择器 */
.batch-mode-selector {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.mode-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e6e9f0;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s;
  text-align: center;
}

.mode-btn:hover {
  border-color: #c0c4cc;
  background: #f1f2f3;
}

.mode-btn.active {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

/* 设置标题 */
.setting-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.title-hint {
  font-size: 13px;
  color: #909399;
}

/* 按题型设置样式 */
.type-score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.type-score-item {
  background: #f8f9fa;
  border: 1px solid #e6e9f0;
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
}

.type-score-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.type-score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.type-score-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.type-score-count {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 12px;
}

.type-score-input-wrapper {
  position: relative;
}

.type-score-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.type-score-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 13px;
}

/* 单题设置样式 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-indices {
  margin-top: 12px;
  padding: 10px 16px;
  background: #f0f9ff;
  border: 1px solid #d9ecff;
  border-radius: 6px;
  font-size: 13px;
  color: #409eff;
}

/* 分值预览样式 */
.score-preview {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.preview-total {
  font-weight: 600;
  color: #67c23a;
  font-size: 16px;
}

.preview-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
}

.preview-type {
  font-weight: 500;
  color: #303133;
}

.preview-count {
  color: #606266;
}

.preview-score {
  color: #409eff;
}

.preview-subtotal {
  font-weight: 600;
  color: #67c23a;
}

/* ==================== 确认并保存试卷样式 ==================== */
.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px 0;
}

/* 基本表单样式 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.form-label.required::after {
  content: " *";
  color: #f56c6c;
}

.input-error {
  border-color: #f56c6c !important;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.1) !important;
}

.form-hint {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

/* 统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #e6e9f0;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 28px;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

/* 分值预览表格 */
.table-container {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.preview-table thead {
  background: #f8f9fa;
}

.preview-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #303133;
  font-size: 13px;
  border-bottom: 2px solid #e6e9f0;
}

.preview-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e6e9f0;
  font-size: 13px;
}

.preview-table tr:hover td {
  background: #f8f9fa;
}

.score-cell {
  font-weight: 600;
  color: #409eff;
}

.more-items {
  text-align: center;
  color: #909399;
  font-style: italic;
  padding: 20px !important;
}

/* 确认摘要 */
.confirm-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.summary-value {
  font-size: 14px;
  color: #303133;
}

/* ==================== 预览试卷样式 ==================== */
.preview-modal-content {
  max-width: 1000px;
  width: 95%;
  padding: 30px;
}

.preview-content {
  max-height: 70vh;
  overflow-y: auto;
  margin: 20px 0;
}
/* 隐藏滚动条 */
.preview-content::-webkit-scrollbar {
  display: none;
}

/* 试卷头部信息 */
.paper-header-info {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left: 4px solid #409eff;
}

.paper-title-section {
  text-align: center;
  margin-bottom: 24px;
}

.paper-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.paper-subtitle {
  font-size: 16px;
  color: #606266;
}

.paper-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.meta-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-content {
  flex: 1;
}

.meta-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 2px;
}

.meta-label {
  font-size: 12px;
  color: #909399;
}

/* 加载状态 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 题目预览容器 */
.questions-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-indicator {
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  font-size: 14px;
  color: #409eff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 预览题目项 */
.preview-question-item {
  position: relative;
  transition: all 0.3s;
}

.preview-question-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e9f0;
}

.question-number-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-number {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.question-score {
  font-size: 14px;
  color: #67c23a;
  font-weight: 600;
}

.question-tags {
  display: flex;
  gap: 8px;
}

.tag.type-tag {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
  font-weight: 500;
}

.tag.difficulty-tag {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

/* 题目内容 */
.question-content {
  line-height: 1.6;
}

.question-text {
  font-size: 15px;
  color: #303133;
  margin-bottom: 16px;
}

/* 选项预览 */
.question-options-preview {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e6e9f0;
}

.option-item-preview {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: white;
}

.option-item-preview:hover {
  background: #f0f9ff;
}

.option-label {
  font-weight: 600;
  min-width: 30px;
  color: #409eff;
  margin-right: 12px;
  font-size: 14px;
}

.option-content {
  flex: 1;
  line-height: 1.5;
  color: #606266;
  font-size: 14px;
}

/* 题目图片 */
.question-image {
  margin: 16px 0;
  text-align: center;
}

.img-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 答案区域 */
.question-answer {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.answer-label {
  font-weight: 600;
  color: #67c23a;
  font-size: 14px;
}

.answer-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

/* 分隔线 */
.question-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e6e9f0, transparent);
  margin-top: 20px;
}

/* 空状态 */
.empty-content {
  text-align: center;
  padding: 60px 40px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-content h3 {
  font-size: 20px;
  color: #303133;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: #909399;
  margin: 0;
}

/* 预览分页控件 */
.preview-pagination-controls {
  margin-top: 24px;
  padding: 20px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}

.separator {
  color: #c0c4cc;
}

.total-items {
  color: #909399;
  font-size: 13px;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
}

.page-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.jump-btn {
  padding: 8px 16px;
  font-size: 13px;
}

.pagination-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

/* 预览统计 */
.preview-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* ==================== PDF下载模态框样式 ==================== */
.download-modal {
  max-width: 1200px;
  width: 95%;
  padding: 30px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.pdf-options-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e6e9f0;
}

.pdf-options-left,
.pdf-options-right {
  display: flex;
  gap: 20px;
}

.pdf-option-group {
  display: flex;
  gap: 20px;
}

.pdf-option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  user-select: none;
}

.pdf-option-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.pdf-format-options {
  display: flex;
  gap: 20px;
}

.pdf-format-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.pdf-format-select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.pdf-format-select:focus {
  outline: none;
  border-color: #409eff;
}

/* PDF内容容器 */
.pdf-content-wrapper {
  background: white;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  padding: 40px;
  margin-bottom: 20px;
  overflow-y: auto;
  max-height: 60vh;
  transition: all 0.3s;
}

/* 下载时应用的样式 */
.pdf-content-wrapper.pdf-printing {
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0;
  background: white;
  max-height: none;
  overflow: visible;
}

/* PDF头部 */
.pdf-header {
  margin-bottom: 30px;
}

.pdf-title-section {
  text-align: center;
  margin-bottom: 20px;
}

.pdf-paper-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 10px 0;
  line-height: 1.3;
  letter-spacing: 1px;
}

.pdf-subtitle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  font-size: 15px;
  color: #666;
  margin-bottom: 20px;
}

.pdf-meta-item {
  font-weight: 500;
}

.pdf-meta-divider {
  color: #ccc;
}

.pdf-header-divider {
  height: 2px;
  background: linear-gradient(to right, transparent, #409eff, transparent);
  margin: 0 auto;
  width: 80%;
}

/* PDF题目列表 */
.pdf-questions {
  margin-bottom: 40px;
}

.pdf-question-item {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: 30px;
  padding-bottom: 20px;
}

.pdf-question-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.pdf-question-number {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  min-width: 40px;
  margin-right: 15px;
}

.pdf-question-meta {
  display: flex;
  align-items: center;
  gap: 20px;
}

.pdf-question-type {
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.pdf-question-score {
  font-size: 14px;
  color: #67c23a;
  font-weight: 600;
}

/* 题目内容 */
.pdf-question-content {
  margin-bottom: 20px;
}

.pdf-question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
  text-align: justify;
}

.pdf-question-text :deep(p) {
  margin: 0 0 10px 0;
}

.pdf-question-text :deep(br) {
  display: block;
  content: "";
  margin-top: 10px;
}

/* 题目选项 */
.pdf-question-options {
  margin: 20px 0 25px 10px;
}

.pdf-option-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
  line-height: 1.6;
  page-break-inside: avoid;
}

.pdf-option-label {
  font-weight: 600;
  min-width: 25px;
  color: #409eff;
  margin-right: 10px;
  font-size: 15px;
}

.pdf-option-text {
  flex: 1;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
}

/* 图片样式 */
.pdf-question-image {
  margin: 20px 0;
  text-align: center;
  page-break-inside: avoid;
}

.pdf-img-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 答案和解析区域 */
.pdf-answer-area,
.pdf-analysis-area {
  margin-top: 25px;
  padding: 15px 20px;
  background: #f9f9f9;
  border-left: 4px solid #67c23a;
  border-radius: 4px;
  page-break-inside: avoid;
}

.pdf-analysis-area {
  border-left-color: #e6a23c;
  margin-top: 15px;
}

.pdf-answer-label,
.pdf-analysis-label {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
  margin-bottom: 8px;
  display: block;
}

.pdf-answer-text,
.pdf-analysis-text {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

/* 题目分隔线 */
.pdf-question-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  margin-top: 20px;
}

/* PDF页脚 */
.pdf-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e6e9f0;
}

.pdf-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.pdf-footer-left {
  display: flex;
  gap: 30px;
}

.pdf-footer-stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pdf-footer-value {
  font-weight: 600;
  color: #409eff;
}

.pdf-footer-page {
  font-weight: 500;
}

.pdf-page-number {
  font-weight: 700;
  color: #409eff;
}

/* 打印样式优化 */
@media print {
  .pdf-content-wrapper {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }

  .pdf-paper-title {
    font-size: 24pt !important;
  }

  .pdf-question-text {
    font-size: 11pt !important;
  }

  .pdf-option-text {
    font-size: 10.5pt !important;
  }

  .pdf-question-item {
    margin-bottom: 20pt !important;
    padding-bottom: 15pt !important;
  }

  .pdf-answer-area,
  .pdf-analysis-area {
    background: none !important;
    border: 1px solid #ddd !important;
  }

  /* 隐藏非打印元素 */
  .pdf-options-bar,
  .modal-header,
  .modal-footer {
    display: none !important;
  }
}

/* 数学公式样式优化 */
.pdf-question-text :deep(.katex) {
  font-size: 1.1em !important;
}

.pdf-question-text :deep(.katex-display) {
  margin: 1em 0 !important;
  overflow: auto hidden;
}

/* 防止长公式溢出 */
.pdf-question-text :deep(.katex-display > .katex) {
  display: inline-block;
  max-width: 100%;
  overflow: auto;
}

/* 列表样式优化 */
.pdf-question-text :deep(ul),
.pdf-question-text :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.pdf-question-text :deep(li) {
  margin-bottom: 0.3em;
  line-height: 1.6;
}

/* 表格样式优化 */
.pdf-question-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 0.95em;
}

.pdf-question-text :deep(th),
.pdf-question-text :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.pdf-question-text :deep(th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

/* 代码块样式优化 */
.pdf-question-text :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}

.pdf-question-text :deep(pre) {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #e9ecef;
}

.pdf-question-text :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-modal {
    padding: 20px;
  }

  .pdf-content-wrapper {
    padding: 20px;
  }

  .pdf-paper-title {
    font-size: 22px;
  }

  .pdf-subtitle {
    flex-direction: column;
    gap: 8px;
  }

  .pdf-question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .pdf-question-number {
    margin-right: 0;
  }

  .pdf-options-bar {
    flex-direction: column;
    gap: 15px;
  }

  .pdf-options-left,
  .pdf-options-right {
    width: 100%;
    justify-content: space-between;
  }

  .pdf-footer-info {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .pdf-footer-left {
    flex-direction: column;
    gap: 10px;
  }
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .papers-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }

  .questions-grid {
    grid-template-columns: 1fr;
  }

  .type-score-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .paper-meta-grid {
    grid-template-columns: repeat(2, 1fr);
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
    gap: 16px;
  }

  .papers-grid {
    grid-template-columns: 1fr;
  }

  .paper-actions {
    flex-direction: column;
  }

  .paper-actions button {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    padding: 30px 20px;
    width: 95%;
  }

  .edit-modal {
    padding: 20px;
  }

  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 16px;
  }

  .edit-summary {
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer button {
    width: 100%;
    justify-content: center;
  }

  .paper-meta-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
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

  .batch-mode-selector {
    flex-direction: column;
  }

  .mode-btn {
    width: 100%;
  }

  .preview-table {
    font-size: 12px;
  }

  .preview-table th,
  .preview-table td {
    padding: 8px 12px;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .pagination-buttons {
    flex-wrap: wrap;
  }

  .preview-stats {
    flex-direction: column;
    gap: 12px;
  }

  .preview-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .preview-actions button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 18px;
  }

  .modal-title {
    font-size: 20px;
  }

  .paper-title {
    font-size: 22px;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .meta-card {
    flex-direction: column;
    text-align: center;
  }

  .meta-icon {
    margin: 0 auto;
  }

  .pagination-buttons {
    flex-direction: column;
  }

  .page-input-container {
    width: 100%;
    justify-content: center;
  }
}
</style>
