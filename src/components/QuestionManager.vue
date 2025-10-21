<template>
  <div class="container">
    <h1>教育题库管理系统</h1>
    <button @click="confirmLogout" class="logout-btn">
      <span class="logout-icon"></span>
      退出登录
    </button>
    <div class="mode-select">
      <button :class="{ active: !updateMode }" @click="exitUpdateMode" type="button">
        上传题目
      </button>
      <button :class="{ active: updateMode }" @click="enterUpdateMode" type="button">
        更新题目
      </button>
    </div>

    <!-- 上传题目表单 -->
    <section v-if="!updateMode" class="form-section">
      <h2>上传题目</h2>
      <form @submit.prevent="handleSubmit">
        <!-- 学校 -->
        <div class="form-group">
          <label class="form-label">学校：</label>
          <select v-model="form.school_id" class="form-select">
            <option :value="null">全部</option>
            <option v-for="school in schoolList" :key="school.id" :value="school.id">
              {{ school.name }}
            </option>
          </select>
        </div>

        <!-- 科目 -->
        <div class="form-group">
          <label class="form-label">科目：</label>
          <select v-model="form.subject_id" class="form-select">
            <option :value="null">全部</option>
            <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </select>
        </div>

        <!-- 题型 -->
        <div class="form-group">
          <label class="form-label required">题型：</label>
          <select v-model="form.question_type" class="form-select" :class="{ error: questionTypeError }"
            @change="handleQuestionTypeChange" required>
            <option :value="null">请选择题型</option>
            <option value="SINGLE">单选题</option>
            <option value="MULTIPLE">多选题</option>
            <option value="SUBJECTIVE">主观题</option>
          </select>
          <div v-if="questionTypeError" class="error-message">请选择题型</div>
        </div>

        <!-- 题目内容 -->
        <div class="form-group">
          <label class="form-label required">题目内容：</label>
          <textarea v-model="form.title" placeholder="请输入题干" class="form-textarea" rows="3" required></textarea>

          <!-- 图片上传（题干图片） -->
          <div class="image-upload-section">
            <label class="form-label">题干图片：</label>
            <div class="upload-controls">
              <input type="file" @change="handleImageUpload" accept="image/*" class="file-input" ref="fileInput" />
              <button type="button" @click="$refs.fileInput.click()" class="btn-secondary">
                选择图片
              </button>
            </div>
            <div v-if="form.img_url" class="image-preview">
              <img :src="form.img_url" alt="预览" class="preview-image" />
              <button type="button" @click="removeImage" class="btn-remove">
                移除图片
              </button>
            </div>
          </div>
        </div>

        <!-- 选择题选项 -->
        <div v-if="showOptions" class="form-group">
          <label class="form-label">选项：</label>
          <div class="options-list">
            <div v-for="(opt, index) in form.options" :key="index" class="option-item">
              <span class="option-label">{{ getOptionLabel(index) }}.</span>
              <input type="text" v-model="opt.text" :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                class="form-input option-input" required />
              <div class="option-actions">
                <template v-if="form.question_type === 'SINGLE'">
                  <input type="radio" name="singleAnswer" :value="index" v-model="singleAnswerIndex"
                    :id="`upload-single-answer-${index}`" class="radio-input" required />
                  <label class="radio-label" :for="`upload-single-answer-${index}`">正确答案</label>
                </template>
                <template v-else-if="form.question_type === 'MULTIPLE'">
                  <input type="checkbox" v-model="opt.isAnswer" :id="`upload-multiple-answer-${index}`"
                    class="checkbox-input" />
                  <label class="checkbox-label" :for="`upload-multiple-answer-${index}`">正确答案</label>
                </template>
                <button type="button" @click="removeOption(index)" class="btn-remove"
                  :disabled="form.options.length <= 2">
                  删除
                </button>
              </div>
            </div>
          </div>
          <button type="button" @click="addOption" class="btn-secondary">添加选项</button>
        </div>

        <!-- 主观题答案 -->
        <div v-if="form.question_type === 'SUBJECTIVE'" class="form-group">
          <label class="form-label required">参考答案：</label>
          <textarea v-model="form.answer" placeholder="请输入参考答案" class="form-textarea" rows="4" required></textarea>
        </div>

        <!-- 知识点 -->
        <div class="form-group">
          <label class="form-label">知识点：</label>
          <div class="searchable-select">
            <input type="text" v-model="knowledgeSearch" placeholder="输入关键字搜索知识点..." class="form-input search-input"
              @input="filterKnowledgePoints" @focus="showKnowledgeDropdown = true" @blur="onKnowledgeBlur" />
            <div v-if="showKnowledgeDropdown && filteredKnowledgePoints.length" class="dropdown-list">
              <div v-for="kp in filteredKnowledgePoints" :key="kp.id" class="dropdown-item"
                @mousedown="selectKnowledgePoint(kp)">
                {{ kp.name }}
              </div>
            </div>
          </div>
          <div class="selected-item" v-if="selectedKnowledgePoint">
            已选择: {{ selectedKnowledgePoint.name }}
            <button type="button" @click="clearKnowledgePoint" class="btn-remove">
              清除
            </button>
          </div>
          <div class="new-knowledge-input">
            <input type="text" v-model="newKnowledgePoint" placeholder="新建知识点（多个用逗号分隔）" class="form-input"
              @keypress.enter="uploadKnowledgePoint" />
            <button type="button" @click="uploadKnowledgePoint" class="btn-highlight"
              :disabled="!newKnowledgePoint.trim()">
              新增知识点
            </button>
          </div>
        </div>

        <!-- 子知识点 -->
        <div class="form-group">
          <label class="form-label">子知识点：</label>
          <div class="searchable-select">
            <input type="text" v-model="subKnowledgeSearch" placeholder="输入关键字搜索子知识点..." class="form-input search-input"
              @input="filterSubKnowledgePoints" @focus="showSubKnowledgeDropdown = true" @blur="onSubKnowledgeBlur" />
            <div v-if="showSubKnowledgeDropdown && filteredSubKnowledgePoints.length" class="dropdown-list">
              <div v-for="kp in filteredSubKnowledgePoints" :key="kp.id" class="dropdown-item"
                @mousedown="selectSubKnowledgePoint(kp)">
                {{ kp.name }}
                <span v-if="isSubKnowledgeSelected(kp.id)" class="selected-mark">✓</span>
              </div>
            </div>
          </div>
          <div class="selected-items" v-if="selectedSubKnowledgePoints.length">
            <span class="selected-tags-label">已选择：</span>
            <span v-for="kp in selectedSubKnowledgePoints" :key="kp.id" class="selected-tag"
              @click="removeSubKnowledgePoint(kp.id)">
              {{ kp.name }} ×
            </span>
          </div>
          <div class="new-knowledge-input">
            <input type="text" v-model="newSubKnowledgePoint" placeholder="新建子知识点（多个用逗号分隔）" class="form-input"
              @keypress.enter="uploadSubKnowledgePoint" />
            <button type="button" @click="uploadSubKnowledgePoint" class="btn-highlight"
              :disabled="!newSubKnowledgePoint.trim()">
              新增子知识点
            </button>
          </div>
        </div>

        <!-- 问题定义 -->
        <div class="form-group">
          <label class="form-label">问题定义：</label>
          <div class="searchable-select">
            <input type="text" v-model="questionDefinitionSearch" placeholder="输入关键字搜索问题定义..."
              class="form-input search-input" @input="filterQuestionDefinitions"
              @focus="showQuestionDefinitionDropdown = true" @blur="onQuestionDefinitionBlur" />
            <div v-if="showQuestionDefinitionDropdown && filteredQuestionDefinitions.length" class="dropdown-list">
              <div v-for="item in filteredQuestionDefinitions" :key="item.id" class="dropdown-item"
                @mousedown="selectQuestionDefinition(item)">
                {{ item.name }}
              </div>
            </div>
          </div>
          <div class="selected-item" v-if="selectedQuestionDefinition">
            已选择: {{ selectedQuestionDefinition.name }}
            <button type="button" @click="clearQuestionDefinition" class="btn-remove">
              清除
            </button>
          </div>
          <div class="new-knowledge-input">
            <input type="text" v-model="newQuestionDefinition" placeholder="新建问题定义（多个用逗号分隔）" class="form-input"
              @keypress.enter="uploadQuestionDefinition" />
            <button type="button" @click="uploadQuestionDefinition" class="btn-highlight"
              :disabled="!newQuestionDefinition.trim()">
              新增问题定义
            </button>
          </div>
        </div>

        <!-- 解题思想 -->
        <div class="form-group">
          <label class="form-label">解题思想：</label>
          <div class="searchable-select">
            <input type="text" v-model="solutionIdeaSearch" placeholder="输入关键字搜索解题思想..." class="form-input search-input"
              @input="filterSolutionIdeas" @focus="showSolutionIdeaDropdown = true" @blur="onSolutionIdeaBlur" />
            <div v-if="showSolutionIdeaDropdown && filteredSolutionIdeas.length" class="dropdown-list">
              <div v-for="item in filteredSolutionIdeas" :key="item.id" class="dropdown-item"
                @mousedown="selectSolutionIdea(item)">
                {{ item.name }}
              </div>
            </div>
          </div>
          <div class="selected-item" v-if="selectedSolutionIdea">
            已选择: {{ selectedSolutionIdea.name }}
            <button type="button" @click="clearSolutionIdea" class="btn-remove">
              清除
            </button>
          </div>
          <div class="new-knowledge-input">
            <input type="text" v-model="newSolutionIdea" placeholder="新建解题思想（多个用逗号分隔）" class="form-input"
              @keypress.enter="uploadSolutionIdea" />
            <button type="button" @click="uploadSolutionIdea" class="btn-highlight" :disabled="!newSolutionIdea.trim()">
              新增解题思想
            </button>
          </div>
        </div>

        <!-- 问题类别 -->
        <div class="form-group">
          <label class="form-label">问题类别：</label>
          <div class="searchable-select">
            <input type="text" v-model="questionCategorySearch" placeholder="输入关键字搜索问题类别..."
              class="form-input search-input" @input="filterQuestionCategories"
              @focus="showQuestionCategoryDropdown = true" @blur="onQuestionCategoryBlur" />
            <div v-if="showQuestionCategoryDropdown && filteredQuestionCategories.length" class="dropdown-list">
              <div v-for="item in filteredQuestionCategories" :key="item.id" class="dropdown-item"
                @mousedown="selectQuestionCategory(item)">
                {{ item.name }}
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

        <!-- 难度 -->
        <div class="form-group">
          <label class="form-label">难度：</label>
          <select v-model="form.difficulty_level" class="form-select">
            <option :value="null">暂无难度评级</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }} 星</option>
          </select>
        </div>

        <!-- 评分方法 -->
        <div class="form-group">
          <label class="form-label">评分方法：</label>
          <select v-model="form.marking_type" class="form-select">
            <option value="0">自动评分</option>
            <option value="1">人工评分</option>
          </select>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button type="submit" class="btn-primary submit-btn" :disabled="submitting">
            {{ submitting ? "提交中..." : "提交题目" }}
          </button>
        </div>
      </form>
    </section>

    <!-- 更新题目界面 -->
    <section v-if="updateMode" class="update-section">
      <!-- 检索条件 -->
      <div class="search-criteria">
        <h2>检索题目</h2>
        <div class="criteria-row">
          <div class="criteria-item">
            <label>年级：</label>
            <select v-model="searchCriteria.grade_id" class="form-select">
              <option :value="null">全部</option>
              <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
          </div>

          <div class="criteria-item">
            <label>科目：</label>
            <select v-model="searchCriteria.subject_id" class="form-select">
              <option :value="null">全部</option>
              <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>

          <div class="criteria-item">
            <label>题型：</label>
            <select v-model="searchCriteria.question_type" class="form-select">
              <option :value="null">全部</option>
              <option value="SINGLE">单选题</option>
              <option value="MULTIPLE">多选题</option>
              <option value="SUBJECTIVE">主观题</option>
            </select>
          </div>

          <!-- 知识点（多选） -->
          <div class="criteria-item">
            <label>知识点：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateKnowledgeSearch" placeholder="输入关键字搜索知识点..."
                class="form-input search-input" @input="filterUpdateKnowledgePoints"
                @focus="showUpdateKnowledgeDropdown = true" @blur="onUpdateKnowledgeBlur" />
              <div v-if="showUpdateKnowledgeDropdown && filteredUpdateKnowledgePoints.length" class="dropdown-list">
                <div v-for="kp in filteredUpdateKnowledgePoints" :key="kp.id" class="dropdown-item"
                  @mousedown="selectUpdateKnowledgePoint(kp)">
                  {{ kp.name }}
                  <span v-if="isUpdateKnowledgeSelected(kp.id)" class="selected-mark">✓</span>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateKnowledgePoints.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="kp in selectedUpdateKnowledgePoints" :key="kp.id" class="selected-tag"
                @click="removeUpdateKnowledgePoint(kp.id)">
                {{ kp.name }} ×
              </span>
            </div>
          </div>

          <div class="criteria-item">
            <label>难度：</label>
            <select v-model="searchCriteria.difficulty_level" class="form-select">
              <option :value="null">全部</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} 星</option>
            </select>
          </div>

          <div class="criteria-item">
            <label>题目内容：</label>
            <input type="text" v-model="searchCriteria.title" placeholder="输入题目关键词" class="form-input" />
          </div>

          <div class="criteria-item">
            <button @click="findQuestions" class="btn-primary search-btn">检索</button>
          </div>
        </div>
      </div>

      <!-- 检索结果 -->
      <div v-if="questionList.length" class="search-results">
        <h3>检索结果 (共 {{ questionList.length }} 条)</h3>
        <div class="results-table-container">
          <div class="results-table">
            <div class="table-header">
              <div class="table-cell">ID</div>
              <div class="table-cell">学校</div>
              <div class="table-cell">年级</div>
              <div class="table-cell">科目</div>
              <div class="table-cell">题型</div>
              <div class="table-cell">评分方法</div>
              <div class="table-cell">知识点</div>
              <div class="table-cell">问题定义</div>
              <div class="table-cell">解题思想</div>
              <div class="table-cell">问题类别</div>
              <div class="table-cell">子知识点</div>
              <div class="table-cell">难度</div>
              <div class="table-cell">题目内容</div>
              <div class="table-cell">图片</div>
              <div class="table-cell">操作</div>
            </div>
            <div v-for="q in questionList" :key="q.id" class="table-row">
              <div class="table-cell">{{ q.id }}</div>
              <div class="table-cell">{{ getSchoolName(q.school_id) }}</div>
              <div class="table-cell">{{ getGradeName(q.grade_id) }}</div>
              <div class="table-cell">{{ getSubjectName(q.subject_id) }}</div>
              <div class="table-cell">{{ getQuestionTypeName(q.question_type) }}</div>
              <div class="table-cell">{{ getMarkingTypeName(q.marking_type) }}</div>
              <div class="table-cell">{{ getKnowledgePointName(q.knowledge_point) }}</div>
              <div class="table-cell">
                {{ getQuestionDefinitionName(q.question_definition_id) }}
              </div>
              <div class="table-cell">{{ getSolutionIdeaName(q.solution_idea_id) }}</div>
              <div class="table-cell">
                {{ getQuestionCategoryName(q.question_category_id) }}
              </div>
              <div class="table-cell sub-knowledge-cell">
                <span v-for="subId in q.sub_knowledge_point || []" :key="subId" class="sub-knowledge-tag">
                  {{ getKnowledgePointName(subId) }}
                </span>
                <span v-if="!(q.sub_knowledge_point && q.sub_knowledge_point.length)" class="no-sub-knowledge">
                  无
                </span>
              </div>
              <div class="table-cell">{{ q.difficulty_level }}星</div>
              <div class="table-cell title-cell">{{ q.title }}</div>
              <div class="table-cell image-cell">
                <img v-if="q.img_url" :src="q.img_url" alt="题目图片" class="thumbnail-image"
                  @click="previewImage(q.img_url)" />
                <span v-else class="no-image">-</span>
              </div>
              <div class="table-cell actions-cell">
                <button @click="loadQuestionForUpdate(q)" class="btn-update">更新</button>
                <button @click="confirmDelete(q)" class="btn-delete">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-else-if="hasSearched" class="no-results">
        <p>暂无相关题目</p>
      </div>

      <!-- 更新题目表单 -->
      <div v-if="selectedQuestion && showUpdateForm" class="update-form-section" ref="updateFormRef">
        <h3>更新题目 (ID: {{ selectedQuestion.id }})</h3>
        <form @submit.prevent="handleUpdateSubmit" class="update-form">
          <!-- 学校 -->
          <div class="form-group">
            <label class="form-label required">学校：</label>
            <select v-model="updateForm.school_id" class="form-select" required>
              <option :value="null">请选择学校</option>
              <option v-for="school in schoolList" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
          </div>

          <!-- 年级 -->
          <div class="form-group">
            <label class="form-label required">年级：</label>
            <select v-model="updateForm.grade_id" class="form-select" required>
              <option :value="null">请选择年级</option>
              <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
          </div>

          <!-- 科目 -->
          <div class="form-group">
            <label class="form-label required">科目：</label>
            <select v-model="updateForm.subject_id" class="form-select" required>
              <option :value="null">请选择科目</option>
              <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>

          <!-- 题型 -->
          <div class="form-group">
            <label class="form-label required">题型：</label>
            <select v-model="updateForm.question_type" class="form-select" :class="{ error: updateQuestionTypeError }"
              @change="handleUpdateQuestionTypeChange" required>
              <option :value="null">请选择题型</option>
              <option value="SINGLE">单选题</option>
              <option value="MULTIPLE">多选题</option>
              <option value="SUBJECTIVE">主观题</option>
            </select>
            <div v-if="updateQuestionTypeError" class="error-message">请选择题型</div>
          </div>

          <!-- 评分方法 -->
          <div class="form-group">
            <label class="form-label required">评分方法：</label>
            <select v-model="updateForm.marking_type" class="form-select" required>
              <option value="0">自动评分</option>
              <option value="1">人工评分</option>
            </select>
          </div>

          <!-- 知识点 -->
          <div class="form-group">
            <label class="form-label">知识点：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateFormKnowledgeSearch" placeholder="输入关键字搜索知识点..."
                class="form-input search-input" @input="filterUpdateFormKnowledgePoints"
                @focus="showUpdateFormKnowledgeDropdown = true" @blur="onUpdateFormKnowledgeBlur" />
              <div v-if="
                showUpdateFormKnowledgeDropdown &&
                filteredUpdateFormKnowledgePoints.length
              " class="dropdown-list">
                <div v-for="kp in filteredUpdateFormKnowledgePoints" :key="kp.id" class="dropdown-item"
                  @mousedown="selectUpdateFormKnowledgePoint(kp)">
                  {{ kp.name }}
                </div>
              </div>
            </div>
            <div class="selected-item" v-if="selectedUpdateFormKnowledgePoint">
              已选择: {{ selectedUpdateFormKnowledgePoint.name }}
              <button type="button" @click="clearUpdateFormKnowledgePoint" class="btn-remove">
                清除
              </button>
            </div>
          </div>

          <!-- 问题定义 -->
          <div class="form-group">
            <label class="form-label">问题定义：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateFormQuestionDefinitionSearch" placeholder="输入关键字搜索问题定义..."
                class="form-input search-input" @input="filterUpdateFormQuestionDefinitions"
                @focus="showUpdateFormQuestionDefinitionDropdown = true" @blur="onUpdateFormQuestionDefinitionBlur" />
              <div v-if="
                showUpdateFormQuestionDefinitionDropdown &&
                filteredUpdateFormQuestionDefinitions.length
              " class="dropdown-list">
                <div v-for="item in filteredUpdateFormQuestionDefinitions" :key="item.id" class="dropdown-item"
                  @mousedown="selectUpdateFormQuestionDefinition(item)">
                  {{ item.name }}
                </div>
              </div>
            </div>
            <div class="selected-item" v-if="selectedUpdateFormQuestionDefinition">
              已选择: {{ selectedUpdateFormQuestionDefinition.name }}
              <button type="button" @click="clearUpdateFormQuestionDefinition" class="btn-remove">
                清除
              </button>
            </div>
          </div>

          <!-- 解题思想 -->
          <div class="form-group">
            <label class="form-label">解题思想：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateFormSolutionIdeaSearch" placeholder="输入关键字搜索解题思想..."
                class="form-input search-input" @input="filterUpdateFormSolutionIdeas"
                @focus="showUpdateFormSolutionIdeaDropdown = true" @blur="onUpdateFormSolutionIdeaBlur" />
              <div v-if="
                showUpdateFormSolutionIdeaDropdown &&
                filteredUpdateFormSolutionIdeas.length
              " class="dropdown-list">
                <div v-for="item in filteredUpdateFormSolutionIdeas" :key="item.id" class="dropdown-item"
                  @mousedown="selectUpdateFormSolutionIdea(item)">
                  {{ item.name }}
                </div>
              </div>
            </div>
            <div class="selected-item" v-if="selectedUpdateFormSolutionIdea">
              已选择: {{ selectedUpdateFormSolutionIdea.name }}
              <button type="button" @click="clearUpdateFormSolutionIdea" class="btn-remove">
                清除
              </button>
            </div>
          </div>

          <!-- 问题类别 -->
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

          <!-- 难度 -->
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
            <textarea v-model="updateForm.title" placeholder="请输入题干" class="form-textarea" rows="3" required></textarea>

            <!-- 图片上传（题干图片） -->
            <div class="image-upload-section">
              <label class="form-label">题干图片：</label>
              <div class="upload-controls">
                <input type="file" @change="handleUpdateImageUpload" accept="image/*" class="file-input"
                  ref="updateFileInput" />
                <button type="button" @click="$refs.updateFileInput.click()" class="btn-secondary">
                  选择图片
                </button>
              </div>
              <div v-if="updateForm.img_url" class="image-preview">
                <img :src="updateForm.img_url" alt="预览" class="preview-image" />
                <button type="button" @click="removeUpdateImage" class="btn-remove">
                  移除图片
                </button>
              </div>
            </div>
          </div>

          <!-- 选择题选项 -->
          <div v-if="showUpdateOptions" class="form-group">
            <label class="form-label">选项：</label>
            <div class="options-list">
              <div v-for="(opt, index) in updateForm.options" :key="index" class="option-item">
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <input type="text" v-model="opt.text" :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                  class="form-input option-input" required />
                <div class="option-actions">
                  <template v-if="updateForm.question_type === 'SINGLE'">
                    <input type="radio" name="updateSingleAnswer" :value="index" v-model="updateSingleAnswerIndex"
                      :id="`update-single-answer-${index}`" class="radio-input" required />
                    <label class="radio-label" :for="`update-single-answer-${index}`">正确答案</label>
                  </template>
                  <template v-else-if="updateForm.question_type === 'MULTIPLE'">
                    <input type="checkbox" v-model="opt.isAnswer" :id="`update-multiple-answer-${index}`"
                      class="checkbox-input" />
                    <label class="checkbox-label" :for="`update-multiple-answer-${index}`">正确答案</label>
                  </template>
                  <button type="button" @click="removeUpdateOption(index)" class="btn-remove"
                    :disabled="updateForm.options.length <= 2">
                    删除
                  </button>
                </div>
              </div>
            </div>
            <button type="button" @click="addUpdateOption" class="btn-secondary">
              添加选项
            </button>
          </div>

          <!-- 主观题答案 -->
          <div v-if="updateForm.question_type === 'SUBJECTIVE'" class="form-group">
            <label class="form-label required">答案/参考答案：</label>
            <textarea v-model="updateForm.answer" placeholder="请输入答案或参考答案" class="form-textarea" rows="4"
              required></textarea>
          </div>

          <!-- 子知识点 -->
          <div class="form-group">
            <label class="form-label">子知识点：</label>
            <div class="searchable-select">
              <input type="text" v-model="updateFormSubKnowledgeSearch" placeholder="输入关键字搜索子知识点..."
                class="form-input search-input" @input="filterUpdateFormSubKnowledgePoints"
                @focus="showUpdateFormSubKnowledgeDropdown = true" @blur="onUpdateFormSubKnowledgeBlur" />
              <div v-if="
                showUpdateFormSubKnowledgeDropdown &&
                filteredUpdateFormSubKnowledgePoints.length
              " class="dropdown-list">
                <div v-for="kp in filteredUpdateFormSubKnowledgePoints" :key="kp.id" class="dropdown-item"
                  @mousedown="selectUpdateFormSubKnowledgePoint(kp)">
                  {{ kp.name }}
                  <span v-if="isUpdateFormSubKnowledgeSelected(kp.id)" class="selected-mark">✓</span>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateFormSubKnowledgePoints.length">
              <span class="selected-tags-label">已选择：</span>
              <span v-for="kp in selectedUpdateFormSubKnowledgePoints" :key="kp.id" class="selected-tag"
                @click="removeUpdateFormSubKnowledgePoint(kp.id)">
                {{ kp.name }} ×
              </span>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <button type="submit" class="btn-primary submit-btn" :disabled="submitting">
              {{ submitting ? "更新中..." : "更新题目" }}
            </button>
            <button type="button" @click="cancelUpdate" class="btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- 删除确认对话框 -->
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

    <!-- 图片预览模态框 -->
    <div v-if="showImagePreview" class="modal-overlay" @click="closeImagePreview">
      <div class="image-preview-modal" @click.stop>
        <img :src="previewImageUrl" alt="预览" class="full-size-image" />
        <button @click="closeImagePreview" class="btn-close">关闭</button>
      </div>
    </div>

    <!-- 统一弹窗提示 -->
    <div v-if="showAlertModal" class="modal-overlay">
      <div class="alert-modal-content">
        <h3 class="alert-modal-title">{{ alertModalTitle }}</h3>
        <p class="alert-modal-message">{{ alertModalMessage }}</p>
      </div>
    </div>
  </div>
  <!-- 退出登录确认对话框 -->
  <div v-if="showLogoutConfirm" class="modal-overlay">
    <div class="modal-content">
      <h3>确认退出</h3>
      <p>确定要退出登录吗？</p>
      <div class="modal-actions">
        <button @click="handleLogout" class="btn-delete">确认退出</button>
        <button @click="cancelLogout" class="btn-secondary">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed, watch, nextTick } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  setup() {
    const router = useRouter();

    // 弹窗相关状态
    const showAlertModal = ref(false);
    const alertModalTitle = ref("");
    const alertModalMessage = ref("");
    const alertModalTimer = ref(null);

    // 显示弹窗的方法
    const showAlert = (title, message) => {
      alertModalTitle.value = title;
      alertModalMessage.value = message;
      showAlertModal.value = true;

      // 清除之前的定时器
      if (alertModalTimer.value) {
        clearTimeout(alertModalTimer.value);
      }

      // 设置1秒后自动关闭弹窗
      alertModalTimer.value = setTimeout(() => {
        showAlertModal.value = false;
      }, 1000);
    };

    const showLogoutConfirm = ref(false);

    const confirmLogout = () => {
      showLogoutConfirm.value = true;
    };

    const handleLogout = () => {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      showAlert("退出成功", "已成功退出登录");
      showLogoutConfirm.value = false;
      // 延迟跳转，让用户看到退出成功的提示
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    };
    const cancelLogout = () => {
      showLogoutConfirm.value = false;
    };

    const schoolList = ref([]);
    const gradeList = ref([]);
    const subjectList = ref([]);
    const knowledgePointList = ref([]);
    const questionDefinitionList = ref([]);
    const solutionIdeaList = ref([]);
    const questionCategoryList = ref([]);

    const newKnowledgePoint = ref("");
    const newSubKnowledgePoint = ref("");
    const newQuestionDefinition = ref("");
    const newSolutionIdea = ref("");
    const newQuestionCategory = ref("");

    const questionList = ref([]);
    const pendingImageFile = ref(null);
    const pendingUpdateImageFile = ref(null);
    const submitting = ref(false);
    const hasSearched = ref(false);
    const updateFormRef = ref(null);
    const showImagePreview = ref(false);
    const previewImageUrl = ref("");

    // 题型选择错误状态
    const questionTypeError = ref(false);
    const updateQuestionTypeError = ref(false);

    // 记忆上传设置
    const uploadMemory = ref(
      JSON.parse(localStorage.getItem("uploadMemory")) || {
        school_id: null,
        grade_id: null,
        subject_id: null,
        question_type: null,
        marking_type: 0,
        difficulty_level: null,
      }
    );

    // 上传题目表单
    const form = reactive({
      id: null,
      school_id: uploadMemory.value.school_id,
      grade_id: uploadMemory.value.grade_id,
      subject_id: uploadMemory.value.subject_id,
      question_type: uploadMemory.value.question_type,
      marking_type: uploadMemory.value.marking_type,
      knowledge_point: null,
      question_definition_id: null,
      solution_idea_id: null,
      question_category_id: null,
      difficulty_level: uploadMemory.value.difficulty_level,
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
      sub_knowledge_point: [],
      img_url: "",
    });

    // 更新题目表单
    const updateForm = reactive({
      id: null,
      school_id: null,
      grade_id: null,
      subject_id: null,
      question_type: null,
      marking_type: 0,
      knowledge_point: null,
      question_definition_id: null,
      solution_idea_id: null,
      question_category_id: null,
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
      sub_knowledge_point: [],
      img_url: "",
    });

    // 检索条件
    const searchCriteria = reactive({
      grade_id: null,
      subject_id: null,
      question_type: null,
      knowledge_points: [],
      difficulty_level: null,
      title: "",
    });

    const singleAnswerIndex = ref(null);
    const updateSingleAnswerIndex = ref(null);
    const updateMode = ref(false);
    const showUpdateForm = ref(false);
    const selectedQuestion = ref(null);
    const showDeleteConfirm = ref(false);
    const questionToDelete = ref(null);

    // 搜索关键词和下拉框状态
    const knowledgeSearch = ref("");
    const subKnowledgeSearch = ref("");
    const questionDefinitionSearch = ref("");
    const solutionIdeaSearch = ref("");
    const questionCategorySearch = ref("");

    const updateKnowledgeSearch = ref("");
    const updateFormKnowledgeSearch = ref("");
    const updateFormQuestionDefinitionSearch = ref("");
    const updateFormSolutionIdeaSearch = ref("");
    const updateFormQuestionCategorySearch = ref("");
    const updateFormSubKnowledgeSearch = ref("");

    // 下拉框显示状态
    const showKnowledgeDropdown = ref(false);
    const showSubKnowledgeDropdown = ref(false);
    const showQuestionDefinitionDropdown = ref(false);
    const showSolutionIdeaDropdown = ref(false);
    const showQuestionCategoryDropdown = ref(false);

    const showUpdateKnowledgeDropdown = ref(false);
    const showUpdateFormKnowledgeDropdown = ref(false);
    const showUpdateFormQuestionDefinitionDropdown = ref(false);
    const showUpdateFormSolutionIdeaDropdown = ref(false);
    const showUpdateFormQuestionCategoryDropdown = ref(false);
    const showUpdateFormSubKnowledgeDropdown = ref(false);

    // 选中的对象
    const selectedKnowledgePoint = ref(null);
    const selectedQuestionDefinition = ref(null);
    const selectedSolutionIdea = ref(null);
    const selectedQuestionCategory = ref(null);

    const selectedUpdateFormKnowledgePoint = ref(null);
    const selectedUpdateFormQuestionDefinition = ref(null);
    const selectedUpdateFormSolutionIdea = ref(null);
    const selectedUpdateFormQuestionCategory = ref(null);

    // 过滤后的列表
    const filteredKnowledgePoints = ref([]);
    const filteredSubKnowledgePoints = ref([]);
    const filteredQuestionDefinitions = ref([]);
    const filteredSolutionIdeas = ref([]);
    const filteredQuestionCategories = ref([]);

    const filteredUpdateKnowledgePoints = ref([]);
    const filteredUpdateFormKnowledgePoints = ref([]);
    const filteredUpdateFormQuestionDefinitions = ref([]);
    const filteredUpdateFormSolutionIdeas = ref([]);
    const filteredUpdateFormQuestionCategories = ref([]);
    const filteredUpdateFormSubKnowledgePoints = ref([]);

    // 计算属性
    const showOptions = computed(
      () => form.question_type === "SINGLE" || form.question_type === "MULTIPLE"
    );

    const showUpdateOptions = computed(
      () =>
        updateForm.question_type === "SINGLE" || updateForm.question_type === "MULTIPLE"
    );

    // 选中的子知识点对象列表
    const selectedSubKnowledgePoints = computed(() => {
      return form.sub_knowledge_point
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    // 选中的更新界面知识点对象列表
    const selectedUpdateKnowledgePoints = computed(() => {
      return searchCriteria.knowledge_points
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    const selectedUpdateFormSubKnowledgePoints = computed(() => {
      return updateForm.sub_knowledge_point
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    // 方法
    const getOptionLabel = (index) => {
      let label = "";
      let n = index;
      while (n >= 0) {
        label = String.fromCharCode((n % 26) + 65) + label;
        n = Math.floor(n / 26) - 1;
      }
      return label;
    };

    const addOption = () => {
      if (form.options.length < 10) {
        form.options.push({ text: "", isAnswer: false });
      }
    };

    const removeOption = (index) => {
      if (form.options.length > 2) {
        form.options.splice(index, 1);
        if (form.question_type === "SINGLE" && singleAnswerIndex.value === index) {
          singleAnswerIndex.value = null;
        }
      }
    };

    const addUpdateOption = () => {
      if (updateForm.options.length < 10) {
        updateForm.options.push({ text: "", isAnswer: false });
      }
    };

    const removeUpdateOption = (index) => {
      if (updateForm.options.length > 2) {
        updateForm.options.splice(index, 1);
        if (
          updateForm.question_type === "SINGLE" &&
          updateSingleAnswerIndex.value === index
        ) {
          updateSingleAnswerIndex.value = null;
        }
      }
    };

    const handleQuestionTypeChange = () => {
      form.options = [
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
      ];
      singleAnswerIndex.value = null;
      form.answer = "";
      questionTypeError.value = false;
    };

    const handleUpdateQuestionTypeChange = () => {
      updateForm.options = [
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
      ];
      updateSingleAnswerIndex.value = null;
      updateForm.answer = "";
      updateQuestionTypeError.value = false;
    };

    // 知识点选择方法
    const selectKnowledgePoint = (kp) => {
      selectedKnowledgePoint.value = kp;
      form.knowledge_point = kp.id;
      knowledgeSearch.value = kp.name;
      showKnowledgeDropdown.value = false;
    };

    const clearKnowledgePoint = () => {
      selectedKnowledgePoint.value = null;
      form.knowledge_point = null;
      knowledgeSearch.value = "";
    };

    // 问题定义选择方法
    const selectQuestionDefinition = (item) => {
      selectedQuestionDefinition.value = item;
      form.question_definition_id = item.id;
      questionDefinitionSearch.value = item.name;
      showQuestionDefinitionDropdown.value = false;
    };

    const clearQuestionDefinition = () => {
      selectedQuestionDefinition.value = null;
      form.question_definition_id = null;
      questionDefinitionSearch.value = "";
    };

    // 解题思想选择方法
    const selectSolutionIdea = (item) => {
      selectedSolutionIdea.value = item;
      form.solution_idea_id = item.id;
      solutionIdeaSearch.value = item.name;
      showSolutionIdeaDropdown.value = false;
    };

    const clearSolutionIdea = () => {
      selectedSolutionIdea.value = null;
      form.solution_idea_id = null;
      solutionIdeaSearch.value = "";
    };

    // 问题类别选择方法
    const selectQuestionCategory = (item) => {
      selectedQuestionCategory.value = item;
      form.question_category_id = item.id;
      questionCategorySearch.value = item.name;
      showQuestionCategoryDropdown.value = false;
    };

    const clearQuestionCategory = () => {
      selectedQuestionCategory.value = null;
      form.question_category_id = null;
      questionCategorySearch.value = "";
    };

    const selectSubKnowledgePoint = (kp) => {
      if (!form.sub_knowledge_point.includes(kp.id)) {
        form.sub_knowledge_point.push(kp.id);
      }
      subKnowledgeSearch.value = "";
      showSubKnowledgeDropdown.value = false;
    };

    const isSubKnowledgeSelected = (id) => {
      return form.sub_knowledge_point.includes(id);
    };

    const removeSubKnowledgePoint = (id) => {
      form.sub_knowledge_point = form.sub_knowledge_point.filter((kp) => kp !== id);
    };

    // 更新界面知识点多选方法
    const selectUpdateKnowledgePoint = (kp) => {
      if (!searchCriteria.knowledge_points.includes(kp.id)) {
        searchCriteria.knowledge_points.push(kp.id);
      }
      updateKnowledgeSearch.value = "";
      showUpdateKnowledgeDropdown.value = false;
    };

    const isUpdateKnowledgeSelected = (id) => {
      return searchCriteria.knowledge_points.includes(id);
    };

    const removeUpdateKnowledgePoint = (id) => {
      searchCriteria.knowledge_points = searchCriteria.knowledge_points.filter(
        (kp) => kp !== id
      );
    };

    const selectUpdateFormKnowledgePoint = (kp) => {
      selectedUpdateFormKnowledgePoint.value = kp;
      updateForm.knowledge_point = kp.id;
      updateFormKnowledgeSearch.value = kp.name;
      showUpdateFormKnowledgeDropdown.value = false;
    };

    const clearUpdateFormKnowledgePoint = () => {
      selectedUpdateFormKnowledgePoint.value = null;
      updateForm.knowledge_point = null;
      updateFormKnowledgeSearch.value = "";
    };

    const selectUpdateFormQuestionDefinition = (item) => {
      selectedUpdateFormQuestionDefinition.value = item;
      updateForm.question_definition_id = item.id;
      updateFormQuestionDefinitionSearch.value = item.name;
      showUpdateFormQuestionDefinitionDropdown.value = false;
    };

    const clearUpdateFormQuestionDefinition = () => {
      selectedUpdateFormQuestionDefinition.value = null;
      updateForm.question_definition_id = null;
      updateFormQuestionDefinitionSearch.value = "";
    };

    const selectUpdateFormSolutionIdea = (item) => {
      selectedUpdateFormSolutionIdea.value = item;
      updateForm.solution_idea_id = item.id;
      updateFormSolutionIdeaSearch.value = item.name;
      showUpdateFormSolutionIdeaDropdown.value = false;
    };

    const clearUpdateFormSolutionIdea = () => {
      selectedUpdateFormSolutionIdea.value = null;
      updateForm.solution_idea_id = null;
      updateFormSolutionIdeaSearch.value = "";
    };

    const selectUpdateFormQuestionCategory = (item) => {
      selectedUpdateFormQuestionCategory.value = item;
      updateForm.question_category_id = item.id;
      updateFormQuestionCategorySearch.value = item.name;
      showUpdateFormQuestionCategoryDropdown.value = false;
    };

    const clearUpdateFormQuestionCategory = () => {
      selectedUpdateFormQuestionCategory.value = null;
      updateForm.question_category_id = null;
      updateFormQuestionCategorySearch.value = "";
    };

    const selectUpdateFormSubKnowledgePoint = (kp) => {
      if (!updateForm.sub_knowledge_point.includes(kp.id)) {
        updateForm.sub_knowledge_point.push(kp.id);
      }
      updateFormSubKnowledgeSearch.value = "";
      showUpdateFormSubKnowledgeDropdown.value = false;
    };

    const isUpdateFormSubKnowledgeSelected = (id) => {
      return updateForm.sub_knowledge_point.includes(id);
    };

    const removeUpdateFormSubKnowledgePoint = (id) => {
      updateForm.sub_knowledge_point = updateForm.sub_knowledge_point.filter(
        (kp) => kp !== id
      );
    };

    // 图片预览方法
    const previewImage = (url) => {
      previewImageUrl.value = url;
      showImagePreview.value = true;
    };

    const closeImagePreview = () => {
      showImagePreview.value = false;
      previewImageUrl.value = "";
    };

    // 下拉框失焦处理
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

    const onQuestionDefinitionBlur = () => {
      setTimeout(() => {
        showQuestionDefinitionDropdown.value = false;
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

    const onUpdateFormKnowledgeBlur = () => {
      setTimeout(() => {
        showUpdateFormKnowledgeDropdown.value = false;
      }, 200);
    };

    const onUpdateFormQuestionDefinitionBlur = () => {
      setTimeout(() => {
        showUpdateFormQuestionDefinitionDropdown.value = false;
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

    // 过滤方法
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

    const filterQuestionDefinitions = () => {
      if (!questionDefinitionSearch.value) {
        filteredQuestionDefinitions.value = questionDefinitionList.value;
      } else {
        filteredQuestionDefinitions.value = questionDefinitionList.value.filter((item) =>
          item.name.toLowerCase().includes(questionDefinitionSearch.value.toLowerCase())
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

    const filterUpdateKnowledgePoints = () => {
      if (!updateKnowledgeSearch.value) {
        filteredUpdateKnowledgePoints.value = knowledgePointList.value;
      } else {
        filteredUpdateKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
          kp.name.toLowerCase().includes(updateKnowledgeSearch.value.toLowerCase())
        );
      }
    };

    const filterUpdateFormKnowledgePoints = () => {
      if (!updateFormKnowledgeSearch.value) {
        filteredUpdateFormKnowledgePoints.value = knowledgePointList.value;
      } else {
        filteredUpdateFormKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
          kp.name.toLowerCase().includes(updateFormKnowledgeSearch.value.toLowerCase())
        );
      }
    };

    const filterUpdateFormQuestionDefinitions = () => {
      if (!updateFormQuestionDefinitionSearch.value) {
        filteredUpdateFormQuestionDefinitions.value = questionDefinitionList.value;
      } else {
        filteredUpdateFormQuestionDefinitions.value = questionDefinitionList.value.filter(
          (item) =>
            item.name
              .toLowerCase()
              .includes(updateFormQuestionDefinitionSearch.value.toLowerCase())
        );
      }
    };

    const filterUpdateFormSolutionIdeas = () => {
      if (!updateFormSolutionIdeaSearch.value) {
        filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value;
      } else {
        filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value.filter((item) =>
          item.name
            .toLowerCase()
            .includes(updateFormSolutionIdeaSearch.value.toLowerCase())
        );
      }
    };

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

    const filterUpdateFormSubKnowledgePoints = () => {
      if (!updateFormSubKnowledgeSearch.value) {
        filteredUpdateFormSubKnowledgePoints.value = knowledgePointList.value;
      } else {
        filteredUpdateFormSubKnowledgePoints.value = knowledgePointList.value.filter(
          (kp) =>
            kp.name
              .toLowerCase()
              .includes(updateFormSubKnowledgeSearch.value.toLowerCase())
        );
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showAlert("文件错误", "请选择图片文件");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showAlert("文件过大", "图片大小不能超过5MB");
        return;
      }

      form.img_url = URL.createObjectURL(file);
      pendingImageFile.value = file;
      event.target.value = "";
    };

    const handleUpdateImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showAlert("文件错误", "请选择图片文件");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showAlert("文件过大", "图片大小不能超过5MB");
        return;
      }

      updateForm.img_url = URL.createObjectURL(file);
      pendingUpdateImageFile.value = file;
      event.target.value = "";
    };

    const removeImage = () => {
      form.img_url = "";
      pendingImageFile.value = null;
    };

    const removeUpdateImage = () => {
      updateForm.img_url = "";
      pendingUpdateImageFile.value = null;
    };

    // 保存上传记忆
    const saveUploadMemory = () => {
      uploadMemory.value = {
        school_id: form.school_id,
        grade_id: form.grade_id,
        subject_id: form.subject_id,
        question_type: form.question_type,
        marking_type: form.marking_type,
        difficulty_level: form.difficulty_level,
      };
      localStorage.setItem("uploadMemory", JSON.stringify(uploadMemory.value));
    };

    // 数据加载
    onMounted(() => {
      const token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      loadLists();
    });

    const loadLists = async () => {
      try {
        const [s, g, sub, kp, qd, si, qc] = await Promise.all([
          axios.get(`${API_BASE}/questions/getSchoolList`),
          axios.get(`${API_BASE}/questions/getGradeList`),
          axios.get(`${API_BASE}/questions/getSubjectList`),
          axios.get(`${API_BASE}/questions/getKnowledgePointList`),
          axios.get(`${API_BASE}/questions/getQuestionDefinitionList`),
          axios.get(`${API_BASE}/questions/getSolutionIdeaList`),
          axios.get(`${API_BASE}/questions/getQuestionCategoryList`),
        ]);

        // 将学校、年级、科目的ID转换为数字
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

        // 处理新的三个列表
        questionDefinitionList.value = Object.entries(
          qd.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));

        solutionIdeaList.value = Object.entries(si.data.data || {}).map(([id, name]) => ({
          id: parseInt(id),
          name,
        }));

        questionCategoryList.value = Object.entries(
          qc.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));

        // 初始化过滤后的列表
        filteredKnowledgePoints.value = knowledgePointList.value;
        filteredSubKnowledgePoints.value = knowledgePointList.value;
        filteredQuestionDefinitions.value = questionDefinitionList.value;
        filteredSolutionIdeas.value = solutionIdeaList.value;
        filteredQuestionCategories.value = questionCategoryList.value;

        filteredUpdateKnowledgePoints.value = knowledgePointList.value;
        filteredUpdateFormKnowledgePoints.value = knowledgePointList.value;
        filteredUpdateFormQuestionDefinitions.value = questionDefinitionList.value;
        filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value;
        filteredUpdateFormQuestionCategories.value = questionCategoryList.value;
        filteredUpdateFormSubKnowledgePoints.value = knowledgePointList.value;
      } catch (err) {
        console.error("获取列表失败:", err);
        showAlert("加载失败", "获取列表失败");
      }
    };

    const uploadKnowledgePoint = async () => {
      if (!newKnowledgePoint.value.trim()) {
        showAlert("输入错误", "请输入知识点名称");
        return;
      }

      try {
        const items = newKnowledgePoint.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadKnowledgePoint`, items);
        showAlert("上传成功", "知识点上传成功");
        newKnowledgePoint.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传知识点失败:", err);
        showAlert("上传失败", "上传知识点失败");
      }
    };

    const uploadSubKnowledgePoint = async () => {
      if (!newSubKnowledgePoint.value.trim()) {
        showAlert("输入错误", "请输入子知识点名称");
        return;
      }

      try {
        const items = newSubKnowledgePoint.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadKnowledgePoint`, items);
        showAlert("上传成功", "子知识点上传成功");
        newSubKnowledgePoint.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传子知识点失败:", err);
        showAlert("上传失败", "上传子知识点失败");
      }
    };

    const uploadQuestionDefinition = async () => {
      if (!newQuestionDefinition.value.trim()) {
        showAlert("输入错误", "请输入问题定义");
        return;
      }

      try {
        const items = newQuestionDefinition.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadQuestionDefinition`, items);
        showAlert("上传成功", "问题定义上传成功");
        newQuestionDefinition.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传问题定义失败:", err);
        showAlert("上传失败", "上传问题定义失败");
      }
    };

    const uploadSolutionIdea = async () => {
      if (!newSolutionIdea.value.trim()) {
        showAlert("输入错误", "请输入解题思想");
        return;
      }

      try {
        const items = newSolutionIdea.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadSolutionIdea`, items);
        showAlert("上传成功", "解题思想上传成功");
        newSolutionIdea.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传解题思想失败:", err);
        showAlert("上传失败", "上传解题思想失败");
      }
    };

    const uploadQuestionCategory = async () => {
      if (!newQuestionCategory.value.trim()) {
        showAlert("输入错误", "请输入问题类别");
        return;
      }

      try {
        const items = newQuestionCategory.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadQuestionCategory`, items);
        showAlert("上传成功", "问题类别上传成功");
        newQuestionCategory.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传问题类别失败:", err);
        showAlert("上传失败", "上传问题类别失败");
      }
    };

    const findQuestions = async () => {
      try {
        const payload = {};

        if (searchCriteria.grade_id !== null)
          payload.grade_id = Number(searchCriteria.grade_id);
        if (searchCriteria.subject_id !== null)
          payload.subject_id = Number(searchCriteria.subject_id);
        if (searchCriteria.question_type !== null)
          payload.question_type = searchCriteria.question_type;
        if (searchCriteria.knowledge_points.length > 0)
          payload.knowledge_points = searchCriteria.knowledge_points.map((id) =>
            Number(id)
          );
        if (searchCriteria.difficulty_level !== null)
          payload.difficulty_level = Number(searchCriteria.difficulty_level);
        if (searchCriteria.title.trim()) payload.title = searchCriteria.title.trim();

        const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
        questionList.value = res.data.data || [];
        hasSearched.value = true;

        if (!questionList.value.length) {
          showAlert("检索结果", "未找到符合条件的题目");
        } else {
          showAlert("检索成功", `找到 ${questionList.value.length} 条题目`);
        }
      } catch (err) {
        console.error("检索失败:", err);
        showAlert("检索失败", "检索失败");
        questionList.value = [];
        hasSearched.value = true;
      }
    };

    const loadQuestionForUpdate = async (q) => {
      selectedQuestion.value = q;
      showUpdateForm.value = true;

      // 重置表单 - 确保ID转换为数字
      updateForm.id = q.id;
      updateForm.title = q.title || "";
      updateForm.school_id = q.school_id ? Number(q.school_id) : null;
      updateForm.grade_id = q.grade_id ? Number(q.grade_id) : null;
      updateForm.subject_id = q.subject_id ? Number(q.subject_id) : null;
      updateForm.question_type = q.question_type;
      updateForm.marking_type = q.marking_type || 0;
      updateForm.knowledge_point = q.knowledge_point ? Number(q.knowledge_point) : null;
      updateForm.question_definition_id = q.question_definition_id
        ? Number(q.question_definition_id)
        : null;
      updateForm.solution_idea_id = q.solution_idea_id
        ? Number(q.solution_idea_id)
        : null;
      updateForm.question_category_id = q.question_category_id
        ? Number(q.question_category_id)
        : null;
      updateForm.difficulty_level = q.difficulty_level
        ? Number(q.difficulty_level)
        : null;
      updateForm.answer = q.answer || "";
      updateForm.notes = q.notes || "";
      updateForm.remark = q.remark || "";
      updateForm.sub_knowledge_point = (q.sub_knowledge_point || []).map((id) =>
        Number(id)
      );
      updateForm.img_url = q.img_url || "";

      // 设置知识点
      if (q.knowledge_point) {
        const currentKnowledge = knowledgePointList.value.find(
          (k) => k.id === Number(q.knowledge_point)
        );
        if (currentKnowledge) {
          selectedUpdateFormKnowledgePoint.value = currentKnowledge;
          updateFormKnowledgeSearch.value = currentKnowledge.name;
        }
      }

      // 设置问题定义
      if (q.question_definition_id) {
        const currentQuestionDefinition = questionDefinitionList.value.find(
          (item) => item.id === Number(q.question_definition_id)
        );
        if (currentQuestionDefinition) {
          selectedUpdateFormQuestionDefinition.value = currentQuestionDefinition;
          updateFormQuestionDefinitionSearch.value = currentQuestionDefinition.name;
        }
      }

      // 设置解题思想
      if (q.solution_idea_id) {
        const currentSolutionIdea = solutionIdeaList.value.find(
          (item) => item.id === Number(q.solution_idea_id)
        );
        if (currentSolutionIdea) {
          selectedUpdateFormSolutionIdea.value = currentSolutionIdea;
          updateFormSolutionIdeaSearch.value = currentSolutionIdea.name;
        }
      }

      // 设置问题类别
      if (q.question_category_id) {
        const currentQuestionCategory = questionCategoryList.value.find(
          (item) => item.id === Number(q.question_category_id)
        );
        if (currentQuestionCategory) {
          selectedUpdateFormQuestionCategory.value = currentQuestionCategory;
          updateFormQuestionCategorySearch.value = currentQuestionCategory.name;
        }
      }

      // 处理选择题选项
      if (q.question_type === "SINGLE" || q.question_type === "MULTIPLE") {
        if (q.options && typeof q.options === "object") {
          const sortedEntries = Object.entries(q.options).sort(([keyA], [keyB]) => {
            return keyA.localeCompare(keyB);
          });

          updateForm.options = sortedEntries.map(([key, text], index) => {
            const optionKey = getOptionLabel(index);
            let isAnswer = false;

            if (q.question_type === "SINGLE") {
              isAnswer = q.answer === optionKey;
            } else if (q.question_type === "MULTIPLE") {
              if (q.answer) {
                const answers = q.answer.split(",").map((a) => a.trim());
                isAnswer = answers.includes(optionKey);
              }
            }

            return {
              text: text || "",
              isAnswer: isAnswer,
            };
          });

          if (q.question_type === "SINGLE") {
            const answerIndex = updateForm.options.findIndex((opt) => opt.isAnswer);
            updateSingleAnswerIndex.value = answerIndex !== -1 ? answerIndex : null;
          }
        }
      }

      await nextTick();
      if (updateFormRef.value) {
        updateFormRef.value.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    const cancelUpdate = () => {
      showUpdateForm.value = false;
      selectedQuestion.value = null;
      updateFormKnowledgeSearch.value = "";
      updateFormQuestionDefinitionSearch.value = "";
      updateFormSolutionIdeaSearch.value = "";
      updateFormQuestionCategorySearch.value = "";
      updateFormSubKnowledgeSearch.value = "";
      selectedUpdateFormKnowledgePoint.value = null;
      selectedUpdateFormQuestionDefinition.value = null;
      selectedUpdateFormSolutionIdea.value = null;
      selectedUpdateFormQuestionCategory.value = null;
      updateQuestionTypeError.value = false;
    };

    const confirmDelete = (q) => {
      questionToDelete.value = q;
      showDeleteConfirm.value = true;
    };

    const cancelDelete = () => {
      showDeleteConfirm.value = false;
      questionToDelete.value = null;
    };

    const deleteQuestion = async () => {
      if (!questionToDelete.value) return;

      try {
        const id = questionToDelete.value.id;
        await axios.delete(`${API_BASE}/questions/deleteQuestion/${id}`);
        showAlert("删除成功", "题目删除成功");

        questionList.value = questionList.value.filter((q) => q.id !== id);

        showDeleteConfirm.value = false;
        questionToDelete.value = null;
      } catch (err) {
        console.error("删除失败:", err);
        showAlert("删除失败", "删除失败");
      }
    };

    const handleSubmit = async () => {
      if (!form.question_type) {
        questionTypeError.value = true;
        const questionTypeElement = document.querySelector(".form-select.error");
        if (questionTypeElement) {
          questionTypeElement.scrollIntoView({ behavior: "smooth", block: "center" });
          questionTypeElement.focus();
        }
        return;
      }

      try {
        submitting.value = true;

        if (pendingImageFile.value) {
          const fd = new FormData();
          fd.append("file", pendingImageFile.value);
          const token = localStorage.getItem("token");
          const uploadRes = await axios.post(`${API_BASE}/questions/uploadImage`, fd, {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const uploadedUrl = uploadRes?.data?.data?.url || uploadRes?.data?.url;
          if (!uploadedUrl) throw new Error("图片上传未返回 URL");
          form.img_url = uploadedUrl;
          pendingImageFile.value = null;
        }

        let optionsPayload = {};
        let answerPayload = "";

        if (form.question_type === "SINGLE" || form.question_type === "MULTIPLE") {
          form.options.forEach((opt, i) => {
            const key = getOptionLabel(i);
            optionsPayload[`option_${key}`] = opt.text;
          });

          if (form.question_type === "SINGLE") {
            answerPayload =
              singleAnswerIndex.value !== null
                ? getOptionLabel(singleAnswerIndex.value)
                : "";
          } else if (form.question_type === "MULTIPLE") {
            answerPayload = form.options
              .map((opt, i) => (opt.isAnswer ? getOptionLabel(i) : null))
              .filter(Boolean)
              .join(",");
          }
        } else {
          answerPayload = form.answer;
        }

        const payload = {
          school_id: form.school_id !== null ? Number(form.school_id) : null,
          grade_id: form.grade_id !== null ? Number(form.grade_id) : null,
          subject_id: form.subject_id !== null ? Number(form.subject_id) : null,
          question_type: form.question_type,
          marking_type: form.marking_type,
          knowledge_point:
            form.knowledge_point !== null ? Number(form.knowledge_point) : null,
          question_definition_id:
            form.question_definition_id !== null
              ? Number(form.question_definition_id)
              : null,
          solution_idea_id:
            form.solution_idea_id !== null ? Number(form.solution_idea_id) : null,
          question_category_id:
            form.question_category_id !== null ? Number(form.question_category_id) : null,
          difficulty_level:
            form.difficulty_level !== null ? Number(form.difficulty_level) : null,
          title: form.title,
          ...(form.question_type === "SINGLE" || form.question_type === "MULTIPLE"
            ? { options: optionsPayload }
            : {}),
          answer: answerPayload,
          notes: form.notes,
          remark: form.remark,
          sub_knowledge_point:
            form.sub_knowledge_point.length > 0
              ? form.sub_knowledge_point.map((id) => Number(id))
              : null,
          img_url: form.img_url,
        };

        const res = await axios.post(
          `${API_BASE}/questions/uploadSingleQuestion`,
          payload
        );
        showAlert("上传成功", res.data.message || "上传成功");

        saveUploadMemory();
        resetForm();
      } catch (err) {
        console.error("提交失败:", err);
        showAlert("提交失败", err.response?.data?.message || err.message);
      } finally {
        submitting.value = false;
      }
    };

    const handleUpdateSubmit = async () => {
      if (!updateForm.question_type) {
        updateQuestionTypeError.value = true;
        const questionTypeElement = document.querySelector(
          ".update-form .form-select.error"
        );
        if (questionTypeElement) {
          questionTypeElement.scrollIntoView({ behavior: "smooth", block: "center" });
          questionTypeElement.focus();
        }
        return;
      }

      try {
        submitting.value = true;

        if (pendingUpdateImageFile.value) {
          const fd = new FormData();
          fd.append("file", pendingUpdateImageFile.value);
          const token = localStorage.getItem("token");
          const uploadRes = await axios.post(`${API_BASE}/questions/uploadImage`, fd, {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const uploadedUrl = uploadRes?.data?.data?.url || uploadRes?.data?.url;
          if (!uploadedUrl) throw new Error("图片上传未返回 URL");
          updateForm.img_url = uploadedUrl;
          pendingUpdateImageFile.value = null;
        }

        let optionsPayload = {};
        let answerPayload = "";

        if (
          updateForm.question_type === "SINGLE" ||
          updateForm.question_type === "MULTIPLE"
        ) {
          updateForm.options.forEach((opt, i) => {
            const key = getOptionLabel(i);
            optionsPayload[`option_${key}`] = opt.text;
          });

          if (updateForm.question_type === "SINGLE") {
            answerPayload =
              updateSingleAnswerIndex.value !== null
                ? getOptionLabel(updateSingleAnswerIndex.value)
                : "";
          } else if (updateForm.question_type === "MULTIPLE") {
            answerPayload = updateForm.options
              .map((opt, i) => (opt.isAnswer ? getOptionLabel(i) : null))
              .filter(Boolean)
              .join(",");
          }
        } else {
          answerPayload = updateForm.answer;
        }

        const payload = {
          id: updateForm.id,
          school_id: updateForm.school_id !== null ? Number(updateForm.school_id) : null,
          grade_id: updateForm.grade_id !== null ? Number(updateForm.grade_id) : null,
          subject_id:
            updateForm.subject_id !== null ? Number(updateForm.subject_id) : null,
          question_type: updateForm.question_type,
          marking_type: updateForm.marking_type,
          knowledge_point:
            updateForm.knowledge_point !== null
              ? Number(updateForm.knowledge_point)
              : null,
          question_definition_id:
            updateForm.question_definition_id !== null
              ? Number(updateForm.question_definition_id)
              : null,
          solution_idea_id:
            updateForm.solution_idea_id !== null
              ? Number(updateForm.solution_idea_id)
              : null,
          question_category_id:
            updateForm.question_category_id !== null
              ? Number(updateForm.question_category_id)
              : null,
          difficulty_level:
            updateForm.difficulty_level !== null
              ? Number(updateForm.difficulty_level)
              : null,
          title: updateForm.title,
          ...(updateForm.question_type === "SINGLE" ||
            updateForm.question_type === "MULTIPLE"
            ? { options: optionsPayload }
            : {}),
          answer: answerPayload,
          notes: updateForm.notes,
          remark: updateForm.remark,
          sub_knowledge_point:
            updateForm.sub_knowledge_point.length > 0
              ? updateForm.sub_knowledge_point.map((id) => Number(id))
              : null,
          img_url: updateForm.img_url,
        };

        const res = await axios.post(`${API_BASE}/questions/updateQuestion`, payload);
        showAlert("更新成功", res.data.message || "更新成功");
        cancelUpdate();
      } catch (err) {
        console.error("更新失败:", err);
        showAlert("更新失败", err.response?.data?.message || err.message);
      } finally {
        submitting.value = false;
      }
    };

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
        sub_knowledge_point: [],
        img_url: "",
        question_definition_id: null,
        solution_idea_id: null,
        question_category_id: null,
      });
      singleAnswerIndex.value = null;
      knowledgeSearch.value = "";
      subKnowledgeSearch.value = "";
      questionDefinitionSearch.value = "";
      solutionIdeaSearch.value = "";
      questionCategorySearch.value = "";
      pendingImageFile.value = null;
      selectedKnowledgePoint.value = null;
      selectedQuestionDefinition.value = null;
      selectedSolutionIdea.value = null;
      selectedQuestionCategory.value = null;
      questionTypeError.value = false;
    };

    const enterUpdateMode = () => {
      updateMode.value = true;
      questionList.value = [];
      showUpdateForm.value = false;
      selectedQuestion.value = null;
      updateKnowledgeSearch.value = "";
      searchCriteria.knowledge_points = [];
      hasSearched.value = false;
      Object.assign(searchCriteria, {
        grade_id: null,
        subject_id: null,
        question_type: null,
        knowledge_points: [],
        difficulty_level: null,
        title: "",
      });
    };

    const exitUpdateMode = () => {
      updateMode.value = false;
      questionList.value = [];
      resetForm();
      hasSearched.value = false;
    };

    // 辅助方法
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

    const getQuestionDefinitionName = (id) => {
      if (id === null) return "-";
      const item = questionDefinitionList.value.find((q) => q.id === Number(id));
      return item ? item.name : "-";
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

    const getQuestionTypeName = (type) => {
      const types = {
        SINGLE: "单选题",
        MULTIPLE: "多选题",
        SUBJECTIVE: "主观题",
      };
      return types[type] || type;
    };

    const getMarkingTypeName = (type) => {
      const types = {
        0: "自动评分",
        1: "人工评分",
      };
      return types[type] || "-";
    };

    return {
      form,
      updateForm,
      searchCriteria,
      schoolList,
      gradeList,
      subjectList,
      knowledgePointList,
      questionDefinitionList,
      solutionIdeaList,
      questionCategoryList,
      newKnowledgePoint,
      newSubKnowledgePoint,
      newQuestionDefinition,
      newSolutionIdea,
      newQuestionCategory,
      addOption,
      removeOption,
      addUpdateOption,
      removeUpdateOption,
      getOptionLabel,
      singleAnswerIndex,
      updateSingleAnswerIndex,
      updateMode,
      enterUpdateMode,
      exitUpdateMode,
      handleSubmit,
      handleUpdateSubmit,
      handleImageUpload,
      handleUpdateImageUpload,
      removeImage,
      removeUpdateImage,
      knowledgeSearch,
      subKnowledgeSearch,
      questionDefinitionSearch,
      solutionIdeaSearch,
      questionCategorySearch,
      filteredKnowledgePoints,
      filteredSubKnowledgePoints,
      filteredQuestionDefinitions,
      filteredSolutionIdeas,
      filteredQuestionCategories,
      selectedSubKnowledgePoints,
      uploadKnowledgePoint,
      uploadSubKnowledgePoint,
      uploadQuestionDefinition,
      uploadSolutionIdea,
      uploadQuestionCategory,
      questionList,
      findQuestions,
      loadQuestionForUpdate,
      cancelUpdate,
      confirmDelete,
      cancelDelete,
      deleteQuestion,
      handleQuestionTypeChange,
      handleUpdateQuestionTypeChange,
      showOptions,
      showUpdateOptions,
      submitting,
      showUpdateForm,
      selectedQuestion,
      showDeleteConfirm,
      questionToDelete,
      getSchoolName,
      getGradeName,
      getSubjectName,
      getKnowledgePointName,
      getQuestionDefinitionName,
      getSolutionIdeaName,
      getQuestionCategoryName,
      getQuestionTypeName,
      getMarkingTypeName,
      updateKnowledgeSearch,
      updateFormKnowledgeSearch,
      updateFormQuestionDefinitionSearch,
      updateFormSolutionIdeaSearch,
      updateFormQuestionCategorySearch,
      updateFormSubKnowledgeSearch,
      filteredUpdateKnowledgePoints,
      filteredUpdateFormKnowledgePoints,
      filteredUpdateFormQuestionDefinitions,
      filteredUpdateFormSolutionIdeas,
      filteredUpdateFormQuestionCategories,
      filteredUpdateFormSubKnowledgePoints,
      filterKnowledgePoints,
      filterSubKnowledgePoints,
      filterQuestionDefinitions,
      filterSolutionIdeas,
      filterQuestionCategories,
      filterUpdateKnowledgePoints,
      filterUpdateFormKnowledgePoints,
      filterUpdateFormQuestionDefinitions,
      filterUpdateFormSolutionIdeas,
      filterUpdateFormQuestionCategories,
      filterUpdateFormSubKnowledgePoints,
      selectKnowledgePoint,
      clearKnowledgePoint,
      selectQuestionDefinition,
      clearQuestionDefinition,
      selectSolutionIdea,
      clearSolutionIdea,
      selectQuestionCategory,
      clearQuestionCategory,
      selectSubKnowledgePoint,
      removeSubKnowledgePoint,
      isSubKnowledgeSelected,
      selectUpdateKnowledgePoint,
      removeUpdateKnowledgePoint,
      isUpdateKnowledgeSelected,
      selectUpdateFormKnowledgePoint,
      clearUpdateFormKnowledgePoint,
      selectUpdateFormQuestionDefinition,
      clearUpdateFormQuestionDefinition,
      selectUpdateFormSolutionIdea,
      clearUpdateFormSolutionIdea,
      selectUpdateFormQuestionCategory,
      clearUpdateFormQuestionCategory,
      selectUpdateFormSubKnowledgePoint,
      removeUpdateFormSubKnowledgePoint,
      isUpdateFormSubKnowledgeSelected,
      showKnowledgeDropdown,
      showSubKnowledgeDropdown,
      showQuestionDefinitionDropdown,
      showSolutionIdeaDropdown,
      showQuestionCategoryDropdown,
      showUpdateKnowledgeDropdown,
      showUpdateFormKnowledgeDropdown,
      showUpdateFormQuestionDefinitionDropdown,
      showUpdateFormSolutionIdeaDropdown,
      showUpdateFormQuestionCategoryDropdown,
      showUpdateFormSubKnowledgeDropdown,
      onKnowledgeBlur,
      onSubKnowledgeBlur,
      onQuestionDefinitionBlur,
      onSolutionIdeaBlur,
      onQuestionCategoryBlur,
      onUpdateKnowledgeBlur,
      onUpdateFormKnowledgeBlur,
      onUpdateFormQuestionDefinitionBlur,
      onUpdateFormSolutionIdeaBlur,
      onUpdateFormQuestionCategoryBlur,
      onUpdateFormSubKnowledgeBlur,
      selectedKnowledgePoint,
      selectedQuestionDefinition,
      selectedSolutionIdea,
      selectedQuestionCategory,
      selectedUpdateFormKnowledgePoint,
      selectedUpdateFormQuestionDefinition,
      selectedUpdateFormSolutionIdea,
      selectedUpdateFormQuestionCategory,
      selectedUpdateKnowledgePoints,
      selectedUpdateFormSubKnowledgePoints,
      hasSearched,
      updateFormRef,
      previewImage,
      closeImagePreview,
      showImagePreview,
      previewImageUrl,
      questionTypeError,
      updateQuestionTypeError,
      handleLogout,
      confirmLogout,
      // 弹窗相关
      showAlertModal,
      alertModalTitle,
      alertModalMessage,
      showAlert,
      showLogoutConfirm,
      cancelLogout,
    };
  },
};
</script>

<style scoped>
/* 样式调整 */
.container {
  max-width: 1800px;
  margin: auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.mode-select {
  margin-bottom: 30px;
  display: flex;
  gap: 10px;
}

.mode-select button {
  padding: 10px 20px;
  border: 2px solid #409eff;
  background: white;
  color: #409eff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.mode-select button.active {
  background-color: #409eff;
  color: white;
}

.mode-select button:hover:not(.active) {
  background-color: #ecf5ff;
}

.form-section,
.update-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-section h2,
.update-section h2 {
  margin-bottom: 25px;
  color: #303133;
  font-size: 20px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.search-criteria {
  margin-bottom: 30px;
}

.criteria-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
}

.criteria-item {
  flex: 1;
  min-width: 300px;
}

.criteria-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.search-btn {
  min-width: 80px;
}

.search-results {
  margin-top: 30px;
}

.search-results h3 {
  margin-bottom: 15px;
  color: #303133;
}

.results-table-container {
  overflow-x: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.results-table {
  min-width: 1600px;
  width: 100%;
  display: table;
  border-collapse: collapse;
}

.table-header,
.table-row {
  display: table-row;
}

.table-header {
  background-color: #f5f7fa;
  font-weight: 600;
}

.table-cell {
  display: table-cell;
  padding: 12px 8px;
  font-size: 14px;
  color: #606266;
  vertical-align: middle;
  text-align: center;
}

.table-header .table-cell {
  text-align: center;
  font-weight: 600;
}

.table-row {
  border-bottom: 1px solid #e4e7ed;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: #f5f7fa;
}

.sub-knowledge-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.sub-knowledge-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  border: 1px solid #d9ecff;
  white-space: nowrap;
  margin: 2px;
  display: inline-block;
}

.no-sub-knowledge {
  color: #c0c4cc;
  font-style: italic;
}

.title-cell {
  word-break: break-word;
  line-height: 1.4;
  max-width: 400px;
  min-width: 300px;
  text-align: left;
}

.image-cell {
  text-align: center;
}

.thumbnail-image {
  width: 60px;
  height: 45px;
  object-fit: cover;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.thumbnail-image:hover {
  transform: scale(1.1);
}

.no-image {
  color: #c0c4cc;
  font-style: italic;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 60px;
}

.btn-update {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.btn-update:hover {
  background-color: #66b1ff;
}

.btn-delete {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.btn-delete:hover {
  background-color: #f78989;
}

.update-form-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.update-form-section h3 {
  margin-bottom: 20px;
  color: #303133;
}

.update-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.update-form .form-group:nth-child(7),
.update-form .form-group:nth-child(8),
.update-form .form-group:nth-child(9) {
  grid-column: 1 / -1;
}

/* 弹窗样式 */
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
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  transform: scale(1.05);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1.05) translateY(0);
  }
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.modal-content p {
  margin-bottom: 30px;
  color: #606266;
  font-size: 18px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-actions button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
}

/* 图片预览模态框样式 */
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
  transform: scale(1.05);
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
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  min-width: 100px;
  transition: background-color 0.3s;
}

.btn-close:hover {
  background-color: #f78989;
}

/* 统一弹窗提示样式 */
.alert-modal-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  transform: scale(1.05);
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

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: black;
}

.form-label.required::after {
  content: " *";
  color: #f56c6c;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.form-select {
  background-color: white;
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-select:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.form-select:focus {
  border-color: #409eff;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-select.error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.form-select.error:focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
}

.error-message::before {
  content: "⚠ ";
  margin-right: 4px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.searchable-select {
  position: relative;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  font-size: 14px;
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
  color: #303133;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-item:hover {
  background-color: #409eff;
  color: white;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.selected-mark {
  color: #409eff;
  font-weight: bold;
}

.search-input {
  margin-bottom: 0;
  border-radius: 4px;
}

.selected-item {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae7ff;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.selected-items {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.selected-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #d9ecff;
  cursor: pointer;
  transition: background-color 0.3s;
}

.selected-tag:hover {
  background-color: #d9ecff;
}

.selected-tags-label {
  font-size: 13px;
  color: #909399;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 16px;
  background: #fafafa;
  border-radius: 4px;
  margin-top: 20px;
}

.no-results p {
  margin: 0;
}

.searchable-select .form-select[multiple] {
  height: 80px;
  padding: 5px;
}

.searchable-select .form-select[multiple] option {
  padding: 5px 8px;
}

.new-knowledge-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.new-knowledge-input .form-input {
  flex: 1;
}

.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f4f4f5;
  color: #606266;
  border: 1px solid #d3d4d6;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e9e9eb;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-highlight {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-highlight:hover:not(:disabled) {
  background-color: #85ce61;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

.btn-highlight:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-remove {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove:hover {
  background-color: #f78989;
}

.image-upload-section {
  margin-top: 15px;
}

.upload-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.image-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.preview-image {
  max-width: 200px;
  max-height: 150px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.options-list {
  margin-bottom: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background: #fafafa;
  border-radius: 4px;
}

.option-label {
  font-weight: 500;
  min-width: 30px;
  color: #409eff;
}

.option-input {
  flex: 1;
}

.option-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio-input,
.checkbox-input {
  margin: 0;
}

.radio-label,
.checkbox-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  grid-column: 1 / -1;
}

.submit-btn {
  flex: 1;
}

/* 调整表格列宽设置 */
.table-cell:nth-child(1) {
  width: 60px;
}

.table-cell:nth-child(2) {
  width: 120px;
}

.table-cell:nth-child(3) {
  width: 80px;
}

.table-cell:nth-child(4) {
  width: 100px;
}

.table-cell:nth-child(5) {
  width: 80px;
}

.table-cell:nth-child(6) {
  width: 80px;
}

.table-cell:nth-child(7) {
  width: 150px;
}

.table-cell:nth-child(8) {
  width: 120px;
}

.table-cell:nth-child(9) {
  width: 120px;
}

.table-cell:nth-child(10) {
  width: 120px;
}

.table-cell:nth-child(11) {
  width: 150px;
}

.table-cell:nth-child(12) {
  width: 60px;
}

.table-cell:nth-child(13) {
  min-width: 300px;
  max-width: 400px;
}

.table-cell:nth-child(14) {
  width: 80px;
}

.table-cell:nth-child(15) {
  width: 120px;
}

.table-row {
  border-bottom: 1px solid #e4e7ed;
}

.table-header {
  border-bottom: 2px solid #e4e7ed;
}

.table-row:last-child {
  border-bottom: none;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
}

.sub-knowledge-tag {
  margin: 2px;
}

.logout-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  float: right;
}

.logout-btn:hover {
  background-color: red;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
}
</style>