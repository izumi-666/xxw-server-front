<template>
  <!-- 主容器 -->
  <div class="container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">题库录入系统</h1>
      </div>
    </div>

    <!-- 模式选择：上传题目 vs 更新题目 -->
    <div class="mode-select">
      <!-- 上传题目按钮 - 根据权限显示 -->
      <button v-if="hasPermission('question:create')" :class="{ active: !updateMode }" @click="exitUpdateMode"
        type="button">
        上传题目
      </button>
      <!-- 更新题目按钮 - 根据权限显示 -->
      <button v-if="hasPermission('question:*')" :class="{ active: updateMode }" @click="enterUpdateMode" type="button">
        更新题目
      </button>
    </div>

    <!-- ==================== 上传题目表单部分 ==================== -->
    <section v-if="!updateMode && hasPermission('question:create')" class="form-section">
      <h2>上传题目</h2>
      <form @submit.prevent="handleSubmit">
        <!-- 学校选择 -->
        <div class="form-group">
          <label class="form-label required">学校：</label>
          <select v-model="form.school_id" class="form-select">
            <option :value="null">全部</option>
            <!-- 遍历学校列表 -->
            <option v-for="school in schoolList" :key="school.id" :value="school.id">
              {{ school.name }}
            </option>
          </select>
        </div>
        <!-- 年级选择 -->
        <div class="form-group">
          <label class="form-label required">年级：</label>
          <select v-model="form.grade_id" class="form-select">
            <option :value="null">全部</option>
            <!-- 遍历年级列表 -->
            <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
              {{ grade.name }}
            </option>
          </select>
        </div>

        <!-- 科目选择 -->
        <div class="form-group">
          <label class="form-label required">科目：</label>
          <select v-model="form.subject_id" class="form-select">
            <option :value="null">全部</option>
            <!-- 遍历科目列表 -->
            <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </select>
        </div>

        <!-- 问题类别选择区域 -->
        <div class="form-group">
          <label class="form-label required">问题类别：</label>
          <div class="searchable-select">
            <input type="text" v-model="questionCategorySearch" placeholder="输入关键字搜索问题类别..."
              class="form-input search-input" @input="filterQuestionCategories"
              @focus="showQuestionCategoryDropdown = true" @blur="onQuestionCategoryBlur" />
            <div v-if="showQuestionCategoryDropdown && filteredQuestionCategories.length" class="dropdown-list">
              <div v-for="item in filteredQuestionCategories" :key="item.id" class="dropdown-item"
                @mousedown="selectQuestionCategory(item)">
                {{ item.name }}
                <span v-if="
                  selectedQuestionCategory && selectedQuestionCategory.id === item.id
                " class="selected-mark">✓</span>
                <!-- 删除问题类别按钮 - 根据权限显示 -->
                <button v-if="hasPermission('question:delete')" type="button"
                  @mousedown.stop="confirmDeleteQuestionCategory(item)" class="btn-remove-small" title="删除问题类别">
                  ×
                </button>
              </div>
            </div>
          </div>
          <div class="selected-item" v-if="selectedQuestionCategory">
            已选择: {{ selectedQuestionCategory.name }}
            <button type="button" @click="clearQuestionCategory" class="btn-remove">
              清除
            </button>
          </div>

          <div class="new-knowledge-input">
            <input type="text" v-model="newQuestionCategory" placeholder="新建问题类别（多个用逗号分隔）" class="form-input"
              @keypress.enter="uploadQuestionCategory" />
            <button type="button" @click="uploadQuestionCategory" class="btn-highlight"
              :disabled="!newQuestionCategory.trim()">
              新增问题类别
            </button>
          </div>
        </div>

        <!-- 题目内容输入区域 -->
        <div class="form-group">
          <label class="form-label required">题目内容：</label>
          <!-- Markdown 编辑器 -->
          <div class="markdown-editor-container">
            <textarea v-model="form.title" data-form="form" data-field="title" class="markdown-editor"
              placeholder="请输入题干，支持 Markdown 语法和 LaTeX 数学公式" @paste="handlePaste" @drop.prevent="handleDrop"
              @dragover.prevent rows="6"></textarea>
            <div class="markdown-preview" v-html="renderMarkdown(form.title)"></div>
          </div>
        </div>

        <!-- 单选题选项区域（仅在问题类别为单选题时显示） -->
        <div v-if="showSingleOptions" class="form-group">
          <label class="form-label">选项：</label>
          <div class="options-list">
            <!-- 遍历选项列表 -->
            <div v-for="(opt, index) in form.options" :key="index" class="option-item">
              <span class="option-label">{{ getOptionLabel(index) }}.</span>
              <div class="option-input-container">
                <!-- 选项 Markdown 编辑器 -->
                <div class="markdown-editor-container small">
                  <textarea v-model="opt.text" data-form="form" data-field="text" :data-opt="index"
                    class="markdown-editor option-editor" :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                    @paste="handlePaste" @drop.prevent="handleDrop" @dragover.prevent rows="3"></textarea>
                  <div class="markdown-preview" v-html="renderMarkdown(opt.text)"></div>
                </div>
              </div>
              <div class="option-actions">
                <!-- 单选题正确答案选择 -->
                <input type="radio" name="singleAnswer" :value="index" v-model="singleAnswerIndex"
                  :id="`upload-single-answer-${index}`" class="radio-input" required />
                <label class="radio-label" :for="`upload-single-answer-${index}`">正确答案</label>
                <!-- 删除选项按钮 -->
                <button type="button" @click="removeOption(index)" class="btn-remove"
                  :disabled="form.options.length <= 2">
                  删除
                </button>
              </div>
            </div>
          </div>
          <!-- 添加选项按钮 -->
          <button type="button" @click="addOption" class="btn-secondary">添加选项</button>
        </div>

        <!-- 多选题选项区域（仅在问题类别为多选题时显示） -->
        <div v-if="showMultipleOptions" class="form-group">
          <label class="form-label">选项：</label>
          <div class="options-list">
            <!-- 遍历选项列表 -->
            <div v-for="(opt, index) in form.options" :key="index" class="option-item">
              <span class="option-label">{{ getOptionLabel(index) }}.</span>
              <div class="option-input-container">
                <!-- 选项 Markdown 编辑器 -->
                <div class="markdown-editor-container small">
                  <textarea v-model="opt.text" data-form="form" data-field="text" :data-opt="index"
                    class="markdown-editor option-editor" :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                    @paste="handlePaste" @drop.prevent="handleDrop" @dragover.prevent rows="3"></textarea>
                  <div class="markdown-preview" v-html="renderMarkdown(opt.text)"></div>
                </div>
              </div>
              <div class="option-actions">
                <!-- 多选题正确答案选择 -->
                <input type="checkbox" v-model="opt.isAnswer" :id="`upload-multiple-answer-${index}`"
                  class="checkbox-input" />
                <label class="checkbox-label" :for="`upload-multiple-answer-${index}`">正确答案</label>
                <!-- 删除选项按钮 -->
                <button type="button" @click="removeOption(index)" class="btn-remove"
                  :disabled="form.options.length <= 2">
                  删除
                </button>
              </div>
            </div>
          </div>
          <!-- 添加选项按钮 -->
          <button type="button" @click="addOption" class="btn-secondary">添加选项</button>
        </div>

        <!-- 主观题答案区域（在问题类别不是选择题时显示） -->
        <div v-if="showSubjectiveAnswer" class="form-group">
          <label class="form-label">参考答案：</label>
          <!-- Markdown 编辑器 -->
          <div class="markdown-editor-container">
            <textarea v-model="form.answer" data-form="form" data-field="answer" class="markdown-editor"
              placeholder="请输入参考答案，支持 Markdown 语法和 LaTeX 数学公式" @paste="handlePaste" @drop.prevent="handleDrop"
              @dragover.prevent rows="6"></textarea>
            <div class="markdown-preview" v-html="renderMarkdown(form.answer)"></div>
          </div>
        </div>

        <!-- 解析输入区域 -->
        <div class="form-group">
          <label class="form-label">解析：</label>
          <!-- Markdown 编辑器 -->
          <div class="markdown-editor-container">
            <textarea v-model="form.notes" data-form="form" data-field="notes" class="markdown-editor"
              placeholder="请输入题目解析，支持 Markdown 语法和 LaTeX 数学公式" @paste="handlePaste" @drop.prevent="handleDrop"
              @dragover.prevent rows="6"></textarea>
            <div class="markdown-preview" v-html="renderMarkdown(form.notes)"></div>
          </div>
        </div>

        <!-- 知识点选择区域 -->
        <div class="form-group">
          <label class="form-label">知识点：</label>

          <!-- 添加加载状态提示 -->
          <div v-if="loadingKnowledgePoints" class="loading-tip">正在加载知识点...</div>

          <!-- 当科目和年级都选择后显示知识点树 -->
          <div v-else-if="form.subject_id && form.grade_id" class="knowledge-tree-container">
            <div class="tree-controls">
              <input type="text" v-model="knowledgeSearch" placeholder="搜索知识点..." class="search-input"
                @input="filterKnowledgeTree" />
              <button v-if="knowledgeSearch" @click="clearKnowledgeSearch" class="btn-clear">
                清除搜索
              </button>
            </div>

            <div class="tree-wrapper">
              <KnowledgeTree v-if="knowledgeTreeData.length" :data="knowledgeTreeData"
                :selected-id="form.knowledge_point_id" @select="selectKnowledgePoint" @toggle="toggleKnowledgeNode" />
              <div v-else class="no-knowledge">暂无知识点数据</div>
            </div>

            <!-- 已选择的知识点显示 -->
            <div class="selected-item" v-if="selectedKnowledgePoint">
              已选择: {{ selectedKnowledgePoint.name }}
              <button type="button" @click="clearKnowledgePoint" class="btn-remove">
                清除
              </button>
            </div>
          </div>

          <!-- 未选择科目或年级时的提示 -->
          <div v-else class="select-tip">请先选择科目和年级</div>
        </div>

        <!-- 副知识点选择区域 -->
        <div class="form-group">
          <label class="form-label">副知识点：</label>

          <div v-if="loadingKnowledgePoints" class="loading-tip">正在加载知识点...</div>

          <div v-else-if="form.subject_id && form.grade_id" class="knowledge-tree-container">
            <div class="tree-controls">
              <input type="text" v-model="subKnowledgeSearch" placeholder="搜索副知识点..." class="search-input"
                @input="filterSubKnowledgeTree" />
              <button v-if="subKnowledgeSearch" @click="clearSubKnowledgeSearch" class="btn-clear">
                清除搜索
              </button>
            </div>

            <div class="tree-wrapper">
              <KnowledgeTree v-if="subKnowledgeTreeData.length" :data="subKnowledgeTreeData"
                :multi-selected-ids="form.sub_knowledge_point_ids" @select="selectSubKnowledgePoint"
                @toggle="toggleSubKnowledgeNode" />
              <div v-else class="no-knowledge">暂无知识点数据</div>
            </div>

            <!-- 已选择的副知识点标签显示 -->
            <div class="selected-items" v-if="selectedSubKnowledgePoints.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="kp in selectedSubKnowledgePoints" :key="kp.id" class="selected-tag"
                @click="removeSubKnowledgePoint(kp.id)">
                {{ kp.name }} ×
              </span>
            </div>
          </div>

          <div v-else class="select-tip">请先选择科目和年级</div>
        </div>

        <!-- 解题思想选择区域 -->
        <div class="form-group">
          <label class="form-label">解题思想：</label>
          <div class="searchable-select">
            <input type="text" v-model="solutionIdeaSearch" placeholder="输入关键字搜索解题思想..." class="form-input search-input"
              @input="filterSolutionIdeas" @focus="
                resetFilteredList('solutionIdea');
              showSolutionIdeaDropdown = true;
              " @blur="onSolutionIdeaBlur" />
            <div v-if="showSolutionIdeaDropdown && filteredSolutionIdeas.length" class="dropdown-list">
              <div v-for="item in filteredSolutionIdeas" :key="item.id" class="dropdown-item"
                @mousedown="selectSolutionIdea(item)">
                {{ item.name }}
                <span v-if="isSolutionIdeaSelected(item.id)" class="selected-mark">✓</span>
                <!-- 删除解题思想按钮 - 根据权限显示 -->
                <button v-if="hasPermission('question:delete')" type="button"
                  @mousedown.stop="confirmDeleteSolutionIdea(item)" class="btn-remove-small" title="删除解题思想">
                  ×
                </button>
              </div>
            </div>
          </div>
          <div class="selected-items" v-if="selectedSolutionIdeas.length">
            <span class="selected-tags-label">已选择：</span>
            <span v-for="item in selectedSolutionIdeas" :key="item.id" class="selected-tag"
              @click="removeSolutionIdea(item.id)">
              {{ item.name }} ×
            </span>
          </div>
          <div class="new-knowledge-input">
            <input type="text" v-model="newSolutionIdea" placeholder="新建解题思想（多个用逗号分隔）" class="form-input"
              @keypress.enter="uploadSolutionIdea" />
            <button type="button" @click="uploadSolutionIdea" class="btn-highlight" :disabled="!newSolutionIdea.trim()">
              新增解题思想
            </button>
          </div>
        </div>

        <!-- 难度选择 -->
        <div class="form-group">
          <label class="form-label">难度：</label>
          <select v-model="form.difficulty_level" class="form-select">
            <option :value="null">暂无难度评级</option>
            <!-- 1-5星难度选项 -->
            <option v-for="n in 5" :key="n" :value="n">{{ n }} 星</option>
          </select>
        </div>

        <!-- 评分方法选择 -->
        <div class="form-group">
          <label class="form-label">评分方法：</label>
          <select v-model="form.marking_type" class="form-select">
            <option value="0">自动评分</option>
            <option value="1">人工评分</option>
          </select>
        </div>

        <!-- 备注（remark） -->
        <div class="form-group">
          <label class="form-label">备注：</label>
          <!-- Markdown 编辑器 -->
          <div class="markdown-editor-container">
            <textarea v-model="form.remark" data-form="form" data-field="remark" class="markdown-editor"
              placeholder="请输入备注信息，支持 Markdown 语法" @paste="handlePaste" @drop.prevent="handleDrop" @dragover.prevent
              rows="4"></textarea>
            <div class="markdown-preview" v-html="renderMarkdown(form.remark)"></div>
          </div>
        </div>

        <!-- 审核人选择 -->
        <div class="form-group">
          <label class="form-label required">审核人：</label>
          <select v-model="selectedReviewer" class="form-select" required>
            <option value="">请选择审核人</option>
            <option v-for="reviewer in reviewerOptions" :key="reviewer.id" :value="reviewer.account">
              {{ reviewer.name || reviewer.account }}
              <template v-if="reviewer.name && reviewer.account !== reviewer.name">
                ({{ reviewer.account }})
              </template>
            </option>
          </select>
          <div v-if="selectedReviewer" class="selected-item">
            已选择: {{ getReviewerName(selectedReviewer) }}
            <button type="button" @click="selectedReviewer = ''" class="btn-remove">
              清除
            </button>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button type="button" @click="showPreview" class="btn-primary submit-btn" :disabled="submitting">
            {{ submitting ? "提交中..." : "预览并提交" }}
          </button>
        </div>
      </form>
    </section>

    <!-- ==================== 更新题目界面 ==================== -->
    <section v-if="updateMode && hasPermission('question:read')" class="update-section">
      <!-- 检索条件区域 -->
      <div class="search-criteria">
        <h2>检索题目</h2>
        <div class="criteria-row">
          <!-- 年级筛选（多选） -->
          <div class="criteria-item">
            <label>年级：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateGradeSearch" placeholder="输入关键字搜索年级..." class="form-input search-input"
                @input="filterUpdateGrades" @focus="
                  resetFilteredList('updateGrade');
                showUpdateGradeDropdown = true;
                " @blur="onUpdateGradeBlur" />
              <div v-if="showUpdateGradeDropdown && filteredUpdateGrades.length" class="dropdown-list">
                <div v-for="grade in filteredUpdateGrades" :key="grade.id" class="dropdown-item"
                  @mousedown="selectUpdateGrade(grade)">
                  {{ grade.name }}
                  <span v-if="isUpdateGradeSelected(grade.id)" class="selected-mark">✓</span>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateGrades.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="grade in selectedUpdateGrades" :key="grade.id" class="selected-tag"
                @click="removeUpdateGrade(grade.id)">
                {{ grade.name }} ×
              </span>
            </div>
          </div>

          <!-- 难度筛选（多选） -->
          <div class="criteria-item">
            <label>难度：</label>
            <div class="difficulty-multi-select">
              <div class="difficulty-options">
                <div v-for="n in 5" :key="n" class="difficulty-option"
                  :class="{ selected: isUpdateDifficultySelected(n) }" @click="toggleUpdateDifficulty(n)">
                  <span class="difficulty-stars">{{ n }} 星</span>
                  <span v-if="isUpdateDifficultySelected(n)" class="selected-mark">✓</span>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="searchCriteria.difficulty_levels.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="level in searchCriteria.difficulty_levels" :key="level" class="selected-tag"
                @click="toggleUpdateDifficulty(level)">
                {{ level }}星 ×
              </span>
            </div>
          </div>

          <!-- 科目筛选 -->
          <div class="criteria-item">
            <label>科目：</label>
            <select v-model="searchCriteria.subject_id" class="form-select">
              <option :value="null">全部</option>
              <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>

          <!-- 问题类别筛选（多选） -->
          <div class="criteria-item">
            <label>问题类别：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateQuestionCategorySearch" placeholder="输入关键字搜索问题类别..."
                class="form-input search-input" @input="filterUpdateQuestionCategories"
                @focus="showUpdateQuestionCategoryDropdown = true" @blur="onUpdateQuestionCategoryBlur" />
              <div v-if="
                showUpdateQuestionCategoryDropdown &&
                filteredUpdateQuestionCategories.length
              " class="dropdown-list">
                <div v-for="item in filteredUpdateQuestionCategories" :key="item.id" class="dropdown-item"
                  @mousedown="selectUpdateQuestionCategory(item)">
                  {{ item.name }}
                  <span v-if="isUpdateQuestionCategorySelected(item.id)" class="selected-mark">✓</span>
                  <!-- 删除问题类别按钮（更新界面） - 根据权限显示 -->
                  <button v-if="hasPermission('question:delete')" type="button"
                    @mousedown.stop="confirmDeleteQuestionCategory(item)" class="btn-remove-small" title="删除问题类别">
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateQuestionCategories.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="item in selectedUpdateQuestionCategories" :key="item.id" class="selected-tag"
                @click="removeUpdateQuestionCategory(item.id)">
                {{ item.name }} ×
              </span>
            </div>
          </div>

          <!-- 知识点筛选（多选） -->
          <div class="criteria-item full-width">
            <label class="form-label">知识点：</label>

            <div v-if="loadingUpdateKnowledgePoints" class="loading-tip">
              正在加载知识点...
            </div>

            <div v-else-if="searchCriteria.subject_id && searchCriteria.grade_ids.length > 0"
              class="knowledge-tree-container full-width-container">
              <div class="tree-controls">
                <div class="selected-grades-info" v-if="searchCriteria.grade_ids.length > 0">
                  <span class="grades-label">已选年级：</span>
                  <span v-for="gradeId in searchCriteria.grade_ids" :key="gradeId" class="grade-tag">
                    {{ getGradeName(gradeId) }}
                  </span>
                </div>
                <input type="text" v-model="updateKnowledgeSearch" placeholder="搜索知识点..." class="search-input"
                  @input="filterUpdateKnowledgeTree" />
                <button v-if="updateKnowledgeSearch" @click="clearUpdateKnowledgeSearch" class="btn-clear">
                  清除搜索
                </button>
              </div>

              <div class="tree-wrapper">
                <KnowledgeTree v-if="updateKnowledgeTreeData.length" :data="updateKnowledgeTreeData"
                  :multi-selected-ids="searchCriteria.knowledge_point_ids" @select="selectUpdateKnowledgePoint"
                  @toggle="toggleUpdateKnowledgeNode" :show-grade="true" />
                <div v-else-if="!loadingUpdateKnowledgePoints" class="no-knowledge">
                  暂无知识点数据
                </div>
              </div>

              <div class="selected-items" v-if="selectedUpdateKnowledgePoints.length">
                <span class="selected-tags-label">已选择：</span>
                <span v-for="kp in selectedUpdateKnowledgePoints" :key="kp.id" class="selected-tag"
                  @click="removeUpdateKnowledgePoint(kp.id)">
                  {{ kp.name }}
                  <span class="tag-grade" v-if="kp.gradeName">({{ kp.gradeName }})</span>
                  <span class="remove-icon">×</span>
                </span>
              </div>
            </div>

            <div v-else class="select-tip full-width-tip">
              请先选择科目和至少一个年级
            </div>
          </div>

          <!-- 副知识点筛选（多选） -->
          <div class="criteria-item full-width">
            <label class="form-label">副知识点：</label>

            <div v-if="loadingUpdateKnowledgePoints" class="loading-tip">
              正在加载知识点...
            </div>

            <div v-else-if="searchCriteria.subject_id && searchCriteria.grade_ids.length > 0"
              class="knowledge-tree-container full-width-container">
              <div class="tree-controls">
                <div class="selected-grades-info" v-if="searchCriteria.grade_ids.length > 0">
                  <span class="grades-label">已选年级：</span>
                  <span v-for="gradeId in searchCriteria.grade_ids" :key="gradeId" class="grade-tag">
                    {{ getGradeName(gradeId) }}
                  </span>
                </div>
                <input type="text" v-model="updateSubKnowledgeSearch" placeholder="搜索副知识点..." class="search-input"
                  @input="filterUpdateSubKnowledgeTree" />
                <button v-if="updateSubKnowledgeSearch" @click="clearUpdateSubKnowledgeSearch" class="btn-clear">
                  清除搜索
                </button>
              </div>

              <div class="tree-wrapper">
                <KnowledgeTree v-if="updateSubKnowledgeTreeData.length" :data="updateSubKnowledgeTreeData"
                  :multi-selected-ids="searchCriteria.sub_knowledge_point_ids" @select="selectUpdateSubKnowledgePoint"
                  @toggle="toggleUpdateSubKnowledgeNode" :show-grade="true" />
                <div v-else-if="!loadingUpdateKnowledgePoints" class="no-knowledge">
                  暂无知识点数据
                </div>
              </div>

              <div class="selected-items" v-if="selectedUpdateSubKnowledgePoints.length">
                <span class="selected-tags-label">已选择：</span>
                <span v-for="kp in selectedUpdateSubKnowledgePoints" :key="kp.id" class="selected-tag"
                  @click="removeUpdateSubKnowledgePoint(kp.id)">
                  {{ kp.name }}
                  <span class="tag-grade" v-if="kp.gradeName">({{ kp.gradeName }})</span>
                  <span class="remove-icon">×</span>
                </span>
              </div>
            </div>

            <div v-else class="select-tip full-width-tip">
              请先选择科目和至少一个年级
            </div>
          </div>

          <!-- 解题思想筛选（多选） -->
          <div class="criteria-item">
            <label>解题思想：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateSolutionIdeaSearch" placeholder="输入关键字搜索解题思想..."
                class="form-input search-input" @input="filterUpdateSolutionIdeas" @focus="
                  resetFilteredList('updateSolutionIdea');
                showUpdateSolutionIdeaDropdown = true;
                " @blur="onUpdateSolutionIdeaBlur" />
              <div v-if="
                showUpdateSolutionIdeaDropdown && filteredUpdateSolutionIdeas.length
              " class="dropdown-list">
                <div v-for="item in filteredUpdateSolutionIdeas" :key="item.id" class="dropdown-item"
                  @mousedown="selectUpdateSolutionIdea(item)">
                  {{ item.name }}
                  <span v-if="isUpdateSolutionIdeaSelected(item.id)" class="selected-mark">✓</span>
                  <!-- 删除解题思想按钮（更新界面） - 根据权限显示 -->
                  <button v-if="hasPermission('question:delete')" type="button"
                    @mousedown.stop="confirmDeleteSolutionIdea(item)" class="btn-remove-small" title="删除解题思想">
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateSolutionIdeas.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="item in selectedUpdateSolutionIdeas" :key="item.id" class="selected-tag"
                @click="removeUpdateSolutionIdea(item.id)">
                {{ item.name }} ×
              </span>
            </div>
          </div>

          <!-- 题目内容关键词搜索 -->
          <div class="criteria-item">
            <label>题目内容：</label>
            <input type="text" v-model="searchCriteria.title" placeholder="输入题目关键词" class="form-input" />
          </div>

          <!-- 检索按钮 -->
          <div class="criteria-item">
            <button @click="findQuestions" class="btn-primary search-btn">检索</button>
          </div>
        </div>
      </div>

      <!-- 检索结果区域 -->
      <div v-if="questionList.length" class="search-results">
        <h3>检索结果 (共 {{ totalItems }} 条)</h3>
        <div class="results-table-container">
          <div class="results-table">
            <!-- 表格头部 -->
            <div class="table-header">
              <!-- <div class="table-cell">学校</div> -->
              <div class="table-cell">上传者</div>
              <div class="table-cell">审核者</div>
              <div class="table-cell">年级</div>
              <div class="table-cell">科目</div>
              <div class="table-cell">问题类别</div>
              <div class="table-cell">评分方法</div>
              <div class="table-cell">知识点</div>
              <div class="table-cell">解题思想</div>
              <div class="table-cell">副知识点</div>
              <div class="table-cell">难度</div>
              <div class="table-cell">题目内容</div>
              <div class="table-cell">备注</div>
              <div class="table-cell">图片</div>
              <div class="table-cell" style="margin-left: 35px">操作</div>
            </div>
            <!-- 表格数据行 -->
            <div v-for="q in questionList" :key="q.id" class="table-row">
              <div class="table-cell">{{ q.uploader || "-" }}</div>
              <div class="table-cell">{{ q.reviewer || "-" }}</div>
              <!-- <div class="table-cell">{{ getSchoolName(q.school_id) }}</div> -->
              <div class="table-cell">{{ getGradeName(q.grade_id) }}</div>
              <div class="table-cell">{{ getSubjectName(q.subject_id) }}</div>
              <div class="table-cell">
                {{ getQuestionCategoryName(q.question_category_id) }}
              </div>
              <div class="table-cell">{{ getMarkingTypeName(q.marking_type) }}</div>
              <div class="table-cell">
                {{ getKnowledgePointName(q.knowledge_point_id) }}
              </div>
              <!-- 解题思想单元格（多值显示） -->
              <div class="table-cell sub-knowledge-cell">
                <span v-for="ideaId in q.solution_idea_ids || []" :key="ideaId" class="sub-knowledge-tag">
                  {{ getSolutionIdeaName(ideaId) }}
                </span>
                <span v-if="!(q.solution_idea_ids && q.solution_idea_ids.length)" class="no-sub-knowledge">
                  无
                </span>
              </div>
              <!-- 副知识点单元格（多值显示） -->
              <div class="table-cell sub-knowledge-cell">
                <template v-if="q.sub_knowledge_point_ids && q.sub_knowledge_point_ids.length">
                  <span v-for="subId in q.sub_knowledge_point_ids" :key="subId" class="sub-knowledge-tag">
                    {{ getKnowledgePointName(subId) }}
                  </span>
                </template>
                <span v-else class="no-sub-knowledge">
                  无
                </span>
              </div>
              <div class="table-cell">{{ q.difficulty_level }}星</div>
              <!-- 题目内容单元格-->
              <div class="table-cell title-cell" v-html="renderMarkdown(q.title)"></div>
              <!-- 备注 -->
              <div class="table-cell title-cell" v-html="renderMarkdown(q.remark)"></div>
              <!-- 图片预览单元格 -->
              <div class="table-cell image-cell">
                <img v-if="q.img_url" :src="q.img_url" alt="题目图片" class="thumbnail-image"
                  @click="previewImage(q.img_url)" />
                <span v-else class="no-image">-</span>
              </div>
              <!-- 操作按钮单元格 -->
              <div class="table-cell actions-cell" style="margin-left: 30px; padding-left: 15px">
                <button v-if="hasPermission('question:update')" @click="loadQuestionForUpdate(q)" class="btn-update">
                  更新
                </button>
                <button v-if="hasPermission('question:delete')" @click="confirmDelete(q)" class="btn-delete">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- 分页控件 -->
        <div class="pagination-controls">
          <!-- 首页按钮 -->
          <button @click="goToFirstPage" :disabled="searchCriteria.page_num <= 1" class="pagination-btn">
            首页
          </button>
          <!-- 上一页按钮 -->
          <button @click="changePage(searchCriteria.page_num - 1)" :disabled="searchCriteria.page_num <= 1"
            class="pagination-btn">
            上一页
          </button>

          <span>第 {{ searchCriteria.page_num }} 页，共 {{ totalPages }} 页 ({{
            totalItems
          }}
            条)</span>

          <!-- 下一页按钮 -->
          <button @click="changePage(searchCriteria.page_num + 1)" :disabled="searchCriteria.page_num >= totalPages"
            class="pagination-btn">
            下一页
          </button>
          <!-- 末页按钮 -->
          <button @click="goToLastPage" :disabled="searchCriteria.page_num >= totalPages" class="pagination-btn">
            末页
          </button>

          <input type="number" v-model.number="pageInput" min="1" :max="totalPages" placeholder="页码"
            @keyup.enter="goToPage" class="page-input" />
          <button @click="goToPage" class="pagination-btn">跳转</button>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-else-if="hasSearched" class="no-results">
        <p>暂无相关题目</p>
      </div>

      <!-- 更新题目表单（选中题目后显示） -->
      <div v-if="selectedQuestion && showUpdateForm && hasPermission('question:update')" :key="'update-form'"
        class="update-form-section" ref="updateFormRef">
        <h3>更新题目 (ID: {{ selectedQuestion.id }})</h3>
        <form @submit.prevent="handleUpdateSubmit" class="update-form">
          <!-- 学校选择 -->
          <div class="form-group">
            <label class="form-label">学校：</label>
            <select v-model="updateForm.school_id" class="form-select" required>
              <option :value="null">请选择学校</option>
              <option v-for="school in schoolList" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
          </div>

          <!-- 显示提交者信息（只读） -->
          <div class="form-group">
            <label class="form-label">提交者：</label>
            <div class="readonly-field">
              {{ selectedQuestion?.uploader || "-" }}
            </div>
          </div>

          <!-- 显示审核者信息（只读） -->
          <div class="form-group">
            <label class="form-label">审核者：</label>
            <div class="readonly-field">
              {{ selectedQuestion?.reviewer || "-" }}
            </div>
          </div>

          <!-- 年级选择 -->
          <div class="form-group">
            <label class="form-label">年级：</label>
            <select v-model="updateForm.grade_id" class="form-select" required>
              <option :value="null">请选择年级</option>
              <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
          </div>

          <!-- 科目选择 -->
          <div class="form-group">
            <label class="form-label">科目：</label>
            <select v-model="updateForm.subject_id" class="form-select" required>
              <option :value="null">请选择科目</option>
              <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>

          <!-- 问题类别选择（单选） -->
          <div class="form-group">
            <label class="form-label">问题类别：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateFormQuestionCategorySearch" placeholder="输入关键字搜索问题类别..."
                class="form-input search-input" @input="filterUpdateFormQuestionCategories"
                @focus="showUpdateFormQuestionCategoryDropdown = true" @blur="onUpdateFormQuestionCategoryBlur" />
              <div v-if="
                showUpdateFormQuestionCategoryDropdown &&
                filteredUpdateFormQuestionCategories.length
              " class="dropdown-list">
                <div v-for="item in filteredUpdateFormQuestionCategories" :key="item.id" class="dropdown-item"
                  @mousedown="selectUpdateFormQuestionCategory(item)">
                  {{ item.name }}
                  <span v-if="
                    selectedUpdateFormQuestionCategory &&
                    selectedUpdateFormQuestionCategory.id === item.id
                  " class="selected-mark">✓</span>
                  <!-- 删除问题类别按钮（更新表单） - 根据权限显示 -->
                  <button v-if="hasPermission('question:delete')" type="button"
                    @mousedown.stop="confirmDeleteQuestionCategory(item)" class="btn-remove-small" title="删除问题类别">
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-item" v-if="selectedUpdateFormQuestionCategory">
              已选择: {{ selectedUpdateFormQuestionCategory.name }}
              <button type="button" @click="clearUpdateFormQuestionCategory" class="btn-remove">
                清除
              </button>
            </div>
          </div>

          <!-- 评分方法选择 -->
          <div class="form-group">
            <label class="form-label">评分方法：</label>
            <select v-model="updateForm.marking_type" class="form-select" required>
              <option value="0">自动评分</option>
              <option value="1">人工评分</option>
            </select>
          </div>

          <!-- 知识点选择区域（使用树状结构） -->
          <div class="form-group">
            <label class="form-label">知识点：</label>

            <div v-if="loadingUpdateFormKnowledgePoints" class="loading-tip">
              正在加载知识点...
            </div>

            <!-- 当科目和年级都选择后显示知识点树 -->
            <div v-else-if="updateForm.subject_id && updateForm.grade_id" class="knowledge-tree-container">
              <div class="tree-controls">
                <input type="text" v-model="updateFormKnowledgeSearch" placeholder="搜索知识点..." class="search-input"
                  @input="filterUpdateFormKnowledgeTree" />
                <button v-if="updateFormKnowledgeSearch" @click="clearUpdateFormKnowledgeSearch" class="btn-clear">
                  清除搜索
                </button>
              </div>

              <div class="tree-wrapper">
                <KnowledgeTree v-if="updateFormKnowledgeTreeData.length" :data="updateFormKnowledgeTreeData"
                  :selected-id="updateForm.knowledge_point_id" @select="selectUpdateFormKnowledgePoint"
                  @toggle="toggleUpdateFormKnowledgeNode" />
                <div v-else class="no-knowledge">暂无知识点数据</div>
              </div>

              <!-- 已选择的知识点显示 -->
              <div class="selected-item" v-if="selectedUpdateFormKnowledgePoint">
                已选择: {{ selectedUpdateFormKnowledgePoint.name }}
                <button type="button" @click="clearUpdateFormKnowledgePoint" class="btn-remove">
                  清除
                </button>
              </div>
            </div>

            <!-- 未选择科目或年级时的提示 -->
            <div v-else class="select-tip">请先选择科目和年级</div>
          </div>

          <!-- 副知识点选择区域（使用树状结构） -->
          <div class="form-group">
            <label class="form-label">副知识点：</label>

            <div v-if="loadingUpdateFormKnowledgePoints" class="loading-tip">
              正在加载知识点...
            </div>

            <div v-else-if="updateForm.subject_id && updateForm.grade_id" class="knowledge-tree-container">
              <div class="tree-controls">
                <input type="text" v-model="updateFormSubKnowledgeSearch" placeholder="搜索副知识点..." class="search-input"
                  @input="filterUpdateFormSubKnowledgeTree" />
                <button v-if="updateFormSubKnowledgeSearch" @click="clearUpdateFormSubKnowledgeSearch"
                  class="btn-clear">
                  清除搜索
                </button>
              </div>

              <div class="tree-wrapper">
                <KnowledgeTree v-if="updateFormSubKnowledgeTreeData.length" :data="updateFormSubKnowledgeTreeData"
                  :multi-selected-ids="updateForm.sub_knowledge_point_ids" @select="selectUpdateFormSubKnowledgePoint"
                  @toggle="toggleUpdateFormSubKnowledgeNode" />
                <div v-else class="no-knowledge">暂无知识点数据</div>
              </div>

              <!-- 已选择的副知识点标签显示 -->
              <div class="selected-items" v-if="selectedUpdateFormSubKnowledgePoints.length">
                <span class="selected-tags-label">已选择：</span>
                <span v-for="kp in selectedUpdateFormSubKnowledgePoints" :key="kp.id" class="selected-tag"
                  @click="removeUpdateFormSubKnowledgePoint(kp.id)">
                  {{ kp.name }} ×
                </span>
              </div>
            </div>

            <div v-else class="select-tip">请先选择科目和年级</div>
          </div>

          <!-- 解题思想选择 -->
          <div class="form-group">
            <label class="form-label">解题思想：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateFormSolutionIdeaSearch" placeholder="输入关键字搜索解题思想..."
                class="form-input search-input" @input="filterUpdateFormSolutionIdeas" @focus="
                  resetFilteredList('updateFormSolutionIdea');
                showUpdateFormSolutionIdeaDropdown = true;
                " @blur="onUpdateFormSolutionIdeaBlur" />
              <div v-if="
                showUpdateFormSolutionIdeaDropdown &&
                filteredUpdateFormSolutionIdeas.length
              " class="dropdown-list">
                <div v-for="item in filteredUpdateFormSolutionIdeas" :key="item.id" class="dropdown-item"
                  @mousedown="selectUpdateFormSolutionIdea(item)">
                  {{ item.name }}
                  <span v-if="isUpdateFormSolutionIdeaSelected(item.id)" class="selected-mark">✓</span>
                  <!-- 删除解题思想按钮（更新表单） - 根据权限显示 -->
                  <button v-if="hasPermission('question:delete')" type="button"
                    @mousedown.stop="confirmDeleteSolutionIdea(item)" class="btn-remove-small" title="删除解题思想">
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateFormSolutionIdeas.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="item in selectedUpdateFormSolutionIdeas" :key="item.id" class="selected-tag"
                @click="removeUpdateFormSolutionIdea(item.id)">
                {{ item.name }} ×
              </span>
            </div>
            <!-- 新增解题思想功能 -->
            <div class="new-knowledge-input">
              <input type="text" v-model="newUpdateFormSolutionIdea" placeholder="新建解题思想（多个用逗号分隔）" class="form-input"
                @keypress.enter="uploadUpdateFormSolutionIdea" />
              <button type="button" @click="uploadUpdateFormSolutionIdea" class="btn-highlight"
                :disabled="!newUpdateFormSolutionIdea.trim()">
                新增解题思想
              </button>
            </div>
          </div>

          <!-- 难度选择 -->
          <div class="form-group">
            <label class="form-label">难度：</label>
            <select v-model="updateForm.difficulty_level" class="form-select" required>
              <option :value="null">暂无难度评级</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} 星</option>
            </select>
          </div>

          <!-- 题目内容 -->
          <div class="form-group">
            <label class="form-label required">题目内容：</label>
            <!-- Markdown 编辑器 -->
            <div class="markdown-editor-container">
              <textarea v-model="updateForm.title" data-form="updateForm" data-field="title" class="markdown-editor"
                placeholder="请输入题干，支持 Markdown 语法和 LaTeX 数学公式" @paste="handlePaste" @drop.prevent="handleDrop"
                @dragover.prevent rows="6"></textarea>
              <div class="markdown-preview" v-html="renderMarkdown(updateForm.title)"></div>
            </div>
          </div>

          <!-- 单选题选项区域 -->
          <div v-if="showUpdateSingleOptions" class="form-group">
            <label class="form-label">选项：</label>
            <div class="options-list">
              <div v-for="(opt, index) in updateForm.options" :key="index" class="option-item">
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <div class="option-input-container">
                  <!-- 选项 Markdown 编辑器 -->
                  <div class="markdown-editor-container small">
                    <textarea v-model="opt.text" data-form="updateForm" data-field="text" :data-opt="index"
                      class="markdown-editor option-editor" :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                      @paste="handlePaste" @drop.prevent="handleDrop" @dragover.prevent rows="3"></textarea>
                    <div class="markdown-preview" v-html="renderMarkdown(opt.text)"></div>
                  </div>
                </div>
                <div class="option-actions">
                  <!-- 单选题答案选择 -->
                  <input type="radio" name="updateSingleAnswer" :value="index" v-model="updateSingleAnswerIndex"
                    :id="`update-single-answer-${index}`" class="radio-input" required />
                  <label class="radio-label" :for="`update-single-answer-${index}`">正确答案</label>
                  <!-- 删除选项按钮 -->
                  <button type="button" @click="removeUpdateOption(index)" class="btn-remove"
                    :disabled="updateForm.options.length <= 2">
                    删除
                  </button>
                </div>
              </div>
            </div>
            <!-- 添加选项按钮 -->
            <button type="button" @click="addUpdateOption" class="btn-secondary">
              添加选项
            </button>
          </div>

          <!-- 多选题选项区域 -->
          <div v-if="showUpdateMultipleOptions" class="form-group">
            <label class="form-label">选项：</label>
            <div class="options-list">
              <div v-for="(opt, index) in updateForm.options" :key="index" class="option-item">
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <div class="option-input-container">
                  <!-- 选项 Markdown 编辑器 -->
                  <div class="markdown-editor-container small">
                    <textarea v-model="opt.text" data-form="updateForm" data-field="text" :data-opt="index"
                      class="markdown-editor option-editor" :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                      @paste="handlePaste" @drop.prevent="handleDrop" @dragover.prevent rows="3"></textarea>
                    <div class="markdown-preview" v-html="renderMarkdown(opt.text)"></div>
                  </div>
                </div>
                <div class="option-actions">
                  <!-- 多选题答案选择 -->
                  <input type="checkbox" v-model="opt.isAnswer" :id="`update-multiple-answer-${index}`"
                    class="checkbox-input" />
                  <label class="checkbox-label" :for="`update-multiple-answer-${index}`">正确答案</label>
                  <!-- 删除选项按钮 -->
                  <button type="button" @click="removeUpdateOption(index)" class="btn-remove"
                    :disabled="updateForm.options.length <= 2">
                    删除
                  </button>
                </div>
              </div>
            </div>
            <!-- 添加选项按钮 -->
            <button type="button" @click="addUpdateOption" class="btn-secondary">
              添加选项
            </button>
          </div>

          <!-- 主观题答案区域 -->
          <div v-if="showUpdateSubjectiveAnswer" class="form-group">
            <label class="form-label">参考答案：</label>
            <!-- Markdown 编辑器 -->
            <div class="markdown-editor-container">
              <textarea v-model="updateForm.answer" data-form="updateForm" data-field="answer" class="markdown-editor"
                placeholder="请输入参考答案，支持 Markdown 语法和 LaTeX 数学公式" @paste="handlePaste" @drop.prevent="handleDrop"
                @dragover.prevent rows="6"></textarea>
              <div class="markdown-preview" v-html="renderMarkdown(updateForm.answer)"></div>
            </div>
          </div>

          <!-- 解析 -->
          <div class="form-group">
            <label class="form-label">解析：</label>
            <!-- Markdown 编辑器 -->
            <div class="markdown-editor-container">
              <textarea v-model="updateForm.notes" data-form="updateForm" data-field="notes" class="markdown-editor"
                placeholder="请输入题目解析，支持 Markdown 语法和 LaTeX 数学公式" @paste="handlePaste" @drop.prevent="handleDrop"
                @dragover.prevent rows="6"></textarea>
              <div class="markdown-preview" v-html="renderMarkdown(updateForm.notes)"></div>
            </div>
          </div>

          <!-- 备注（更新表单） -->
          <div class="form-group">
            <label class="form-label">备注：</label>
            <!-- Markdown 编辑器 -->
            <div class="markdown-editor-container">
              <textarea v-model="updateForm.remark" data-form="updateForm" data-field="remark" class="markdown-editor"
                placeholder="请输入备注信息，支持 Markdown 语法" @paste="handlePaste" @drop.prevent="handleDrop" @dragover.prevent
                rows="4"></textarea>
              <div class="markdown-preview" v-html="renderMarkdown(updateForm.remark)"></div>
            </div>
          </div>

          <!-- 更新操作按钮 -->
          <div class="form-actions">
            <button type="button" @click="showUpdatePreview" class="btn-primary submit-btn" :disabled="submitting">
              {{ submitting ? "更新中..." : "预览并更新" }}
            </button>
            <button type="button" @click="cancelUpdate" class="btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- ==================== 删除确认对话框 ==================== -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除题目 (ID: {{ questionToDelete?.id }}) 吗？此操作不可恢复。</p>
        <div class="modal-actions">
          <button @click="deleteQuestion" class="btn-delete">确认删除</button>
          <button @click="cancelDelete" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- ==================== 图片预览模态框 ==================== -->
    <div v-if="showImagePreview" class="modal-overlay" @click="closeImagePreview">
      <div class="image-preview-modal" @click.stop>
        <img :src="previewImageUrl" alt="预览" class="full-size-image" />
      </div>
    </div>

    <!-- ==================== 题目预览模态框 ==================== -->
    <div v-if="showPreviewModal" class="modal-overlay preview-modal-overlay" @click="closePreview">
      <div class="preview-modal-content">
        <h3 class="preview-modal-title">
          {{ previewMode === "upload" ? "题目上传预览" : "题目更新预览" }}
        </h3>

        <div class="preview-content">
          <!-- 基本信息 -->
          <div class="preview-section">
            <h4>基本信息</h4>
            <div class="preview-grid">
              <div class="preview-item">
                <label>上传人:</label>
                <span>{{ getPreviewUploaderName() }}</span>
              </div>
              <div class="preview-item">
                <label>审核人:</label>
                <span>{{ getPreviewReviewerName() }}</span>
              </div>
              <div class="preview-item">
                <label>学校:</label>
                <span>{{ getPreviewSchoolName() }}</span>
              </div>
              <div class="preview-item">
                <label>年级:</label>
                <span>{{ getPreviewGradeName() }}</span>
              </div>
              <div class="preview-item">
                <label>科目:</label>
                <span>{{ getPreviewSubjectName() }}</span>
              </div>
              <div class="preview-item">
                <label>问题类别:</label>
                <span>{{ getPreviewQuestionCategoryName() }}</span>
              </div>
              <div class="preview-item">
                <label>难度:</label>
                <span>{{ getPreviewDifficultyLevel() }}</span>
              </div>
              <div class="preview-item">
                <label>评分方法:</label>
                <span>{{ getPreviewMarkingType() }}</span>
              </div>
            </div>
          </div>

          <!-- 知识点相关 -->
          <div class="preview-section">
            <h4>知识点信息</h4>
            <div class="preview-grid">
              <div class="preview-item">
                <label>知识点:</label>
                <span>{{ getPreviewKnowledgePointName() }}</span>
              </div>
              <div class="preview-item">
                <label>副知识点:</label>
                <span>{{ getPreviewSubKnowledgePoints() }}</span>
              </div>
              <div class="preview-item">
                <label>解题思想:</label>
                <span>{{ getPreviewSolutionIdeas() }}</span>
              </div>
            </div>
          </div>

          <!-- 题目内容 -->
          <div class="preview-section">
            <h4>题目内容</h4>
            <div class="preview-text-content" v-html="renderMarkdown(getPreviewTitle())"></div>
            <div v-if="getPreviewImageUrl()" class="preview-image">
              <img :src="getPreviewImageUrl()" alt="题目图片" class="preview-img" />
            </div>
          </div>

          <!-- 选项（选择题） -->
          <div v-if="showPreviewOptions()" class="preview-section">
            <h4>选项</h4>
            <div class="preview-options">
              <div v-for="(opt, index) in getPreviewOptions()" :key="index" class="preview-option"
                :class="{ 'correct-answer': isPreviewOptionCorrect(index) }">
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <span class="option-text" v-html="renderMarkdown(opt.text)"></span>
                <span v-if="isPreviewOptionCorrect(index)" class="correct-badge">正确答案</span>
              </div>
            </div>
          </div>

          <!-- 答案（主观题） -->
          <div v-if="showPreviewSubjectiveAnswer()" class="preview-section">
            <h4>参考答案</h4>
            <div class="preview-text-content" v-html="renderMarkdown(getPreviewAnswer())"></div>
          </div>

          <!-- 解析 -->
          <div v-if="getPreviewNotes()" class="preview-section">
            <h4>解析</h4>
            <div class="preview-text-content" v-html="renderMarkdown(getPreviewNotes())"></div>
          </div>

          <!-- 备注 -->
          <div v-if="getPreviewRemark()" class="preview-section">
            <h4>备注</h4>
            <div class="preview-text-content" v-html="renderMarkdown(getPreviewRemark())"></div>
          </div>
        </div>

        <div class="preview-actions">
          <button @click="confirmSubmit" class="btn-primary">
            {{ previewMode === "upload" ? "确认提交" : "确认更新" }}
          </button>
          <button @click="closePreview" class="btn-secondary">返回修改</button>
        </div>
      </div>
    </div>

    <!-- ==================== 删除知识点/解题思想/问题类别确认对话框 ==================== -->
    <div v-if="showDeleteEntityConfirm" class="modal-overlay">
      <div class="modal-content delete-entity-modal">
        <h3>确认删除</h3>
        <p>
          确定要删除{{ deleteEntityType }} "{{ deleteEntityData?.name }}"
          吗？此操作不可恢复。
        </p>

        <!-- 对于解题思想和问题类别，显示依赖题目列表 -->
        <div v-if="deleteEntityType === '解题思想' || deleteEntityType === '问题类别'" class="dependent-questions">
          <h4>
            以下题目使用了该{{ deleteEntityType }}（共
            {{ dependentQuestionsTotalItems }} 条）：
          </h4>
          <div class="dependent-list">
            <div v-for="q in dependentQuestions" :key="q.id" class="dependent-question">
              <div class="dependent-question-preview">
                <div class="dependent-question-header">
                  <span class="dependent-question-id">ID: {{ q.id }}</span>
                  <span class="dependent-question-type">{{
                    getQuestionCategoryName(q.question_category_id)
                  }}</span>
                </div>
                <div class="dependent-question-content" v-html="renderMarkdown(q.title)"></div>
                <div class="dependent-question-actions">
                  <!-- 删除按钮 - 根据权限显示 -->
                  <button v-if="hasPermission('question:delete')" @click="deleteDependentQuestion(q)"
                    class="btn-delete">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 对于解题思想和问题类别，显示分页控件 -->
        <div v-if="deleteEntityType === '解题思想' || deleteEntityType === '问题类别'" class="pagination-controls">
          <button @click="goToDependentFirstPage" :disabled="dependentQuestionsPageNum <= 1" class="pagination-btn">
            首页
          </button>
          <button @click="changeDependentPage(dependentQuestionsPageNum - 1)" :disabled="dependentQuestionsPageNum <= 1"
            class="pagination-btn">
            上一页
          </button>

          <span>第 {{ dependentQuestionsPageNum }} 页，共
            {{ dependentQuestionsTotalPages }} 页 ({{
              dependentQuestionsTotalItems
            }}
            条)</span>

          <button @click="changeDependentPage(dependentQuestionsPageNum + 1)"
            :disabled="dependentQuestionsPageNum >= dependentQuestionsTotalPages" class="pagination-btn">
            下一页
          </button>
          <button @click="goToDependentLastPage" :disabled="dependentQuestionsPageNum >= dependentQuestionsTotalPages"
            class="pagination-btn">
            末页
          </button>

          <input type="number" v-model.number="dependentQuestionsPageInput" min="1" :max="dependentQuestionsTotalPages"
            placeholder="页码" @keyup.enter="goToDependentPage" class="page-input" />
          <button @click="goToDependentPage" class="pagination-btn">跳转</button>
        </div>

        <div class="modal-actions">
          <!-- 对于解题思想和问题类别，显示全部删除按钮 -->
          <button v-if="
            (deleteEntityType === '解题思想' || deleteEntityType === '问题类别') &&
            dependentQuestions.length > 0 &&
            hasPermission('question:delete')
          " @click="deleteAllDependentQuestions" class="btn-delete delete-all-btn">
            全部删除（共 {{ dependentQuestionsTotalItems }} 道题目）
          </button>
          <!-- 确认删除按钮 - 根据权限显示 -->
          <button v-if="hasPermission('question:delete')" @click="deleteEntity" class="btn-delete" :disabled="(deleteEntityType === '解题思想' || deleteEntityType === '问题类别') &&
            dependentQuestions.length > 0
            ">
            确认删除
          </button>
          <button @click="cancelDeleteEntity" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入Vue相关功能和依赖
import { reactive, ref, onMounted, computed, nextTick, watch } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import "element-plus/dist/index.css";
import KnowledgeTree from "./KnowledgePointTree.vue";
// 导入知识点工具函数
import { fetchKnowledgePointList, getKnowledgePointName, getKnowledgePointNames } from '../utils/knowledgeList';

// 导入 Markdown 渲染相关
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

// 从环境变量获取API基础URL
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 配置 marked 以支持 LaTeX
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false, // 允许 HTML
});

// ==================== 权限检查函数 ====================
/**
 * 检查用户是否拥有指定权限
 * @param {string} permission - 权限字符串
 * @returns {boolean} 是否拥有权限
 */
const hasPermission = (permission) => {
  // 从localStorage获取权限列表
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  // 检查是否有精确权限
  if (permissions.includes(permission)) {
    return true;
  }

  // 检查通配符权限
  const permissionParts = permission.split(":");
  if (permissionParts.length === 2) {
    const [resource, action] = permissionParts;
    // 检查 resource:* 形式的通配符
    if (permissions.includes(`${resource}:*`)) {
      return true;
    }
    // 检查 *:action 形式的通配符
    if (permissions.includes(`*:${action}`)) {
      return true;
    }
    // 检查 *:* 形式的通配符
    if (permissions.includes("*:*")) {
      return true;
    }
  }

  return false;
};

// ==================== Markdown 渲染函数 ====================
/**
 * 渲染 Markdown 文本为 HTML
 * @param {string} text - Markdown 文本
 * @returns {string} 渲染后的 HTML
 */
const renderMarkdown = (text) => {
  if (!text) return "";

  // 预处理 LaTeX 公式
  const processedText = text
    // 处理行内公式 $...$
    // 处理块级公式 $$...$$
    .replace(/\$\$(.+?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (error) {
        return match; // 如果渲染失败，返回原公式
      }
    })
    .replace(/\$(.+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (error) {
        return match; // 如果渲染失败，返回原公式
      }
    });

  // 渲染 Markdown
  return marked(processedText);
};

// ==================== 删除实体相关状态 ====================
const showDeleteEntityConfirm = ref(false); // 删除实体确认框显示状态
const deleteEntityType = ref(""); // 删除的实体类型: solutionIdea, questionCategory
const deleteEntityData = ref(null); // 要删除的实体数据
const dependentQuestions = ref([]); // 依赖的题目列表

// ==================== 依赖题目分页相关状态 ====================
const dependentQuestionsPageNum = ref(1); // 依赖题目当前页码
const dependentQuestionsPageSize = ref(5); // 依赖题目每页数量
const dependentQuestionsTotalPages = ref(1); // 依赖题目总页数
const dependentQuestionsTotalItems = ref(0); // 依赖题目总条目数
const dependentQuestionsPageInput = ref(1); // 依赖题目页码输入

// ==================== 预览功能相关状态 ====================
const showPreviewModal = ref(false); // 预览模态框显示状态
const previewMode = ref("upload"); // 预览模式：upload 或 update

// ==================== 数据列表状态 ====================
const schoolList = ref([]); // 学校列表
const gradeList = ref([]); // 年级列表
const subjectList = ref([]); // 科目列表
const solutionIdeaList = ref([]); // 解题思想列表
const questionCategoryList = ref([]); // 问题类别列表

// 知识点树数据
const knowledgeTreeData = ref([]); // 上传界面的知识点树
const subKnowledgeTreeData = ref([]); // 上传界面的副知识点树
const updateKnowledgeTreeData = ref([]); // 更新界面检索的知识点树
const updateFormKnowledgeTreeData = ref([]); // 更新表单的知识点树
const updateFormSubKnowledgeTreeData = ref([]); // 更新表单的副知识点树

// 加载状态
const loadingKnowledgePoints = ref(false);
const loadingUpdateKnowledgePoints = ref(false);
const loadingUpdateFormKnowledgePoints = ref(false);

// 原始知识点树数据（用于搜索）
const originalKnowledgeTreeData = ref([]);
const originalSubKnowledgeTreeData = ref([]);
const originalUpdateKnowledgeTreeData = ref([]);
const originalUpdateFormKnowledgeTreeData = ref([]);
const originalUpdateFormSubKnowledgeTreeData = ref([]);

// ==================== 新建内容输入状态 ====================
const newSolutionIdea = ref(""); // 新建解题思想输入
const newQuestionCategory = ref(""); // 新建问题类别输入

// 更新界面的新建内容输入状态
const newUpdateFormSolutionIdea = ref(""); // 更新表单新建解题思想

// ==================== 其他状态 ====================
const questionList = ref([]); // 题目列表
const submitting = ref(false); // 提交状态
const hasSearched = ref(false); // 是否已进行过搜索
const updateFormRef = ref(null); // 更新表单的DOM引用
const showImagePreview = ref(false); // 图片预览显示状态
const previewImageUrl = ref(""); // 预览图片的URL

//审核题目相关
const currentUser = ref(""); // 当前用户名
const staffList = ref([]); // 教师列表
const reviewerOptions = ref([]); // 可选的审核人列表
const selectedReviewer = ref(""); // 选择的审核人

// 加载状态
const loadingReviewers = ref(false); // 加载审核人列表状态
const reviewerLoadError = ref(false); // 加载失败状态

// ==================== 记忆上传设置 ====================
// 从localStorage读取或初始化上传记忆
const uploadMemory = ref(
  JSON.parse(localStorage.getItem("uploadMemory")) || {
    school_id: null,
    grade_id: null,
    subject_id: null,
    marking_type: 0,
    difficulty_level: null,
  }
);

// ==================== 上传题目表单数据 ====================
const form = reactive({
  id: null,
  school_id: uploadMemory.value.school_id,
  grade_id: uploadMemory.value.grade_id,
  subject_id: uploadMemory.value.subject_id,
  question_category_id: uploadMemory.value.question_category_id, // 问题类别ID（单选）
  marking_type: uploadMemory.value.marking_type,
  knowledge_point_id: null, // 知识点ID
  solution_idea_ids: [], // 解题思想ID数组
  difficulty_level: uploadMemory.value.difficulty_level,
  title: "", // 题目内容
  options: [
    // 选择题选项数组
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
  ],
  answer: "", // 答案
  notes: "", // 解析
  remark: "", // 备注
  sub_knowledge_point_ids: [], // 副知识点ID数组
  img_url: "", // 图片URL
});

// ==================== 更新题目表单数据 ====================
const updateForm = reactive({
  id: null,
  school_id: null,
  grade_id: null,
  subject_id: null,
  question_category_id: null, // 问题类别ID（单选）
  marking_type: 0,
  knowledge_point_id: null,
  solution_idea_ids: [],
  difficulty_level: null,
  title: "",
  options: [
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
  ],
  answer: "",
  notes: "",
  remark: "",
  sub_knowledge_point_ids: [],
  img_url: "",
});

// ==================== 检索条件 ====================
const searchCriteria = reactive({
  grade_ids: [],
  subject_id: null,
  question_category_ids: [],
  knowledge_point_ids: [], // 知识点ID数组
  sub_knowledge_point_ids: [], // 副知识点ID数组
  solution_idea_ids: [], // 解题思想ID数组
  difficulty_levels: [],
  title: "", // 题目关键词
  page_num: 1, // 当前页码，默认第一页
  page_size: 10, // 每页数量，默认10条
});

// ==================== 选择题答案索引 ====================
const singleAnswerIndex = ref(null); // 单选题正确答案索引
const updateSingleAnswerIndex = ref(null); // 更新界面单选题正确答案索引

// ==================== 界面模式状态 ====================
const updateMode = ref(false); // 是否为更新模式
const showUpdateForm = ref(false); // 是否显示更新表单
const selectedQuestion = ref(null); // 选中的题目
const showDeleteConfirm = ref(false); // 删除确认框显示状态
const questionToDelete = ref(null); // 待删除的题目

// ==================== 搜索关键词状态 ====================
// 上传界面的搜索关键词
const knowledgeSearch = ref("");
const subKnowledgeSearch = ref("");
const solutionIdeaSearch = ref("");
const questionCategorySearch = ref("");

// 更新界面检索条件的搜索关键词
const updateKnowledgeSearch = ref("");
const updateSubKnowledgeSearch = ref("");
const updateSolutionIdeaSearch = ref("");
const updateQuestionCategorySearch = ref("");
const updateGradeSearch = ref("");

// 更新表单的搜索关键词
const updateFormKnowledgeSearch = ref("");
const updateFormSolutionIdeaSearch = ref("");
const updateFormQuestionCategorySearch = ref("");
const updateFormSubKnowledgeSearch = ref("");

// ==================== 下拉框显示状态 ====================
// 上传界面的下拉框显示状态
const showKnowledgeDropdown = ref(false);
const showSubKnowledgeDropdown = ref(false);
const showSolutionIdeaDropdown = ref(false);
const showQuestionCategoryDropdown = ref(false);

// 更新界面检索条件的下拉框显示状态
const showUpdateKnowledgeDropdown = ref(false);
const showUpdateSubKnowledgeDropdown = ref(false);
const showUpdateSolutionIdeaDropdown = ref(false);
const showUpdateQuestionCategoryDropdown = ref(false);
const showUpdateGradeDropdown = ref(false);

// 更新表单的下拉框显示状态
const showUpdateFormKnowledgeDropdown = ref(false);
const showUpdateFormSolutionIdeaDropdown = ref(false);
const showUpdateFormQuestionCategoryDropdown = ref(false);
const showUpdateFormSubKnowledgeDropdown = ref(false);

// ==================== 选中的对象状态 ====================
const selectedKnowledgePoint = ref(null); // 选中的知识点
const selectedQuestionCategory = ref(null); // 选中的问题类别
const selectedUpdateFormKnowledgePoint = ref(null); // 更新表单选中的知识点
const selectedUpdateFormQuestionCategory = ref(null); // 更新表单选中的问题类别

// ==================== 过滤后的列表状态 ====================
// 上传界面的过滤列表
const filteredKnowledgePoints = ref([]);
const filteredSubKnowledgePoints = ref([]);
const filteredSolutionIdeas = ref([]);
const filteredQuestionCategories = ref([]);

// 更新界面检索条件的过滤列表
const filteredUpdateKnowledgePoints = ref([]);
const filteredUpdateSubKnowledgePoints = ref([]);
const filteredUpdateSolutionIdeas = ref([]);
const filteredUpdateQuestionCategories = ref([]);
const filteredUpdateGrades = ref([]);

// 更新表单的过滤列表
const filteredUpdateFormKnowledgePoints = ref([]);
const filteredUpdateFormSolutionIdeas = ref([]);
const filteredUpdateFormQuestionCategories = ref([]);
const filteredUpdateFormSubKnowledgePoints = ref([]);

// ==================== 分页相关状态 ====================
const totalPages = ref(1); // 总页数
const totalItems = ref(0); // 总条目数
const pageInput = ref(1); // 页码输入

// ==================== 删除实体相关方法 ====================
/**
 * 确认删除解题思想
 * @param {Object} solutionIdea - 解题思想对象
 */
const confirmDeleteSolutionIdea = async (solutionIdea) => {
  deleteEntityType.value = "解题思想";
  deleteEntityData.value = solutionIdea;
  dependentQuestionsPageNum.value = 1;
  dependentQuestionsPageInput.value = 1;
  await loadDependentQuestions(); // 解题思想仍然需要加载依赖题目
  showDeleteEntityConfirm.value = true;
};

/**
 * 确认删除问题类别
 * @param {Object} questionCategory - 问题类别对象
 */
const confirmDeleteQuestionCategory = async (questionCategory) => {
  deleteEntityType.value = "问题类别";
  deleteEntityData.value = questionCategory;
  dependentQuestionsPageNum.value = 1;
  dependentQuestionsPageInput.value = 1;
  await loadDependentQuestions(); // 问题类别仍然需要加载依赖题目
  showDeleteEntityConfirm.value = true;
};

/**
 * 加载依赖的题目
 */
const loadDependentQuestions = async () => {
  if (!deleteEntityData.value) return;

  try {
    let payload = {
      page_num: dependentQuestionsPageNum.value,
      page_size: dependentQuestionsPageSize.value,
    };

    // 根据实体类型设置不同的检索条件
    switch (deleteEntityType.value) {
      case "解题思想":
        payload.solution_idea_ids = [deleteEntityData.value.id];
        break;
      case "问题类别":
        payload.question_category_ids = [deleteEntityData.value.id];
        break;
      default:
        // 知识点和副知识点不需要加载依赖题目
        dependentQuestions.value = [];
        dependentQuestionsTotalPages.value = 1;
        dependentQuestionsTotalItems.value = 0;
        dependentQuestionsPageInput.value = dependentQuestionsPageNum.value;
        return;
    }

    const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
    const responseData = res.data.data;

    dependentQuestions.value = responseData?.data_info || [];
    dependentQuestionsTotalPages.value = responseData?.total_pages || 1;
    dependentQuestionsTotalItems.value = responseData?.total_items || 0;
    dependentQuestionsPageInput.value = dependentQuestionsPageNum.value;
  } catch (err) {
    console.error("加载依赖题目失败:", err);
    ElMessage.error("加载依赖题目失败");
  }
};

/**
 * 改变依赖题目页码
 * @param {number} newPage - 新页码
 */
const changeDependentPage = (newPage) => {
  if (newPage < 1 || newPage > dependentQuestionsTotalPages.value) {
    return;
  }
  dependentQuestionsPageNum.value = newPage;
  dependentQuestionsPageInput.value = newPage;

  // 只有解题思想和问题类别需要加载依赖题目
  if (deleteEntityType.value === "解题思想" || deleteEntityType.value === "问题类别") {
    loadDependentQuestions();
  }
};

/**
 * 跳转到依赖题目首页
 */
const goToDependentFirstPage = () => {
  changeDependentPage(1);
};

/**
 * 跳转到依赖题目末页
 */
const goToDependentLastPage = () => {
  changeDependentPage(dependentQuestionsTotalPages.value);
};

/**
 * 跳转到依赖题目指定页码
 */
const goToDependentPage = () => {
  const page = parseInt(dependentQuestionsPageInput.value);
  if (page >= 1 && page <= dependentQuestionsTotalPages.value) {
    changeDependentPage(page);
  } else {
    ElMessage.error(`请输入 1 到 ${dependentQuestionsTotalPages.value} 之间的页码`);
  }
};

/**
 * 删除依赖题目
 * @param {Object} question - 题目对象
 */
const deleteDependentQuestion = async (question) => {
  try {
    await ElMessageBox.confirm(`确定要删除题目(ID: ${question.id})吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await axios.delete(`${API_BASE}/questions/deleteQuestion/${question.id}`);
    ElMessage.success("题目删除成功");

    await loadDependentQuestions();

    if (selectedQuestion.value && selectedQuestion.value.id === question.id) {
      cancelUpdate();
    }
  } catch (err) {
    if (err === "cancel" || err === "close") {
    } else {
      console.error("删除题目失败:", err);
      ElMessage.error("删除题目失败");
    }
  }
};

/**
 * 删除所有依赖题目
 */
const deleteAllDependentQuestions = async () => {
  if (
    !confirm(
      `确定要删除所有 ${dependentQuestionsTotalItems.value} 道题目吗？此操作不可恢复！`
    )
  ) {
    return;
  }

  try {
    // 获取所有依赖题目的ID
    let allDependentQuestions = [];
    let currentPage = 1;
    const pageSize = 100; // 每页获取100条

    // 首先获取所有题目的ID
    while (true) {
      let payload = {
        page_num: currentPage,
        page_size: pageSize,
      };

      // 根据实体类型设置不同的检索条件
      switch (deleteEntityType.value) {
        case "解题思想":
          payload.solution_idea_ids = [deleteEntityData.value.id];
          break;
        case "问题类别":
          payload.question_category_ids = [deleteEntityData.value.id];
          break;
        default:
          // 知识点和副知识点不需要批量删除题目
          return;
      }

      const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
      const responseData = res.data.data;

      if (!responseData?.data_info || responseData.data_info.length === 0) {
        break;
      }

      allDependentQuestions = allDependentQuestions.concat(
        responseData.data_info.map((q) => q.id)
      );

      if (currentPage >= (responseData.total_pages || 1)) {
        break;
      }
      currentPage++;
    }

    // 批量删除所有题目
    for (const questionId of allDependentQuestions) {
      await axios.delete(`${API_BASE}/questions/deleteQuestion/${questionId}`);
    }

    ElMessage.success(`成功删除 ${allDependentQuestions.length} 道题目`);

    // 重新加载依赖题目列表（应该为空）
    await loadDependentQuestions();

    // 关闭更新表单（如果打开的话）
    cancelUpdate();
  } catch (err) {
    console.error("批量删除题目失败:", err);
    ElMessage.error("批量删除题目失败");
  }
};

/**
 * 删除实体（知识点/解题思想/问题类别）
 */
const deleteEntity = async () => {
  if (!deleteEntityData.value) return;

  try {
    let url = "";
    let entityName = "";

    switch (deleteEntityType.value) {
      case "解题思想":
        url = `${API_BASE}/questions/deleteSolutionIdea/${deleteEntityData.value.id}`;
        entityName = "解题思想";
        break;
      case "问题类别":
        url = `${API_BASE}/questions/deleteQuestionCategory/${deleteEntityData.value.id}`;
        entityName = "问题类别";
        break;
      default:
        return;
    }
    const response = await axios.delete(url);

    // 检查返回的状态码（例如知识点被绑定，返回409）
    if (response.data?.code === 409) {
      const { message } = response.data;
      ElMessage.warning(message);
      showDeleteEntityConfirm.value = false;
      return;
    }

    // 删除成功
    ElMessage.success(`${entityName}删除成功`);

    // 重新加载列表
    await loadLists();

    // 如果当前选中的实体被删除，清除选择
    if (
      deleteEntityType.value === "问题类别" &&
      selectedQuestionCategory.value &&
      selectedQuestionCategory.value.id === deleteEntityData.value.id
    ) {
      clearQuestionCategory();
    }

    showDeleteEntityConfirm.value = false;
    deleteEntityData.value = null;
    dependentQuestions.value = []; // 清空依赖题目列表
  } catch (err) {
    console.error(`删除${deleteEntityType.value}失败:`, err);
    showDeleteEntityConfirm.value = false;
    ElMessage.error("删除失败");
  }
};

/**
 * 取消删除实体
 */
const cancelDeleteEntity = () => {
  showDeleteEntityConfirm.value = false;
  deleteEntityData.value = null;
  dependentQuestions.value = [];
};

// ==================== 预览功能相关方法 ====================
/**
 * 显示预览模态框
 */
const showPreview = () => {
  if (!validateForm()) return;
  previewMode.value = "upload";
  showPreviewModal.value = true;
};

/**
 * 显示更新预览模态框
 */
const showUpdatePreview = () => {
  if (!validateUpdateForm()) return;
  previewMode.value = "update";
  showPreviewModal.value = true;
};

/**
 * 关闭预览模态框
 */
const closePreview = () => {
  showPreviewModal.value = false;
};

/**
 * 确认提交
 */
const replaceBlobUrls = async (targetForm) => {
  if (!targetForm.pendingImages || targetForm.pendingImages.length === 0) return;

  for (const img of targetForm.pendingImages) {
    const url = await uploadToImageBed(img.file);

    // 所有需要替换的字段
    const fields = ["title", "remark", "answer", "notes"];

    fields.forEach((key) => {
      if (targetForm[key]) {
        targetForm[key] = targetForm[key].replaceAll(img.localUrl, url);
      }
    });

    // 替换选项
    if (targetForm.options) {
      targetForm.options = targetForm.options.map((opt) => {
        if (opt.text) {
          opt.text = opt.text.replaceAll(img.localUrl, url);
        }
        return opt;
      });
    }
  }

  // 清空 pending
  targetForm.pendingImages = [];
};

const confirmSubmit = async () => {
  const targetForm = previewMode.value === "upload" ? form : updateForm;

  // 统一替换（创建或更新都可）
  await replaceBlobUrls(targetForm);

  showPreviewModal.value = false;

  if (previewMode.value === "upload") {
    handleSubmit();
  } else {
    handleUpdateSubmit();
  }
};

/**
 * 验证表单
 */
const validateForm = () => {
  if (!form.question_category_id) {
    ElMessage.error("请选择问题类别");
    return false;
  }
  if (!form.title.trim()) {
    ElMessage.error("请输入题目内容");
    return false;
  }
  if (!selectedReviewer.value) {
    ElMessage.error("请选择审核人");
    return false;
  }
  return true;
};

/**
 * 获取预览的审核人名称
 */
const getPreviewReviewerName = () => {
  return getReviewerName(selectedReviewer.value);
};

/**
 * 获取预览的上传人名称
 */
const getPreviewUploaderName = () => {
  return currentUser.value;
};

/**
 * 验证更新表单
 */
const validateUpdateForm = () => {
  if (!updateForm.question_category_id) {
    ElMessage.error("请选择问题类别");
    return false;
  }
  if (!updateForm.title.trim()) {
    ElMessage.error("请输入题目内容");
    return false;
  }
  return true;
};

// ==================== 预览数据获取方法 ====================
/**
 * 获取预览的学校名称
 */
const getPreviewSchoolName = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (currentForm.school_id === null) return "全部";
  const school = schoolList.value.find((s) => s.id === currentForm.school_id);
  return school ? school.name : "未知";
};

/**
 * 获取预览的年级名称
 */
const getPreviewGradeName = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (currentForm.grade_id === null) return "全部";
  const grade = gradeList.value.find((g) => g.id === currentForm.grade_id);
  return grade ? grade.name : "未知";
};

/**
 * 获取预览的科目名称
 */
const getPreviewSubjectName = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (currentForm.subject_id === null) return "全部";
  const subject = subjectList.value.find((s) => s.id === currentForm.subject_id);
  return subject ? subject.name : "未知";
};

/**
 * 获取预览的问题类别名称
 */
const getPreviewQuestionCategoryName = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (!currentForm.question_category_id) return "未选择";
  const category = questionCategoryList.value.find(
    (c) => c.id === currentForm.question_category_id
  );
  return category ? category.name : "未知";
};

/**
 * 获取预览的难度级别
 */
const getPreviewDifficultyLevel = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (currentForm.difficulty_level === null) return "暂无难度评级";
  return `${currentForm.difficulty_level} 星`;
};

/**
 * 获取预览的评分方法
 */
const getPreviewMarkingType = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.marking_type === 1 ? "人工评分" : "自动评分";
};

/**
 * 获取预览的知识点名称
 */
const getPreviewKnowledgePointName = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (!currentForm.knowledge_point_id) return "未选择";

  // 根据当前模式选择正确的知识点树数据
  let treeData = [];
  if (previewMode.value === "upload") {
    treeData = sortedKnowledgeTreeData.value; // 改为排序后的数据
  } else {
    treeData = sortedUpdateFormKnowledgeTreeData.value; // 改为排序后的数据
  }

  // 递归在树中查找节点
  const findNodeInTree = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === currentForm.knowledge_point_id) {
        return node.name;
      }
      if (node.children && node.children.length) {
        const found = findNodeInTree(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const name = findNodeInTree(treeData, currentForm.knowledge_point_id);
  return name || "未知";
};

/**
 * 获取预览的副知识点
 */
const getPreviewSubKnowledgePoints = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (!currentForm.sub_knowledge_point_ids.length) return "无";

  // 根据当前模式选择正确的知识点树数据
  let treeData = [];
  if (previewMode.value === "upload") {
    treeData = sortedSubKnowledgeTreeData.value; // 改为排序后的数据
  } else {
    treeData = sortedUpdateFormSubKnowledgeTreeData.value; // 改为排序后的数据
  }

  // 递归在树中查找多个节点
  const findNodeInTree = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node.name;
      }
      if (node.children && node.children.length) {
        const found = findNodeInTree(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const names = currentForm.sub_knowledge_point_ids
    .map((id) => findNodeInTree(treeData, id))
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : "未知";
};

/**
 * 获取预览的解题思想
 */
const getPreviewSolutionIdeas = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  if (!currentForm.solution_idea_ids.length) return "无";
  return currentForm.solution_idea_ids
    .map((id) => {
      const si = solutionIdeaList.value.find((s) => s.id === id);
      return si ? si.name : "未知";
    })
    .join(", ");
};

/**
 * 获取预览的题目内容
 */
const getPreviewTitle = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.title || "无";
};

/**
 * 获取预览的图片URL
 */
const getPreviewImageUrl = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.img_url || "";
};

/**
 * 获取预览的选项
 */
const getPreviewOptions = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.options || [];
};

/**
 * 检查是否显示预览选项
 */
const showPreviewOptions = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  const categoryName = getPreviewQuestionCategoryName();
  return (
    categoryName === "单选题" ||
    categoryName.includes("单选") ||
    categoryName === "多选题" ||
    categoryName.includes("多选")
  );
};

/**
 * 检查选项是否为正确答案
 */
const isPreviewOptionCorrect = (index) => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  const categoryName = getPreviewQuestionCategoryName();

  if (categoryName === "单选题" || categoryName.includes("单选")) {
    const currentSingleAnswerIndex =
      previewMode.value === "upload"
        ? singleAnswerIndex.value
        : updateSingleAnswerIndex.value;
    return currentSingleAnswerIndex === index;
  } else if (categoryName === "多选题" || categoryName.includes("多选")) {
    return currentForm.options[index]?.isAnswer || false;
  }
  return false;
};

/**
 * 检查是否显示主观题答案
 */
const showPreviewSubjectiveAnswer = () => {
  const categoryName = getPreviewQuestionCategoryName();
  return !(
    categoryName === "单选题" ||
    categoryName.includes("单选") ||
    categoryName === "多选题" ||
    categoryName.includes("多选")
  );
};

/**
 * 获取预览的答案
 */
const getPreviewAnswer = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.answer;
};

/**
 * 获取预览的解析
 */
const getPreviewNotes = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.notes;
};

/**
 * 获取预览的备注
 */
const getPreviewRemark = () => {
  const currentForm = previewMode.value === "upload" ? form : updateForm;
  return currentForm.remark;
};

// ==================== 选项操作方法 ====================
/**
 * 获取选项标签（A, B, C, ...）
 * @param {number} index - 选项索引
 * @returns {string} 选项标签
 */
const getOptionLabel = (index) => {
  let label = "";
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
};

/**
 * 添加选项
 */
const addOption = () => {
  if (form.options.length < 10) {
    form.options.push({ text: "", isAnswer: false });
  }
};

/**
 * 删除选项
 * @param {number} index - 要删除的选项索引
 */
const removeOption = (index) => {
  if (form.options.length > 2) {
    form.options.splice(index, 1);
    if (singleAnswerIndex.value === index) {
      singleAnswerIndex.value = null;
    }
  }
};

/**
 * 更新界面添加选项
 */
const addUpdateOption = () => {
  if (updateForm.options.length < 10) {
    updateForm.options.push({ text: "", isAnswer: false });
  }
};

/**
 * 更新界面删除选项
 * @param {number} index - 要删除的选项索引
 */
const removeUpdateOption = (index) => {
  if (updateForm.options.length > 2) {
    updateForm.options.splice(index, 1);
    if (updateSingleAnswerIndex.value === index) {
      updateSingleAnswerIndex.value = null;
    }
  }
};

// ==================== 问题类别变更处理 ====================
/**
 * 处理问题类别变更
 */
const handleQuestionCategoryChange = () => {
  const name = selectedQuestionCategory.value?.name || "";
  const isChoiceQuestion = name === "单选题" ||
    name.includes("单选") ||
    name === "多选题" ||
    name.includes("多选");
  const wasChoiceQuestion = form._lastQuestionCategoryType?.isChoice || false;

  // 只在从选择题切换到选择题时重置选项
  if (isChoiceQuestion) {
    // 保存当前答案（如果是选择题，答案可能是字母）
    const currentAnswer = form.answer;

    // 重置选项（保留现有文本，清空答案标记）
    form.options = form.options.map((opt, index) => ({
      text: opt.text || "",
      isAnswer: false
    }));

    // 确保至少有4个选项
    while (form.options.length < 4) {
      form.options.push({ text: "", isAnswer: false });
    }

    // 如果是第一次进入选择题，或者从主观题切换过来，才重置答案
    if (!wasChoiceQuestion) {
      singleAnswerIndex.value = null;
      form.answer = "";
    }
  } else {
    // 主观题：保留答案，不清空
    // 不需要做任何重置
  }

  // 根据问题类别设置默认评分方法
  const autoMarkingKeywords = ["单选", "多选"];
  form.marking_type = autoMarkingKeywords.some((keyword) => name.includes(keyword))
    ? 0
    : 1;

  // 保存当前问题类别类型，用于下次判断
  form._lastQuestionCategoryType = {
    name,
    isChoice: isChoiceQuestion
  };
};

/**
 * 处理更新界面问题类别变更
 */
const handleUpdateQuestionCategoryChange = () => {
  updateForm.options = [
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
    { text: "", isAnswer: false },
  ];
  updateSingleAnswerIndex.value = null;
  updateForm.answer = "";
};

// ==================== 知识点选择方法 ====================
/**
 * 清除知识点选择
 */
const clearKnowledgePoint = () => {
  selectedKnowledgePoint.value = null;
  form.knowledge_point_id = null;
  knowledgeSearch.value = "";
};

// ==================== 问题类别选择方法（单选） ====================
/**
 * 选择问题类别
 * @param {Object} item - 问题类别对象
 */
const selectQuestionCategory = (item) => {
  selectedQuestionCategory.value = item;
  form.question_category_id = item.id;
  questionCategorySearch.value = item.name;
  showQuestionCategoryDropdown.value = false;

  handleQuestionCategoryChange();

  // 更新记忆
  uploadMemory.value.question_category_id = item.id;
  saveUploadMemory();
};

/**
 * 清除问题类别选择
 */
const clearQuestionCategory = () => {
  selectedQuestionCategory.value = null;
  form.question_category_id = null;
  questionCategorySearch.value = "";
  handleQuestionCategoryChange();
  // 更新记忆
  uploadMemory.value.question_category_id = null;
  saveUploadMemory();
};

// ==================== 解题思想选择方法 ====================
/**
 * 选择解题思想
 * @param {Object} item - 解题思想对象
 */
const selectSolutionIdea = (item) => {
  if (!form.solution_idea_ids.includes(item.id)) {
    form.solution_idea_ids.push(item.id);
  }
  solutionIdeaSearch.value = "";
  showSolutionIdeaDropdown.value = false;
};

/**
 * 检查解题思想是否已选择
 * @param {number} id - 解题思想ID
 * @returns {boolean} 是否已选择
 */
const isSolutionIdeaSelected = (id) => {
  return form.solution_idea_ids.includes(id);
};

/**
 * 移除解题思想
 * @param {number} id - 要移除的解题思想ID
 */
const removeSolutionIdea = (id) => {
  form.solution_idea_ids = form.solution_idea_ids.filter((itemId) => itemId !== id);
};

// ==================== 副知识点选择方法 ====================
/**
 * 检查副知识点是否已选择
 * @param {number} id - 副知识点ID
 * @returns {boolean} 是否已选择
 */
const isSubKnowledgeSelected = (id) => {
  return form.sub_knowledge_point_ids.includes(id);
};

/**
 * 移除副知识点
 */
const removeSubKnowledgePoint = (id) => {
  form.sub_knowledge_point_ids = form.sub_knowledge_point_ids.filter(
    (kpId) => kpId !== id
  );
};

// ==================== 更新界面知识点多选方法 ====================
/**
 * 检查更新界面知识点是否已选择
 * @param {number} id - 知识点ID
 * @returns {boolean} 是否已选择
 */
const isUpdateKnowledgeSelected = (id) => {
  return searchCriteria.knowledge_point_ids.includes(id);
};

/**
 * 移除更新界面知识点
 * @param {number} id - 要移除的知识点ID
 */
const removeUpdateKnowledgePoint = (id) => {
  searchCriteria.knowledge_point_ids = searchCriteria.knowledge_point_ids.filter(
    (kp) => kp !== id
  );
};

/**
 * 更新界面选择副知识点
 * @param {Object} node - 知识点节点
 */
const selectUpdateSubKnowledgePoint = (node) => {
  const id = node.id;

  // 检查是否已选择
  const index = searchCriteria.sub_knowledge_point_ids.indexOf(id);
  if (index === -1) {
    // 未选择，添加到数组
    searchCriteria.sub_knowledge_point_ids.push(id);
  } else {
    // 已选择，从数组中移除
    searchCriteria.sub_knowledge_point_ids.splice(index, 1);
  }

  // 清空搜索并重置树显示
  updateSubKnowledgeSearch.value = "";
  filterUpdateSubKnowledgeTree();
};

/**
 * 移除更新界面副知识点
 * @param {number} id - 要移除的副知识点ID
 */
const removeUpdateSubKnowledgePoint = (id) => {
  searchCriteria.sub_knowledge_point_ids = searchCriteria.sub_knowledge_point_ids.filter(
    (kp) => kp !== id
  );
};

// ==================== 更新界面解题思想多选方法 ====================
/**
 * 更新界面选择解题思想
 * @param {Object} item - 解题思想对象
 */
const selectUpdateSolutionIdea = (item) => {
  if (!searchCriteria.solution_idea_ids.includes(item.id)) {
    searchCriteria.solution_idea_ids.push(item.id);
  }
  updateSolutionIdeaSearch.value = "";
  showUpdateSolutionIdeaDropdown.value = false;
};

/**
 * 检查更新界面解题思想是否已选择
 * @param {number} id - 解题思想ID
 * @returns {boolean} 是否已选择
 */
const isUpdateSolutionIdeaSelected = (id) => {
  return searchCriteria.solution_idea_ids.includes(id);
};

/**
 * 移除更新界面解题思想
 * @param {number} id - 要移除的解题思想ID
 */
const removeUpdateSolutionIdea = (id) => {
  searchCriteria.solution_idea_ids = searchCriteria.solution_idea_ids.filter(
    (itemId) => itemId !== id
  );
};

// ==================== 更新界面问题类别多选方法 ====================
/**
 * 更新界面选择问题类别
 * @param {Object} item - 问题类别对象
 */
const selectUpdateQuestionCategory = (item) => {
  if (!searchCriteria.question_category_ids.includes(item.id)) {
    searchCriteria.question_category_ids.push(item.id);
  }
  updateQuestionCategorySearch.value = "";
  showUpdateQuestionCategoryDropdown.value = false;
};

/**
 * 检查更新界面问题类别是否已选择
 * @param {number} id - 问题类别ID
 * @returns {boolean} 是否已选择
 */
const isUpdateQuestionCategorySelected = (id) => {
  return searchCriteria.question_category_ids.includes(id);
};

/**
 * 移除更新界面问题类别
 * @param {number} id - 要移除的问题类别ID
 */
const removeUpdateQuestionCategory = (id) => {
  searchCriteria.question_category_ids = searchCriteria.question_category_ids.filter(
    (itemId) => itemId !== id
  );
};

/**
 * 清除更新界面问题类别选择
 */
const clearUpdateQuestionCategory = () => {
  searchCriteria.question_category_ids = [];
  updateQuestionCategorySearch.value = "";
};

/**
 * 更新界面选择年级
 * @param {Object} grade - 年级对象
 */
const selectUpdateGrade = (grade) => {
  if (!searchCriteria.grade_ids.includes(grade.id)) {
    searchCriteria.grade_ids.push(grade.id);
  }
  updateGradeSearch.value = "";
  showUpdateGradeDropdown.value = false;
};

/**
 * 检查更新界面年级是否已选择
 * @param {number} id - 年级ID
 * @returns {boolean} 是否已选择
 */
const isUpdateGradeSelected = (id) => {
  return searchCriteria.grade_ids.includes(id);
};

/**
 * 移除更新界面年级
 * @param {number} id - 要移除的年级ID
 */
const removeUpdateGrade = (id) => {
  searchCriteria.grade_ids = searchCriteria.grade_ids.filter((gradeId) => gradeId !== id);
};

/**
 * 检查更新界面难度是否已选择
 * @param {number} level - 难度级别
 * @returns {boolean} 是否已选择
 */
const isUpdateDifficultySelected = (level) => {
  return searchCriteria.difficulty_levels.includes(level);
};

/**
 * 选择或取消选择难度级别
 * @param {number} level - 难度级别
 */
const toggleUpdateDifficulty = (level) => {
  if (isUpdateDifficultySelected(level)) {
    // 如果已经选择，则移除
    searchCriteria.difficulty_levels = searchCriteria.difficulty_levels.filter(
      (l) => l !== level
    );
  } else {
    // 如果未选择，则添加
    searchCriteria.difficulty_levels.push(level);
  }
};

// ==================== 更新表单知识点选择方法 ====================
/**
 * 清除更新表单知识点选择
 */
const clearUpdateFormKnowledgePoint = () => {
  selectedUpdateFormKnowledgePoint.value = null;
  updateForm.knowledge_point_id = null;
  updateFormKnowledgeSearch.value = "";
  filterUpdateFormKnowledgeTree();
};

// ==================== 更新表单问题类别单选方法 ====================
/**
 * 更新表单选择问题类别
 * @param {Object} item - 问题类别对象
 */
const selectUpdateFormQuestionCategory = (item) => {
  selectedUpdateFormQuestionCategory.value = item;
  updateForm.question_category_id = item.id;
  updateFormQuestionCategorySearch.value = item.name;
  showUpdateFormQuestionCategoryDropdown.value = false;
  handleUpdateQuestionCategoryChange();
};

/**
 * 清除更新表单问题类别选择
 */
const clearUpdateFormQuestionCategory = () => {
  selectedUpdateFormQuestionCategory.value = null;
  updateForm.question_category_id = null;
  updateFormQuestionCategorySearch.value = "";
  handleUpdateQuestionCategoryChange();
};

// ==================== 更新表单解题思想多选方法 ====================
/**
 * 更新表单选择解题思想
 * @param {Object} item - 解题思想对象
 */
const selectUpdateFormSolutionIdea = (item) => {
  if (!updateForm.solution_idea_ids.includes(item.id)) {
    updateForm.solution_idea_ids.push(item.id);
  }
  updateFormSolutionIdeaSearch.value = "";
  showUpdateFormSolutionIdeaDropdown.value = false;
};

/**
 * 检查更新表单解题思想是否已选择
 * @param {number} id - 解题思想ID
 * @returns {boolean} 是否已选择
 */
const isUpdateFormSolutionIdeaSelected = (id) => {
  return updateForm.solution_idea_ids.includes(id);
};

/**
 * 移除更新表单解题思想
 * @param {number} id - 要移除的解题思想ID
 */
const removeUpdateFormSolutionIdea = (id) => {
  updateForm.solution_idea_ids = updateForm.solution_idea_ids.filter(
    (itemId) => itemId !== id
  );
};

// ==================== 更新表单副知识点选择方法 ====================
/**
 * 选择更新表单副知识点
 */
const selectUpdateFormSubKnowledgePoint = (node) => {
  const id = node.id;

  // 检查是否已选择
  const index = updateForm.sub_knowledge_point_ids.indexOf(id);
  if (index === -1) {
    // 未选择，添加到数组
    updateForm.sub_knowledge_point_ids.push(id);
  } else {
    // 已选择，从数组中移除
    updateForm.sub_knowledge_point_ids.splice(index, 1);
  }

  // 清空搜索并重置树显示
  updateFormSubKnowledgeSearch.value = "";
  filterUpdateFormSubKnowledgeTree();
};

/**
 * 检查更新表单副知识点是否已选择
 * @param {number} id - 副知识点ID
 * @returns {boolean} 是否已选择
 */
const isUpdateFormSubKnowledgeSelected = (id) => {
  return updateForm.sub_knowledge_point_ids.includes(id);
};

/**
 * 移除更新表单副知识点
 */
const removeUpdateFormSubKnowledgePoint = (id) => {
  updateForm.sub_knowledge_point_ids = updateForm.sub_knowledge_point_ids.filter(
    (kpId) => kpId !== id
  );
  filterUpdateFormSubKnowledgeTree();
};

// ==================== 图片预览方法 ====================
/**
 * 预览图片
 * @param {string} url - 图片URL
 */
const previewImage = (url) => {
  previewImageUrl.value = url;
  showImagePreview.value = true;
};

/**
 * 关闭图片预览
 */
const closeImagePreview = () => {
  showImagePreview.value = false;
  previewImageUrl.value = "";
};

// ==================== 审核题目相关方法 ====================
/**
 * 获取当前用户信息
 */
/**
 * 获取当前用户信息
 */
const getCurrentUser = () => {
  // 从 localStorage 获取当前用户名
  currentUser.value = localStorage.getItem("userName") || "";
  // 最后检查是否获取到用户名
  if (!currentUser.value) {
    console.error("无法获取当前用户名，请检查localStorage中是否有userName字段");
  }
};

/**
 * 获取教师列表并过滤审核人
 */
const loadReviewerList = async () => {
  try {
    loadingReviewers.value = true;
    reviewerLoadError.value = false;

    // 并行获取教师列表和角色列表
    const [staffResponse, roleResponse] = await Promise.all([
      axios.get(`${API_BASE}/user/getStaffList`),
      axios.get(`${API_BASE}/questions/getRoleList`)
    ]);

    if (staffResponse.data.code === 200 && staffResponse.data.data) {
      // 保存完整的教师列表
      staffList.value = staffResponse.data.data;

      // 处理角色映射关系
      let roleMap = {};
      if (roleResponse.data.code === 200 && roleResponse.data.data) {
        roleResponse.data.data.forEach(role => {
          roleMap[role.id] = role.role_name;
        });
      }

      // 过滤出有审核权限的用户 (role是1或2，对应ROLE_ROOT和ROLE_ADMINISTRATOR)
      reviewerOptions.value = staffList.value
        .filter(user => {
          if (!user || user.role === undefined || user.role === null) {
            return false;
          }

          // 获取用户角色ID
          const userRoleId = Number(user.role);

          // 检查是否是ROOT或ADMINISTRATOR
          const isReviewer = userRoleId === 1 || userRoleId === 2; // 1: ROLE_ROOT, 2: ROLE_ADMINISTRATOR

          // 获取角色名称用于日志
          const roleName = roleMap[userRoleId] || `未知角色(ID:${userRoleId})`;

          // 排除当前用户自己
          if (currentUser.value && user.account === currentUser.value) {
            return false;
          }

          return isReviewer;
        })
        .map(user => ({
          id: user.id,
          account: user.account,
          name: user.name || user.account,
          role_id: user.role,
          role_name: roleMap[user.role] || `角色ID:${user.role}`
        }));

      if (reviewerOptions.value.length === 0) {
        console.warn("没有找到符合条件的审核人");
        ElMessage.warning("没有找到符合条件的审核人，请确保有ROOT或ADMINISTRATOR权限的教师账户");
      }

    } else {
      console.error("获取教师列表失败:", staffResponse.data.message);
      reviewerLoadError.value = true;
      ElMessage.error("获取审核人列表失败");
    }
  } catch (err) {
    console.error("获取教师列表失败:", err);
    reviewerLoadError.value = true;
    ElMessage.error("获取审核人列表失败");
  } finally {
    loadingReviewers.value = false;
  }
};

/**
 * 获取审核人名称
 */
const getReviewerName = (account) => {
  const reviewer = reviewerOptions.value.find(r => r.account === account);
  return reviewer ? (reviewer.name || reviewer.account) : account;
};

// ==================== 下拉框失焦处理方法 ====================
// 这些方法使用setTimeout延迟隐藏下拉框，确保点击选项能够正常触发
const onKnowledgeBlur = () => {
  setTimeout(() => {
    showKnowledgeDropdown.value = false;
  }, 200);
};

const onSubKnowledgeBlur = () => {
  setTimeout(() => {
    showSubKnowledgeDropdown.value = false;
  }, 200);
};

const onSolutionIdeaBlur = () => {
  setTimeout(() => {
    showSolutionIdeaDropdown.value = false;
  }, 200);
};

const onQuestionCategoryBlur = () => {
  setTimeout(() => {
    showQuestionCategoryDropdown.value = false;
  }, 200);
};

const onUpdateKnowledgeBlur = () => {
  setTimeout(() => {
    showUpdateKnowledgeDropdown.value = false;
  }, 200);
};

const onUpdateSolutionIdeaBlur = () => {
  setTimeout(() => {
    showUpdateSolutionIdeaDropdown.value = false;
  }, 200);
};

const onUpdateQuestionCategoryBlur = () => {
  setTimeout(() => {
    showUpdateQuestionCategoryDropdown.value = false;
  }, 200);
};

const onUpdateGradeBlur = () => {
  setTimeout(() => {
    showUpdateGradeDropdown.value = false;
  }, 200);
};

const onUpdateFormKnowledgeBlur = () => {
  setTimeout(() => {
    showUpdateFormKnowledgeDropdown.value = false;
  }, 200);
};

const onUpdateFormSolutionIdeaBlur = () => {
  setTimeout(() => {
    showUpdateFormSolutionIdeaDropdown.value = false;
  }, 200);
};

const onUpdateFormQuestionCategoryBlur = () => {
  setTimeout(() => {
    showUpdateFormQuestionCategoryDropdown.value = false;
  }, 200);
};

const onUpdateFormSubKnowledgeBlur = () => {
  setTimeout(() => {
    showUpdateFormSubKnowledgeDropdown.value = false;
  }, 200);
};

// ==================== 列表过滤方法 ====================
/**
 * 过滤知识点列表
 */
const filterKnowledgePoints = () => {
  if (!knowledgeSearch.value) {
    filteredKnowledgePoints.value = knowledgePointList.value;
  } else {
    filteredKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
      kp.name.toLowerCase().includes(knowledgeSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤副知识点列表
 */
const filterSubKnowledgePoints = () => {
  if (!subKnowledgeSearch.value) {
    filteredSubKnowledgePoints.value = knowledgePointList.value;
  } else {
    filteredSubKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
      kp.name.toLowerCase().includes(subKnowledgeSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤解题思想列表
 */
const filterSolutionIdeas = () => {
  if (!solutionIdeaSearch.value) {
    filteredSolutionIdeas.value = solutionIdeaList.value;
  } else {
    filteredSolutionIdeas.value = solutionIdeaList.value.filter((item) =>
      item.name.toLowerCase().includes(solutionIdeaSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤问题类别列表
 */
const filterQuestionCategories = () => {
  if (!questionCategorySearch.value) {
    filteredQuestionCategories.value = questionCategoryList.value;
  } else {
    filteredQuestionCategories.value = questionCategoryList.value.filter((item) =>
      item.name.toLowerCase().includes(questionCategorySearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新界面知识点列表
 */
const filterUpdateKnowledgePoints = () => {
  if (!updateKnowledgeSearch.value) {
    filteredUpdateKnowledgePoints.value = knowledgePointList.value;
  } else {
    filteredUpdateKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
      kp.name.toLowerCase().includes(updateKnowledgeSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新界面解题思想列表
 */
const filterUpdateSolutionIdeas = () => {
  if (!updateSolutionIdeaSearch.value) {
    filteredUpdateSolutionIdeas.value = solutionIdeaList.value;
  } else {
    filteredUpdateSolutionIdeas.value = solutionIdeaList.value.filter((item) =>
      item.name.toLowerCase().includes(updateSolutionIdeaSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新界面问题类别列表
 */
const filterUpdateQuestionCategories = () => {
  if (!updateQuestionCategorySearch.value) {
    filteredUpdateQuestionCategories.value = questionCategoryList.value;
  } else {
    filteredUpdateQuestionCategories.value = questionCategoryList.value.filter((item) =>
      item.name.toLowerCase().includes(updateQuestionCategorySearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新界面年级列表
 */
const filterUpdateGrades = () => {
  if (!updateGradeSearch.value) {
    filteredUpdateGrades.value = gradeList.value;
  } else {
    filteredUpdateGrades.value = gradeList.value.filter((grade) =>
      grade.name.toLowerCase().includes(updateGradeSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新表单知识点列表
 */
const filterUpdateFormKnowledgePoints = () => {
  if (!updateFormKnowledgeSearch.value) {
    filteredUpdateFormKnowledgePoints.value = knowledgePointList.value;
  } else {
    filteredUpdateFormKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
      kp.name.toLowerCase().includes(updateFormKnowledgeSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新表单解题思想列表
 */
const filterUpdateFormSolutionIdeas = () => {
  if (!updateFormSolutionIdeaSearch.value) {
    filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value;
  } else {
    filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value.filter((item) =>
      item.name.toLowerCase().includes(updateFormSolutionIdeaSearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新表单问题类别列表
 */
const filterUpdateFormQuestionCategories = () => {
  if (!updateFormQuestionCategorySearch.value) {
    filteredUpdateFormQuestionCategories.value = questionCategoryList.value;
  } else {
    filteredUpdateFormQuestionCategories.value = questionCategoryList.value.filter(
      (item) =>
        item.name
          .toLowerCase()
          .includes(updateFormQuestionCategorySearch.value.toLowerCase())
    );
  }
};

/**
 * 过滤更新表单副知识点树
 */
const filterUpdateFormSubKnowledgeTree = () => {
  if (!updateFormSubKnowledgeSearch.value) {
    updateFormSubKnowledgeTreeData.value = sortTreeByOrder(JSON.parse(JSON.stringify(originalUpdateFormSubKnowledgeTreeData.value)));
  } else {
    const filtered = filterTreeByKeyword(
      JSON.parse(JSON.stringify(originalUpdateFormSubKnowledgeTreeData.value)),
      updateFormSubKnowledgeSearch.value
    );
    updateFormSubKnowledgeTreeData.value = sortTreeByOrder(filtered);
  }
};

const resetFilteredList = (type) => {
  switch (type) {
    // =========== 上传界面 ===========
    case "subKnowledge":
      filteredSubKnowledgePoints.value = knowledgePointList.value;
      break;
    case "solutionIdea":
      filteredSolutionIdeas.value = solutionIdeaList.value;
      break;

    // =========== 更新界面 ===========
    case "updateKnowledge":
      filteredUpdateKnowledgePoints.value = knowledgePointList.value;
      break;
    case "updateSubKnowledge":
      filteredUpdateSubKnowledgePoints.value = knowledgePointList.value;
      break;
    case "updateSolutionIdea":
      filteredUpdateSolutionIdeas.value = solutionIdeaList.value;
      break;

    // =========== 更新表单 ===========
    case "updateFormSolutionIdea":
      filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value;
      break;
    case "updateFormSubKnowledge":
      filteredUpdateFormSubKnowledgePoints.value = knowledgePointList.value;
      break;
    case "updateGrade":
      filteredUpdateGrades.value = gradeList.value;
      break;
  }
};

// ==================== 图片上传配置 ====================
const IMAGE_BED_CONFIG = {
  apiUrl: "https://xxwpic.flito.art/api/index.php", // 图床API地址
  token: "1c17b11693cb5ec63859b091c5b9c1b2", // 图床API令牌
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
 * 上传待处理的图片（在表单提交时调用）
 * @param {string} mode - 模式：'upload' 或 'update'
 * @returns {Promise<boolean>} 是否上传成功
 */
const uploadPendingImage = async (mode) => {
  try {
    const formData = mode === "upload" ? form : updateForm;

    if (!formData.pendingImages || formData.pendingImages.length === 0) {
      return true; // 没有待上传的图片，直接返回成功
    }

    ElMessage.warning("图片正在上传到图床...");

    // 上传所有待处理的图片
    for (const img of formData.pendingImages) {
      // 上传到图床
      const imageUrl = await uploadToImageBed(img.file);

      // 使用图床返回的URL替换预览URL
      // 在所有字段中替换临时URL
      const fields = ["title", "remark", "answer", "notes", "img_url"];
      fields.forEach((key) => {
        if (formData[key] && typeof formData[key] === "string") {
          formData[key] = formData[key].replaceAll(img.localUrl, imageUrl);
        }
      });

      // 替换选项中的临时URL
      if (formData.options) {
        formData.options = formData.options.map((opt) => {
          if (opt.text && typeof opt.text === "string") {
            opt.text = opt.text.replaceAll(img.localUrl, imageUrl);
          }
          return opt;
        });
      }
    }

    // 清空待处理图片
    formData.pendingImages = [];

    return true;
  } catch (error) {
    console.error("图片上传失败:", error);
    ElMessage.error("上传失败");
    return false;
  }
};

/**
 * 获取 textarea 对应字段和表单对象
 * 这里通过 data-form="form" 或 data-form="updateForm" 来区分
 */
const getFormInfo = (textarea) => {
  const formName = textarea.dataset.form;
  const field = textarea.dataset.field;
  const optIndex = textarea.dataset.opt;

  const formObject = formName === "updateForm" ? updateForm : form;

  const optObj = optIndex !== undefined ? formObject.options[optIndex] : null;

  return { formObject, field, optObj };
};

const handlePaste = async (event) => {
  const textarea = event.target;
  const { formObject, field, optObj } = getFormInfo(textarea);
  if (!formObject || !field) return;

  const items = event.clipboardData.items;

  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      const localUrl = URL.createObjectURL(file);

      if (!formObject.pendingImages) formObject.pendingImages = [];
      formObject.pendingImages.push({ file, localUrl });

      insertImageMarkdown(localUrl, textarea, formObject, field, optObj);
    }
  }
};

const pendingImages = reactive([]);

const handleDrop = async (event) => {
  const textarea = event.target;
  const { formObject, field, optObj } = getFormInfo(textarea);
  if (!formObject || !field) return;

  for (let file of event.dataTransfer.files) {
    if (file.type.startsWith("image/")) {
      const localUrl = URL.createObjectURL(file);

      if (!formObject.pendingImages) formObject.pendingImages = [];
      formObject.pendingImages.push({ file, localUrl });

      insertImageMarkdown(localUrl, textarea, formObject, field, optObj);
    }
  }
};

/**
 * 插入 Markdown 图片
 */
const insertImageMarkdown = (url, textarea, formObject, field, optObj) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const targetObj = optObj || formObject;
  const oldText = targetObj[field] || "";
  const markdown = `![image](${url})`;

  targetObj[field] = oldText.slice(0, start) + markdown + oldText.slice(end);

  textarea.setSelectionRange(start + markdown.length, start + markdown.length);
};

// ==================== 记忆功能 ====================
/**
 * 保存上传记忆到localStorage
 */
const saveUploadMemory = () => {
  uploadMemory.value = {
    school_id: form.school_id,
    grade_id: form.grade_id,
    subject_id: form.subject_id,
    question_category_id: form.question_category_id,
    marking_type: form.marking_type,
    difficulty_level: form.difficulty_level,
  };
  localStorage.setItem("uploadMemory", JSON.stringify(uploadMemory.value));
};

// ==================== 生命周期和数据加载 ====================
/**
 * 组件挂载时执行
 */
const isDataInitialized = ref(false);

onMounted(async () => {
  // 1. 先加载所有列表数据 - 使用 await 确保数据加载完成
  await loadLists();

  // 2. 加载其他数据
  getCurrentUser();
  loadReviewerList();
  fetchKnowledgePointList();

  // 3. 数据加载完成后再检查是否有再次上传的数据
  const reuploadData = localStorage.getItem('reuploadQuestionData');
  if (reuploadData) {
    try {
      const questionData = JSON.parse(reuploadData);

      // ============ 立即恢复的数据 ============
      // 基础字段
      form.school_id = questionData.school_id;
      form.grade_id = questionData.grade_id;
      form.subject_id = questionData.subject_id;
      form.marking_type = questionData.marking_type || 0;
      form.difficulty_level = questionData.difficulty_level;
      form.title = questionData.title || "";
      form.answer = questionData.answer || "";
      form.notes = questionData.notes || "";
      form.remark = questionData.remark || "";
      form.img_url = questionData.img_url || "";

      // 恢复副知识点
      form.sub_knowledge_point_ids =
        questionData.sub_knowledge_point_ids ||
        questionData.subKnowledgePointIds ||
        [];

      // 恢复解题思想
      form.solution_idea_ids =
        questionData.solution_idea_ids ||
        questionData.solutionIdeaIds ||
        [];

      // 恢复选项
      if (questionData.options && Array.isArray(questionData.options)) {
        form.options = questionData.options;
      }

      // ============ 问题类别恢复 ============
      if (questionData.question_category_id) {
        const categoryId = Number(questionData.question_category_id);
        const category = questionCategoryList.value.find(c => c.id === categoryId);

        if (category) {
          // 1. 先保存所有需要恢复的数据
          const savedAnswer = questionData.answer || "";
          const savedOptions = questionData.options || [];
          const savedSingleAnswerIndex = (() => {
            if (savedOptions.length && savedAnswer) {
              const index = savedOptions.findIndex((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                return savedAnswer === letter;
              });
              return index !== -1 ? index : null;
            }
            return null;
          })();

          // 2. 设置问题类别
          selectedQuestionCategory.value = category;
          form.question_category_id = category.id;
          questionCategorySearch.value = category.name;

          // 3. 先恢复选项
          if (savedOptions.length) {
            form.options = savedOptions;
          }

          // 4. 调用处理函数（修改后的版本不会清空重要数据）
          handleQuestionCategoryChange();

          // 5. 恢复答案
          const isChoiceQuestion = category.name === "单选题" ||
            category.name.includes("单选") ||
            category.name === "多选题" ||
            category.name.includes("多选");

          if (isChoiceQuestion) {
            // 选择题：恢复单选索引
            if (savedSingleAnswerIndex !== null) {
              singleAnswerIndex.value = savedSingleAnswerIndex;
            }
          } else {
            // 主观题：恢复文本答案
            form.answer = savedAnswer;
          }

          // 6. 更新记忆
          uploadMemory.value.question_category_id = category.id;
          saveUploadMemory();
        }
      }

      // ============ 恢复单选题答案 ============
      if (questionData.options && questionData.answer && selectedQuestionCategory.value) {
        const questionCategoryName = selectedQuestionCategory.value.name;
        if (questionCategoryName === '单选题' || questionCategoryName?.includes('单选')) {
          const answerIndex = questionData.options.findIndex((opt, index) => {
            const letter = String.fromCharCode(65 + index);
            return questionData.answer === letter;
          });
          if (answerIndex !== -1) {
            singleAnswerIndex.value = answerIndex;
          }
        }
      }

      // ============ 知识点恢复 ============
      // 先保存知识点ID，但不要立即设置到form
      const pendingKnowledgeId = questionData.knowledge_point_id
        ? Number(questionData.knowledge_point_id)
        : null;

      if (pendingKnowledgeId) {
        console.log('准备恢复知识点ID:', pendingKnowledgeId);

        // 定义查找并选中知识点的函数
        const selectKnowledgeNode = (nodes) => {
          for (const node of nodes) {
            if (node.id === pendingKnowledgeId) {
              // 选中知识点
              selectedKnowledgePoint.value = node;
              form.knowledge_point_id = node.id;
              console.log('知识点恢复成功:', node.name);
              return true;
            }
            if (node.children && node.children.length) {
              if (selectKnowledgeNode(node.children)) {
                // 展开父节点
                node.expanded = true;
                return true;
              }
            }
          }
          return false;
        };

        // 检查知识点树是否已加载
        if (knowledgeTreeData.value && knowledgeTreeData.value.length > 0) {
          // 已加载，直接选中
          selectKnowledgeNode(knowledgeTreeData.value);
        } else {
          // 未加载，等待知识点树加载完成
          console.log('知识点树尚未加载，等待加载...');

          // 监听知识点树数据变化
          const unwatch = watch(
            () => knowledgeTreeData.value,
            (newTree) => {
              if (newTree && newTree.length > 0) {
                console.log('知识点树已加载，开始恢复知识点');
                const found = selectKnowledgeNode(newTree);
                if (found) {
                  ElMessage.success(`已恢复知识点: ${selectedKnowledgePoint.value?.name}`);
                } else {
                  console.warn('未找到知识点ID:', pendingKnowledgeId);
                }
                unwatch(); // 停止监听
              }
            },
            { immediate: true } // 立即检查一次，防止错过
          );

          // 设置超时，避免无限等待
          setTimeout(() => {
            unwatch();
            if (!selectedKnowledgePoint.value) {
              console.warn('知识点树加载超时，请手动选择知识点');
              // 即使超时，也设置form的值，至少保证提交时有知识点ID
              form.knowledge_point_id = pendingKnowledgeId;
            }
          }, 5000);
        }
      }

      // ============ 审核人恢复 ============
      const savedReviewer = localStorage.getItem('reuploadReviewer') || questionData.reviewer;
      if (savedReviewer) {
        if (reviewerOptions.value.length > 0) {
          const reviewerExists = reviewerOptions.value.some(r => r.account === savedReviewer);
          if (reviewerExists) {
            selectedReviewer.value = savedReviewer;
            ElMessage.success(`已恢复审核人: ${getReviewerName(savedReviewer)}`);
          } else {
            console.warn('审核人不在列表中:', savedReviewer);
          }
        } else {
          const unwatch = watch(reviewerOptions, (reviewers) => {
            if (reviewers.length > 0) {
              const reviewerExists = reviewers.some(r => r.account === savedReviewer);
              if (reviewerExists) {
                selectedReviewer.value = savedReviewer;
                ElMessage.success(`已恢复审核人: ${getReviewerName(savedReviewer)}`);
              } else {
                console.warn('审核人不在列表中:', savedReviewer);
              }
              unwatch();
            }
          }, { immediate: true });

          setTimeout(() => {
            unwatch();
          }, 5000);
        }
      }

      ElMessage.success('已恢复被拒绝的题目数据，请修改后重新提交');

      // ============ 清除存储的数据 ============
      localStorage.removeItem('reuploadQuestionData');
      localStorage.removeItem('reuploadUploader');
      localStorage.removeItem('reuploadReviewer');
      localStorage.removeItem('reuploadQuestionId');
      localStorage.removeItem('reuploadQuestionCategoryId');
      localStorage.removeItem('sub_knowledge_point_ids');
      localStorage.removeItem('subKnowledgePointIds');
      localStorage.removeItem('solution_idea_ids');
      localStorage.removeItem('solutionIdeaIds');

    } catch (error) {
      console.error('恢复题目数据失败:', error);
      ElMessage.error('恢复题目数据失败');
      // 清理所有可能的数据
      localStorage.removeItem('reuploadQuestionData');
      localStorage.removeItem('reuploadUploader');
      localStorage.removeItem('reuploadReviewer');
      localStorage.removeItem('reuploadQuestionId');
      localStorage.removeItem('reuploadQuestionCategoryId');
      localStorage.removeItem('sub_knowledge_point_ids');
      localStorage.removeItem('subKnowledgePointIds');
      localStorage.removeItem('solution_idea_ids');
      localStorage.removeItem('solutionIdeaIds');
    }
  }
});

/**
 * 加载所有数据列表
 */
const loadLists = async () => {
  try {
    // 并行请求学校、年级、科目、解题思想、问题类别
    const [s, g, sub, si, qc] = await Promise.all([
      axios.get(`${API_BASE}/questions/getSchoolList`),
      axios.get(`${API_BASE}/questions/getGradeList`),
      axios.get(`${API_BASE}/questions/getSubjectList`),
      axios.get(`${API_BASE}/questions/getSolutionIdeaList`),
      axios.get(`${API_BASE}/questions/getQuestionCategoryList`),
    ]);

    // 处理学校列表数据
    schoolList.value = Object.entries(s.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));

    // 处理年级列表数据
    gradeList.value = Object.entries(g.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));

    // 处理科目列表数据
    subjectList.value = Object.entries(sub.data.data || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));

    // 处理解题思想列表数据
    solutionIdeaList.value = Object.entries(si.data.data || {}).map(([id, name]) => ({
      id: parseInt(id),
      name,
    }));

    // 处理问题类别列表数据
    questionCategoryList.value = Object.entries(qc.data.data || {}).map(([id, name]) => ({
      id: parseInt(id),
      name,
    }));

    // 初始化所有过滤后的列表（移除知识点相关）
    filteredSolutionIdeas.value = solutionIdeaList.value;
    filteredQuestionCategories.value = questionCategoryList.value;

    filteredUpdateSolutionIdeas.value = solutionIdeaList.value;
    filteredUpdateQuestionCategories.value = questionCategoryList.value;

    filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value;
    filteredUpdateFormQuestionCategories.value = questionCategoryList.value;

    if (uploadMemory.value.question_category_id) {
      const rememberedCategory = questionCategoryList.value.find(
        (category) => category.id === uploadMemory.value.question_category_id
      );
      if (rememberedCategory) {
        selectedQuestionCategory.value = rememberedCategory;
        form.question_category_id = rememberedCategory.id;
        questionCategorySearch.value = rememberedCategory.name;
      } else {
        // 如果记忆的类别不存在，清除记忆
        uploadMemory.value.question_category_id = null;
        saveUploadMemory();
      }
    }

    // 返回成功状态
    return true;
  } catch (err) {
    console.error("获取列表失败:", err);
    ElMessage.error("获取列表失败");
    return false;
  }
};

// ==================== 知识点树相关方法 ====================
/**
 * 按 sort_order 排序知识点树
 * @param {Array} nodes - 知识点树节点数组
 * @returns {Array} 排序后的节点数组
 */
const sortTreeByOrder = (nodes) => {
  if (!nodes || !nodes.length) return nodes;

  // 对当前层级的节点按 sort_order 排序
  const sortedNodes = nodes.sort((a, b) => {
    const orderA = Number(a.sort_order) || 0;
    const orderB = Number(b.sort_order) || 0;
    return orderA - orderB;
  });

  // 递归排序子节点
  sortedNodes.forEach((node) => {
    if (node.children && node.children.length) {
      node.children = sortTreeByOrder(node.children);
    }
  });

  return sortedNodes;
};

// ==================== 按 sort_order 排序的知识点树计算属性 ====================

/**
 * 按 sort_order 排序的上传知识点树
 */
const sortedKnowledgeTreeData = computed(() => {
  return sortTreeByOrder(JSON.parse(JSON.stringify(knowledgeTreeData.value)));
});

/**
 * 按 sort_order 排序的上传副知识点树
 */
const sortedSubKnowledgeTreeData = computed(() => {
  return sortTreeByOrder(JSON.parse(JSON.stringify(subKnowledgeTreeData.value)));
});

/**
 * 按 sort_order 排序的更新界面知识点树
 */
const sortedUpdateKnowledgeTreeData = computed(() => {
  return sortTreeByOrder(JSON.parse(JSON.stringify(updateKnowledgeTreeData.value)));
});

/**
 * 按 sort_order 排序的更新界面副知识点树
 */
const sortedUpdateSubKnowledgeTreeData = computed(() => {
  return sortTreeByOrder(JSON.parse(JSON.stringify(updateSubKnowledgeTreeData.value)));
});

/**
 * 按 sort_order 排序的更新表单知识点树
 */
const sortedUpdateFormKnowledgeTreeData = computed(() => {
  return sortTreeByOrder(JSON.parse(JSON.stringify(updateFormKnowledgeTreeData.value)));
});

/**
 * 按 sort_order 排序的更新表单副知识点树
 */
const sortedUpdateFormSubKnowledgeTreeData = computed(() => {
  return sortTreeByOrder(JSON.parse(JSON.stringify(updateFormSubKnowledgeTreeData.value)));
});

/**
 * 加载知识点树数据
 * @param {string} type - 类型：'upload', 'uploadSub', 'update', 'updateForm', 'updateFormSub'
 * @param {number} subjectId - 科目ID
 * @param {number} gradeId - 年级ID
 */
const loadKnowledgeTree = async (type, subjectId, gradeId) => {
  if (!subjectId || !gradeId) return;

  try {
    // 设置加载状态
    switch (type) {
      case "upload":
        loadingKnowledgePoints.value = true;
        break;
      case "uploadSub":
        loadingKnowledgePoints.value = true;
        break;
      case "update":
        loadingUpdateKnowledgePoints.value = true;
        break;
      case "updateForm":
      case "updateFormSub":
        loadingUpdateFormKnowledgePoints.value = true;
        break;
    }

    const url = `${API_BASE}/questions/getKnowledgePointJson/${subjectId}/${gradeId}`;
    const res = await axios.get(url);
    const data = res.data.data || [];

    // 添加展开属性，并按 sort_order 排序
    const addExpandedProperty = (nodes) => {
      // 首先对当前层级的节点按 sort_order 排序
      const sortedNodes = nodes.sort((a, b) => {
        const orderA = Number(a.sort_order) || 0;
        const orderB = Number(b.sort_order) || 0;
        return orderA - orderB;
      });

      return sortedNodes.map((node) => {
        const newNode = {
          ...node,
          expanded: true, // 默认展开所有节点
        };
        if (node.children && node.children.length) {
          // 递归处理子节点
          newNode.children = addExpandedProperty(node.children);
        }
        return newNode;
      });
    };

    const treeData = addExpandedProperty(data);

    // 根据类型设置数据
    switch (type) {
      case "upload":
        knowledgeTreeData.value = treeData;
        originalKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
        break;
      case "uploadSub":
        subKnowledgeTreeData.value = treeData;
        originalSubKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
        break;
      case "update":
        updateKnowledgeTreeData.value = treeData;
        originalUpdateKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
        break;
      case "updateForm":
        updateFormKnowledgeTreeData.value = treeData;
        originalUpdateFormKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
        break;
      case "updateFormSub":
        updateFormSubKnowledgeTreeData.value = treeData;
        originalUpdateFormSubKnowledgeTreeData.value = JSON.parse(
          JSON.stringify(treeData)
        );
        break;
    }
  } catch (err) {
    console.error(`加载知识点树失败(${type}):`, err);
    ElMessage.error("加载知识点失败");
  } finally {
    // 清除加载状态
    switch (type) {
      case "upload":
      case "uploadSub":
        loadingKnowledgePoints.value = false;
        break;
      case "update":
        loadingUpdateKnowledgePoints.value = false;
        break;
      case "updateForm":
      case "updateFormSub":
        loadingUpdateFormKnowledgePoints.value = false;
        break;
    }
  }
};

/**
 * 搜索过滤知识点树
 * @param {Array} nodes - 节点数组
 * @param {string} keyword - 关键词
 * @returns {Array} 过滤后的节点数组
 */
const filterTreeByKeyword = (nodes, keyword) => {
  if (!keyword) return sortTreeByOrder(nodes);

  const filtered = [];

  nodes.forEach((node) => {
    const newNode = { ...node };

    // 如果节点名称匹配关键词，包含该节点
    if (node.name.toLowerCase().includes(keyword.toLowerCase())) {
      newNode.expanded = true; // 搜索匹配的节点自动展开
      filtered.push(newNode);
    }
    // 如果不匹配，检查子节点
    else if (node.children && node.children.length) {
      const filteredChildren = filterTreeByKeyword(node.children, keyword);
      if (filteredChildren.length > 0) {
        newNode.children = filteredChildren;
        newNode.expanded = true; // 自动展开有匹配子节点的父节点
        filtered.push(newNode);
      }
    }
  });

  // 过滤后按 sort_order 排序
  return sortTreeByOrder(filtered);
};

// ==================== 上传界面的知识点树方法 ====================

/**
 * 监听科目和年级变化，加载知识点树
 */
watch(
  () => [form.subject_id, form.grade_id],
  ([subjectId, gradeId], oldValues) => {
    // 获取旧值，如果没有旧值则使用空数组
    const [oldSubjectId, oldGradeId] = oldValues || [null, null];

    // 当科目或年级发生变化时，立即加载知识点树
    if (subjectId && gradeId) {
      // 只有当两个值都存在时才加载
      if (subjectId !== oldSubjectId || gradeId !== oldGradeId) {
        loadKnowledgeTree("upload", subjectId, gradeId);
        loadKnowledgeTree("uploadSub", subjectId, gradeId);
      }
    } else {
      // 如果科目或年级被清空，则清空知识点树
      knowledgeTreeData.value = [];
      subKnowledgeTreeData.value = [];
      originalKnowledgeTreeData.value = [];
      originalSubKnowledgeTreeData.value = [];
    }
  },
  { immediate: true } // 添加立即执行选项，初始时就会执行一次
);

/**
 * 过滤知识点树
 */
const filterKnowledgeTree = () => {
  if (!knowledgeSearch.value) {
    knowledgeTreeData.value = sortTreeByOrder(JSON.parse(JSON.stringify(originalKnowledgeTreeData.value)));
  } else {
    const filtered = filterTreeByKeyword(
      JSON.parse(JSON.stringify(originalKnowledgeTreeData.value)),
      knowledgeSearch.value
    );
    knowledgeTreeData.value = sortTreeByOrder(filtered);
  }
};

/**
 * 过滤副知识点树
 */
const filterSubKnowledgeTree = () => {
  if (!subKnowledgeSearch.value) {
    subKnowledgeTreeData.value = sortTreeByOrder(JSON.parse(JSON.stringify(originalSubKnowledgeTreeData.value)));
  } else {
    const filtered = filterTreeByKeyword(
      JSON.parse(JSON.stringify(originalSubKnowledgeTreeData.value)),
      subKnowledgeSearch.value
    );
    subKnowledgeTreeData.value = sortTreeByOrder(filtered);
  }
};

/**
 * 清除知识点搜索
 */
const clearKnowledgeSearch = () => {
  knowledgeSearch.value = "";
  filterKnowledgeTree(); // 这会重新排序
};

/**
 * 清除副知识点搜索
 */
const clearSubKnowledgeSearch = () => {
  subKnowledgeSearch.value = "";
  filterSubKnowledgeTree(); // 这会重新排序
};

/**
 * 选择知识点
 */
const selectKnowledgePoint = (node) => {
  selectedKnowledgePoint.value = node;
  form.knowledge_point_id = node.id;
  knowledgeSearch.value = ""; // 清空搜索
  filterKnowledgeTree(); // 重置树显示
};

/**
 * 选择副知识点
 */
const selectSubKnowledgePoint = (node) => {
  const id = node.id;

  // 检查是否已选择
  const index = form.sub_knowledge_point_ids.indexOf(id);
  if (index === -1) {
    // 未选择，添加到数组
    form.sub_knowledge_point_ids.push(id);
  } else {
    // 已选择，从数组中移除
    form.sub_knowledge_point_ids.splice(index, 1);
  }

  // 清空搜索并重置树显示
  subKnowledgeSearch.value = "";
  filterSubKnowledgeTree();
};

/**
 * 切换知识点节点展开状态
 */
const toggleKnowledgeNode = (node) => {
  node.expanded = !node.expanded;
};

/**
 * 切换副知识点节点展开状态
 */
const toggleSubKnowledgeNode = (node) => {
  node.expanded = !node.expanded;
};

// ==================== 更新界面的知识点树方法 ====================
/**
 * 加载多年级知识点树
 * @param {string} type - 类型：'update', 'updateSub'
 * @param {number} subjectId - 科目ID
 * @param {number[]} gradeIds - 年级ID数组
 */
const loadMultiGradeKnowledgeTree = async (type, subjectId, gradeIds) => {
  if (!subjectId || !gradeIds.length) return;

  try {
    // 设置加载状态
    switch (type) {
      case "update":
        loadingUpdateKnowledgePoints.value = true;
        break;
      case "updateSub":
        loadingUpdateKnowledgePoints.value = true;
        break;
    }

    // 并行加载所有选中年级的知识点
    const gradePromises = gradeIds.map(gradeId => {
      const grade = gradeList.value.find(g => g.id === gradeId);
      return axios.get(
        `${API_BASE}/questions/getKnowledgePointJson/${subjectId}/${gradeId}`
      ).then(res => ({
        gradeId,
        gradeName: grade?.name || '',
        data: res.data.data || []
      })).catch(err => {
        console.error(`加载年级 ${gradeId} 的知识点失败:`, err);
        return {
          gradeId,
          gradeName: grade?.name || '',
          data: []
        };
      });
    });

    const results = await Promise.all(gradePromises);

    let allKnowledgePoints = [];

    results.forEach(result => {
      const { gradeId, gradeName, data } = result;

      if (data && data.length > 0) {
        const addGradeInfo = (nodes) => {
          return nodes.map(node => {
            const currentNode = {
              ...node,
              gradeId,
              gradeName,
              displayName: `${gradeName}: ${node.name}`,
              originalName: node.name,
              expanded: true
            };

            if (node.children && node.children.length) {
              currentNode.children = addGradeInfo(node.children);
            }

            return currentNode;
          });
        };

        const gradeKnowledge = addGradeInfo(data);
        allKnowledgePoints.push(...gradeKnowledge);
      }
    });

    // 按 sort_order 排序
    const addExpandedProperty = (nodes) => {
      const sortedNodes = nodes.sort((a, b) => {
        const orderA = Number(a.sort_order) || 0;
        const orderB = Number(b.sort_order) || 0;
        return orderA - orderB;
      });

      return sortedNodes.map((node) => {
        const newNode = { ...node, expanded: true };
        if (node.children && node.children.length) {
          newNode.children = addExpandedProperty(node.children);
        }
        return newNode;
      });
    };

    const treeData = addExpandedProperty(allKnowledgePoints);

    // 根据类型设置数据
    switch (type) {
      case "update":
        updateKnowledgeTreeData.value = treeData;
        originalUpdateKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
        break;
      case "updateSub":
        updateSubKnowledgeTreeData.value = treeData;
        originalUpdateSubKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
        break;
    }

    if (treeData.length === 0) {
      ElMessage.warning("选中的年级和科目暂无知识点数据");
    }

  } catch (err) {
    console.error(`加载多年级知识点树失败(${type}):`, err);
    ElMessage.error("加载知识点失败，请稍后重试");
  } finally {
    // 清除加载状态
    switch (type) {
      case "update":
      case "updateSub":
        loadingUpdateKnowledgePoints.value = false;
        break;
    }
  }
};

// 监听更新界面科目和年级变化，加载知识点树
watch(
  () => [searchCriteria.subject_id, searchCriteria.grade_ids],
  ([subjectId, gradeIds]) => {
    if (subjectId && gradeIds && gradeIds.length > 0) {
      // 使用新的多选年级加载函数
      loadMultiGradeKnowledgeTree("update", subjectId, gradeIds);
      loadMultiGradeKnowledgeTree("updateSub", subjectId, gradeIds);
    } else {
      updateKnowledgeTreeData.value = [];
      updateSubKnowledgeTreeData.value = [];
      originalUpdateKnowledgeTreeData.value = [];
      originalUpdateSubKnowledgeTreeData.value = [];
    }
  },
  { deep: true }
);

/**
 * 过滤更新界面知识点树
 */
const filterUpdateKnowledgeTree = () => {
  if (!updateKnowledgeSearch.value) {
    updateKnowledgeTreeData.value = sortTreeByOrder(JSON.parse(JSON.stringify(originalUpdateKnowledgeTreeData.value)));
  } else {
    const filtered = filterTreeByKeyword(
      JSON.parse(JSON.stringify(originalUpdateKnowledgeTreeData.value)),
      updateKnowledgeSearch.value
    );
    updateKnowledgeTreeData.value = sortTreeByOrder(filtered);
  }
};

/**
 * 更新界面选择知识点（多选切换）
 * @param {Object} node - 知识点节点
 */
const selectUpdateKnowledgePoint = (node) => {
  const id = node.id;

  // 检查是否已选择
  const index = searchCriteria.knowledge_point_ids.indexOf(id);
  if (index === -1) {
    // 未选择，添加到数组
    searchCriteria.knowledge_point_ids.push(id);
  } else {
    // 已选择，从数组中移除
    searchCriteria.knowledge_point_ids.splice(index, 1);
  }

  // 清空搜索并重置树显示
  updateKnowledgeSearch.value = "";
  filterUpdateKnowledgeTree();
};

/**
 * 切换更新界面知识点节点
 */
const toggleUpdateKnowledgeNode = (node) => {
  node.expanded = !node.expanded;
};

/**
 * 加载更新界面的副知识点树
 */
const loadUpdateSubKnowledgeTree = async (subjectId, gradeId) => {
  if (!subjectId) return;

  try {
    loadingUpdateKnowledgePoints.value = true;

    const url = `${API_BASE}/questions/getKnowledgePointJson/${subjectId}/${gradeId || ""
      }`;
    const res = await axios.get(url);
    const data = res.data.data || [];

    // 添加展开属性，并按 sort_order 排序
    const addExpandedProperty = (nodes) => {
      // 首先对当前层级的节点按 sort_order 排序
      const sortedNodes = nodes.sort((a, b) => {
        const orderA = Number(a.sort_order) || 0;
        const orderB = Number(b.sort_order) || 0;
        return orderA - orderB;
      });

      return sortedNodes.map((node) => {
        const newNode = {
          ...node,
          expanded: true,
        };
        if (node.children && node.children.length) {
          newNode.children = addExpandedProperty(node.children);
        }
        return newNode;
      });
    };

    const treeData = addExpandedProperty(data);
    updateSubKnowledgeTreeData.value = treeData;
    originalUpdateSubKnowledgeTreeData.value = JSON.parse(JSON.stringify(treeData));
  } catch (err) {
    console.error("加载副知识点树失败:", err);
    ElMessage.error("加载副知识点失败");
  } finally {
    loadingUpdateKnowledgePoints.value = false;
  }
};

/**
 * 过滤更新界面副知识点树
 */
const filterUpdateSubKnowledgeTree = () => {
  if (!updateSubKnowledgeSearch.value) {
    updateSubKnowledgeTreeData.value = sortTreeByOrder(JSON.parse(JSON.stringify(originalUpdateSubKnowledgeTreeData.value)));
  } else {
    const filtered = filterTreeByKeyword(
      JSON.parse(JSON.stringify(originalUpdateSubKnowledgeTreeData.value)),
      updateSubKnowledgeSearch.value
    );
    updateSubKnowledgeTreeData.value = sortTreeByOrder(filtered);
  }
};

/**
 * 清除更新界面副知识点搜索
 */
const clearUpdateSubKnowledgeSearch = () => {
  updateSubKnowledgeSearch.value = "";
  filterUpdateSubKnowledgeTree();
};

/**
 * 切换更新界面副知识点节点展开状态
 */
const toggleUpdateSubKnowledgeNode = (node) => {
  node.expanded = !node.expanded;
};

const updateSubKnowledgeTreeData = ref([]);
const originalUpdateSubKnowledgeTreeData = ref([]);

// ==================== 更新表单的知识点树方法 ====================

/**
 * 监听更新表单科目和年级变化
 */
watch(
  () => [updateForm.subject_id, updateForm.grade_id],
  ([subjectId, gradeId]) => {
    if (subjectId && gradeId) {
      loadKnowledgeTree("updateForm", subjectId, gradeId);
      loadKnowledgeTree("updateFormSub", subjectId, gradeId);
    } else {
      updateFormKnowledgeTreeData.value = [];
      updateFormSubKnowledgeTreeData.value = [];
      originalUpdateFormKnowledgeTreeData.value = [];
      originalUpdateFormSubKnowledgeTreeData.value = [];
    }
  }
);

/**
 * 过滤更新表单知识点树
 */
const filterUpdateFormKnowledgeTree = () => {
  if (!updateFormKnowledgeSearch.value) {
    updateFormKnowledgeTreeData.value = sortTreeByOrder(JSON.parse(JSON.stringify(originalUpdateFormKnowledgeTreeData.value)));
  } else {
    const filtered = filterTreeByKeyword(
      JSON.parse(JSON.stringify(originalUpdateFormKnowledgeTreeData.value)),
      updateFormKnowledgeSearch.value
    );
    updateFormKnowledgeTreeData.value = sortTreeByOrder(filtered);
  }
};

/**
 * 清除更新表单知识点搜索
 */
const clearUpdateFormKnowledgeSearch = () => {
  updateFormKnowledgeSearch.value = "";
  filterUpdateFormKnowledgeTree();
};

/**
 * 清除更新表单副知识点搜索
 */
const clearUpdateFormSubKnowledgeSearch = () => {
  updateFormSubKnowledgeSearch.value = "";
  filterUpdateFormSubKnowledgeTree();
};

/**
 * 选择更新表单知识点
 */
const selectUpdateFormKnowledgePoint = (node) => {
  selectedUpdateFormKnowledgePoint.value = node;
  updateForm.knowledge_point_id = node.id;
  updateFormKnowledgeSearch.value = "";
  filterUpdateFormKnowledgeTree();
};

/**
 * 切换更新表单知识点节点
 */
const toggleUpdateFormKnowledgeNode = (node) => {
  node.expanded = !node.expanded;
};

/**
 * 切换更新表单副知识点节点展开状态
 */
const toggleUpdateFormSubKnowledgeNode = (node) => {
  node.expanded = !node.expanded;
};

// ==================== 新建内容上传方法 ====================
/**
 * 上传解题思想
 */
const uploadSolutionIdea = async () => {
  if (!newSolutionIdea.value.trim()) {
    ElMessage.error("请输入解题思想");
    return;
  }

  try {
    const items = newSolutionIdea.value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter((item) => item);
    await axios.post(`${API_BASE}/questions/uploadSolutionIdea`, items);
    ElMessage.success("解题思想上传成功");
    newSolutionIdea.value = "";
    await loadLists();
  } catch (err) {
    console.error("上传解题思想失败:", err);
    ElMessage.error("上传解题思想失败");
  }
};

/**
 * 上传问题类别
 */
const uploadQuestionCategory = async () => {
  if (!newQuestionCategory.value.trim()) {
    ElMessage.error("请输入问题类别");
    return;
  }

  try {
    const items = newQuestionCategory.value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter((item) => item);
    await axios.post(`${API_BASE}/questions/uploadQuestionCategory`, items);
    ElMessage.success("问题类别上传成功");
    newQuestionCategory.value = "";
    await loadLists();
  } catch (err) {
    console.error("上传问题类别失败:", err);
    ElMessage.error("上传问题类别失败");
  }
};

/**
 * 更新表单上传解题思想
 */
const uploadUpdateFormSolutionIdea = async () => {
  if (!newUpdateFormSolutionIdea.value.trim()) {
    ElMessage.error("请输入解题思想");
    return;
  }

  try {
    const items = newUpdateFormSolutionIdea.value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter((item) => item);
    await axios.post(`${API_BASE}/questions/uploadSolutionIdea`, items);
    ElMessage.success("解题思想上传成功");
    newUpdateFormSolutionIdea.value = "";
    await loadLists();
  } catch (err) {
    console.error("上传解题思想失败:", err);
    ElMessage.error("上传解题思想失败");
  }
};

// ==================== 题目检索和操作 ====================
/**
 * 检索题目
 */
const findQuestions = async () => {
  try {
    searchCriteria.page_num = 1;
    pageInput.value = 1;
    const payload = { ...searchCriteria };

    // 构建检索条件，过滤空值
    // 处理多选年级
    if (searchCriteria.grade_ids.length > 0) {
      payload.grade_ids = searchCriteria.grade_ids.map(id => Number(id));
    }

    // 其他条件处理保持不变...

    const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
    const responseData = res.data.data;

    // 正确设置分页数据
    questionList.value = responseData?.data_info || [];

    // 从响应数据的data字段中获取分页信息
    if (responseData) {
      searchCriteria.page_num = responseData.page_num || 1;
      searchCriteria.page_size = responseData.page_size || 10;
      totalPages.value = responseData.total_pages || 1;
      totalItems.value = responseData.total_items || 0;
      pageInput.value = responseData.page_num || 1;
    }

    hasSearched.value = true;

    if (!questionList.value.length) {
      ElMessage.error("未找到符合条件的题目");
    } else {
      // 显示选中的年级数量
      const gradeCount = searchCriteria.grade_ids.length;
      const gradeText = gradeCount > 1 ?
        `跨 ${gradeCount} 个年级找到 ${totalItems.value} 条题目` :
        `找到 ${totalItems.value} 条题目`;
      ElMessage.success(gradeText);
    }
  } catch (err) {
    console.error("检索失败:", err);
    ElMessage.error("检索失败");
    questionList.value = [];
    hasSearched.value = true;
  }
};

/**
 * 跳转到首页
 */
const goToFirstPage = () => {
  changePage(1);
};

/**
 * 跳转到末页
 */
const goToLastPage = () => {
  changePage(totalPages.value);
};

/**
 * 改变页码
 * @param {number} newPage - 新的页码
 */
const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) {
    return;
  }
  searchCriteria.page_num = newPage;
  pageInput.value = newPage; // 同步页码输入框
  silentFindQuestions();
};

/**
 * 跳转到指定页码
 */
const goToPage = () => {
  const page = parseInt(pageInput.value);
  if (page >= 1 && page <= totalPages.value) {
    changePage(page);
  } else {
    ElMessage.error(`请输入 1 到 ${totalPages.value} 之间的页码`);
  }
};

/**
 * 加载题目到更新表单
 * @param {Object} q - 题目对象
 */
const loadQuestionForUpdate = async (q) => {
  selectedQuestion.value = q;
  showUpdateForm.value = true;

  // 重置表单并填充数据
  updateForm.id = q.id;
  updateForm.title = q.title || "";
  updateForm.school_id = q.school_id ? Number(q.school_id) : null;
  updateForm.grade_id = q.grade_id ? Number(q.grade_id) : null;
  updateForm.subject_id = q.subject_id ? Number(q.subject_id) : null;
  updateForm.question_category_id = q.question_category_id
    ? Number(q.question_category_id)
    : null;
  updateForm.marking_type = q.marking_type || 0;
  updateForm.knowledge_point_id = q.knowledge_point_id
    ? Number(q.knowledge_point_id)
    : null;
  updateForm.solution_idea_ids = q.solution_idea_ids
    ? q.solution_idea_ids.map((id) => Number(id))
    : [];
  updateForm.difficulty_level = q.difficulty_level ? Number(q.difficulty_level) : null;
  updateForm.answer = q.answer || "";
  updateForm.notes = q.notes || "";
  updateForm.remark = q.remark || "";
  updateForm.sub_knowledge_point_ids = (q.sub_knowledge_point_ids || []).map((id) =>
    Number(id)
  );
  updateForm.img_url = q.img_url || "";
  updateForm.pendingImages = [];

  // 清空搜索关键词
  updateFormKnowledgeSearch.value = "";
  updateFormSubKnowledgeSearch.value = "";

  // 根据科目和年级加载知识点树
  if (q.subject_id && q.grade_id) {
    await Promise.all([
      loadKnowledgeTree("updateForm", q.subject_id, q.grade_id),
      loadKnowledgeTree("updateFormSub", q.subject_id, q.grade_id),
    ]);
  }

  // 等待树加载完成并选择对应的知识点
  await nextTick();

  // 设置选中的知识点
  if (q.knowledge_point_id && updateFormKnowledgeTreeData.value.length > 0) {
    const findNode = (nodes, targetId) => {
      for (const node of nodes) {
        if (node.id === Number(targetId)) {
          selectedUpdateFormKnowledgePoint.value = node;
          return true;
        }
        if (node.children && node.children.length) {
          if (findNode(node.children, targetId)) {
            node.expanded = true;
            return true;
          }
        }
      }
      return false;
    };

    findNode(updateFormKnowledgeTreeData.value, q.knowledge_point_id);
  }

  // 设置选中的问题类别
  if (q.question_category_id) {
    const category = questionCategoryList.value.find(
      (c) => c.id === Number(q.question_category_id)
    );
    if (category) {
      selectedUpdateFormQuestionCategory.value = category;
      updateFormQuestionCategorySearch.value = category.name;
    }
  }

  // 滚动到更新表单
  await nextTick();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = updateFormRef.value;
      if (!el) return;

      const scrollParent = findScrollParent(el);

      const top =
        scrollParent === window
          ? el.getBoundingClientRect().top + window.pageYOffset - 20
          : el.offsetTop - 20;

      scrollParent.scrollTo({
        top,
        behavior: "smooth",
      });
    });
  });

  // 查找真正负责滚动的父容器
  function findScrollParent(el) {
    let current = el.parentNode;
    while (current && current !== document.body) {
      const { overflowY } = window.getComputedStyle(current);
      if (overflowY === "auto" || overflowY === "scroll") {
        return current;
      }
      current = current.parentNode;
    }
    return window;
  }
};

/**
 * 取消更新
 */
const cancelUpdate = () => {
  showUpdateForm.value = false;
  selectedQuestion.value = null;

  // 清空所有搜索关键词和选择
  updateFormKnowledgeSearch.value = "";
  updateFormSubKnowledgeSearch.value = "";
  updateFormSolutionIdeaSearch.value = "";
  updateFormQuestionCategorySearch.value = "";

  selectedUpdateFormKnowledgePoint.value = null;
  selectedUpdateFormQuestionCategory.value = null;

  // 清空知识点树数据
  updateFormKnowledgeTreeData.value = [];
  updateFormSubKnowledgeTreeData.value = [];
  originalUpdateFormKnowledgeTreeData.value = [];
  originalUpdateFormSubKnowledgeTreeData.value = [];
};

/**
 * 确认删除题目
 * @param {Object} q - 题目对象
 */
const confirmDelete = (q) => {
  questionToDelete.value = q;
  showDeleteConfirm.value = true;
};

/**
 * 取消删除
 */
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  questionToDelete.value = null;
};

/**
 * 删除题目
 */
const deleteQuestion = async () => {
  if (!questionToDelete.value) return;

  try {
    const id = questionToDelete.value.id;
    await axios.delete(`${API_BASE}/questions/deleteQuestion/${id}`);
    ElMessage.success("题目删除成功");

    // 从列表中移除已删除的题目
    questionList.value = questionList.value.filter((q) => q.id !== id);

    showDeleteConfirm.value = false;
    questionToDelete.value = null;
  } catch (err) {
    console.error("删除失败:", err);
    ElMessage.error("删除失败");
  }
};

// ==================== 表单提交处理 ====================
/**
 * 处理题目提交
 */
const handleSubmit = async () => {
  // 验证问题类别是否选择
  if (!form.question_category_id) {
    ElMessage.error("请选择问题类别");
    return;
  }

  // 验证审核人是否选择
  if (!selectedReviewer.value) {
    ElMessage.error("请选择审核人");
    return;
  }

  try {
    submitting.value = true;

    // 先上传题目图片到图床
    const imageUploadSuccess = await uploadPendingImage("upload");
    if (!imageUploadSuccess) {
      submitting.value = false;
      return;
    }

    let optionsPayload = {};
    let answerPayload = "";

    const questionCategoryName = selectedQuestionCategory.value?.name;

    // 处理选择题选项和答案
    if (
      questionCategoryName &&
      (questionCategoryName === "单选题" ||
        questionCategoryName.includes("单选") ||
        questionCategoryName === "多选题" ||
        questionCategoryName.includes("多选"))
    ) {
      form.options.forEach((opt, i) => {
        const key = getOptionLabel(i);
        optionsPayload[`option_${key}`] = opt.text;
      });

      if (questionCategoryName === "单选题" || questionCategoryName.includes("单选")) {
        answerPayload =
          singleAnswerIndex.value !== null ? getOptionLabel(singleAnswerIndex.value) : "";
      } else if (
        questionCategoryName === "多选题" ||
        questionCategoryName.includes("多选")
      ) {
        answerPayload = form.options
          .map((opt, i) => (opt.isAnswer ? getOptionLabel(i) : null))
          .filter(Boolean)
          .join(",");
      }
    } else {
      answerPayload = form.answer;
    }

    // 构建提交数据
    const payload = {
      school_id: form.school_id !== null ? Number(form.school_id) : null,
      grade_id: form.grade_id !== null ? Number(form.grade_id) : null,
      subject_id: form.subject_id !== null ? Number(form.subject_id) : null,
      question_category_id:
        form.question_category_id !== null ? Number(form.question_category_id) : null,
      marking_type: form.marking_type,
      knowledge_point_id:
        form.knowledge_point_id !== null ? Number(form.knowledge_point_id) : null,
      solution_idea_ids: form.solution_idea_ids.map((id) => Number(id)),
      difficulty_level:
        form.difficulty_level !== null ? Number(form.difficulty_level) : null,
      title: form.title,
      ...(questionCategoryName &&
        (questionCategoryName === "单选题" ||
          questionCategoryName.includes("单选") ||
          questionCategoryName === "多选题" ||
          questionCategoryName.includes("多选"))
        ? { options: optionsPayload }
        : {}),
      answer: answerPayload,
      notes: form.notes,
      remark: form.remark,
      sub_knowledge_point_ids: form.sub_knowledge_point_ids.map((id) => Number(id)),
      img_url: form.img_url,
    };

    const url = `${API_BASE}/questions/uploadSingleQuestion/${currentUser.value}/${selectedReviewer.value}`;
    const res = await axios.post(url, payload);

    if (res.data.message && res.data.message.includes("题目已存在")) {
      ElMessage.error("题目已存在");
    } else {
      ElMessage.success("上传成功");
      saveUploadMemory(); // 保存用户设置
      resetForm(); // 重置表单
      selectedReviewer.value = ""; // 清空审核人选择
    }
  } catch (err) {
    console.error("提交失败:", err);
    ElMessage.error("提交失败");
  } finally {
    submitting.value = false;
  }
};

/**
 * 处理题目更新提交
 */
const handleUpdateSubmit = async () => {
  if (!updateForm.question_category_id) {
    ElMessage.error("请选择问题类别");
    return;
  }

  try {
    submitting.value = true;
    // 先上传题目图片到图床
    const imageUploadSuccess = await uploadPendingImage("update");
    if (!imageUploadSuccess) {
      submitting.value = false;
      return;
    }

    let optionsPayload = {};
    let answerPayload = "";

    const questionCategoryName = selectedUpdateFormQuestionCategory.value?.name;

    // 处理选择题选项和答案
    if (
      questionCategoryName &&
      (questionCategoryName === "单选题" ||
        questionCategoryName.includes("单选") ||
        questionCategoryName === "多选题" ||
        questionCategoryName.includes("多选"))
    ) {
      updateForm.options.forEach((opt, i) => {
        const key = getOptionLabel(i);
        optionsPayload[`option_${key}`] = opt.text;
      });

      if (questionCategoryName === "单选题" || questionCategoryName.includes("单选")) {
        answerPayload =
          updateSingleAnswerIndex.value !== null
            ? getOptionLabel(updateSingleAnswerIndex.value)
            : "";
      } else if (
        questionCategoryName === "多选题" ||
        questionCategoryName.includes("多选")
      ) {
        answerPayload = updateForm.options
          .map((opt, i) => (opt.isAnswer ? getOptionLabel(i) : null))
          .filter(Boolean)
          .join(",");
      }
    } else {
      answerPayload = updateForm.answer;
    }

    // 构建更新数据
    const payload = {
      id: updateForm.id,
      school_id: updateForm.school_id !== null ? Number(updateForm.school_id) : null,
      grade_id: updateForm.grade_id !== null ? Number(updateForm.grade_id) : null,
      subject_id: updateForm.subject_id !== null ? Number(updateForm.subject_id) : null,
      question_category_id:
        updateForm.question_category_id !== null
          ? Number(updateForm.question_category_id)
          : null,
      marking_type: updateForm.marking_type,
      knowledge_point_id:
        updateForm.knowledge_point_id !== null
          ? Number(updateForm.knowledge_point_id)
          : null,
      solution_idea_ids: updateForm.solution_idea_ids.map((id) => Number(id)),
      difficulty_level:
        updateForm.difficulty_level !== null ? Number(updateForm.difficulty_level) : null,
      title: updateForm.title,
      ...(questionCategoryName &&
        (questionCategoryName === "单选题" ||
          questionCategoryName.includes("单选") ||
          questionCategoryName === "多选题" ||
          questionCategoryName.includes("多选"))
        ? { options: optionsPayload }
        : {}),
      answer: answerPayload,
      notes: updateForm.notes,
      remark: updateForm.remark,
      sub_knowledge_point_ids: updateForm.sub_knowledge_point_ids.map((id) => Number(id)),
      img_url: updateForm.img_url,
    };

    const res = await axios.post(`${API_BASE}/questions/updateQuestion`, payload);
    // 检查响应消息是否为"题目已存在"
    if (res.data.message && res.data.message.includes("题目已存在")) {
      ElMessage.error("题目已存在");
    } else {
      ElMessage.success("更新成功");
      await silentFindQuestions(); // 静默刷新列表
      cancelUpdate(); // 关闭更新表单
    }
  } catch (err) {
    console.error("更新失败:", err);
    ElMessage.error("更新失败");
  } finally {
    submitting.value = false;
  }
};

/**
 * 静默检索题目（不显示弹窗）
 */
const silentFindQuestions = async () => {
  try {
    const payload = { ...searchCriteria };

    // 构建检索条件
    if (searchCriteria.grade_id !== null)
      payload.grade_id = Number(searchCriteria.grade_id);
    if (searchCriteria.subject_id !== null)
      payload.subject_id = Number(searchCriteria.subject_id);
    if (searchCriteria.question_category_ids.length > 0)
      // 改为数组判断
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

    // 从响应数据的data字段中获取分页信息
    if (responseData) {
      searchCriteria.page_num = responseData.page_num || 1;
      searchCriteria.page_size = responseData.page_size || 10;
      totalPages.value = responseData.total_pages || 1;
      totalItems.value = responseData.total_items || 0;
      pageInput.value = responseData.page_num || 1;
    }

    hasSearched.value = true;

    // 静默操作，不显示任何弹窗
  } catch (err) {
    console.error("检索失败:", err);
    questionList.value = [];
    hasSearched.value = true;
    // 静默操作，不显示错误弹窗
  }
};

// ==================== 表单重置和模式切换 ====================
/**
 * 重置上传表单
 */
const resetForm = () => {
  Object.assign(form, {
    id: null,
    title: "",
    options: [
      { text: "", isAnswer: false },
      { text: "", isAnswer: false },
      { text: "", isAnswer: false },
      { text: "", isAnswer: false },
    ],
    answer: "",
    notes: "",
    remark: "",
    sub_knowledge_point_ids: [],
    solution_idea_ids: [],
    img_url: "",
    pendingImages: [],
  });
  singleAnswerIndex.value = null;
  knowledgeSearch.value = "";
  subKnowledgeSearch.value = "";
  solutionIdeaSearch.value = "";
  questionCategorySearch.value = "";
  selectedKnowledgePoint.value = null;
  selectedQuestionCategory.value = null;
  selectedReviewer.value = "";
  pendingImages.length = 0;
};

/**
 * 进入更新模式
 */
const enterUpdateMode = () => {
  updateMode.value = true;
  questionList.value = [];
  showUpdateForm.value = false;
  selectedQuestion.value = null;
  updateGradeSearch.value = "";
  updateKnowledgeSearch.value = "";
  updateSubKnowledgeSearch.value = "";
  updateSolutionIdeaSearch.value = "";
  updateQuestionCategorySearch.value = "";
  searchCriteria.grade_ids = [];
  searchCriteria.knowledge_point_ids = [];
  searchCriteria.sub_knowledge_point_ids = [];
  searchCriteria.solution_idea_ids = [];
  searchCriteria.question_category_ids = []; // 改为数组
  searchCriteria.difficulty_levels = [];
  searchCriteria.page_num = 1; // 重置为第一页
  searchCriteria.page_size = 10; // 重置每页数量
  totalPages.value = 1; // 重置总页数
  totalItems.value = 0; // 重置总条目数
  pageInput.value = 1; // 重置页码输入
  hasSearched.value = false;
  Object.assign(searchCriteria, {
    grade_ids: [],
    subject_id: null,
    question_category_ids: [], // 改为数组
    knowledge_point_ids: [],
    sub_knowledge_point_ids: [],
    solution_idea_ids: [],
    difficulty_levels: [],
    title: "",
    page_num: 1, // 确保重置
    page_size: 10, // 确保重置
  });
};

/**
 * 退出更新模式
 */
const exitUpdateMode = () => {
  updateMode.value = false;
  questionList.value = [];
  resetForm();
  hasSearched.value = false;
};

// ==================== 辅助方法 ====================
/**
 * 根据ID获取学校名称
 * @param {number} id - 学校ID
 * @returns {string} 学校名称
 */
const getSchoolName = (id) => {
  if (id === null) return "-";
  const school = schoolList.value.find((s) => s.id === Number(id));
  return school ? school.name : "-";
};

/**
 * 根据ID获取年级名称
 * @param {number} id - 年级ID
 * @returns {string} 年级名称
 */
const getGradeName = (id) => {
  if (id === null) return "-";
  const grade = gradeList.value.find((g) => g.id === Number(id));
  return grade ? grade.name : "-";
};

/**
 * 根据ID获取科目名称
 * @param {number} id - 科目ID
 * @returns {string} 科目名称
 */
const getSubjectName = (id) => {
  if (id === null) return "-";
  const subject = subjectList.value.find((s) => s.id === Number(id));
  return subject ? subject.name : "-";
};

/**
 * 根据ID获取解题思想名称
 * @param {number} id - 解题思想ID
 * @returns {string} 解题思想名称
 */
const getSolutionIdeaName = (id) => {
  if (id === null) return "-";
  const item = solutionIdeaList.value.find((s) => s.id === Number(id));
  return item ? item.name : "-";
};

/**
 * 根据ID获取问题类别名称
 * @param {number} id - 问题类别ID
 * @returns {string} 问题类别名称
 */
const getQuestionCategoryName = (id) => {
  if (id === null) return "-";
  const item = questionCategoryList.value.find((c) => c.id === Number(id));
  return item ? item.name : "-";
};

/**
 * 根据评分方法代码获取评分方法名称
 * @param {number} type - 评分方法代码
 * @returns {string} 评分方法名称
 */
const getMarkingTypeName = (type) => {
  const types = {
    0: "自动评分",
    1: "人工评分",
  };
  return types[type] || "-";
};

// ==================== 计算属性 ====================
// 获取选中年级的名称
const selectedUpdateGradeNames = computed(() => {
  return selectedUpdateGrades.value.map(grade => grade.name).join("、");
});

// 选中的知识点对象列表（包含年级信息）
const selectedUpdateKnowledgePoints = computed(() => {
  return searchCriteria.knowledge_point_ids
    .map((id) => {
      const node = findNodeInMultiGradeTree(id, updateKnowledgeTreeData.value);
      if (node) {
        return {
          id: node.id,
          name: node.originalName || node.name,
          gradeName: node.gradeName,
          displayName: node.displayName || node.name
        };
      }
      return null;
    })
    .filter(Boolean);
});

// 选中的副知识点对象列表（包含年级信息）
const selectedUpdateSubKnowledgePoints = computed(() => {
  return searchCriteria.sub_knowledge_point_ids
    .map((id) => {
      const node = findNodeInMultiGradeTree(id, updateSubKnowledgeTreeData.value);
      if (node) {
        return {
          id: node.id,
          name: node.originalName || node.name,
          gradeName: node.gradeName,
          displayName: node.displayName || node.name
        };
      }
      return null;
    })
    .filter(Boolean);
});

// 在多年级树中查找节点
const findNodeInMultiGradeTree = (targetId, nodes) => {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }
    if (node.children && node.children.length) {
      const found = findNodeInMultiGradeTree(targetId, node.children);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 是否显示单选题选项区域
 */
const showSingleOptions = computed(() => {
  if (!selectedQuestionCategory.value) return false;
  const name = selectedQuestionCategory.value.name;
  return name === "单选题" || name.includes("单选");
});

/**
 * 是否显示多选题选项区域
 */
const showMultipleOptions = computed(() => {
  if (!selectedQuestionCategory.value) return false;
  const name = selectedQuestionCategory.value.name;
  return name === "多选题" || name.includes("多选");
});

/**
 * 是否显示主观题答案区域
 */
const showSubjectiveAnswer = computed(() => {
  if (!selectedQuestionCategory.value) return true; // 默认显示主观题区域
  const name = selectedQuestionCategory.value.name;
  return !(
    name === "单选题" ||
    name.includes("单选") ||
    name === "多选题" ||
    name.includes("多选")
  );
});

/**
 * 更新界面是否显示单选题选项区域
 */
const showUpdateSingleOptions = computed(() => {
  if (!selectedUpdateFormQuestionCategory.value) return false;
  const name = selectedUpdateFormQuestionCategory.value.name;
  return name === "单选题" || name.includes("单选");
});

/**
 * 更新界面是否显示多选题选项区域
 */
const showUpdateMultipleOptions = computed(() => {
  if (!selectedUpdateFormQuestionCategory.value) return false;
  const name = selectedUpdateFormQuestionCategory.value.name;
  return name === "多选题" || name.includes("多选");
});

/**
 * 更新界面是否显示主观题答案区域
 */
const showUpdateSubjectiveAnswer = computed(() => {
  if (!selectedUpdateFormQuestionCategory.value) return true; // 默认显示主观题区域
  const name = selectedUpdateFormQuestionCategory.value.name;
  return !(
    name === "单选题" ||
    name.includes("单选") ||
    name === "多选题" ||
    name.includes("多选")
  );
});

/**
 * 选中的副知识点对象列表
 */
const selectedSubKnowledgePoints = computed(() => {
  // 从知识点树中查找对应的节点信息
  const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children && node.children.length) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  return form.sub_knowledge_point_ids
    .map((id) => findNodeById(sortedSubKnowledgeTreeData.value, id)) // 改为排序后的数据
    .filter(Boolean);
});

/**
 * 选中的解题思想对象列表
 */
const selectedSolutionIdeas = computed(() => {
  return form.solution_idea_ids
    .map((id) => solutionIdeaList.value.find((s) => s.id === id))
    .filter(Boolean);
});

/**
 * 清除更新界面知识点搜索
 */
const clearUpdateKnowledgeSearch = () => {
  updateKnowledgeSearch.value = "";
  filterUpdateKnowledgeTree();
};

/**
 * 更新界面选中的解题思想对象列表
 */
const selectedUpdateSolutionIdeas = computed(() => {
  return searchCriteria.solution_idea_ids
    .map((id) => solutionIdeaList.value.find((s) => s.id === id))
    .filter(Boolean);
});

/**
 * 更新界面选中的问题类别对象列表
 */
const selectedUpdateQuestionCategories = computed(() => {
  return searchCriteria.question_category_ids
    .map((id) => questionCategoryList.value.find((c) => c.id === id))
    .filter(Boolean);
});

/**
 * 更新表单选中的解题思想对象列表
 */
const selectedUpdateFormSolutionIdeas = computed(() => {
  return updateForm.solution_idea_ids
    .map((id) => solutionIdeaList.value.find((s) => s.id === id))
    .filter(Boolean);
});

/**
 * 更新表单选中的副知识点对象列表
 */
const selectedUpdateFormSubKnowledgePoints = computed(() => {
  // 从副知识点树中查找对应的节点信息
  const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children && node.children.length) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  return updateForm.sub_knowledge_point_ids
    .map((id) => findNodeById(updateFormSubKnowledgeTreeData.value, id))
    .filter(Boolean);
});

/**
 * 更新表单选中的年级对象列表
 */
const selectedUpdateGrades = computed(() => {
  return searchCriteria.grade_ids
    .map((id) => gradeList.value.find((g) => g.id === id))
    .filter(Boolean);
});

// ==================== 知识点列表相关 ====================
const knowledgePointList = ref([]);

// ==================== 初始化方法 ====================
const init = () => {
  loadLists();
};

// 初始化组件
init();
</script>

<style scoped>
/* ==================== 全局容器样式 ==================== */
/* 主容器样式 */
.container {
  max-width: 1800px;
  /* 最大宽度，适应大屏幕 */
  margin: auto;
  /* 水平居中 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  /* 字体栈，优先使用系统字体 */
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
  gap: 10px;
}

/* ==================== Markdown 编辑器样式 ==================== */
.markdown-editor-container {
  margin-bottom: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.markdown-editor {
  min-height: 180px;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px;
  border: none;
  border-bottom: 1px solid #dcdfe6;
  resize: vertical;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}

.markdown-editor:focus {
  outline: none;
  border-color: #409eff;
}

.markdown-preview {
  padding: 12px;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* 小编辑器（选项） */
.markdown-editor-container.small .markdown-editor {
  min-height: 80px;
  font-size: 13px;
}

.markdown-editor-container.small .markdown-preview {
  min-height: 60px;
  max-height: 120px;
  font-size: 13px;
}

/* 选项编辑器 */
.markdown-editor.option-editor {
  min-height: 60px;
  font-size: 13px;
}

/* ==================== 模式选择器样式 ==================== */
.mode-select {
  margin-bottom: 30px;
  /* 底部外边距 */
  display: flex;
  /* 弹性布局 */
  gap: 10px;
  /* 子元素间距 */
}

.mode-select button {
  padding: 10px 20px;
  /* 内边距 */
  border: 2px solid #409eff;
  /* 边框颜色使用主题蓝色 */
  background: white;
  /* 背景色 */
  color: #409eff;
  /* 文字颜色 */
  border-radius: 6px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 14px;
  /* 字体大小 */
  transition: all 0.3s;
  /* 过渡动画 */
}

/* 激活状态的按钮样式 */
.mode-select button.active {
  background-color: #409eff;
  /* 主题蓝色背景 */
  color: white;
  /* 白色文字 */
}

/* 非激活状态按钮的悬停效果 */
.mode-select button:hover:not(.active) {
  background-color: #ecf5ff;
  /* 浅蓝色背景 */
}

/* ==================== 表单区域样式 ==================== */
.form-section,
.update-section {
  background: white;
  /* 白色背景 */
  padding: 20px;
  /* 内边距 */
  border-radius: 8px;
  /* 圆角 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  /* 阴影效果 */
}

/* 标题样式 */
.form-section h2,
.update-section h2 {
  margin-bottom: 25px;
  /* 底部外边距 */
  color: #303133;
  /* 深灰色文字 */
  font-size: 20px;
  /* 字体大小 */
  border-bottom: 1px solid #e4e7ed;
  /* 底部边框 */
  padding-bottom: 10px;
  /* 底部内边距 */
}

/* ==================== 搜索条件区域样式 ==================== */
.search-criteria {
  margin-bottom: 30px;
  /* 底部外边距 */
}

.criteria-row {
  display: flex;
  /* 弹性布局 */
  flex-wrap: wrap;
  /* 允许换行 */
  gap: 15px;
  /* 子元素间距 */
  align-items: flex-end;
  /* 底部对齐 */
}

.criteria-item {
  flex: 1;
  /* 弹性填充 */
  min-width: 300px;
  /* 最小宽度 */
}

.criteria-item label {
  display: block;
  /* 块级显示 */
  margin-bottom: 5px;
  /* 底部外边距 */
  font-size: 14px;
  /* 字体大小 */
  color: #606266;
  /* 中灰色文字 */
  font-weight: 500;
  /* 中等字重 */
}

.search-btn {
  min-width: 80px;
  /* 搜索按钮最小宽度 */
}

/* ==================== 搜索结果区域样式 ==================== */
.search-results {
  margin-top: 30px;
  /* 顶部外边距 */
}

.search-results h3 {
  margin-bottom: 15px;
  /* 底部外边距 */
  color: #303133;
  /* 深灰色文字 */
}

.results-table-container {
  overflow-x: auto;
  /* 水平滚动 */
  border: 1px solid #e4e7ed;
  /* 边框 */
  border-radius: 4px;
  /* 圆角 */
}

.results-table {
  min-width: 1200px;
  /* 最小宽度 */
  width: 100%;
  /* 宽度100% */
  display: flex;
  /* 弹性布局 */
  flex-direction: column;
  /* 垂直方向 */
}

/* 表格行样式 */
.table-header,
.table-row {
  display: flex;
  /* 弹性布局 */
  align-items: center;
  /* 垂直居中 */
  justify-content: flex-start;
  /* 水平居中 */
}

.table-header {
  background-color: #d6f0ff;
  /* 浅蓝色表头背景 */
  font-weight: 600;
  /* 粗体字重 */
}

.table-cell {
  padding: 12px 8px;
  /* 内边距 */
  font-size: 14px;
  /* 字体大小 */
  color: #606266;
  /* 文字颜色 */
  box-sizing: border-box;
  /* 盒模型 */
  text-align: center;
  /* 文字居中 */
  word-break: break-word;
  /* 单词换行 */
  white-space: normal !important;
  /* 正常换行 */
}

.table-header .table-cell {
  font-weight: 600;
  /* 粗体 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
}

.table-row {
  border-bottom: 1px solid #e4e7ed;
  /* 底部边框 */
}

.table-row:last-child {
  border-bottom: none;
  /* 最后一行无底部边框 */
}

/* 表格行悬停效果 */
.table-row:hover {
  background-color: #f5f7fa;
  /* 浅灰色背景 */
}

/* 副知识点单元格样式 */
.sub-knowledge-cell {
  display: flex;
  /* 弹性布局 */
  flex-wrap: wrap;
  /* 允许换行 */
  gap: 4px;
  /* 子元素间距 */
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
}

/* 副知识点标签样式 */
.sub-knowledge-tag {
  background: #ecf5ff;
  /* 浅蓝色背景 */
  color: #409eff;
  /* 主题蓝色文字 */
  padding: 2px 6px;
  /* 内边距 */
  border-radius: 3px;
  /* 小圆角 */
  font-size: 11px;
  /* 小字体 */
  border: 1px solid #d9ecff;
  /* 边框 */
  white-space: nowrap;
  /* 不换行 */
  margin: 2px;
  /* 外边距 */
  display: inline-block;
  /* 行内块显示 */
}

/* 无副知识点提示样式 （问题定义，解题思想，问题类别也同样适用此标签）*/
.no-sub-knowledge {
  color: #c0c4cc;
  /* 浅灰色文字 */
  font-style: italic;
  /* 斜体 */
}

/* 题目内容单元格样式 */
.title-cell {
  word-break: break-word;
  /* 单词换行 */
  line-height: 1.4;
  /* 行高 */
  text-align: left;
  /* 左对齐 */
  max-height: 250px;
  /* 设置最大高度 */
  overflow-y: auto;
  /* 垂直滚动条 */
}

.image-cell {
  text-align: center;
  /* 居中对齐 */
}

/* 缩略图样式 */
.thumbnail-image {
  width: 60px;
  /* 固定宽度 */
  height: 45px;
  /* 固定高度 */
  object-fit: cover;
  /* 图片填充方式 */
  border: 1px solid #e4e7ed;
  /* 边框 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  transition: transform 0.2s;
  /* 变换过渡 */
}

/* 缩略图悬停效果 */
.thumbnail-image:hover {
  transform: scale(1.1);
  /* 放大效果 */
}

.no-image {
  color: #c0c4cc;
  /* 浅灰色文字 */
  font-style: italic;
  /* 斜体 */
}

/* 操作按钮单元格样式 */
.actions-cell {
  display: flex;
  /* 弹性布局 */
  gap: 8px;
  /* 按钮间距 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
  height: 100%;
  /* 高度100% */
  min-height: 60px;
  /* 最小高度 */
}

/* 更新按钮样式 */
.btn-update {
  background-color: #409eff;
  /* 主题蓝色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 8px 16px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 14px;
  /* 字体大小 */
  white-space: nowrap;
  /* 不换行 */
  transition: background-color 0.3s;
  /* 背景色过渡 */
}

.btn-update:hover {
  background-color: #66b1ff;
  /* 悬停时更亮的蓝色 */
}

/* 删除按钮样式 */
.btn-delete {
  background-color: #f56c6c;
  /* 红色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 8px 16px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 14px;
  /* 字体大小 */
  white-space: nowrap;
  /* 不换行 */
  transition: background-color 0.3s;
  /* 背景色过渡 */
}

.btn-delete:hover {
  background-color: #f78989;
  /* 悬停时更亮的红色 */
}

/* ==================== 分页控件样式 ==================== */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 8px 8px;
}

.pagination-controls button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.pagination-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-controls input {
  width: 60px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.pagination-controls span {
  font-size: 14px;
  color: #606266;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  border-radius: 4px;
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
  border-radius: 4px;
  text-align: center;
}

.pagination-controls span {
  font-size: 14px;
  color: #606266;
  margin: 0 10px;
}

/* ==================== 更新表单区域样式 ==================== */
.update-form-section {
  margin-top: 30px;
  /* 顶部外边距 */
  padding-top: 20px;
  /* 顶部内边距 */
  border-top: 1px solid #e4e7ed;
  /* 顶部边框 */
}

.update-form-section h3 {
  margin-bottom: 20px;
  /* 底部外边距 */
  color: #303133;
  /* 深灰色文字 */
}

.update-form {
  display: grid;
  /* 网格布局 */
  grid-template-columns: repeat(2, 1fr);
  /* 两列等宽 */
  gap: 20px;
  /* 网格间距 */
}

/* 跨列的表单组 */
.update-form .form-group:nth-child(7),
.update-form .form-group:nth-child(8),
.update-form .form-group:nth-child(9) {
  grid-column: 1 / -1;
  /* 跨所有列 */
}

/* ==================== 模态框样式 ==================== */
.modal-overlay {
  position: fixed;
  /* 固定定位 */
  top: 0;
  /* 顶部对齐 */
  left: 0;
  /* 左侧对齐 */
  right: 0;
  /* 右侧对齐 */
  bottom: 0;
  /* 底部对齐 */
  background: rgba(0, 0, 0, 0.5);
  /* 半透明黑色背景 */
  display: flex;
  /* 弹性布局 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
  z-index: 1000;
  /* 高z-index确保在最上层 */
}

.modal-content {
  background: white;
  /* 白色背景 */
  padding: 40px;
  /* 内边距 */
  border-radius: 12px;
  /* 大圆角 */
  max-width: 1500px;
  /* 最大宽度 */
  width: 90%;
  /* 宽度90% */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  /* 阴影效果 */
  text-align: center;
  /* 文字居中 */
  transform: scale(1.05);
  /* 轻微放大 */
  animation: modalAppear 0.3s ease-out;
  /* 出现动画 */
}

/* 模态框出现动画 */
@keyframes modalAppear {
  from {
    opacity: 0;
    /* 完全透明 */
    transform: scale(0.8) translateY(-20px);
    /* 缩小并上移 */
  }

  to {
    opacity: 1;
    /* 完全不透明 */
    transform: scale(1.05) translateY(0);
    /* 正常大小和位置 */
  }
}

.modal-content h3 {
  margin-bottom: 20px;
  /* 底部外边距 */
  color: #303133;
  /* 深灰色文字 */
  font-size: 24px;
  /* 大字体 */
  font-weight: 600;
  /* 粗体 */
}

.modal-content p {
  margin-bottom: 30px;
  /* 底部外边距 */
  color: #606266;
  /* 中灰色文字 */
  font-size: 18px;
  /* 字体大小 */
  line-height: 1.5;
  /* 行高 */
}

.modal-actions {
  padding: 12px 24px;
  display: flex;
  /* 弹性布局 */
  gap: 15px;
  /* 按钮间距 */
  justify-content: center;
  /* 水平居中 */
}

.modal-actions button {
  padding: 12px 24px;
  /* 内边距 */
  font-size: 16px;
  /* 字体大小 */
  border-radius: 6px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  transition: all 0.3s;
  /* 过渡动画 */
  min-width: 100px;
  /* 最小宽度 */
}

/* ==================== 图片预览模态框样式 ==================== */
.image-preview-modal {
  background: white;
  /* 白色背景 */
  padding: 30px;
  /* 内边距 */
  border-radius: 12px;
  /* 大圆角 */
  max-width: 90vw;
  /* 最大宽度为视口90% */
  max-height: 90vh;
  /* 最大高度为视口90% */
  display: flex;
  /* 弹性布局 */
  flex-direction: column;
  /* 垂直方向 */
  align-items: center;
  /* 水平居中 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  /* 阴影效果 */
  transform: scale(1.05);
  /* 轻微放大 */
  animation: modalAppear 0.3s ease-out;
  /* 出现动画 */
}

.full-size-image {
  max-width: 100%;
  /* 最大宽度100% */
  max-height: 70vh;
  /* 最大高度为视口70% */
  object-fit: contain;
  /* 保持比例填充 */
  margin-bottom: 20px;
  /* 底部外边距 */
  border-radius: 8px;
  /* 圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  /* 阴影效果 */
}

/* ==================== 题目预览模态框样式 ==================== */
.preview-modal-overlay {
  z-index: 2000;
  /* 更高的z-index确保在最上层 */
}

.preview-modal-content {
  background: white;
  /* 白色背景 */
  padding: 40px;
  /* 内边距 */
  border-radius: 12px;
  /* 大圆角 */
  max-width: 800px;
  /* 最大宽度 */
  width: 95%;
  /* 宽度95% */
  max-height: 90vh;
  /* 最大高度为视口90% */
  overflow-y: auto;
  /* 垂直滚动 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  /* 阴影效果 */
  transform: scale(1.05);
  /* 轻微放大 */
  animation: modalAppear 0.3s ease-out;
  /* 出现动画 */
}

.preview-modal-title {
  margin-bottom: 25px;
  /* 底部外边距 */
  color: #303133;
  /* 深灰色文字 */
  font-size: 24px;
  /* 大字体 */
  font-weight: 600;
  /* 粗体 */
  text-align: center;
  /* 文字居中 */
  border-bottom: 2px solid #409eff;
  /* 底部边框 */
  padding-bottom: 15px;
  /* 底部内边距 */
}

.preview-content {
  margin-bottom: 30px;
  /* 底部外边距 */
}

.preview-section {
  margin-bottom: 20px;
  /* 底部外边距 */
  padding: 15px;
  /* 内边距 */
  border: 1px solid #e4e7ed;
  /* 边框 */
  border-radius: 8px;
  /* 圆角 */
  background: #fafafa;
  /* 浅灰色背景 */
}

.preview-section h4 {
  margin-bottom: 15px;
  /* 底部外边距 */
  color: #409eff;
  /* 主题蓝色文字 */
  font-size: 18px;
  /* 字体大小 */
  font-weight: 600;
  /* 粗体 */
  border-bottom: 1px solid #dcdfe6;
  /* 底部边框 */
  padding-bottom: 8px;
  /* 底部内边距 */
}

.preview-grid {
  display: grid;
  /* 网格布局 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  /* 自适应列 */
  gap: 15px;
  /* 网格间距 */
}

.preview-item {
  display: flex;
  /* 弹性布局 */
  flex-direction: column;
  /* 垂直方向 */
}

.preview-item label {
  font-weight: 600;
  /* 粗体 */
  color: #606266;
  /* 中灰色文字 */
  margin-bottom: 5px;
  /* 底部外边距 */
  font-size: 14px;
  /* 字体大小 */
}

.preview-item span {
  color: #303133;
  /* 深灰色文字 */
  font-size: 15px;
  /* 字体大小 */
  line-height: 1.5;
  /* 行高 */
  word-break: break-word;
  /* 单词换行 */
}

.preview-text-content {
  background: white;
  /* 白色背景 */
  padding: 15px;
  /* 内边距 */
  border-radius: 6px;
  /* 圆角 */
  border: 1px solid #dcdfe6;
  /* 边框 */
  line-height: 1.6;
  /* 行高 */
  color: #303133;
  /* 深灰色文字 */
  overflow: auto;
  /* 垂直滚动 */
}

.preview-img {
  max-width: 100%;
  /* 最大宽度100% */
  max-height: 4000px;
  /* 最大高度 */
  height: auto;
  /* 高度自适应 */
  border-radius: 6px;
  /* 圆角 */
  border: 1px solid #dcdfe6;
  /* 边框 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 阴影效果 */
}

.preview-options {
  display: flex;
  /* 弹性布局 */
  flex-direction: column;
  /* 垂直方向 */
  gap: 12px;
  /* 选项间距 */
}

.preview-option {
  display: flex;
  /* 弹性布局 */
  align-items: flex-start;
  /* 顶部对齐 */
  gap: 10px;
  /* 子元素间距 */
  padding: 12px;
  /* 内边距 */
  background: white;
  /* 白色背景 */
  border: 1px solid #dcdfe6;
  /* 边框 */
  border-radius: 6px;
  /* 圆角 */
  transition: all 0.3s;
  /* 过渡动画 */
  overflow-y: auto;
  /* 允许垂直滚动 */
}

.preview-option.correct-answer {
  background: #f0f9ff;
  /* 浅蓝色背景 */
  border-color: #409eff;
  /* 主题蓝色边框 */
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  /* 蓝色阴影 */
}

.option-label {
  font-weight: 600;
  /* 粗体 */
  color: #409eff;
  /* 主题蓝色 */
  min-width: 30px;
  /* 最小宽度 */
}

.option-text {
  flex: 1;
  /* 弹性填充 */
  color: #303133;
  /* 深灰色文字 */
  line-height: 1.5;
  /* 行高 */
}

.correct-badge {
  background: #67c23a;
  /* 绿色背景 */
  color: white;
  /* 白色文字 */
  padding: 4px 8px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  font-size: 12px;
  /* 小字体 */
  font-weight: 600;
  /* 粗体 */
}

.preview-actions {
  display: flex;
  /* 弹性布局 */
  gap: 15px;
  /* 按钮间距 */
  justify-content: center;
  /* 水平居中 */
  margin-top: 25px;
  /* 顶部外边距 */
  padding-top: 20px;
  /* 顶部内边距 */
  border-top: 1px solid #e4e7ed;
  /* 顶部边框 */
}

.preview-actions button {
  padding: 12px 24px;
  /* 内边距 */
  font-size: 16px;
  /* 字体大小 */
  border-radius: 6px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  transition: all 0.3s;
  /* 过渡动画 */
  min-width: 120px;
  /* 最小宽度 */
}

/* ==================== 删除知识点/解题思想/问题类别确认对话框样式 ==================== */
.delete-entity-modal {
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
}

.dependent-questions {
  margin: 20px 0;
  text-align: left;
}

.dependent-questions h4 {
  color: #f56c6c;
  margin-bottom: 10px;
  padding: 0px 0px 20px 0px;
  font-size: 16px;
}

.dependent-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background: #f9f9f9;
  margin-bottom: 15px;
}

.dependent-question {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
}

.dependent-question:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.dependent-question-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dependent-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dependent-question-id {
  font-weight: 600;
  color: #409eff;
}

.dependent-question-type {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.dependent-question-content {
  line-height: 1.4;
  color: #606266;
  color: #606266;
  overflow: visible;
  max-height: none;
}

.dependent-question-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.dependent-question-actions button {
  padding: 4px 8px;
  font-size: 12px;
}

.delete-all-btn {
  background-color: #e6a23c;
  margin-right: auto;
}

.delete-all-btn:hover {
  background-color: #eebe77;
}

/* ==================== 编辑按钮样式 ==================== */
.btn-edit-small {
  background-color: #409eff;
  /* 主题蓝色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 2px 6px;
  /* 小内边距 */
  border-radius: 3px;
  /* 小圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 12px;
  /* 小字体 */
  transition: background-color 0.3s;
  /* 背景色过渡 */
  margin-left: 4px;
  /* 左侧间距 */
}

.btn-edit-small:hover {
  background-color: #66b1ff;
  /* 悬停时更亮的蓝色 */
}

/* ==================== 按钮容器样式 ==================== */
.item-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* ==================== 表单组件样式 ==================== */
.form-group {
  margin-bottom: 20px;
  /* 底部外边距 */
}

.form-label {
  display: block;
  /* 块级显示 */
  margin-bottom: 8px;
  /* 底部外边距 */
  font-weight: 700;
  /* 粗体 */
  color: black;
  /* 黑色文字 */
}

/* 必填字段标记 */
.form-label.required::after {
  content: " *";
  /* 星号内容 */
  color: #f56c6c;
  /* 红色 */
}

/* 表单控件通用样式 */
.form-select,
.form-input,
.form-textarea {
  width: 100%;
  /* 宽度100% */
  padding: 10px 12px;
  /* 内边距 */
  border: 1px solid #dcdfe6;
  /* 边框 */
  border-radius: 4px;
  /* 圆角 */
  font-size: 14px;
  /* 字体大小 */
  transition: border-color 0.3s;
  /* 边框颜色过渡 */
  box-sizing: border-box;
  /* 盒模型 */
}

/* 表单控件焦点状态 */
.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  /* 去除默认轮廓 */
  border-color: #409eff;
  /* 主题蓝色边框 */
}

/* 下拉选择框特定样式 */
.form-select {
  background-color: white;
  /* 白色背景 */
  border: 2px solid #e4e7ed;
  /* 边框 */
  border-radius: 6px;
  /* 圆角 */
  padding: 10px;
  /* 内边距 */
  font-size: 16px;
  /* 字体大小 */
  cursor: pointer;
  /* 鼠标手型 */
  transition: all 0.3s ease;
  /* 过渡动画 */
}

.form-select:hover {
  border-color: #409eff;
  /* 悬停时主题蓝色边框 */
  background-color: #f5f7fa;
  /* 浅灰色背景 */
}

.form-select:focus {
  border-color: #409eff;
  /* 焦点时主题蓝色边框 */
  background-color: #fff;
  /* 白色背景 */
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  /* 蓝色发光效果 */
}

/* 错误状态的下拉框 */
.form-select.error {
  border-color: #f56c6c;
  /* 红色边框 */
  background-color: #fef0f0;
  /* 浅红色背景 */
}

.form-select.error:focus {
  border-color: #f56c6c;
  /* 红色边框 */
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
  /* 红色发光效果 */
}

/* 错误消息样式 */
.error-message {
  color: #f56c6c;
  /* 红色文字 */
  font-size: 12px;
  /* 小字体 */
  margin-top: 4px;
  /* 顶部外边距 */
  display: flex;
  /* 弹性布局 */
  align-items: center;
  /* 垂直居中 */
}

.error-message::before {
  content: "⚠ ";
  /* 警告图标 */
  margin-right: 4px;
  /* 右侧间距 */
}

.form-textarea {
  resize: vertical;
  /* 允许垂直调整大小 */
  min-height: 80px;
  /* 最小高度 */
}

/* 只读字段样式 */
.readonly-field {
  padding: 10px 12px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  min-height: 40px;
  display: flex;
  align-items: center;
}

/* ==================== 可搜索选择框样式 ==================== */
.searchable-select {
  position: relative;
  /* 相对定位，为下拉列表提供定位上下文 */
}

.dropdown-list {
  position: absolute;
  /* 绝对定位 */
  top: 100%;
  /* 位于父元素底部 */
  left: 0;
  /* 左侧对齐 */
  right: 0;
  /* 右侧对齐 */
  background: #ffffff;
  /* 白色背景 */
  border: 1px solid #dcdfe6;
  /* 边框 */
  border-radius: 8px;
  /* 圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* 阴影效果 */
  max-height: 250px;
  /* 最大高度 */
  overflow-y: auto;
  /* 垂直滚动 */
  z-index: 1000;
  /* 高z-index确保在最上层 */
  font-size: 16px;
  /* 字体大小 */
}

.dropdown-item {
  padding: 10px 12px;
  /* 内边距 */
  cursor: pointer;
  /* 鼠标手型 */
  transition: all 0.2s ease;
  /* 过渡动画 */
  border-bottom: 1px solid #f0f0f0;
  /* 底部边框 */
  background-color: white;
  /* 白色背景 */
  color: #303133;
  /* 文字颜色 */
  display: flex;
  /* 弹性布局 */
  justify-content: space-between;
  /* 两端对齐 */
  align-items: center;
  /* 垂直居中 */
}

.dropdown-item:hover {
  background-color: #409eff;
  /* 悬停时主题蓝色背景 */
  color: white;
  /* 白色文字 */
}

.dropdown-item:last-child {
  border-bottom: none;
  /* 最后一项无底部边框 */
}

.selected-mark {
  color: #409eff;
  /* 主题蓝色 */
  font-weight: bold;
  /* 粗体 */
}

.search-input {
  margin-bottom: 0;
  /* 无底部外边距 */
  border-radius: 4px;
  /* 圆角 */
}

/* ==================== 删除按钮样式 ==================== */
.btn-remove-small {
  background-color: #f56c6c;
  /* 红色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 2px 6px;
  /* 小内边距 */
  border-radius: 3px;
  /* 小圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 12px;
  /* 小字体 */
  transition: background-color 0.3s;
  /* 背景色过渡 */
  margin-left: 8px;
  /* 左侧间距 */
}

.btn-remove-small:hover {
  background-color: #f78989;
  /* 悬停时更亮的红色 */
}

/* ==================== 选中项显示样式 ==================== */
.selected-item {
  margin-top: 8px;
  /* 顶部外边距 */
  padding: 8px 12px;
  /* 内边距 */
  background: #f0f9ff;
  /* 浅蓝色背景 */
  border: 1px solid #bae7ff;
  /* 边框 */
  border-radius: 4px;
  /* 圆角 */
  display: flex;
  /* 弹性布局 */
  justify-content: space-between;
  /* 两端对齐 */
  align-items: center;
  /* 垂直居中 */
  font-size: 14px;
  /* 字体大小 */
}

.selected-items {
  margin-top: 8px;
  /* 顶部外边距 */
  display: flex;
  /* 弹性布局 */
  flex-wrap: wrap;
  /* 允许换行 */
  gap: 8px;
  /* 子元素间距 */
  align-items: center;
  /* 垂直居中 */
}

.selected-tag {
  background: #ecf5ff;
  /* 浅蓝色背景 */
  color: #409eff;
  /* 主题蓝色文字 */
  padding: 4px 8px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  font-size: 12px;
  /* 小字体 */
  border: 1px solid #d9ecff;
  /* 边框 */
  cursor: pointer;
  /* 鼠标手型 */
  transition: background-color 0.3s;
  /* 背景色过渡 */
}

.selected-tag:hover {
  background-color: #d9ecff;
  /* 悬停时更深的蓝色背景 */
}

.selected-tags-label {
  font-size: 13px;
  /* 字体大小 */
  color: #909399;
  /* 浅灰色文字 */
}

/* ==================== 难度多选样式 ==================== */
.difficulty-multi-select {
  margin-top: 5px;
}

.difficulty-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.difficulty-option {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  background-color: white;
}

.difficulty-option:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.difficulty-option.selected {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.difficulty-stars {
  font-size: 14px;
  font-weight: 500;
}

/* ==================== 无结果提示样式 ==================== */
.no-results {
  text-align: center;
  /* 文字居中 */
  padding: 40px;
  /* 内边距 */
  color: #909399;
  /* 浅灰色文字 */
  font-size: 16px;
  /* 字体大小 */
  background: #fafafa;
  /* 浅灰色背景 */
  border-radius: 4px;
  /* 圆角 */
  margin-top: 20px;
  /* 顶部外边距 */
}

.no-results p {
  margin: 0;
  /* 无外边距 */
}

/* 多选下拉框样式 */
.searchable-select .form-select[multiple] {
  height: 80px;
  /* 固定高度 */
  padding: 5px;
  /* 内边距 */
}

.searchable-select .form-select[multiple] option {
  padding: 5px 8px;
  /* 选项内边距 */
}

/* ==================== 新建知识点输入区域样式 ==================== */
.new-knowledge-input {
  display: flex;
  /* 弹性布局 */
  gap: 10px;
  /* 子元素间距 */
  margin-top: 10px;
  /* 顶部外边距 */
}

.new-knowledge-input .form-input {
  flex: 1;
  /* 弹性填充 */
}

/* ==================== 按钮样式系统 ==================== */
/* 主要按钮样式 */
.btn-primary {
  background-color: #409eff;
  /* 主题蓝色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 10px 20px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 14px;
  /* 字体大小 */
  transition: background-color 0.3s;
  /* 背景色过渡 */
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  /* 悬停时更亮的蓝色 */
}

.btn-primary:disabled {
  background-color: #a0cfff;
  /* 禁用时浅蓝色 */
  cursor: not-allowed;
  /* 禁用光标 */
}

/* 次要按钮样式 */
.btn-secondary {
  background-color: #f4f4f5;
  /* 浅灰色背景 */
  color: #606266;
  /* 中灰色文字 */
  border: 1px solid #d3d4d6;
  /* 边框 */
  padding: 8px 16px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 13px;
  /* 字体大小 */
  transition: all 0.3s;
  /* 过渡动画 */
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e9e9eb;
  /* 悬停时更深的灰色 */
}

.btn-secondary:disabled {
  opacity: 0.6;
  /* 半透明 */
  cursor: not-allowed;
  /* 禁用光标 */
}

/* 高亮按钮样式（用于新建等操作） */
.btn-highlight {
  background-color: #67c23a;
  /* 绿色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 10px 16px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 13px;
  /* 字体大小 */
  transition: all 0.3s;
  /* 过渡动画 */
  font-weight: 500;
  /* 中等字重 */
}

.btn-highlight:hover:not(:disabled) {
  background-color: #85ce61;
  /* 悬停时更亮的绿色 */
  transform: translateY(-1px);
  /* 上移效果 */
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
  /* 阴影效果 */
}

.btn-highlight:disabled {
  opacity: 0.6;
  /* 半透明 */
  cursor: not-allowed;
  /* 禁用光标 */
  transform: none;
  /* 无变换 */
  box-shadow: none;
  /* 无阴影 */
}

/* 移除按钮样式 */
.btn-remove {
  background-color: #f56c6c;
  /* 红色背景 */
  color: white;
  /* 白色文字 */
  border: none;
  /* 无边框 */
  padding: 6px 12px;
  /* 内边距 */
  border-radius: 4px;
  /* 圆角 */
  cursor: pointer;
  /* 鼠标手型 */
  font-size: 12px;
  /* 小字体 */
}

.btn-remove:hover {
  background-color: #f78989;
  /* 悬停时更亮的红色 */
}

/* ==================== 图片上传区域样式 ==================== */
.image-preview {
  display: flex;
  /* 弹性布局 */
  align-items: center;
  /* 垂直居中 */
  gap: 15px;
  /* 子元素间距 */
  margin-top: 10px;
  /* 顶部外边距 */
}

/* ==================== 选项列表样式 ==================== */
.options-list {
  margin-bottom: 15px;
  /* 底部外边距 */
}

.option-item {
  display: flex;
  /* 弹性布局 */
  align-items: flex-start;
  /* 顶部对齐 */
  gap: 10px;
  /* 子元素间距 */
  margin-bottom: 15px;
  /* 底部外边距 */
  padding: 10px;
  /* 内边距 */
  background: #fafafa;
  /* 浅灰色背景 */
  border-radius: 4px;
  /* 圆角 */
}

.option-label {
  font-weight: 500;
  /* 中等字重 */
  min-width: 30px;
  /* 最小宽度 */
  color: #409eff;
  /* 主题蓝色 */
  margin-top: 8px;
  /* 顶部外边距 */
}

.option-input-container {
  flex: 1;
  /* 弹性填充 */
  display: flex;
  /* 弹性布局 */
  flex-direction: column;
  /* 垂直方向 */
}

.option-input {
  margin-bottom: 4px;
  /* 底部外边距 */
}

.option-actions {
  display: flex;
  /* 弹性布局 */
  align-items: center;
  /* 垂直居中 */
  gap: 10px;
  /* 子元素间距 */
  margin-top: 8px;
  /* 顶部外边距 */
}

.radio-input,
.checkbox-input {
  margin: 0;
  /* 无外边距 */
}

.radio-label,
.checkbox-label {
  font-size: 13px;
  /* 小字体 */
  color: #606266;
  /* 中灰色文字 */
  white-space: nowrap;
  /* 不换行 */
}

/* ==================== 表单操作区域样式 ==================== */
.form-actions {
  display: flex;
  /* 弹性布局 */
  gap: 15px;
  /* 子元素间距 */
  margin-top: 30px;
  /* 顶部外边距 */
  padding-top: 20px;
  /* 顶部内边距 */
  border-top: 1px solid #e4e7ed;
  /* 顶部边框 */
  grid-column: 1 / -1;
  /* 网格布局中跨所有列 */
}

.submit-btn {
  flex: 1;
  /* 弹性填充 */
}

/* ==================== 表格列宽设置 ==================== */
/* 按顺序为每个表格列设置固定宽度 */
.table-cell:nth-child(1) {
  width: 60px;
  /* 上传者列 */
}

.table-cell:nth-child(2) {
  width: 60px;
  /* 审核者列 */
}

.table-cell:nth-child(3) {
  width: 80px;
  /* 年级列 */
}

.table-cell:nth-child(4) {
  width: 50px;
  /* 科目列 */
}

.table-cell:nth-child(5) {
  width: 90px;
  /* 问题类别列 */
}

.table-cell:nth-child(6) {
  width: 50px;
  /* 评分方法列 */
}

.table-cell:nth-child(7) {
  width: 100px;
  /* 知识点列 */
}

.table-cell:nth-child(8) {
  width: 100px;
  /* 解题思想列 */
}

.table-cell:nth-child(9) {
  width: 150px;
  /* 副知识点列 */
}

.table-cell:nth-child(10) {
  width: 50px;
  /* 难度列 */
}

.table-cell:nth-child(11) {
  width: 300px;
  /* 题目内容列 */
}

.table-cell:nth-child(12) {
  width: 100px;
  /* 备注列 */
}

.table-cell:nth-child(13) {
  width: 100px;
  /* 图片列 */
}

.table-cell:nth-child(14) {
  width: 45px;
  /* 操作列 */
}

/* 表格行边框 */
.table-row {
  border-bottom: 1px solid #e4e7ed;
  /* 底部边框 */
}

.table-header {
  border-bottom: 2px solid #e4e7ed;
  /* 更粗的底部边框 */
}

.table-row:last-child {
  border-bottom: none;
  /* 最后一行无边框 */
}

.actions-cell {
  display: flex;
  /* 弹性布局 */
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
  height: 100%;
  /* 高度100% */
  min-height: 60px;
  /* 最小高度 */
}

.sub-knowledge-tag {
  margin: 2px;
  /* 外边距 */
}

/* ==================== 知识点树样式 ==================== */
.knowledge-tree-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background-color: #fff;
}

.tree-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.btn-clear {
  padding: 6px 12px;
  background-color: #f4f4f5;
  border: 1px solid #d3d4d6;
  border-radius: 4px;
  color: #606266;
  cursor: pointer;
  font-size: 12px;
}

.btn-clear:hover {
  background-color: #e9e9eb;
}

.tree-wrapper {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
}

.loading-tip {
  padding: 20px;
  text-align: center;
  color: #909399;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

.select-tip {
  padding: 10px;
  text-align: center;
  color: #909399;
  font-style: italic;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.no-knowledge {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-style: italic;
}

/* 调整已选择的知识点显示 */
.selected-item {
  margin-top: 15px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bae7ff;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

.selected-items {
  margin-top: 15px;
  padding: 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
}

/* 更新界面的树容器调整 */
.criteria-item .knowledge-tree-container {
  max-width: 400px;
}

.criteria-item .tree-wrapper {
  max-height: 200px;
}

/* 年级标签样式 */
.selected-grades-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #bae7ff;
}

.grades-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.grade-tag {
  background: #409eff;
  color: white;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

/* 知识点标签中的年级信息 */
.tag-grade {
  font-size: 10px;
  color: #d65601;
  margin-left: 4px;
  font-weight: 500;
}

.remove-icon {
  margin-left: 4px;
  cursor: pointer;
  font-weight: bold;
  color: #f56c6c;
}

/* 知识点树节点中的年级标识 */
:deep(.knowledge-tree-node .node-content) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

:deep(.knowledge-tree-node .node-content:hover) {
  background-color: #f5f7fa;
}

:deep(.grade-indicator) {
  font-size: 10px;
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 10px;
  border: 1px solid #d9ecff;
  white-space: nowrap;
}

/* ==================== 全宽度知识点筛选样式 ==================== */
.criteria-item.full-width {
  width: 100%;
  min-width: 100%;
  flex-basis: 100%;
  margin-bottom: 20px;
}

.knowledge-tree-container.full-width-container {
  width: 100%;
  max-width: 100%;
}

.select-tip.full-width-tip {
  width: 100%;
  text-align: left;
}

/* 调整更新界面中知识点树的高度和显示 */
.update-section .knowledge-tree-container {
  max-width: 100% !important;
  width: 100% !important;
}

.update-section .tree-wrapper {
  max-height: 250px !important;
  min-height: 150px;
}

/* 调整已选择的知识点标签显示 */
.update-section .selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  margin-top: 10px;
  border: 1px solid #bae7ff;
}

.update-section .selected-tag {
  background: #409eff;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.update-section .selected-tag:hover {
  background: #66b1ff;
  transform: translateY(-1px);
}

.update-section .selected-tags-label {
  color: #606266;
  font-weight: 500;
  margin-right: 8px;
  align-self: center;
}

/* 调整检索条件区域的布局 */
.search-criteria {
  margin-bottom: 30px;
}

.criteria-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-start;
}

.criteria-item:not(.full-width) {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

/* 让题目内容搜索框独占一行 */
.criteria-item:has(input[type="text"][placeholder*="题目关键词"]) {
  flex-basis: 100%;
  min-width: 100%;
  max-width: 500px;
}

/* 调整难度多选按钮的布局 */
.difficulty-multi-select {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.difficulty-option {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  font-size: 13px;
}

/* 调整表格布局 */
.results-table {
  min-width: 1400px;
  /* 增加最小宽度以适应更宽的内容 */
}

/* 为知识点和副知识点列增加宽度 */
.table-cell:nth-child(6) {
  width: 100px;
  /* 知识点列 */
}

.table-cell:nth-child(8) {
  width: 200px;
  /* 副知识点列 */
}

/* ==================== 审核人选择样式 ==================== */
.form-select option {
  padding: 8px 12px;
}

.form-select option:first-child {
  color: #909399;
}

/* 已选择的审核人显示 */
.selected-item .btn-remove {
  margin-left: 10px;
  padding: 4px 8px;
  font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .criteria-item:not(.full-width) {
    min-width: 180px;
  }

  .update-section .tree-wrapper {
    max-height: 200px !important;
  }
}

@media (max-width: 992px) {
  .criteria-item:not(.full-width) {
    min-width: 150px;
  }

  .criteria-item.full-width {
    margin-bottom: 15px;
  }
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {

  /* 在小屏幕上将选项项改为垂直布局 */
  .option-item {
    flex-direction: column;
    /* 垂直方向 */
    align-items: stretch;
    /* 拉伸对齐 */
  }

  .option-actions {
    justify-content: flex-start;
    /* 左对齐 */
    margin-top: 10px;
    /* 顶部外边距 */
  }

  /* 预览模态框在小屏幕上的适配 */
  .preview-modal-content {
    padding: 20px;
    /* 较小的内边距 */
    margin: 10px;
    /* 较小的外边距 */
  }

  .preview-grid {
    grid-template-columns: 1fr;
    /* 单列布局 */
  }

  .preview-actions {
    flex-direction: column;
    /* 垂直方向 */
  }

  /* 删除实体确认对话框在小屏幕上的适配 */
  .delete-entity-modal {
    padding: 20px;
    margin: 10px;
  }

  .dependent-question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .dependent-question-actions {
    justify-content: flex-start;
  }

  /* 合并知识点模态框在小屏幕上的适配 */
  .merge-knowledge-modal {
    padding: 20px;
    margin: 10px;
  }

  .merge-source-points {
    flex-direction: column;
    align-items: flex-start;
  }

  .affected-question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  /* Markdown 编辑器在小屏幕上的适配 */
  .markdown-editor-container {
    margin-bottom: 8px;
  }

  .markdown-editor {
    height: 150px;
  }

  .markdown-editor.option-editor {
    height: 80px;
  }
}
</style>
