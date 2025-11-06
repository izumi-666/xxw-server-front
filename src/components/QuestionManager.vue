<template>
  <!-- 主容器 -->
  <div class="container">
    <!-- 页面标题 -->
    <h1>教育题库管理系统</h1>

    <!-- 退出登录按钮 -->
    <button @click="confirmLogout" class="logout-btn">
      <span class="logout-icon"></span>
      退出登录
    </button>

    <!-- 模式选择：上传题目 vs 更新题目 -->
    <div class="mode-select">
      <!-- 上传题目按钮 -->
      <button :class="{ active: !updateMode }" @click="exitUpdateMode" type="button">
        上传题目
      </button>
      <!-- 更新题目按钮 -->
      <button :class="{ active: updateMode }" @click="enterUpdateMode" type="button">
        更新题目
      </button>
    </div>

    <!-- ==================== 上传题目表单部分 ==================== -->
    <section v-if="!updateMode" class="form-section">
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
            <input
              type="text"
              v-model="questionCategorySearch"
              placeholder="输入关键字搜索问题类别..."
              class="form-input search-input"
              @input="filterQuestionCategories"
              @focus="showQuestionCategoryDropdown = true"
              @blur="onQuestionCategoryBlur"
            />
            <div
              v-if="showQuestionCategoryDropdown && filteredQuestionCategories.length"
              class="dropdown-list"
            >
              <div
                v-for="item in filteredQuestionCategories"
                :key="item.id"
                class="dropdown-item"
                @mousedown="selectQuestionCategory(item)"
              >
                {{ item.name }}
                <span
                  v-if="
                    selectedQuestionCategory && selectedQuestionCategory.id === item.id
                  "
                  class="selected-mark"
                  >✓</span
                >
                <!-- 删除问题类别按钮 -->
                <button
                  type="button"
                  @mousedown.stop="confirmDeleteQuestionCategory(item)"
                  class="btn-remove-small"
                  title="删除问题类别"
                >
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
            <input
              type="text"
              v-model="newQuestionCategory"
              placeholder="新建问题类别（多个用逗号分隔）"
              class="form-input"
              @keypress.enter="uploadQuestionCategory"
            />
            <button
              type="button"
              @click="uploadQuestionCategory"
              class="btn-highlight"
              :disabled="!newQuestionCategory.trim()"
            >
              新增问题类别
            </button>
          </div>
        </div>

        <!-- 题目内容输入区域 -->
        <div class="form-group">
          <label class="form-label required">题目内容：</label>
          <!-- 题目内容文本域 -->
          <textarea
            v-model="form.title"
            placeholder="请输入题干，数学公式使用 $公式$ "
            class="form-textarea"
            rows="3"
            @input="renderMathPreview('title', form.title)"
            required
          ></textarea>
          <!-- 数学公式预览 -->
          <div class="math-preview" v-html="titlePreview"></div>

          <!-- 图片上传区域 -->
          <div class="image-upload-section">
            <label class="form-label">题干图片：</label>
            <div class="upload-controls">
              <!-- 文件输入（隐藏） -->
              <input
                type="file"
                @change="handleImageUpload"
                accept="image/*"
                class="file-input"
                ref="fileInput"
              />
              <!-- 触发文件选择的按钮 -->
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="btn-secondary"
              >
                选择图片
              </button>
            </div>
            <!-- 图片预览 -->
            <div v-if="form.img_url" class="image-preview">
              <img
                :src="form.img_url"
                alt="预览"
                class="preview-image"
                @click="previewImage(form.img_url)"
              />
              <button type="button" @click="removeImage" class="btn-remove">
                移除图片
              </button>
            </div>
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
                <!-- 选项文本输入 -->
                <input
                  type="text"
                  v-model="opt.text"
                  :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                  class="form-input option-input"
                  @input="renderOptionPreview(index, opt.text)"
                />
                <!-- 选项数学公式预览 -->
                <div class="math-preview small" v-html="optionPreviews[index]"></div>
              </div>
              <div class="option-actions">
                <!-- 单选题正确答案选择 -->
                <input
                  type="radio"
                  name="singleAnswer"
                  :value="index"
                  v-model="singleAnswerIndex"
                  :id="`upload-single-answer-${index}`"
                  class="radio-input"
                  required
                />
                <label class="radio-label" :for="`upload-single-answer-${index}`"
                  >正确答案</label
                >
                <!-- 删除选项按钮 -->
                <button
                  type="button"
                  @click="removeOption(index)"
                  class="btn-remove"
                  :disabled="form.options.length <= 2"
                >
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
                <!-- 选项文本输入 -->
                <input
                  type="text"
                  v-model="opt.text"
                  :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                  class="form-input option-input"
                  @input="renderOptionPreview(index, opt.text)"
                />
                <!-- 选项数学公式预览 -->
                <div class="math-preview small" v-html="optionPreviews[index]"></div>
              </div>
              <div class="option-actions">
                <!-- 多选题正确答案选择 -->
                <input
                  type="checkbox"
                  v-model="opt.isAnswer"
                  :id="`upload-multiple-answer-${index}`"
                  class="checkbox-input"
                />
                <label class="checkbox-label" :for="`upload-multiple-answer-${index}`"
                  >正确答案</label
                >
                <!-- 删除选项按钮 -->
                <button
                  type="button"
                  @click="removeOption(index)"
                  class="btn-remove"
                  :disabled="form.options.length <= 2"
                >
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
          <textarea
            v-model="form.answer"
            placeholder="请输入参考答案，数学公式使用 $公式$ "
            class="form-textarea"
            rows="4"
            @input="renderMathPreview('answer', form.answer)"
            required
          ></textarea>
          <div class="math-preview" v-html="answerPreview"></div>
        </div>

        <!-- 解析输入区域 -->
        <div class="form-group">
          <label class="form-label">解析：</label>
          <textarea
            v-model="form.notes"
            placeholder="请输入题目解析，数学公式使用 $公式$ "
            class="form-textarea"
            rows="3"
            @input="renderMathPreview('notes', form.notes)"
          ></textarea>
          <div class="math-preview" v-html="notesPreview"></div>
        </div>

        <!-- 知识点选择区域 -->
        <div class="form-group">
          <label class="form-label">知识点：</label>
          <!-- 可搜索的下拉选择 -->
          <div class="searchable-select">
            <input
              type="text"
              v-model="knowledgeSearch"
              placeholder="输入关键字搜索知识点..."
              class="form-input search-input"
              @input="filterKnowledgePoints"
              @focus="showKnowledgeDropdown = true"
              @blur="onKnowledgeBlur"
            />
            <!-- 知识点下拉列表 -->
            <div
              v-if="showKnowledgeDropdown && filteredKnowledgePoints.length"
              class="dropdown-list"
            >
              <div
                v-for="kp in filteredKnowledgePoints"
                :key="kp.id"
                class="dropdown-item"
                @mousedown="selectKnowledgePoint(kp)"
              >
                {{ kp.name }}
                <!-- 删除知识点按钮 -->
                <button
                  type="button"
                  @mousedown.stop="confirmDeleteKnowledgePoint(kp)"
                  class="btn-remove-small"
                  title="删除知识点"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <!-- 已选择的知识点显示 -->
          <div class="selected-item" v-if="selectedKnowledgePoint">
            已选择: {{ selectedKnowledgePoint.name }}
            <button type="button" @click="clearKnowledgePoint" class="btn-remove">
              清除
            </button>
          </div>
          <!-- 新建知识点输入 -->
          <div class="new-knowledge-input">
            <input
              type="text"
              v-model="newKnowledgePoint"
              placeholder="新建知识点（多个用逗号分隔）"
              class="form-input"
              @keypress.enter="uploadKnowledgePoint"
            />
            <button
              type="button"
              @click="uploadKnowledgePoint"
              class="btn-highlight"
              :disabled="!newKnowledgePoint.trim()"
            >
              新增知识点
            </button>
          </div>
        </div>

        <!-- 子知识点选择区域 -->
        <div class="form-group">
          <label class="form-label">子知识点：</label>
          <div class="searchable-select">
            <input
              type="text"
              v-model="subKnowledgeSearch"
              placeholder="输入关键字搜索子知识点..."
              class="form-input search-input"
              @input="filterSubKnowledgePoints"
              @focus="showSubKnowledgeDropdown = true"
              @blur="onSubKnowledgeBlur"
            />
            <div
              v-if="showSubKnowledgeDropdown && filteredSubKnowledgePoints.length"
              class="dropdown-list"
            >
              <div
                v-for="kp in filteredSubKnowledgePoints"
                :key="kp.id"
                class="dropdown-item"
                @mousedown="selectSubKnowledgePoint(kp)"
              >
                {{ kp.name }}
                <!-- 已选择标记 -->
                <span v-if="isSubKnowledgeSelected(kp.id)" class="selected-mark">✓</span>
                <!-- 删除子知识点按钮 -->
                <button
                  type="button"
                  @mousedown.stop="confirmDeleteSubKnowledgePoint(kp)"
                  class="btn-remove-small"
                  title="删除子知识点"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <!-- 已选择的子知识点标签显示 -->
          <div class="selected-items" v-if="selectedSubKnowledgePoints.length">
            <span class="selected-tags-label">已选择：</span>
            <span
              v-for="kp in selectedSubKnowledgePoints"
              :key="kp.id"
              class="selected-tag"
              @click="removeSubKnowledgePoint(kp.id)"
            >
              {{ kp.name }} ×
            </span>
          </div>
          <!-- 新建子知识点输入 -->
          <div class="new-knowledge-input">
            <input
              type="text"
              v-model="newSubKnowledgePoint"
              placeholder="新建子知识点（多个用逗号分隔）"
              class="form-input"
              @keypress.enter="uploadSubKnowledgePoint"
            />
            <button
              type="button"
              @click="uploadSubKnowledgePoint"
              class="btn-highlight"
              :disabled="!newSubKnowledgePoint.trim()"
            >
              新增子知识点
            </button>
          </div>
        </div>

        <!-- 解题思想选择区域 -->
        <div class="form-group">
          <label class="form-label">解题思想：</label>
          <div class="searchable-select">
            <input
              type="text"
              v-model="solutionIdeaSearch"
              placeholder="输入关键字搜索解题思想..."
              class="form-input search-input"
              @input="filterSolutionIdeas"
              @focus="showSolutionIdeaDropdown = true"
              @blur="onSolutionIdeaBlur"
            />
            <div
              v-if="showSolutionIdeaDropdown && filteredSolutionIdeas.length"
              class="dropdown-list"
            >
              <div
                v-for="item in filteredSolutionIdeas"
                :key="item.id"
                class="dropdown-item"
                @mousedown="selectSolutionIdea(item)"
              >
                {{ item.name }}
                <span v-if="isSolutionIdeaSelected(item.id)" class="selected-mark"
                  >✓</span
                >
                <!-- 删除解题思想按钮 -->
                <button
                  type="button"
                  @mousedown.stop="confirmDeleteSolutionIdea(item)"
                  class="btn-remove-small"
                  title="删除解题思想"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <div class="selected-items" v-if="selectedSolutionIdeas.length">
            <span class="selected-tags-label">已选择：</span>
            <span
              v-for="item in selectedSolutionIdeas"
              :key="item.id"
              class="selected-tag"
              @click="removeSolutionIdea(item.id)"
            >
              {{ item.name }} ×
            </span>
          </div>
          <div class="new-knowledge-input">
            <input
              type="text"
              v-model="newSolutionIdea"
              placeholder="新建解题思想（多个用逗号分隔）"
              class="form-input"
              @keypress.enter="uploadSolutionIdea"
            />
            <button
              type="button"
              @click="uploadSolutionIdea"
              class="btn-highlight"
              :disabled="!newSolutionIdea.trim()"
            >
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
          <textarea
            v-model="form.remark"
            placeholder="请输入备注信息，数学公式使用 $公式$"
            class="form-textarea"
            rows="3"
            @input="renderMathPreview('remark', form.remark)"
          ></textarea>
          <div class="math-preview" v-html="remarkPreview"></div>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button
            type="button"
            @click="showPreview"
            class="btn-primary submit-btn"
            :disabled="submitting"
          >
            {{ submitting ? "提交中..." : "预览并提交" }}
          </button>
        </div>
      </form>
    </section>

    <!-- ==================== 更新题目界面 ==================== -->
    <section v-if="updateMode" class="update-section">
      <!-- 检索条件区域 -->
      <div class="search-criteria">
        <h2>检索题目</h2>
        <div class="criteria-row">
          <!-- 年级筛选 -->
          <div class="criteria-item">
            <label>年级：</label>
            <select v-model="searchCriteria.grade_id" class="form-select">
              <option :value="null">全部</option>
              <option v-for="grade in gradeList" :key="grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
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
              <input
                type="text"
                v-model="updateQuestionCategorySearch"
                placeholder="输入关键字搜索问题类别..."
                class="form-input search-input"
                @input="filterUpdateQuestionCategories"
                @focus="showUpdateQuestionCategoryDropdown = true"
                @blur="onUpdateQuestionCategoryBlur"
              />
              <div
                v-if="
                  showUpdateQuestionCategoryDropdown &&
                  filteredUpdateQuestionCategories.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="item in filteredUpdateQuestionCategories"
                  :key="item.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateQuestionCategory(item)"
                >
                  {{ item.name }}
                  <span
                    v-if="isUpdateQuestionCategorySelected(item.id)"
                    class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除问题类别按钮（更新界面） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteQuestionCategory(item)"
                    class="btn-remove-small"
                    title="删除问题类别"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateQuestionCategories.length">
              <span class="selected-tags-label">已选择：</span>
              <span
                v-for="item in selectedUpdateQuestionCategories"
                :key="item.id"
                class="selected-tag"
                @click="removeUpdateQuestionCategory(item.id)"
              >
                {{ item.name }} ×
              </span>
            </div>
          </div>

          <!-- 知识点筛选（多选） -->
          <div class="criteria-item">
            <label>知识点：</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="updateKnowledgeSearch"
                placeholder="输入关键字搜索知识点..."
                class="form-input search-input"
                @input="filterUpdateKnowledgePoints"
                @focus="showUpdateKnowledgeDropdown = true"
                @blur="onUpdateKnowledgeBlur"
              />
              <div
                v-if="showUpdateKnowledgeDropdown && filteredUpdateKnowledgePoints.length"
                class="dropdown-list"
              >
                <div
                  v-for="kp in filteredUpdateKnowledgePoints"
                  :key="kp.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateKnowledgePoint(kp)"
                >
                  {{ kp.name }}
                  <span v-if="isUpdateKnowledgeSelected(kp.id)" class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除知识点按钮（更新界面） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteKnowledgePoint(kp)"
                    class="btn-remove-small"
                    title="删除知识点"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateKnowledgePoints.length">
              <span class="selected-tags-label">已选择：</span>
              <span
                v-for="kp in selectedUpdateKnowledgePoints"
                :key="kp.id"
                class="selected-tag"
                @click="removeUpdateKnowledgePoint(kp.id)"
              >
                {{ kp.name }} ×
              </span>
            </div>
          </div>
          <!-- 子知识点筛选（多选） -->
          <div class="criteria-item">
            <label>子知识点：</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="updateSubKnowledgeSearch"
                placeholder="输入关键字搜索子知识点..."
                class="form-input search-input"
                @input="filterUpdateSubKnowledgePoints"
                @focus="showUpdateSubKnowledgeDropdown = true"
                @blur="onUpdateSubKnowledgeBlur"
              />
              <div
                v-if="
                  showUpdateSubKnowledgeDropdown &&
                  filteredUpdateSubKnowledgePoints.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="kp in filteredUpdateSubKnowledgePoints"
                  :key="kp.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateSubKnowledgePoint(kp)"
                >
                  {{ kp.name }}
                  <span v-if="isUpdateSubKnowledgeSelected(kp.id)" class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除子知识点按钮 -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteSubKnowledgePoint(kp)"
                    class="btn-remove-small"
                    title="删除子知识点"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateSubKnowledgePoints.length">
              <span class="selected-tags-label">已选择：</span>
              <span
                v-for="kp in selectedUpdateSubKnowledgePoints"
                :key="kp.id"
                class="selected-tag"
                @click="removeUpdateSubKnowledgePoint(kp.id)"
              >
                {{ kp.name }} ×
              </span>
            </div>
          </div>

          <!-- 解题思想筛选（多选） -->
          <div class="criteria-item">
            <label>解题思想：</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="updateSolutionIdeaSearch"
                placeholder="输入关键字搜索解题思想..."
                class="form-input search-input"
                @input="filterUpdateSolutionIdeas"
                @focus="showUpdateSolutionIdeaDropdown = true"
                @blur="onUpdateSolutionIdeaBlur"
              />
              <div
                v-if="
                  showUpdateSolutionIdeaDropdown && filteredUpdateSolutionIdeas.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="item in filteredUpdateSolutionIdeas"
                  :key="item.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateSolutionIdea(item)"
                >
                  {{ item.name }}
                  <span v-if="isUpdateSolutionIdeaSelected(item.id)" class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除解题思想按钮（更新界面） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteSolutionIdea(item)"
                    class="btn-remove-small"
                    title="删除解题思想"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateSolutionIdeas.length">
              <span class="selected-tags-label">已选择：</span>
              <span
                v-for="item in selectedUpdateSolutionIdeas"
                :key="item.id"
                class="selected-tag"
                @click="removeUpdateSolutionIdea(item.id)"
              >
                {{ item.name }} ×
              </span>
            </div>
          </div>

          <!-- 难度筛选 -->
          <div class="criteria-item">
            <label>难度：</label>
            <select v-model="searchCriteria.difficulty_level" class="form-select">
              <option :value="null">全部</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} 星</option>
            </select>
          </div>

          <!-- 题目内容关键词搜索 -->
          <div class="criteria-item">
            <label>题目内容：</label>
            <input
              type="text"
              v-model="searchCriteria.title"
              placeholder="输入题目关键词"
              class="form-input"
            />
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
        <!-- 分页控件 -->
        <div class="pagination-controls">
          <!-- 首页按钮 -->
          <button
            @click="goToFirstPage"
            :disabled="searchCriteria.page_num <= 1"
            class="pagination-btn"
          >
            首页
          </button>
          <!-- 上一页按钮 -->
          <button
            @click="changePage(searchCriteria.page_num - 1)"
            :disabled="searchCriteria.page_num <= 1"
            class="pagination-btn"
          >
            上一页
          </button>

          <span
            >第 {{ searchCriteria.page_num }} 页，共 {{ totalPages }} 页 ({{
              totalItems
            }}
            条)</span
          >

          <!-- 下一页按钮 -->
          <button
            @click="changePage(searchCriteria.page_num + 1)"
            :disabled="searchCriteria.page_num >= totalPages"
            class="pagination-btn"
          >
            下一页
          </button>
          <!-- 末页按钮 -->
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
        <div class="results-table-container">
          <div class="results-table">
            <!-- 表格头部 -->
            <div class="table-header">
              <div class="table-cell">ID</div>
              <div class="table-cell">学校</div>
              <div class="table-cell">年级</div>
              <div class="table-cell">科目</div>
              <div class="table-cell">问题类别</div>
              <div class="table-cell">评分方法</div>
              <div class="table-cell">知识点</div>
              <div class="table-cell">解题思想</div>
              <div class="table-cell">子知识点</div>
              <div class="table-cell">难度</div>
              <div class="table-cell">题目内容</div>
              <div class="table-cell">备注</div>
              <div class="table-cell">图片</div>
              <div class="table-cell">操作</div>
            </div>
            <!-- 表格数据行 -->
            <div v-for="q in questionList" :key="q.id" class="table-row">
              <div class="table-cell">{{ q.id }}</div>
              <div class="table-cell">{{ getSchoolName(q.school_id) }}</div>
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
                <span
                  v-for="ideaId in q.solution_idea_ids || []"
                  :key="ideaId"
                  class="sub-knowledge-tag"
                >
                  {{ getSolutionIdeaName(ideaId) }}
                </span>
                <span
                  v-if="!(q.solution_idea_ids && q.solution_idea_ids.length)"
                  class="no-sub-knowledge"
                >
                  无
                </span>
              </div>
              <!-- 子知识点单元格（多值显示） -->
              <div class="table-cell sub-knowledge-cell">
                <span
                  v-for="subId in q.sub_knowledge_point_ids || []"
                  :key="subId"
                  class="sub-knowledge-tag"
                >
                  {{ getKnowledgePointName(subId) }}
                </span>
                <span
                  v-if="!(q.sub_knowledge_point_ids && q.sub_knowledge_point_ids.length)"
                  class="no-sub-knowledge"
                >
                  无
                </span>
              </div>
              <div class="table-cell">{{ q.difficulty_level }}星</div>
              <!-- 题目内容单元格（截断显示） -->
              <div class="table-cell title-cell">{{ q.title }}</div>
              <!-- 备注 -->
              <div class="table-cell title-cell">{{ q.remark }}</div>
              <!-- 图片预览单元格 -->
              <div class="table-cell image-cell">
                <img
                  v-if="q.img_url"
                  :src="q.img_url"
                  alt="题目图片"
                  class="thumbnail-image"
                  @click="previewImage(q.img_url)"
                />
                <span v-else class="no-image">-</span>
              </div>
              <!-- 操作按钮单元格 -->
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

      <!-- 更新题目表单（选中题目后显示） -->
      <div
        v-if="selectedQuestion && showUpdateForm"
        class="update-form-section"
        ref="updateFormRef"
      >
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
              <input
                type="text"
                v-model="updateFormQuestionCategorySearch"
                placeholder="输入关键字搜索问题类别..."
                class="form-input search-input"
                @input="filterUpdateFormQuestionCategories"
                @focus="showUpdateFormQuestionCategoryDropdown = true"
                @blur="onUpdateFormQuestionCategoryBlur"
              />
              <div
                v-if="
                  showUpdateFormQuestionCategoryDropdown &&
                  filteredUpdateFormQuestionCategories.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="item in filteredUpdateFormQuestionCategories"
                  :key="item.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateFormQuestionCategory(item)"
                >
                  {{ item.name }}
                  <span
                    v-if="
                      selectedUpdateFormQuestionCategory &&
                      selectedUpdateFormQuestionCategory.id === item.id
                    "
                    class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除问题类别按钮（更新表单） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteQuestionCategory(item)"
                    class="btn-remove-small"
                    title="删除问题类别"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-item" v-if="selectedUpdateFormQuestionCategory">
              已选择: {{ selectedUpdateFormQuestionCategory.name }}
              <button
                type="button"
                @click="clearUpdateFormQuestionCategory"
                class="btn-remove"
              >
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

          <!-- 知识点选择 -->
          <div class="form-group">
            <label class="form-label">知识点：</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="updateFormKnowledgeSearch"
                placeholder="输入关键字搜索知识点..."
                class="form-input search-input"
                @input="filterUpdateFormKnowledgePoints"
                @focus="showUpdateFormKnowledgeDropdown = true"
                @blur="onUpdateFormKnowledgeBlur"
              />
              <div
                v-if="
                  showUpdateFormKnowledgeDropdown &&
                  filteredUpdateFormKnowledgePoints.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="kp in filteredUpdateFormKnowledgePoints"
                  :key="kp.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateFormKnowledgePoint(kp)"
                >
                  {{ kp.name }}
                  <!-- 删除知识点按钮（更新表单） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteKnowledgePoint(kp)"
                    class="btn-remove-small"
                    title="删除知识点"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-item" v-if="selectedUpdateFormKnowledgePoint">
              已选择: {{ selectedUpdateFormKnowledgePoint.name }}
              <button
                type="button"
                @click="clearUpdateFormKnowledgePoint"
                class="btn-remove"
              >
                清除
              </button>
            </div>
            <!-- 新增知识点功能 -->
            <div class="new-knowledge-input">
              <input
                type="text"
                v-model="newUpdateFormKnowledgePoint"
                placeholder="新建知识点（多个用逗号分隔）"
                class="form-input"
                @keypress.enter="uploadUpdateFormKnowledgePoint"
              />
              <button
                type="button"
                @click="uploadUpdateFormKnowledgePoint"
                class="btn-highlight"
                :disabled="!newUpdateFormKnowledgePoint.trim()"
              >
                新增知识点
              </button>
            </div>
          </div>
          <!-- 子知识点选择 -->
          <div class="form-group">
            <label class="form-label">子知识点：</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="updateFormSubKnowledgeSearch"
                placeholder="输入关键字搜索子知识点..."
                class="form-input search-input"
                @input="filterUpdateFormSubKnowledgePoints"
                @focus="showUpdateFormSubKnowledgeDropdown = true"
                @blur="onUpdateFormSubKnowledgeBlur"
              />
              <div
                v-if="
                  showUpdateFormSubKnowledgeDropdown &&
                  filteredUpdateFormSubKnowledgePoints.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="kp in filteredUpdateFormSubKnowledgePoints"
                  :key="kp.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateFormSubKnowledgePoint(kp)"
                >
                  {{ kp.name }}
                  <span
                    v-if="isUpdateFormSubKnowledgeSelected(kp.id)"
                    class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除子知识点按钮（更新表单） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteSubKnowledgePoint(kp)"
                    class="btn-remove-small"
                    title="删除子知识点"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div
              class="selected-items"
              v-if="selectedUpdateFormSubKnowledgePoints.length"
            >
              <span class="selected-tags-label">已选择：</span>
              <span
                v-for="kp in selectedUpdateFormSubKnowledgePoints"
                :key="kp.id"
                class="selected-tag"
                @click="removeUpdateFormSubKnowledgePoint(kp.id)"
              >
                {{ kp.name }} ×
              </span>
            </div>
            <!-- 新增子知识点功能 -->
            <div class="new-knowledge-input">
              <input
                type="text"
                v-model="newUpdateFormSubKnowledgePoint"
                placeholder="新建子知识点（多个用逗号分隔）"
                class="form-input"
                @keypress.enter="uploadUpdateFormSubKnowledgePoint"
              />
              <button
                type="button"
                @click="uploadUpdateFormSubKnowledgePoint"
                class="btn-highlight"
                :disabled="!newUpdateFormSubKnowledgePoint.trim()"
              >
                新增子知识点
              </button>
            </div>
          </div>

          <!-- 解题思想选择 -->
          <div class="form-group">
            <label class="form-label">解题思想：</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="updateFormSolutionIdeaSearch"
                placeholder="输入关键字搜索解题思想..."
                class="form-input search-input"
                @input="filterUpdateFormSolutionIdeas"
                @focus="showUpdateFormSolutionIdeaDropdown = true"
                @blur="onUpdateFormSolutionIdeaBlur"
              />
              <div
                v-if="
                  showUpdateFormSolutionIdeaDropdown &&
                  filteredUpdateFormSolutionIdeas.length
                "
                class="dropdown-list"
              >
                <div
                  v-for="item in filteredUpdateFormSolutionIdeas"
                  :key="item.id"
                  class="dropdown-item"
                  @mousedown="selectUpdateFormSolutionIdea(item)"
                >
                  {{ item.name }}
                  <span
                    v-if="isUpdateFormSolutionIdeaSelected(item.id)"
                    class="selected-mark"
                    >✓</span
                  >
                  <!-- 删除解题思想按钮（更新表单） -->
                  <button
                    type="button"
                    @mousedown.stop="confirmDeleteSolutionIdea(item)"
                    class="btn-remove-small"
                    title="删除解题思想"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            <div class="selected-items" v-if="selectedUpdateFormSolutionIdeas.length">
              <span class="selected-tags-label">已选择：</span>
              <span
                v-for="item in selectedUpdateFormSolutionIdeas"
                :key="item.id"
                class="selected-tag"
                @click="removeUpdateFormSolutionIdea(item.id)"
              >
                {{ item.name }} ×
              </span>
            </div>
            <!-- 新增解题思想功能 -->
            <div class="new-knowledge-input">
              <input
                type="text"
                v-model="newUpdateFormSolutionIdea"
                placeholder="新建解题思想（多个用逗号分隔）"
                class="form-input"
                @keypress.enter="uploadUpdateFormSolutionIdea"
              />
              <button
                type="button"
                @click="uploadUpdateFormSolutionIdea"
                class="btn-highlight"
                :disabled="!newUpdateFormSolutionIdea.trim()"
              >
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
            <textarea
              v-model="updateForm.title"
              placeholder="请输入题干，数学公式使用 $公式$ "
              class="form-textarea"
              rows="3"
              @input="renderMathPreview('updateTitle', updateForm.title)"
              required
            ></textarea>
            <div class="math-preview" v-html="updateTitlePreview"></div>

            <!-- 图片上传 -->
            <div class="image-upload-section">
              <label class="form-label">题干图片：</label>
              <div class="upload-controls">
                <input
                  type="file"
                  @change="handleUpdateImageUpload"
                  accept="image/*"
                  class="file-input"
                  ref="updateFileInput"
                />
                <button
                  type="button"
                  @click="$refs.updateFileInput.click()"
                  class="btn-secondary"
                >
                  选择图片
                </button>
              </div>
              <div v-if="updateForm.img_url" class="image-preview">
                <img
                  :src="updateForm.img_url"
                  alt="预览"
                  class="preview-image"
                  @click="previewImage(updateForm.img_url)"
                />
                <button type="button" @click="removeUpdateImage" class="btn-remove">
                  移除图片
                </button>
              </div>
            </div>
          </div>

          <!-- 单选题选项区域 -->
          <div v-if="showUpdateSingleOptions" class="form-group">
            <label class="form-label">选项：</label>
            <div class="options-list">
              <div
                v-for="(opt, index) in updateForm.options"
                :key="index"
                class="option-item"
              >
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <div class="option-input-container">
                  <input
                    type="text"
                    v-model="opt.text"
                    :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                    class="form-input option-input"
                    @input="renderUpdateOptionPreview(index, opt.text)"
                    required
                  />
                  <div
                    class="math-preview small"
                    v-html="updateOptionPreviews[index]"
                  ></div>
                </div>
                <div class="option-actions">
                  <!-- 单选题答案选择 -->
                  <input
                    type="radio"
                    name="updateSingleAnswer"
                    :value="index"
                    v-model="updateSingleAnswerIndex"
                    :id="`update-single-answer-${index}`"
                    class="radio-input"
                    required
                  />
                  <label class="radio-label" :for="`update-single-answer-${index}`"
                    >正确答案</label
                  >
                  <!-- 删除选项按钮 -->
                  <button
                    type="button"
                    @click="removeUpdateOption(index)"
                    class="btn-remove"
                    :disabled="updateForm.options.length <= 2"
                  >
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
              <div
                v-for="(opt, index) in updateForm.options"
                :key="index"
                class="option-item"
              >
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <div class="option-input-container">
                  <input
                    type="text"
                    v-model="opt.text"
                    :placeholder="`请输入选项 ${getOptionLabel(index)} 的内容`"
                    class="form-input option-input"
                    @input="renderUpdateOptionPreview(index, opt.text)"
                    required
                  />
                  <div
                    class="math-preview small"
                    v-html="updateOptionPreviews[index]"
                  ></div>
                </div>
                <div class="option-actions">
                  <!-- 多选题答案选择 -->
                  <input
                    type="checkbox"
                    v-model="opt.isAnswer"
                    :id="`update-multiple-answer-${index}`"
                    class="checkbox-input"
                  />
                  <label class="checkbox-label" :for="`update-multiple-answer-${index}`"
                    >正确答案</label
                  >
                  <!-- 删除选项按钮 -->
                  <button
                    type="button"
                    @click="removeUpdateOption(index)"
                    class="btn-remove"
                    :disabled="updateForm.options.length <= 2"
                  >
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
            <textarea
              v-model="updateForm.answer"
              placeholder="请输入参考答案，数学公式使用 $公式$ "
              class="form-textarea"
              rows="4"
              @input="renderMathPreview('updateAnswer', updateForm.answer)"
              required
            ></textarea>
            <div class="math-preview" v-html="updateAnswerPreview"></div>
          </div>

          <!-- 解析 -->
          <div class="form-group">
            <label class="form-label">解析：</label>
            <textarea
              v-model="updateForm.notes"
              placeholder="请输入题目解析，数学公式使用 $公式$ "
              class="form-textarea"
              rows="3"
              @input="renderMathPreview('updateNotes', updateForm.notes)"
            ></textarea>
            <div class="math-preview" v-html="updateNotesPreview"></div>
          </div>

          <!-- 备注（更新表单） -->
          <div class="form-group">
            <label class="form-label">备注：</label>
            <textarea
              v-model="updateForm.remark"
              placeholder="请输入备注，数学公式使用 $公式$ "
              class="form-textarea"
              rows="3"
              @input="renderMathPreview('updateRemark', updateForm.remark)"
            ></textarea>
            <div class="math-preview" v-html="updateRemarkPreview"></div>
          </div>

          <!-- 更新操作按钮 -->
          <div class="form-actions">
            <button
              type="button"
              @click="showUpdatePreview"
              class="btn-primary submit-btn"
              :disabled="submitting"
            >
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

    <!-- ==================== 统一弹窗提示 ==================== -->
    <div v-if="showAlertModal" class="modal-overlay">
      <div class="alert-modal-content">
        <h3 class="alert-modal-title">{{ alertModalTitle }}</h3>
        <p class="alert-modal-message">{{ alertModalMessage }}</p>
      </div>
    </div>

    <!-- ==================== 题目预览模态框 ==================== -->
    <div
      v-if="showPreviewModal"
      class="modal-overlay preview-modal-overlay"
      @click="closePreview"
    >
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
                <label>子知识点:</label>
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
            <div class="preview-text-content" v-html="getPreviewTitle()"></div>
            <div v-if="getPreviewImageUrl()" class="preview-image">
              <img :src="getPreviewImageUrl()" alt="题目图片" class="preview-img" />
            </div>
          </div>

          <!-- 选项（选择题） -->
          <div v-if="showPreviewOptions()" class="preview-section">
            <h4>选项</h4>
            <div class="preview-options">
              <div
                v-for="(opt, index) in getPreviewOptions()"
                :key="index"
                class="preview-option"
                :class="{ 'correct-answer': isPreviewOptionCorrect(index) }"
              >
                <span class="option-label">{{ getOptionLabel(index) }}.</span>
                <span class="option-text" v-html="renderMath(opt.text)"></span>
                <span v-if="isPreviewOptionCorrect(index)" class="correct-badge"
                  >正确答案</span
                >
              </div>
            </div>
          </div>

          <!-- 答案（主观题） -->
          <div v-if="showPreviewSubjectiveAnswer()" class="preview-section">
            <h4>参考答案</h4>
            <div class="preview-text-content" v-html="getPreviewAnswer()"></div>
          </div>

          <!-- 解析 -->
          <div v-if="getPreviewNotes()" class="preview-section">
            <h4>解析</h4>
            <div class="preview-text-content" v-html="getPreviewNotes()"></div>
          </div>

          <!-- 备注 -->
          <div v-if="getPreviewRemark()" class="preview-section">
            <h4>备注</h4>
            <div class="preview-text-content" v-html="getPreviewRemark()"></div>
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
        <p>确定要删除{{ deleteEntityType }} "{{ deleteEntityData?.name }}" 吗？</p>

        <!-- 显示依赖的题目列表 -->
        <div v-if="dependentQuestions.length > 0" class="dependent-questions">
          <h4>
            以下题目使用了该{{ deleteEntityType }}（共
            {{ dependentQuestionsTotalItems }} 条）：
          </h4>

          <!-- 分页控件 -->
          <div class="pagination-controls">
            <button
              @click="goToDependentFirstPage"
              :disabled="dependentQuestionsPageNum <= 1"
              class="pagination-btn"
            >
              首页
            </button>
            <button
              @click="changeDependentPage(dependentQuestionsPageNum - 1)"
              :disabled="dependentQuestionsPageNum <= 1"
              class="pagination-btn"
            >
              上一页
            </button>

            <span
              >第 {{ dependentQuestionsPageNum }} 页，共
              {{ dependentQuestionsTotalPages }} 页 ({{
                dependentQuestionsTotalItems
              }}
              条)</span
            >

            <button
              @click="changeDependentPage(dependentQuestionsPageNum + 1)"
              :disabled="dependentQuestionsPageNum >= dependentQuestionsTotalPages"
              class="pagination-btn"
            >
              下一页
            </button>
            <button
              @click="goToDependentLastPage"
              :disabled="dependentQuestionsPageNum >= dependentQuestionsTotalPages"
              class="pagination-btn"
            >
              末页
            </button>

            <input
              type="number"
              v-model.number="dependentQuestionsPageInput"
              min="1"
              :max="dependentQuestionsTotalPages"
              placeholder="页码"
              @keyup.enter="goToDependentPage"
              class="page-input"
            />
            <button @click="goToDependentPage" class="pagination-btn">跳转</button>
          </div>

          <div class="dependent-list">
            <div v-for="q in dependentQuestions" :key="q.id" class="dependent-question">
              <div class="dependent-question-preview">
                <div class="dependent-question-header">
                  <span class="dependent-question-id">ID: {{ q.id }}</span>
                  <span class="dependent-question-type">{{
                    getQuestionCategoryName(q.question_category_id)
                  }}</span>
                </div>
                <div
                  class="dependent-question-content"
                  v-html="renderMath(q.title)"
                ></div>
                <div class="dependent-question-actions">
                  <button @click="deleteDependentQuestion(q)" class="btn-delete">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            v-if="dependentQuestions.length > 0"
            @click="deleteAllDependentQuestions"
            class="btn-delete delete-all-btn"
          >
            全部删除（共 {{ dependentQuestionsTotalItems }} 道题目）
          </button>
          <button
            @click="deleteEntity"
            class="btn-delete"
            :disabled="dependentQuestions.length > 0"
          >
            确认删除
          </button>
          <button @click="cancelDeleteEntity" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- ==================== 退出登录确认对话框 ==================== -->
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
  </div>
</template>

<script>
// 导入Vue相关功能和依赖
import { reactive, ref, onMounted, computed, watch, nextTick } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

// 从环境变量获取API基础URL
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default {
  setup() {
    const router = useRouter();

    // ==================== 新增删除实体相关状态 ====================
    const showDeleteEntityConfirm = ref(false); // 删除实体确认框显示状态
    const deleteEntityType = ref(""); // 删除的实体类型：knowledgePoint, solutionIdea, questionCategory
    const deleteEntityData = ref(null); // 要删除的实体数据
    const dependentQuestions = ref([]); // 依赖的题目列表

    // ==================== 新增依赖题目分页相关状态 ====================
    const dependentQuestionsPageNum = ref(1); // 依赖题目当前页码
    const dependentQuestionsPageSize = ref(5); // 依赖题目每页数量
    const dependentQuestionsTotalPages = ref(1); // 依赖题目总页数
    const dependentQuestionsTotalItems = ref(0); // 依赖题目总条目数
    const dependentQuestionsPageInput = ref(1); // 依赖题目页码输入

    // ==================== 新增预览功能相关状态 ====================
    const showPreviewModal = ref(false); // 预览模态框显示状态
    const previewMode = ref("upload"); // 预览模式：upload 或 update

    // ==================== 数学公式预览相关状态 ====================
    // 上传界面的数学公式预览
    const titlePreview = ref(""); // 题目内容预览
    const answerPreview = ref(""); // 答案预览
    const notesPreview = ref(""); // 解析预览
    const optionPreviews = ref(Array(10).fill("")); // 选项预览数组
    const remarkPreview = ref(""); // 备注预览

    // 更新界面的数学公式预览
    const updateTitlePreview = ref(""); // 更新题目内容预览
    const updateAnswerPreview = ref(""); // 更新答案预览
    const updateNotesPreview = ref(""); // 更新解析预览
    const updateOptionPreviews = ref(Array(10).fill("")); // 更新选项预览数组
    const updateRemarkPreview = ref(""); // 更新备注预览

    // ==================== 弹窗和提示相关状态 ====================
    const showAlertModal = ref(false); // 是否显示提示弹窗
    const alertModalTitle = ref(""); // 弹窗标题
    const alertModalMessage = ref(""); // 弹窗消息
    const alertModalTimer = ref(null); // 弹窗定时器

    /**
     * 显示提示弹窗
     * @param {string} title - 弹窗标题
     * @param {string} message - 弹窗消息
     */
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

    // ==================== 退出登录相关状态 ====================
    const showLogoutConfirm = ref(false); // 退出登录确认框显示状态

    /**
     * 确认退出登录
     */
    const confirmLogout = () => {
      showLogoutConfirm.value = true;
    };

    /**
     * 处理退出登录
     */
    const handleLogout = () => {
      // 清除本地存储的token
      localStorage.removeItem("token");
      // 清除axios默认请求头中的Authorization
      delete axios.defaults.headers.common["Authorization"];
      // 显示退出成功提示
      showAlert("退出成功", "已成功退出登录");
      showLogoutConfirm.value = false;
      // 延迟跳转，让用户看到退出成功的提示
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    };

    /**
     * 取消退出登录
     */
    const cancelLogout = () => {
      showLogoutConfirm.value = false;
    };

    // ==================== 数据列表状态 ====================
    const schoolList = ref([]); // 学校列表
    const gradeList = ref([]); // 年级列表
    const subjectList = ref([]); // 科目列表
    const knowledgePointList = ref([]); // 知识点列表
    const solutionIdeaList = ref([]); // 解题思想列表
    const questionCategoryList = ref([]); // 问题类别列表

    // ==================== 新建内容输入状态 ====================
    const newKnowledgePoint = ref(""); // 新建知识点输入
    const newSubKnowledgePoint = ref(""); // 新建子知识点输入
    const newSolutionIdea = ref(""); // 新建解题思想输入
    const newQuestionCategory = ref(""); // 新建问题类别输入

    // 更新界面的新建内容输入状态
    const newUpdateKnowledgePoint = ref(""); // 更新界面新建知识点
    const newUpdateSolutionIdea = ref(""); // 更新界面新建解题思想
    const newUpdateFormKnowledgePoint = ref(""); // 更新表单新建知识点
    const newUpdateFormSubKnowledgePoint = ref(""); // 更新表单新建子知识点
    const newUpdateFormSolutionIdea = ref(""); // 更新表单新建解题思想

    // ==================== 其他状态 ====================
    const questionList = ref([]); // 题目列表
    const pendingImageFile = ref(null); // 待上传的图片文件
    const pendingUpdateImageFile = ref(null); // 更新界面的待上传图片文件
    const submitting = ref(false); // 提交状态
    const hasSearched = ref(false); // 是否已进行过搜索
    const updateFormRef = ref(null); // 更新表单的DOM引用
    const showImagePreview = ref(false); // 图片预览显示状态
    const previewImageUrl = ref(""); // 预览图片的URL

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
      sub_knowledge_point_ids: [], // 子知识点ID数组
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
      grade_id: null,
      subject_id: null,
      question_category_ids: [], // 改为数组，支持多选
      knowledge_point_ids: [], // 知识点ID数组
      sub_knowledge_point_ids: [], // 子知识点ID数组
      solution_idea_ids: [], // 解题思想ID数组
      difficulty_level: null,
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

    // 更新表单的过滤列表
    const filteredUpdateFormKnowledgePoints = ref([]);
    const filteredUpdateFormSolutionIdeas = ref([]);
    const filteredUpdateFormQuestionCategories = ref([]);
    const filteredUpdateFormSubKnowledgePoints = ref([]);

    // ==================== 分页相关状态 ====================
    const totalPages = ref(1); // 总页数
    const totalItems = ref(0); // 总条目数
    const pageInput = ref(1); // 页码输入

    // ==================== 计算属性 ====================
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
     * 选中的子知识点对象列表
     */
    const selectedSubKnowledgePoints = computed(() => {
      return form.sub_knowledge_point_ids
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
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
     * 更新界面选中的知识点对象列表
     */
    const selectedUpdateKnowledgePoints = computed(() => {
      return searchCriteria.knowledge_point_ids
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    /**
     * 更新界面选中的子知识点对象列表
     */
    const selectedUpdateSubKnowledgePoints = computed(() => {
      return searchCriteria.sub_knowledge_point_ids
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

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
     * 更新表单选中的子知识点对象列表
     */
    const selectedUpdateFormSubKnowledgePoints = computed(() => {
      return updateForm.sub_knowledge_point_ids
        .map((id) => knowledgePointList.value.find((k) => k.id === id))
        .filter(Boolean);
    });

    // ==================== 数学公式处理函数 ====================
    /**
     * 渲染数学公式
     * @param {string} text - 包含数学公式的文本
     * @returns {string} 渲染后的HTML
     */
    const renderMath = (text) => {
      if (!text) return "";

      try {
        // 处理行内公式：$...$
        let html = text.replace(/\$(.+?)\$/g, (match, formula) => {
          try {
            return katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
            });
          } catch (e) {
            return `<span class="math-error" title="${e.message}">${match}</span>`;
          }
        });

        return html;
      } catch (error) {
        console.error("数学公式渲染错误:", error);
        return text;
      }
    };

    /**
     * 渲染数学公式预览
     * @param {string} type - 预览类型
     * @param {string} text - 要渲染的文本
     */
    const renderMathPreview = (type, text) => {
      const preview = renderMath(text);
      switch (type) {
        case "title":
          titlePreview.value = preview; // 题目内容预览
          break;
        case "answer":
          answerPreview.value = preview; // 答案预览
          break;
        case "notes":
          notesPreview.value = preview; // 解析预览
          break;
        case "remark":
          remarkPreview.value = preview; // 备注预览
          break;
        case "updateTitle":
          updateTitlePreview.value = preview; // 更新题目内容预览
          break;
        case "updateAnswer":
          updateAnswerPreview.value = preview; // 更新答案预览
          break;
        case "updateNotes":
          updateNotesPreview.value = preview; // 更新解析预览
          break;
        case "updateRemark":
          updateRemarkPreview.value = preview; // 更新备注预览
          break;
      }
    };

    /**
     * 渲染选项数学公式预览
     * @param {number} index - 选项索引
     * @param {string} text - 选项文本
     */
    const renderOptionPreview = (index, text) => {
      optionPreviews.value[index] = renderMath(text);
    };

    /**
     * 渲染更新界面选项数学公式预览
     * @param {number} index - 选项索引
     * @param {string} text - 选项文本
     */
    const renderUpdateOptionPreview = (index, text) => {
      updateOptionPreviews.value[index] = renderMath(text);
    };

    // ==================== 删除实体相关方法 ====================
    /**
     * 确认删除知识点
     * @param {Object} knowledgePoint - 知识点对象
     */
    const confirmDeleteKnowledgePoint = async (knowledgePoint) => {
      deleteEntityType.value = "知识点";
      deleteEntityData.value = knowledgePoint;
      dependentQuestionsPageNum.value = 1;
      dependentQuestionsPageInput.value = 1;
      await loadDependentQuestions();
      showDeleteEntityConfirm.value = true;
    };

    /**
     * 确认删除知识点
     * @param {Object} SubknowledgePoint - 子知识点对象
     */
    const confirmDeleteSubKnowledgePoint = async (knowledgePoint) => {
      deleteEntityType.value = "子知识点";
      deleteEntityData.value = knowledgePoint;
      dependentQuestionsPageNum.value = 1;
      dependentQuestionsPageInput.value = 1;
      await loadDependentQuestions();
      showDeleteEntityConfirm.value = true;
    };

    /**
     * 确认删除解题思想
     * @param {Object} solutionIdea - 解题思想对象
     */
    const confirmDeleteSolutionIdea = async (solutionIdea) => {
      deleteEntityType.value = "解题思想";
      deleteEntityData.value = solutionIdea;
      dependentQuestionsPageNum.value = 1;
      dependentQuestionsPageInput.value = 1;
      await loadDependentQuestions();
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
      await loadDependentQuestions();
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
          case "知识点":
            payload.knowledge_point_ids = [deleteEntityData.value.id];
            break;
          case "子知识点":
            payload.sub_knowledge_point_ids = [deleteEntityData.value.id];
            break;
          case "解题思想":
            payload.solution_idea_ids = [deleteEntityData.value.id];
            break;
          case "问题类别":
            payload.question_category_ids = [deleteEntityData.value.id];
            break;
        }

        const res = await axios.post(`${API_BASE}/questions/findQuestions`, payload);
        const responseData = res.data.data;

        dependentQuestions.value = responseData?.data_info || [];
        dependentQuestionsTotalPages.value = responseData?.total_pages || 1;
        dependentQuestionsTotalItems.value = responseData?.total_items || 0;
        dependentQuestionsPageInput.value = dependentQuestionsPageNum.value;
      } catch (err) {
        console.error("加载依赖题目失败:", err);
        showAlert("加载失败", "加载依赖题目失败");
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
      loadDependentQuestions();
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
        showAlert(
          "输入错误",
          `请输入 1 到 ${dependentQuestionsTotalPages.value} 之间的页码`
        );
      }
    };

    /**
     * 删除依赖题目
     * @param {Object} question - 题目对象
     */
    const deleteDependentQuestion = async (question) => {
      if (!confirm(`确定要删除题目(ID: ${question.id})吗？`)) {
        return;
      }

      try {
        await axios.delete(`${API_BASE}/questions/deleteQuestion/${question.id}`);
        showAlert("删除成功", "题目删除成功");

        // 重新加载依赖题目
        await loadDependentQuestions();

        // 如果删除的是当前更新表单中的题目，关闭更新表单
        if (selectedQuestion.value && selectedQuestion.value.id === question.id) {
          cancelUpdate();
        }
      } catch (err) {
        console.error("删除题目失败:", err);
        showAlert("删除失败", "删除题目失败");
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
            case "知识点":
              payload.knowledge_point_ids = [deleteEntityData.value.id];
              break;
            case "子知识点":
              payload.sub_knowledge_point_ids = [deleteEntityData.value.id];
              break;
            case "解题思想":
              payload.solution_idea_ids = [deleteEntityData.value.id];
              break;
            case "问题类别":
              payload.question_category_ids = [deleteEntityData.value.id];
              break;
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

        showAlert("删除成功", `成功删除 ${allDependentQuestions.length} 道题目`);

        // 重新加载依赖题目列表（应该为空）
        await loadDependentQuestions();

        // 关闭更新表单（如果打开的话）
        cancelUpdate();
      } catch (err) {
        console.error("批量删除题目失败:", err);
        showAlert("删除失败", "批量删除题目失败");
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
          case "知识点":
          case "子知识点":
            url = `${API_BASE}/questions/deleteKnowledgePoint/${deleteEntityData.value.id}`;
            entityName = deleteEntityType.value;
            break;
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
          showAlert("无法删除", message);
          showDeleteEntityConfirm.value = false;
          return;
        }

        // 删除成功
        showAlert("删除成功", `${entityName}删除成功`);

        // 重新加载列表
        await loadLists();

        // 如果当前选中的实体被删除，清除选择
        if (
          (deleteEntityType.value === "知识点" ||
            deleteEntityType.value === "子知识点") &&
          selectedKnowledgePoint.value &&
          selectedKnowledgePoint.value.id === deleteEntityData.value.id
        ) {
          clearKnowledgePoint();
        }
        if (
          deleteEntityType.value === "问题类别" &&
          selectedQuestionCategory.value &&
          selectedQuestionCategory.value.id === deleteEntityData.value.id
        ) {
          clearQuestionCategory();
        }

        showDeleteEntityConfirm.value = false;
        deleteEntityData.value = null;
        dependentQuestions.value = [];
      } catch (err) {
        console.error(`删除${deleteEntityType.value}失败:`, err);
        // 优先取后端返回的 message，否则显示通用提示
        const backendMessage = err.response?.data?.message;
        showDeleteEntityConfirm.value = false;
        showAlert("删除失败", backendMessage);
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
    const confirmSubmit = () => {
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
        showAlert("输入错误", "请选择问题类别");
        return false;
      }
      if (!form.title.trim()) {
        showAlert("输入错误", "请输入题目内容");
        return false;
      }
      return true;
    };

    /**
     * 验证更新表单
     */
    const validateUpdateForm = () => {
      if (!updateForm.question_category_id) {
        showAlert("输入错误", "请选择问题类别");
        return false;
      }
      if (!updateForm.title.trim()) {
        showAlert("输入错误", "请输入题目内容");
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
      const kp = knowledgePointList.value.find(
        (k) => k.id === currentForm.knowledge_point_id
      );
      return kp ? kp.name : "未知";
    };

    /**
     * 获取预览的子知识点
     */
    const getPreviewSubKnowledgePoints = () => {
      const currentForm = previewMode.value === "upload" ? form : updateForm;
      if (!currentForm.sub_knowledge_point_ids.length) return "无";
      return currentForm.sub_knowledge_point_ids
        .map((id) => {
          const kp = knowledgePointList.value.find((k) => k.id === id);
          return kp ? kp.name : "未知";
        })
        .join(", ");
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
      return renderMath(currentForm.title || "无");
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
      return renderMath(currentForm.answer || "无");
    };

    /**
     * 获取预览的解析
     */
    const getPreviewNotes = () => {
      const currentForm = previewMode.value === "upload" ? form : updateForm;
      return renderMath(currentForm.notes || "");
    };

    /**
     * 获取预览的备注
     */
    const getPreviewRemark = () => {
      const currentForm = previewMode.value === "upload" ? form : updateForm;
      return renderMath(currentForm.remark || "");
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
        optionPreviews.value.push("");
      }
    };

    /**
     * 删除选项
     * @param {number} index - 要删除的选项索引
     */
    const removeOption = (index) => {
      if (form.options.length > 2) {
        form.options.splice(index, 1);
        optionPreviews.value.splice(index, 1);
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
        updateOptionPreviews.value.push("");
      }
    };

    /**
     * 更新界面删除选项
     * @param {number} index - 要删除的选项索引
     */
    const removeUpdateOption = (index) => {
      if (updateForm.options.length > 2) {
        updateForm.options.splice(index, 1);
        updateOptionPreviews.value.splice(index, 1);
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
      // 重置选项
      form.options = [
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
        { text: "", isAnswer: false },
      ];
      singleAnswerIndex.value = null;
      form.answer = "";
      optionPreviews.value = Array(10).fill("");
      titlePreview.value = "";
      answerPreview.value = "";
      notesPreview.value = "";

      // 根据问题类别设置默认评分方法
      if (selectedQuestionCategory.value) {
        const name = selectedQuestionCategory.value.name || "";
        const autoMarkingKeywords = ["单选", "多选"]; // 可在这里扩展更多自动评分题型
        form.marking_type = autoMarkingKeywords.some((keyword) => name.includes(keyword))
          ? 0
          : 1;
      }
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
      updateOptionPreviews.value = Array(10).fill("");
      updateTitlePreview.value = "";
      updateAnswerPreview.value = "";
      updateNotesPreview.value = "";
    };

    // ==================== 知识点选择方法 ====================
    /**
     * 选择知识点
     * @param {Object} kp - 知识点对象
     */
    const selectKnowledgePoint = (kp) => {
      selectedKnowledgePoint.value = kp;
      form.knowledge_point_id = kp.id;
      knowledgeSearch.value = kp.name;
      showKnowledgeDropdown.value = false;
    };

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

    // ==================== 子知识点选择方法 ====================
    /**
     * 选择子知识点
     * @param {Object} kp - 子知识点对象
     */
    const selectSubKnowledgePoint = (kp) => {
      if (!form.sub_knowledge_point_ids.includes(kp.id)) {
        form.sub_knowledge_point_ids.push(kp.id);
      }
      subKnowledgeSearch.value = "";
      showSubKnowledgeDropdown.value = false;
    };

    /**
     * 检查子知识点是否已选择
     * @param {number} id - 子知识点ID
     * @returns {boolean} 是否已选择
     */
    const isSubKnowledgeSelected = (id) => {
      return form.sub_knowledge_point_ids.includes(id);
    };

    /**
     * 移除子知识点
     * @param {number} id - 要移除的子知识点ID
     */
    const removeSubKnowledgePoint = (id) => {
      form.sub_knowledge_point_ids = form.sub_knowledge_point_ids.filter(
        (kp) => kp !== id
      );
    };

    // ==================== 更新界面知识点多选方法 ====================
    /**
     * 更新界面选择知识点
     * @param {Object} kp - 知识点对象
     */
    const selectUpdateKnowledgePoint = (kp) => {
      if (!searchCriteria.knowledge_point_ids.includes(kp.id)) {
        searchCriteria.knowledge_point_ids.push(kp.id);
      }
      updateKnowledgeSearch.value = "";
      showUpdateKnowledgeDropdown.value = false;
    };

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
     * 更新界面选择子知识点
     * @param {Object} kp - 子知识点对象
     */
    const selectUpdateSubKnowledgePoint = (kp) => {
      if (!searchCriteria.sub_knowledge_point_ids.includes(kp.id)) {
        searchCriteria.sub_knowledge_point_ids.push(kp.id);
      }
      updateSubKnowledgeSearch.value = "";
      showUpdateSubKnowledgeDropdown.value = false;
    };

    /**
     * 检查更新界面子知识点是否已选择
     * @param {number} id - 子知识点ID
     * @returns {boolean} 是否已选择
     */
    const isUpdateSubKnowledgeSelected = (id) => {
      return searchCriteria.sub_knowledge_point_ids.includes(id);
    };

    /**
     * 移除更新界面子知识点
     * @param {number} id - 要移除的子知识点ID
     */
    const removeUpdateSubKnowledgePoint = (id) => {
      searchCriteria.sub_knowledge_point_ids = searchCriteria.sub_knowledge_point_ids.filter(
        (kp) => kp !== id
      );
    };

    /**
     * 过滤更新界面子知识点列表
     */
    const filterUpdateSubKnowledgePoints = () => {
      if (!updateSubKnowledgeSearch.value) {
        filteredUpdateSubKnowledgePoints.value = knowledgePointList.value;
      } else {
        filteredUpdateSubKnowledgePoints.value = knowledgePointList.value.filter((kp) =>
          kp.name.toLowerCase().includes(updateSubKnowledgeSearch.value.toLowerCase())
        );
      }
    };
    /**
     * 更新界面子知识点下拉框失焦处理
     */
    const onUpdateSubKnowledgeBlur = () => {
      setTimeout(() => {
        showUpdateSubKnowledgeDropdown.value = false;
      }, 200);
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

    // ==================== 更新表单知识点选择方法 ====================
    /**
     * 更新表单选择知识点
     * @param {Object} kp - 知识点对象
     */
    const selectUpdateFormKnowledgePoint = (kp) => {
      selectedUpdateFormKnowledgePoint.value = kp;
      updateForm.knowledge_point_id = kp.id;
      updateFormKnowledgeSearch.value = kp.name;
      showUpdateFormKnowledgeDropdown.value = false;
    };

    /**
     * 清除更新表单知识点选择
     */
    const clearUpdateFormKnowledgePoint = () => {
      selectedUpdateFormKnowledgePoint.value = null;
      updateForm.knowledge_point_id = null;
      updateFormKnowledgeSearch.value = "";
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

    // ==================== 更新表单子知识点选择方法 ====================
    /**
     * 更新表单选择子知识点
     * @param {Object} kp - 子知识点对象
     */
    const selectUpdateFormSubKnowledgePoint = (kp) => {
      if (!updateForm.sub_knowledge_point_ids.includes(kp.id)) {
        updateForm.sub_knowledge_point_ids.push(kp.id);
      }
      updateFormSubKnowledgeSearch.value = "";
      showUpdateFormSubKnowledgeDropdown.value = false;
    };

    /**
     * 检查更新表单子知识点是否已选择
     * @param {number} id - 子知识点ID
     * @returns {boolean} 是否已选择
     */
    const isUpdateFormSubKnowledgeSelected = (id) => {
      return updateForm.sub_knowledge_point_ids.includes(id);
    };

    /**
     * 移除更新表单子知识点
     * @param {number} id - 要移除的子知识点ID
     */
    const removeUpdateFormSubKnowledgePoint = (id) => {
      updateForm.sub_knowledge_point_ids = updateForm.sub_knowledge_point_ids.filter(
        (kp) => kp !== id
      );
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
     * 过滤子知识点列表
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
        filteredUpdateQuestionCategories.value = questionCategoryList.value.filter(
          (item) =>
            item.name
              .toLowerCase()
              .includes(updateQuestionCategorySearch.value.toLowerCase())
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
          item.name
            .toLowerCase()
            .includes(updateFormSolutionIdeaSearch.value.toLowerCase())
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
     * 过滤更新表单子知识点列表
     */
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
     * 处理图片上传
     * @param {Event} event - 文件输入事件
     */
    const handleImageUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        showAlert("文件错误", "请选择图片文件");
        return;
      }

      // 验证文件大小（5MB限制）
      if (file.size > 5 * 1024 * 1024) {
        showAlert("文件过大", "图片大小不能超过5MB");
        return;
      }

      // 创建对象URL用于预览
      const previewUrl = URL.createObjectURL(file);
      form.img_url = previewUrl;
      pendingImageFile.value = file;
      event.target.value = ""; // 重置文件输入

      // 显示上传中状态
      showAlert("上传中", "图片正在上传...", "info");
    };

    /**
     * 处理更新界面图片上传
     * @param {Event} event - 文件输入事件
     */
    const handleUpdateImageUpload = async (event) => {
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

      // 创建对象URL用于预览
      const previewUrl = URL.createObjectURL(file);
      updateForm.img_url = previewUrl;
      pendingUpdateImageFile.value = file; // 保存文件，等待确认上传
      event.target.value = "";
    };

    /**
     * 移除图片
     */
    const removeImage = () => {
      form.img_url = "";
      pendingImageFile.value = null;
    };

    /**
     * 移除更新界面图片
     */
    const removeUpdateImage = () => {
      updateForm.img_url = "";
      pendingUpdateImageFile.value = null;
    };
    /**
     * 上传待处理的图片（在表单提交时调用）
     * @param {string} mode - 模式：'upload' 或 'update'
     * @returns {Promise<boolean>} 是否上传成功
     */
    const uploadPendingImage = async (mode) => {
      try {
        const pendingFile =
          mode === "upload" ? pendingImageFile.value : pendingUpdateImageFile.value;
        const formData = mode === "upload" ? form : updateForm;

        if (!pendingFile) {
          return true; // 没有待上传的图片，直接返回成功
        }

        showAlert("上传中", "图片正在上传到图床...", "info");

        // 上传到图床
        const imageUrl = await uploadToImageBed(pendingFile);

        // 使用图床返回的URL替换预览URL
        formData.img_url = imageUrl;

        // 清空待处理文件
        if (mode === "upload") {
          pendingImageFile.value = null;
        } else {
          pendingUpdateImageFile.value = null;
        }

        showAlert("上传成功", "图片已成功上传到图床");
        return true;
      } catch (error) {
        console.error("图片上传失败:", error);
        showAlert("上传失败", error.message);
        return false;
      }
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
    onMounted(() => {
      // 设置axios认证token
      const token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      loadLists();
    });

    /**
     * 加载所有数据列表
     */
    const loadLists = async () => {
      try {
        // 并行请求所有数据
        const [s, g, sub, kp, si, qc] = await Promise.all([
          axios.get(`${API_BASE}/questions/getSchoolList`),
          axios.get(`${API_BASE}/questions/getGradeList`),
          axios.get(`${API_BASE}/questions/getSubjectList`),
          axios.get(`${API_BASE}/questions/getKnowledgePointList`),
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

        // 处理知识点列表数据
        knowledgePointList.value = Object.entries(
          kp.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));

        // 处理解题思想列表数据
        solutionIdeaList.value = Object.entries(si.data.data || {}).map(([id, name]) => ({
          id: parseInt(id),
          name,
        }));

        // 处理问题类别列表数据
        questionCategoryList.value = Object.entries(
          qc.data.data || {}
        ).map(([id, name]) => ({ id: parseInt(id), name }));

        // 初始化所有过滤后的列表
        filteredKnowledgePoints.value = knowledgePointList.value;
        filteredSubKnowledgePoints.value = knowledgePointList.value;
        filteredSolutionIdeas.value = solutionIdeaList.value;
        filteredQuestionCategories.value = questionCategoryList.value;

        filteredUpdateKnowledgePoints.value = knowledgePointList.value;
        filteredUpdateSubKnowledgePoints.value = knowledgePointList.value;
        filteredUpdateSolutionIdeas.value = solutionIdeaList.value;
        filteredUpdateQuestionCategories.value = questionCategoryList.value;

        filteredUpdateFormKnowledgePoints.value = knowledgePointList.value;
        filteredUpdateFormSolutionIdeas.value = solutionIdeaList.value;
        filteredUpdateFormQuestionCategories.value = questionCategoryList.value;
        filteredUpdateFormSubKnowledgePoints.value = knowledgePointList.value;
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
      } catch (err) {
        console.error("获取列表失败:", err);
        showAlert("加载失败", "获取列表失败");
      }
    };

    // ==================== 新建内容上传方法 ====================
    /**
     * 上传知识点
     */
    const uploadKnowledgePoint = async () => {
      if (!newKnowledgePoint.value.trim()) {
        showAlert("输入错误", "请输入知识点名称");
        return;
      }

      try {
        // 分割输入内容（支持逗号和中文逗号）
        const items = newKnowledgePoint.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadKnowledgePoint`, items);
        showAlert("上传成功", "知识点上传成功");
        newKnowledgePoint.value = "";
        await loadLists(); // 重新加载列表
      } catch (err) {
        console.error("上传知识点失败:", err);
        showAlert("上传失败", "上传知识点失败");
      }
    };

    /**
     * 上传子知识点
     */
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

    /**
     * 上传解题思想
     */
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

    /**
     * 上传问题类别
     */
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

    // ==================== 更新界面新建内容上传方法 ====================
    /**
     * 更新界面上传知识点
     */
    const uploadUpdateKnowledgePoint = async () => {
      if (!newUpdateKnowledgePoint.value.trim()) {
        showAlert("输入错误", "请输入知识点名称");
        return;
      }

      try {
        const items = newUpdateKnowledgePoint.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadKnowledgePoint`, items);
        showAlert("上传成功", "知识点上传成功");
        newUpdateKnowledgePoint.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传知识点失败:", err);
        showAlert("上传失败", "上传知识点失败");
      }
    };

    /**
     * 更新界面上传解题思想
     */
    const uploadUpdateSolutionIdea = async () => {
      if (!newUpdateSolutionIdea.value.trim()) {
        showAlert("输入错误", "请输入解题思想");
        return;
      }

      try {
        const items = newUpdateSolutionIdea.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadSolutionIdea`, items);
        showAlert("上传成功", "解题思想上传成功");
        newUpdateSolutionIdea.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传解题思想失败:", err);
        showAlert("上传失败", "上传解题思想失败");
      }
    };

    /**
     * 更新表单上传知识点
     */
    const uploadUpdateFormKnowledgePoint = async () => {
      if (!newUpdateFormKnowledgePoint.value.trim()) {
        showAlert("输入错误", "请输入知识点名称");
        return;
      }

      try {
        const items = newUpdateFormKnowledgePoint.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadKnowledgePoint`, items);
        showAlert("上传成功", "知识点上传成功");
        newUpdateFormKnowledgePoint.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传知识点失败:", err);
        showAlert("上传失败", "上传知识点失败");
      }
    };

    /**
     * 更新表单上传子知识点
     */
    const uploadUpdateFormSubKnowledgePoint = async () => {
      if (!newUpdateFormSubKnowledgePoint.value.trim()) {
        showAlert("输入错误", "请输入子知识点名称");
        return;
      }

      try {
        const items = newUpdateFormSubKnowledgePoint.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadKnowledgePoint`, items);
        showAlert("上传成功", "子知识点上传成功");
        newUpdateFormSubKnowledgePoint.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传子知识点失败:", err);
        showAlert("上传失败", "上传子知识点失败");
      }
    };

    /**
     * 更新表单上传解题思想
     */
    const uploadUpdateFormSolutionIdea = async () => {
      if (!newUpdateFormSolutionIdea.value.trim()) {
        showAlert("输入错误", "请输入解题思想");
        return;
      }

      try {
        const items = newUpdateFormSolutionIdea.value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter((item) => item);
        await axios.post(`${API_BASE}/questions/uploadSolutionIdea`, items);
        showAlert("上传成功", "解题思想上传成功");
        newUpdateFormSolutionIdea.value = "";
        await loadLists();
      } catch (err) {
        console.error("上传解题思想失败:", err);
        showAlert("上传失败", "上传解题思想失败");
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
        const responseData = res.data.data; // 获取返回的data对象

        // 修复：正确设置分页数据
        questionList.value = responseData?.data_info || [];

        // 从响应数据的data字段中获取分页信息
        if (responseData) {
          searchCriteria.page_num = responseData.page_num || 1;
          searchCriteria.page_size = responseData.page_size || 10;
          totalPages.value = responseData.total_pages || 1;
          totalItems.value = responseData.total_items || 0;
          pageInput.value = responseData.page_num || 1; // 同步页码输入框
        }

        hasSearched.value = true;

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
        showAlert("输入错误", `请输入 1 到 ${totalPages.value} 之间的页码`);
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
      updateForm.difficulty_level = q.difficulty_level
        ? Number(q.difficulty_level)
        : null;
      updateForm.answer = q.answer || "";
      updateForm.notes = q.notes || "";
      updateForm.remark = q.remark || "";
      updateForm.sub_knowledge_point_ids = (q.sub_knowledge_point_ids || []).map((id) =>
        Number(id)
      );
      updateForm.img_url = q.img_url || "";

      // 设置知识点显示
      if (q.knowledge_point_id) {
        const currentKnowledge = knowledgePointList.value.find(
          (k) => k.id === Number(q.knowledge_point_id)
        );
        if (currentKnowledge) {
          selectedUpdateFormKnowledgePoint.value = currentKnowledge;
          updateFormKnowledgeSearch.value = currentKnowledge.name;
        }
      }

      // 设置问题类别显示
      if (q.question_category_id) {
        const currentQuestionCategory = questionCategoryList.value.find(
          (c) => c.id === Number(q.question_category_id)
        );
        if (currentQuestionCategory) {
          selectedUpdateFormQuestionCategory.value = currentQuestionCategory;
          updateFormQuestionCategorySearch.value = currentQuestionCategory.name;
        }
      }

      // 处理选择题选项
      const questionCategoryName = selectedUpdateFormQuestionCategory.value?.name;
      if (
        questionCategoryName &&
        (questionCategoryName === "单选题" ||
          questionCategoryName.includes("单选") ||
          questionCategoryName === "多选题" ||
          questionCategoryName.includes("多选"))
      ) {
        if (q.options && typeof q.options === "object") {
          // 对选项按键名排序
          const sortedEntries = Object.entries(q.options).sort(([keyA], [keyB]) => {
            return keyA.localeCompare(keyB);
          });

          updateForm.options = sortedEntries.map(([key, text], index) => {
            const optionKey = getOptionLabel(index);
            let isAnswer = false;

            // 根据问题类别设置正确答案
            if (
              questionCategoryName === "单选题" ||
              questionCategoryName.includes("单选")
            ) {
              isAnswer = q.answer === optionKey;
            } else if (
              questionCategoryName === "多选题" ||
              questionCategoryName.includes("多选")
            ) {
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

          // 设置单选题正确答案索引
          if (
            questionCategoryName === "单选题" ||
            questionCategoryName.includes("单选")
          ) {
            const answerIndex = updateForm.options.findIndex((opt) => opt.isAnswer);
            updateSingleAnswerIndex.value = answerIndex !== -1 ? answerIndex : null;
          }
        }
      }

      // 初始化预览
      await nextTick();
      renderMathPreview("updateTitle", updateForm.title);
      renderMathPreview("updateAnswer", updateForm.answer);
      renderMathPreview("updateNotes", updateForm.notes);
      renderMathPreview("updateRemark", updateForm.remark);

      // 初始化选项预览
      if (updateForm.options && updateForm.options.length) {
        updateForm.options.forEach((opt, index) => {
          renderUpdateOptionPreview(index, opt.text);
        });
      }

      // 滚动到更新表单
      if (updateFormRef.value) {
        updateFormRef.value.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    /**
     * 取消更新
     */
    const cancelUpdate = () => {
      showUpdateForm.value = false;
      selectedQuestion.value = null;
      updateFormKnowledgeSearch.value = "";
      updateFormSolutionIdeaSearch.value = "";
      updateFormQuestionCategorySearch.value = "";
      updateFormSubKnowledgeSearch.value = "";
      selectedUpdateFormKnowledgePoint.value = null;
      selectedUpdateFormQuestionCategory.value = null;
      updateTitlePreview.value = "";
      updateAnswerPreview.value = "";
      updateNotesPreview.value = "";
      updateRemarkPreview.value = "";
      updateOptionPreviews.value = Array(10).fill("");
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
        showAlert("删除成功", "题目删除成功");

        // 从列表中移除已删除的题目
        questionList.value = questionList.value.filter((q) => q.id !== id);

        showDeleteConfirm.value = false;
        questionToDelete.value = null;
      } catch (err) {
        console.error("删除失败:", err);
        showAlert("删除失败", "删除失败");
      }
    };

    // ==================== 表单提交处理 ====================
    /**
     * 处理题目提交
     */
    const handleSubmit = async () => {
      // 验证问题类别是否选择
      if (!form.question_category_id) {
        showAlert("输入错误", "请选择问题类别");
        return;
      }

      try {
        submitting.value = true;
        const imageUploadSuccess = await uploadPendingImage("upload");
        if (!imageUploadSuccess) {
          submitting.value = false;
          return;
        }

        // 如果有待上传的图片，先上传图片
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

          if (
            questionCategoryName === "单选题" ||
            questionCategoryName.includes("单选")
          ) {
            answerPayload =
              singleAnswerIndex.value !== null
                ? getOptionLabel(singleAnswerIndex.value)
                : "";
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
          solution_idea_ids:
            form.solution_idea_ids.length > 0
              ? form.solution_idea_ids.map((id) => Number(id))
              : null,
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
          sub_knowledge_point_ids:
            form.sub_knowledge_point_ids.length > 0
              ? form.sub_knowledge_point_ids.map((id) => Number(id))
              : null,
          img_url: form.img_url,
        };

        const res = await axios.post(
          `${API_BASE}/questions/uploadSingleQuestion`,
          payload
        );
        if (res.data.message && res.data.message.includes("题目已存在")) {
          showAlert("上传失败", "题目已存在，无法重复上传");
        } else {
          showAlert("上传成功", res.data.message || "上传成功");
          saveUploadMemory(); // 保存用户设置
          resetForm(); // 重置表单
        }
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
        // 先上传图片到图床
        const imageUploadSuccess = await uploadPendingImage("update");
        if (!imageUploadSuccess) {
          submitting.value = false;
          return;
        }

        // 处理图片上传
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

          if (
            questionCategoryName === "单选题" ||
            questionCategoryName.includes("单选")
          ) {
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
          subject_id:
            updateForm.subject_id !== null ? Number(updateForm.subject_id) : null,
          question_category_id:
            updateForm.question_category_id !== null
              ? Number(updateForm.question_category_id)
              : null,
          marking_type: updateForm.marking_type,
          knowledge_point_id:
            updateForm.knowledge_point_id !== null
              ? Number(updateForm.knowledge_point_id)
              : null,
          solution_idea_ids:
            updateForm.solution_idea_ids.length > 0
              ? updateForm.solution_idea_ids.map((id) => Number(id))
              : null,
          difficulty_level:
            updateForm.difficulty_level !== null
              ? Number(updateForm.difficulty_level)
              : null,
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
          sub_knowledge_point_ids:
            updateForm.sub_knowledge_point_ids.length > 0
              ? updateForm.sub_knowledge_point_ids.map((id) => Number(id))
              : null,
          img_url: updateForm.img_url,
        };

        const res = await axios.post(`${API_BASE}/questions/updateQuestion`, payload);
        // 检查响应消息是否为"题目已存在"
        if (res.data.message && res.data.message.includes("题目已存在")) {
          showAlert("更新失败", "题目已存在，无法更新");
        } else {
          showAlert("更新成功", res.data.message || "更新成功");
          await silentFindQuestions(); // 静默刷新列表
          cancelUpdate(); // 关闭更新表单
        }
      } catch (err) {
        console.error("更新失败:", err);
        showAlert("更新失败", err.response?.data?.message || err.message);
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
      });
      singleAnswerIndex.value = null;
      knowledgeSearch.value = "";
      subKnowledgeSearch.value = "";
      solutionIdeaSearch.value = "";
      pendingImageFile.value = null;
      selectedKnowledgePoint.value = null;
      titlePreview.value = "";
      answerPreview.value = "";
      notesPreview.value = "";
      optionPreviews.value = Array(10).fill("");
    };

    /**
     * 进入更新模式
     */
    const enterUpdateMode = () => {
      updateMode.value = true;
      questionList.value = [];
      showUpdateForm.value = false;
      selectedQuestion.value = null;
      updateKnowledgeSearch.value = "";
      updateSubKnowledgeSearch.value = "";
      updateSolutionIdeaSearch.value = "";
      updateQuestionCategorySearch.value = "";
      searchCriteria.knowledge_point_ids = [];
      searchCriteria.sub_knowledge_point_ids = [];
      searchCriteria.solution_idea_ids = [];
      searchCriteria.question_category_ids = []; // 改为数组
      searchCriteria.page_num = 1; // 重置为第一页
      searchCriteria.page_size = 10; // 重置每页数量
      totalPages.value = 1; // 重置总页数
      totalItems.value = 0; // 重置总条目数
      pageInput.value = 1; // 重置页码输入
      hasSearched.value = false;
      Object.assign(searchCriteria, {
        grade_id: null,
        subject_id: null,
        question_category_ids: [], // 改为数组
        knowledge_point_ids: [],
        sub_knowledge_point_ids: [],
        solution_idea_ids: [],
        difficulty_level: null,
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
     * 根据ID获取知识点名称
     * @param {number} id - 知识点ID
     * @returns {string} 知识点名称
     */
    const getKnowledgePointName = (id) => {
      if (id === null) return "-";
      const kp = knowledgePointList.value.find((k) => k.id === Number(id));
      return kp ? kp.name : "-";
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

    // ==================== 返回所有响应式数据和方法 ====================
    return {
      // 表单数据
      form,
      updateForm,
      searchCriteria,

      // 数据列表
      schoolList,
      gradeList,
      subjectList,
      knowledgePointList,
      solutionIdeaList,
      questionCategoryList,

      // 新建内容输入
      newKnowledgePoint,
      newSubKnowledgePoint,
      newSolutionIdea,
      newQuestionCategory,
      newUpdateKnowledgePoint,
      newUpdateSolutionIdea,
      newUpdateFormKnowledgePoint,
      newUpdateFormSubKnowledgePoint,
      newUpdateFormSolutionIdea,

      // 选项操作方法
      addOption,
      removeOption,
      addUpdateOption,
      removeUpdateOption,
      getOptionLabel,

      // 答案索引
      singleAnswerIndex,
      updateSingleAnswerIndex,

      // 模式状态
      updateMode,
      enterUpdateMode,
      exitUpdateMode,

      // 提交处理方法
      handleSubmit,
      handleUpdateSubmit,

      // 图片处理方法
      handleImageUpload,
      handleUpdateImageUpload,
      removeImage,
      removeUpdateImage,

      // 搜索关键词
      knowledgeSearch,
      subKnowledgeSearch,
      solutionIdeaSearch,
      questionCategorySearch,

      // 过滤列表
      filteredKnowledgePoints,
      filteredSubKnowledgePoints,
      filteredSolutionIdeas,
      filteredQuestionCategories,

      // 选中项列表
      selectedSubKnowledgePoints,
      selectedSolutionIdeas,
      selectedQuestionCategory,

      // 上传方法
      uploadKnowledgePoint,
      uploadSubKnowledgePoint,
      uploadSolutionIdea,
      uploadQuestionCategory,
      uploadUpdateKnowledgePoint,
      uploadUpdateSolutionIdea,
      uploadUpdateFormKnowledgePoint,
      uploadUpdateFormSubKnowledgePoint,
      uploadUpdateFormSolutionIdea,

      // 题目列表和检索
      questionList,
      findQuestions,
      loadQuestionForUpdate,
      cancelUpdate,

      // 删除相关
      confirmDelete,
      cancelDelete,
      deleteQuestion,

      // 问题类别变更处理
      handleQuestionCategoryChange,
      handleUpdateQuestionCategoryChange,

      // 计算属性
      showSingleOptions,
      showMultipleOptions,
      showSubjectiveAnswer,
      showUpdateSingleOptions,
      showUpdateMultipleOptions,
      showUpdateSubjectiveAnswer,

      // 状态
      submitting,
      showUpdateForm,
      selectedQuestion,
      showDeleteConfirm,
      questionToDelete,

      // 辅助方法
      getSchoolName,
      getGradeName,
      getSubjectName,
      getKnowledgePointName,
      getSolutionIdeaName,
      getQuestionCategoryName,
      getMarkingTypeName,

      // 更新界面搜索关键词
      updateKnowledgeSearch,
      updateSubKnowledgeSearch,
      updateSolutionIdeaSearch,
      updateQuestionCategorySearch,
      updateFormKnowledgeSearch,
      updateFormSolutionIdeaSearch,
      updateFormQuestionCategorySearch,
      updateFormSubKnowledgeSearch,

      // 更新界面过滤列表
      filteredUpdateKnowledgePoints,
      filteredUpdateSubKnowledgePoints,
      filteredUpdateSolutionIdeas,
      filteredUpdateQuestionCategories,
      filteredUpdateFormKnowledgePoints,
      filteredUpdateFormSolutionIdeas,
      filteredUpdateFormQuestionCategories,
      filteredUpdateFormSubKnowledgePoints,

      // 过滤方法
      filterKnowledgePoints,
      filterSubKnowledgePoints,
      filterSolutionIdeas,
      filterQuestionCategories,
      filterUpdateKnowledgePoints,
      filterUpdateSubKnowledgePoints,
      filterUpdateSolutionIdeas,
      filterUpdateQuestionCategories,
      filterUpdateFormKnowledgePoints,
      filterUpdateFormSolutionIdeas,
      filterUpdateFormQuestionCategories,
      filterUpdateFormSubKnowledgePoints,

      // 选择方法
      selectKnowledgePoint,
      clearKnowledgePoint,
      selectSolutionIdea,
      removeSolutionIdea,
      isSolutionIdeaSelected,
      selectQuestionCategory,
      clearQuestionCategory,
      selectSubKnowledgePoint,
      removeSubKnowledgePoint,
      isSubKnowledgeSelected,
      selectUpdateKnowledgePoint,
      selectUpdateSubKnowledgePoint,
      removeUpdateKnowledgePoint,
      removeUpdateSubKnowledgePoint,
      isUpdateKnowledgeSelected,
      isUpdateSubKnowledgeSelected,
      selectUpdateSolutionIdea,
      removeUpdateSolutionIdea,
      isUpdateSolutionIdeaSelected,
      selectUpdateQuestionCategory,
      removeUpdateQuestionCategory,
      isUpdateQuestionCategorySelected,
      clearUpdateQuestionCategory,
      selectUpdateFormKnowledgePoint,
      clearUpdateFormKnowledgePoint,
      selectUpdateFormSolutionIdea,
      removeUpdateFormSolutionIdea,
      isUpdateFormSolutionIdeaSelected,
      selectUpdateFormQuestionCategory,
      clearUpdateFormQuestionCategory,
      selectUpdateFormSubKnowledgePoint,
      removeUpdateFormSubKnowledgePoint,
      isUpdateFormSubKnowledgeSelected,

      // 下拉框显示状态
      showKnowledgeDropdown,
      showSubKnowledgeDropdown,
      showSolutionIdeaDropdown,
      showQuestionCategoryDropdown,
      showUpdateKnowledgeDropdown,
      showUpdateSubKnowledgeDropdown,
      showUpdateSolutionIdeaDropdown,
      showUpdateQuestionCategoryDropdown,
      showUpdateFormKnowledgeDropdown,
      showUpdateFormSolutionIdeaDropdown,
      showUpdateFormQuestionCategoryDropdown,
      showUpdateFormSubKnowledgeDropdown,

      // 下拉框失焦处理
      onKnowledgeBlur,
      onSubKnowledgeBlur,
      onSolutionIdeaBlur,
      onQuestionCategoryBlur,
      onUpdateKnowledgeBlur,
      onUpdateSubKnowledgeBlur,
      onUpdateSolutionIdeaBlur,
      onUpdateQuestionCategoryBlur,
      onUpdateFormKnowledgeBlur,
      onUpdateFormSolutionIdeaBlur,
      onUpdateFormQuestionCategoryBlur,
      onUpdateFormSubKnowledgeBlur,

      // 选中的对象
      selectedKnowledgePoint,
      selectedUpdateFormKnowledgePoint,
      selectedUpdateFormQuestionCategory,
      selectedUpdateKnowledgePoints,
      selectedUpdateSubKnowledgePoints,
      selectedUpdateSolutionIdeas,
      selectedUpdateQuestionCategories,
      selectedUpdateFormSolutionIdeas,
      selectedUpdateFormSubKnowledgePoints,

      // 搜索状态
      hasSearched,

      // DOM引用
      updateFormRef,

      // 图片预览
      previewImage,
      closeImagePreview,
      showImagePreview,
      previewImageUrl,

      // 退出登录
      handleLogout,
      confirmLogout,

      // 弹窗相关
      showAlertModal,
      alertModalTitle,
      alertModalMessage,
      showAlert,
      showLogoutConfirm,
      cancelLogout,
      silentFindQuestions,

      // 数学公式预览相关
      titlePreview,
      answerPreview,
      notesPreview,
      optionPreviews,
      remarkPreview,
      updateTitlePreview,
      updateAnswerPreview,
      updateNotesPreview,
      updateOptionPreviews,
      updateRemarkPreview,
      renderMathPreview,
      renderOptionPreview,
      renderUpdateOptionPreview,

      // 新增预览功能相关
      showPreviewModal,
      previewMode,
      showPreview,
      showUpdatePreview,
      closePreview,
      confirmSubmit,
      getPreviewSchoolName,
      getPreviewGradeName,
      getPreviewSubjectName,
      getPreviewQuestionCategoryName,
      getPreviewDifficultyLevel,
      getPreviewMarkingType,
      getPreviewKnowledgePointName,
      getPreviewSubKnowledgePoints,
      getPreviewSolutionIdeas,
      getPreviewTitle,
      getPreviewImageUrl,
      getPreviewOptions,
      showPreviewOptions,
      isPreviewOptionCorrect,
      showPreviewSubjectiveAnswer,
      getPreviewAnswer,
      getPreviewNotes,
      getPreviewRemark,
      renderMath,

      // 分页相关
      totalPages,
      totalItems,
      pageInput,
      changePage,
      goToPage,
      goToFirstPage,
      goToLastPage,

      // 新增删除实体相关
      showDeleteEntityConfirm,
      deleteEntityType,
      deleteEntityData,
      dependentQuestions,
      dependentQuestionsPageNum,
      dependentQuestionsPageSize,
      dependentQuestionsTotalPages,
      dependentQuestionsTotalItems,
      dependentQuestionsPageInput,
      confirmDeleteKnowledgePoint,
      confirmDeleteSubKnowledgePoint,
      confirmDeleteSolutionIdea,
      confirmDeleteQuestionCategory,
      loadDependentQuestions,
      changeDependentPage,
      goToDependentFirstPage,
      goToDependentLastPage,
      goToDependentPage,
      deleteDependentQuestion,
      deleteAllDependentQuestions,
      deleteEntity,
      cancelDeleteEntity,
    };
  },
};
</script>

<style scoped>
/* ==================== 全局容器样式 ==================== */
/* 主容器样式 */
.container {
  max-width: 1800px; /* 最大宽度，适应大屏幕 */
  margin: auto; /* 水平居中 */
  padding: 20px; /* 内边距 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; /* 字体栈，优先使用系统字体 */
}

/* ==================== 模式选择器样式 ==================== */
.mode-select {
  margin-bottom: 30px; /* 底部外边距 */
  display: flex; /* 弹性布局 */
  gap: 10px; /* 子元素间距 */
}

.mode-select button {
  padding: 10px 20px; /* 内边距 */
  border: 2px solid #409eff; /* 边框颜色使用主题蓝色 */
  background: white; /* 背景色 */
  color: #409eff; /* 文字颜色 */
  border-radius: 6px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 14px; /* 字体大小 */
  transition: all 0.3s; /* 过渡动画 */
}

/* 激活状态的按钮样式 */
.mode-select button.active {
  background-color: #409eff; /* 主题蓝色背景 */
  color: white; /* 白色文字 */
}

/* 非激活状态按钮的悬停效果 */
.mode-select button:hover:not(.active) {
  background-color: #ecf5ff; /* 浅蓝色背景 */
}

/* ==================== 表单区域样式 ==================== */
.form-section,
.update-section {
  background: white; /* 白色背景 */
  padding: 30px; /* 内边距 */
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); /* 阴影效果 */
}

/* 标题样式 */
.form-section h2,
.update-section h2 {
  margin-bottom: 25px; /* 底部外边距 */
  color: #303133; /* 深灰色文字 */
  font-size: 20px; /* 字体大小 */
  border-bottom: 1px solid #e4e7ed; /* 底部边框 */
  padding-bottom: 10px; /* 底部内边距 */
}

/* ==================== 搜索条件区域样式 ==================== */
.search-criteria {
  margin-bottom: 30px; /* 底部外边距 */
}

.criteria-row {
  display: flex; /* 弹性布局 */
  flex-wrap: wrap; /* 允许换行 */
  gap: 15px; /* 子元素间距 */
  align-items: flex-end; /* 底部对齐 */
}

.criteria-item {
  flex: 1; /* 弹性填充 */
  min-width: 300px; /* 最小宽度 */
}

.criteria-item label {
  display: block; /* 块级显示 */
  margin-bottom: 5px; /* 底部外边距 */
  font-size: 14px; /* 字体大小 */
  color: #606266; /* 中灰色文字 */
  font-weight: 500; /* 中等字重 */
}

.search-btn {
  min-width: 80px; /* 搜索按钮最小宽度 */
}

/* ==================== 搜索结果区域样式 ==================== */
.search-results {
  margin-top: 30px; /* 顶部外边距 */
}

.search-results h3 {
  margin-bottom: 15px; /* 底部外边距 */
  color: #303133; /* 深灰色文字 */
}

.results-table-container {
  overflow-x: auto; /* 水平滚动 */
  border: 1px solid #e4e7ed; /* 边框 */
  border-radius: 4px; /* 圆角 */
}

.results-table {
  min-width: 1600px; /* 最小宽度，确保表格内容完整显示 */
  width: 100%; /* 宽度100% */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直方向 */
}

/* 表格行样式 */
.table-header,
.table-row {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: flex-start; /* 水平居中 */
}

.table-header {
  background-color: #d6f0ff; /* 浅蓝色表头背景 */
  font-weight: 600; /* 粗体字重 */
}

.table-cell {
  /* align-items: center; /* 垂直居中 
  justify-content: center; 水平居中  （之前无备注列时dispaly使用flex时使用此两行） */
  padding: 12px 8px; /* 内边距 */
  font-size: 14px; /* 字体大小 */
  color: #606266; /* 文字颜色 */
  box-sizing: border-box; /* 盒模型 */
  text-align: center; /* 文字居中 */
  word-break: break-word; /* 单词换行 */
}

.table-header .table-cell {
  font-weight: 600; /* 粗体 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}

.table-row {
  border-bottom: 1px solid #e4e7ed; /* 底部边框 */
}

.table-row:last-child {
  border-bottom: none; /* 最后一行无底部边框 */
}

/* 表格行悬停效果 */
.table-row:hover {
  background-color: #f5f7fa; /* 浅灰色背景 */
}

/* 子知识点单元格样式 */
.sub-knowledge-cell {
  display: flex; /* 弹性布局 */
  flex-wrap: wrap; /* 允许换行 */
  gap: 4px; /* 子元素间距 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}

/* 子知识点标签样式 */
.sub-knowledge-tag {
  background: #ecf5ff; /* 浅蓝色背景 */
  color: #409eff; /* 主题蓝色文字 */
  padding: 2px 6px; /* 内边距 */
  border-radius: 3px; /* 小圆角 */
  font-size: 11px; /* 小字体 */
  border: 1px solid #d9ecff; /* 边框 */
  white-space: nowrap; /* 不换行 */
  margin: 2px; /* 外边距 */
  display: inline-block; /* 行内块显示 */
}

/* 无子知识点提示样式 （问题定义，解题思想，问题类别也同样适用此标签）*/
.no-sub-knowledge {
  color: #c0c4cc; /* 浅灰色文字 */
  font-style: italic; /* 斜体 */
}

/* 题目内容单元格样式 */
.title-cell {
  word-break: break-word; /* 单词换行 */
  line-height: 1.4; /* 行高 */
  text-align: left; /* 左对齐 */
}

.image-cell {
  text-align: center; /* 居中对齐 */
}

/* 缩略图样式 */
.thumbnail-image {
  width: 60px; /* 固定宽度 */
  height: 45px; /* 固定高度 */
  object-fit: cover; /* 图片填充方式 */
  border: 1px solid #e4e7ed; /* 边框 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  transition: transform 0.2s; /* 变换过渡 */
}

/* 缩略图悬停效果 */
.thumbnail-image:hover {
  transform: scale(1.1); /* 放大效果 */
}

.no-image {
  color: #c0c4cc; /* 浅灰色文字 */
  font-style: italic; /* 斜体 */
}

/* 操作按钮单元格样式 */
.actions-cell {
  display: flex; /* 弹性布局 */
  gap: 8px; /* 按钮间距 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100%; /* 高度100% */
  min-height: 60px; /* 最小高度 */
}

/* 更新按钮样式 */
.btn-update {
  background-color: #409eff; /* 主题蓝色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 8px 16px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 14px; /* 字体大小 */
  white-space: nowrap; /* 不换行 */
  transition: background-color 0.3s; /* 背景色过渡 */
}

.btn-update:hover {
  background-color: #66b1ff; /* 悬停时更亮的蓝色 */
}

/* 删除按钮样式 */
.btn-delete {
  background-color: #f56c6c; /* 红色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 8px 16px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 14px; /* 字体大小 */
  white-space: nowrap; /* 不换行 */
  transition: background-color 0.3s; /* 背景色过渡 */
}

.btn-delete:hover {
  background-color: #f78989; /* 悬停时更亮的红色 */
}
/* ==================== 分页控件样式 ==================== */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
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
  margin-top: 30px; /* 顶部外边距 */
  padding-top: 20px; /* 顶部内边距 */
  border-top: 1px solid #e4e7ed; /* 顶部边框 */
}

.update-form-section h3 {
  margin-bottom: 20px; /* 底部外边距 */
  color: #303133; /* 深灰色文字 */
}

.update-form {
  display: grid; /* 网格布局 */
  grid-template-columns: repeat(2, 1fr); /* 两列等宽 */
  gap: 20px; /* 网格间距 */
}

/* 跨列的表单组 */
.update-form .form-group:nth-child(7),
.update-form .form-group:nth-child(8),
.update-form .form-group:nth-child(9) {
  grid-column: 1 / -1; /* 跨所有列 */
}

/* ==================== 模态框样式 ==================== */
.modal-overlay {
  position: fixed; /* 固定定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  display: flex; /* 弹性布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  z-index: 1000; /* 高z-index确保在最上层 */
}

.modal-content {
  background: white; /* 白色背景 */
  padding: 40px; /* 内边距 */
  border-radius: 12px; /* 大圆角 */
  max-width: 500px; /* 最大宽度 */
  width: 90%; /* 宽度90% */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* 阴影效果 */
  text-align: center; /* 文字居中 */
  transform: scale(1.05); /* 轻微放大 */
  animation: modalAppear 0.3s ease-out; /* 出现动画 */
}

/* 模态框出现动画 */
@keyframes modalAppear {
  from {
    opacity: 0; /* 完全透明 */
    transform: scale(0.8) translateY(-20px); /* 缩小并上移 */
  }

  to {
    opacity: 1; /* 完全不透明 */
    transform: scale(1.05) translateY(0); /* 正常大小和位置 */
  }
}

.modal-content h3 {
  margin-bottom: 20px; /* 底部外边距 */
  color: #303133; /* 深灰色文字 */
  font-size: 24px; /* 大字体 */
  font-weight: 600; /* 粗体 */
}

.modal-content p {
  margin-bottom: 30px; /* 底部外边距 */
  color: #606266; /* 中灰色文字 */
  font-size: 18px; /* 字体大小 */
  line-height: 1.5; /* 行高 */
}

.modal-actions {
  display: flex; /* 弹性布局 */
  gap: 15px; /* 按钮间距 */
  justify-content: center; /* 水平居中 */
}

.modal-actions button {
  padding: 12px 24px; /* 内边距 */
  font-size: 16px; /* 字体大小 */
  border-radius: 6px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  transition: all 0.3s; /* 过渡动画 */
  min-width: 100px; /* 最小宽度 */
}

/* ==================== 图片预览模态框样式 ==================== */
.image-preview-modal {
  background: white; /* 白色背景 */
  padding: 30px; /* 内边距 */
  border-radius: 12px; /* 大圆角 */
  max-width: 90vw; /* 最大宽度为视口90% */
  max-height: 90vh; /* 最大高度为视口90% */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直方向 */
  align-items: center; /* 水平居中 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* 阴影效果 */
  transform: scale(1.05); /* 轻微放大 */
  animation: modalAppear 0.3s ease-out; /* 出现动画 */
}

.full-size-image {
  max-width: 100%; /* 最大宽度100% */
  max-height: 70vh; /* 最大高度为视口70% */
  object-fit: contain; /* 保持比例填充 */
  margin-bottom: 20px; /* 底部外边距 */
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 阴影效果 */
}

.btn-close {
  background-color: #f56c6c; /* 红色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 12px 24px; /* 内边距 */
  border-radius: 6px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 16px; /* 字体大小 */
  min-width: 100px; /* 最小宽度 */
  transition: background-color 0.3s; /* 背景色过渡 */
}

.btn-close:hover {
  background-color: #f78989; /* 悬停时更亮的红色 */
}

/* ==================== 统一弹窗提示样式 ==================== */
.alert-modal-content {
  background: white; /* 白色背景 */
  padding: 40px; /* 内边距 */
  border-radius: 12px; /* 大圆角 */
  max-width: 500px; /* 最大宽度 */
  width: 90%; /* 宽度90% */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* 阴影效果 */
  text-align: center; /* 文字居中 */
  transform: scale(1.05); /* 轻微放大 */
  animation: modalAppear 0.3s ease-out; /* 出现动画 */
}

.alert-modal-title {
  margin-bottom: 20px; /* 底部外边距 */
  color: #303133; /* 深灰色文字 */
  font-size: 24px; /* 大字体 */
  font-weight: 600; /* 粗体 */
}

.alert-modal-message {
  margin-bottom: 0; /* 无底部外边距 */
  color: #606266; /* 中灰色文字 */
  font-size: 18px; /* 字体大小 */
  line-height: 1.5; /* 行高 */
}

/* ==================== 题目预览模态框样式 ==================== */
.preview-modal-overlay {
  z-index: 2000; /* 更高的z-index确保在最上层 */
}

.preview-modal-content {
  background: white; /* 白色背景 */
  padding: 40px; /* 内边距 */
  border-radius: 12px; /* 大圆角 */
  max-width: 800px; /* 最大宽度 */
  width: 95%; /* 宽度95% */
  max-height: 90vh; /* 最大高度为视口90% */
  overflow-y: auto; /* 垂直滚动 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* 阴影效果 */
  transform: scale(1.05); /* 轻微放大 */
  animation: modalAppear 0.3s ease-out; /* 出现动画 */
}

.preview-modal-title {
  margin-bottom: 25px; /* 底部外边距 */
  color: #303133; /* 深灰色文字 */
  font-size: 24px; /* 大字体 */
  font-weight: 600; /* 粗体 */
  text-align: center; /* 文字居中 */
  border-bottom: 2px solid #409eff; /* 底部边框 */
  padding-bottom: 15px; /* 底部内边距 */
}

.preview-content {
  margin-bottom: 30px; /* 底部外边距 */
}

.preview-section {
  margin-bottom: 20px; /* 底部外边距 */
  padding: 15px; /* 内边距 */
  border: 1px solid #e4e7ed; /* 边框 */
  border-radius: 8px; /* 圆角 */
  background: #fafafa; /* 浅灰色背景 */
}

.preview-section h4 {
  margin-bottom: 15px; /* 底部外边距 */
  color: #409eff; /* 主题蓝色文字 */
  font-size: 18px; /* 字体大小 */
  font-weight: 600; /* 粗体 */
  border-bottom: 1px solid #dcdfe6; /* 底部边框 */
  padding-bottom: 8px; /* 底部内边距 */
}

.preview-grid {
  display: grid; /* 网格布局 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 自适应列 */
  gap: 15px; /* 网格间距 */
}

.preview-item {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直方向 */
}

.preview-item label {
  font-weight: 600; /* 粗体 */
  color: #606266; /* 中灰色文字 */
  margin-bottom: 5px; /* 底部外边距 */
  font-size: 14px; /* 字体大小 */
}

.preview-item span {
  color: #303133; /* 深灰色文字 */
  font-size: 15px; /* 字体大小 */
  line-height: 1.5; /* 行高 */
  word-break: break-word; /* 单词换行 */
}

.preview-text-content {
  background: white; /* 白色背景 */
  padding: 15px; /* 内边距 */
  border-radius: 6px; /* 圆角 */
  border: 1px solid #dcdfe6; /* 边框 */
  line-height: 1.6; /* 行高 */
  color: #303133; /* 深灰色文字 */
}

.preview-image {
  margin-top: 15px; /* 顶部外边距 */
  text-align: center; /* 文字居中 */
  overflow-y: auto; /* 允许垂直滚动 */
}

.preview-img {
  max-width: 100%; /* 最大宽度100% */
  max-height: 4000px; /* 最大高度 */
  height: auto; /* 高度自适应 */
  border-radius: 6px; /* 圆角 */
  border: 1px solid #dcdfe6; /* 边框 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 阴影效果 */
}

.preview-options {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直方向 */
  gap: 12px; /* 选项间距 */
}

.preview-option {
  display: flex; /* 弹性布局 */
  align-items: flex-start; /* 顶部对齐 */
  gap: 10px; /* 子元素间距 */
  padding: 12px; /* 内边距 */
  background: white; /* 白色背景 */
  border: 1px solid #dcdfe6; /* 边框 */
  border-radius: 6px; /* 圆角 */
  transition: all 0.3s; /* 过渡动画 */
}

.preview-option.correct-answer {
  background: #f0f9ff; /* 浅蓝色背景 */
  border-color: #409eff; /* 主题蓝色边框 */
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2); /* 蓝色阴影 */
}

.option-label {
  font-weight: 600; /* 粗体 */
  color: #409eff; /* 主题蓝色 */
  min-width: 30px; /* 最小宽度 */
}

.option-text {
  flex: 1; /* 弹性填充 */
  color: #303133; /* 深灰色文字 */
  line-height: 1.5; /* 行高 */
}

.correct-badge {
  background: #67c23a; /* 绿色背景 */
  color: white; /* 白色文字 */
  padding: 4px 8px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  font-size: 12px; /* 小字体 */
  font-weight: 600; /* 粗体 */
}

.preview-actions {
  display: flex; /* 弹性布局 */
  gap: 15px; /* 按钮间距 */
  justify-content: center; /* 水平居中 */
  margin-top: 25px; /* 顶部外边距 */
  padding-top: 20px; /* 顶部内边距 */
  border-top: 1px solid #e4e7ed; /* 顶部边框 */
}

.preview-actions button {
  padding: 12px 24px; /* 内边距 */
  font-size: 16px; /* 字体大小 */
  border-radius: 6px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  transition: all 0.3s; /* 过渡动画 */
  min-width: 120px; /* 最小宽度 */
}

/* ==================== 新增删除实体确认对话框样式 ==================== */
.delete-entity-modal {
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.dependent-questions {
  margin: 20px 0;
  text-align: left;
}

.dependent-questions h4 {
  color: #f56c6c;
  margin-bottom: 10px;
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
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* ==================== 表单组件样式 ==================== */
.form-group {
  margin-bottom: 20px; /* 底部外边距 */
}

.form-label {
  display: block; /* 块级显示 */
  margin-bottom: 8px; /* 底部外边距 */
  font-weight: 700; /* 粗体 */
  color: black; /* 黑色文字 */
}

/* 必填字段标记 */
.form-label.required::after {
  content: " *"; /* 星号内容 */
  color: #f56c6c; /* 红色 */
}

/* 表单控件通用样式 */
.form-select,
.form-input,
.form-textarea {
  width: 100%; /* 宽度100% */
  padding: 10px 12px; /* 内边距 */
  border: 1px solid #dcdfe6; /* 边框 */
  border-radius: 4px; /* 圆角 */
  font-size: 14px; /* 字体大小 */
  transition: border-color 0.3s; /* 边框颜色过渡 */
  box-sizing: border-box; /* 盒模型 */
}

/* 表单控件焦点状态 */
.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none; /* 去除默认轮廓 */
  border-color: #409eff; /* 主题蓝色边框 */
}

/* 下拉选择框特定样式 */
.form-select {
  background-color: white; /* 白色背景 */
  border: 2px solid #e4e7ed; /* 边框 */
  border-radius: 6px; /* 圆角 */
  padding: 10px; /* 内边距 */
  font-size: 16px; /* 字体大小 */
  cursor: pointer; /* 鼠标手型 */
  transition: all 0.3s ease; /* 过渡动画 */
}

.form-select:hover {
  border-color: #409eff; /* 悬停时主题蓝色边框 */
  background-color: #f5f7fa; /* 浅灰色背景 */
}

.form-select:focus {
  border-color: #409eff; /* 焦点时主题蓝色边框 */
  background-color: #fff; /* 白色背景 */
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); /* 蓝色发光效果 */
}

/* 错误状态的下拉框 */
.form-select.error {
  border-color: #f56c6c; /* 红色边框 */
  background-color: #fef0f0; /* 浅红色背景 */
}

.form-select.error:focus {
  border-color: #f56c6c; /* 红色边框 */
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2); /* 红色发光效果 */
}

/* 错误消息样式 */
.error-message {
  color: #f56c6c; /* 红色文字 */
  font-size: 12px; /* 小字体 */
  margin-top: 4px; /* 顶部外边距 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
}

.error-message::before {
  content: "⚠ "; /* 警告图标 */
  margin-right: 4px; /* 右侧间距 */
}

.form-textarea {
  resize: vertical; /* 允许垂直调整大小 */
  min-height: 80px; /* 最小高度 */
}

/* ==================== 可搜索选择框样式 ==================== */
.searchable-select {
  position: relative; /* 相对定位，为下拉列表提供定位上下文 */
}

.dropdown-list {
  position: absolute; /* 绝对定位 */
  top: 100%; /* 位于父元素底部 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  background: #ffffff; /* 白色背景 */
  border: 1px solid #dcdfe6; /* 边框 */
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  max-height: 250px; /* 最大高度 */
  overflow-y: auto; /* 垂直滚动 */
  z-index: 1000; /* 高z-index确保在最上层 */
  font-size: 14px; /* 字体大小 */
}

.dropdown-item {
  padding: 10px 12px; /* 内边距 */
  cursor: pointer; /* 鼠标手型 */
  transition: all 0.2s ease; /* 过渡动画 */
  border-bottom: 1px solid #f0f0f0; /* 底部边框 */
  background-color: white; /* 白色背景 */
  color: #303133; /* 文字颜色 */
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
}

.dropdown-item:hover {
  background-color: #409eff; /* 悬停时主题蓝色背景 */
  color: white; /* 白色文字 */
}

.dropdown-item:last-child {
  border-bottom: none; /* 最后一项无底部边框 */
}

.selected-mark {
  color: #409eff; /* 主题蓝色 */
  font-weight: bold; /* 粗体 */
}

.search-input {
  margin-bottom: 0; /* 无底部外边距 */
  border-radius: 4px; /* 圆角 */
}

/* ==================== 新增删除按钮样式 ==================== */
.btn-remove-small {
  background-color: #f56c6c; /* 红色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 2px 6px; /* 小内边距 */
  border-radius: 3px; /* 小圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 12px; /* 小字体 */
  transition: background-color 0.3s; /* 背景色过渡 */
  margin-left: 8px; /* 左侧间距 */
}

.btn-remove-small:hover {
  background-color: #f78989; /* 悬停时更亮的红色 */
}

/* ==================== 选中项显示样式 ==================== */
.selected-item {
  margin-top: 8px; /* 顶部外边距 */
  padding: 8px 12px; /* 内边距 */
  background: #f0f9ff; /* 浅蓝色背景 */
  border: 1px solid #bae7ff; /* 边框 */
  border-radius: 4px; /* 圆角 */
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  font-size: 14px; /* 字体大小 */
}

.selected-items {
  margin-top: 8px; /* 顶部外边距 */
  display: flex; /* 弹性布局 */
  flex-wrap: wrap; /* 允许换行 */
  gap: 8px; /* 子元素间距 */
  align-items: center; /* 垂直居中 */
}

.selected-tag {
  background: #ecf5ff; /* 浅蓝色背景 */
  color: #409eff; /* 主题蓝色文字 */
  padding: 4px 8px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  font-size: 12px; /* 小字体 */
  border: 1px solid #d9ecff; /* 边框 */
  cursor: pointer; /* 鼠标手型 */
  transition: background-color 0.3s; /* 背景色过渡 */
}

.selected-tag:hover {
  background-color: #d9ecff; /* 悬停时更深的蓝色背景 */
}

.selected-tags-label {
  font-size: 13px; /* 字体大小 */
  color: #909399; /* 浅灰色文字 */
}

/* ==================== 无结果提示样式 ==================== */
.no-results {
  text-align: center; /* 文字居中 */
  padding: 40px; /* 内边距 */
  color: #909399; /* 浅灰色文字 */
  font-size: 16px; /* 字体大小 */
  background: #fafafa; /* 浅灰色背景 */
  border-radius: 4px; /* 圆角 */
  margin-top: 20px; /* 顶部外边距 */
}

.no-results p {
  margin: 0; /* 无外边距 */
}

/* 多选下拉框样式 */
.searchable-select .form-select[multiple] {
  height: 80px; /* 固定高度 */
  padding: 5px; /* 内边距 */
}

.searchable-select .form-select[multiple] option {
  padding: 5px 8px; /* 选项内边距 */
}

/* ==================== 新建知识点输入区域样式 ==================== */
.new-knowledge-input {
  display: flex; /* 弹性布局 */
  gap: 10px; /* 子元素间距 */
  margin-top: 10px; /* 顶部外边距 */
}

.new-knowledge-input .form-input {
  flex: 1; /* 弹性填充 */
}

/* ==================== 按钮样式系统 ==================== */
/* 主要按钮样式 */
.btn-primary {
  background-color: #409eff; /* 主题蓝色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 10px 20px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 14px; /* 字体大小 */
  transition: background-color 0.3s; /* 背景色过渡 */
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff; /* 悬停时更亮的蓝色 */
}

.btn-primary:disabled {
  background-color: #a0cfff; /* 禁用时浅蓝色 */
  cursor: not-allowed; /* 禁用光标 */
}

/* 次要按钮样式 */
.btn-secondary {
  background-color: #f4f4f5; /* 浅灰色背景 */
  color: #606266; /* 中灰色文字 */
  border: 1px solid #d3d4d6; /* 边框 */
  padding: 8px 16px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 13px; /* 字体大小 */
  transition: all 0.3s; /* 过渡动画 */
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e9e9eb; /* 悬停时更深的灰色 */
}

.btn-secondary:disabled {
  opacity: 0.6; /* 半透明 */
  cursor: not-allowed; /* 禁用光标 */
}

/* 高亮按钮样式（用于新建等操作） */
.btn-highlight {
  background-color: #67c23a; /* 绿色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 8px 16px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 13px; /* 字体大小 */
  transition: all 0.3s; /* 过渡动画 */
  font-weight: 500; /* 中等字重 */
}

.btn-highlight:hover:not(:disabled) {
  background-color: #85ce61; /* 悬停时更亮的绿色 */
  transform: translateY(-1px); /* 上移效果 */
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3); /* 阴影效果 */
}

.btn-highlight:disabled {
  opacity: 0.6; /* 半透明 */
  cursor: not-allowed; /* 禁用光标 */
  transform: none; /* 无变换 */
  box-shadow: none; /* 无阴影 */
}

/* 移除按钮样式 */
.btn-remove {
  background-color: #f56c6c; /* 红色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 6px 12px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 12px; /* 小字体 */
}

.btn-remove:hover {
  background-color: #f78989; /* 悬停时更亮的红色 */
}

/* ==================== 图片上传区域样式 ==================== */
.image-upload-section {
  margin-top: 15px; /* 顶部外边距 */
}

.upload-controls {
  display: flex; /* 弹性布局 */
  gap: 10px; /* 子元素间距 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 10px; /* 底部外边距 */
}

.file-input {
  display: none; /* 隐藏文件输入 */
}

.image-preview {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 15px; /* 子元素间距 */
  margin-top: 10px; /* 顶部外边距 */
}

.preview-image {
  max-width: 200px; /* 最大宽度 */
  max-height: 150px; /* 最大高度 */
  border: 1px solid #e4e7ed; /* 边框 */
  border-radius: 4px; /* 圆角 */
}

/* ==================== 选项列表样式 ==================== */
.options-list {
  margin-bottom: 15px; /* 底部外边距 */
}

.option-item {
  display: flex; /* 弹性布局 */
  align-items: flex-start; /* 顶部对齐 */
  gap: 10px; /* 子元素间距 */
  margin-bottom: 15px; /* 底部外边距 */
  padding: 10px; /* 内边距 */
  background: #fafafa; /* 浅灰色背景 */
  border-radius: 4px; /* 圆角 */
}

.option-label {
  font-weight: 500; /* 中等字重 */
  min-width: 30px; /* 最小宽度 */
  color: #409eff; /* 主题蓝色 */
  margin-top: 8px; /* 顶部外边距 */
}

.option-input-container {
  flex: 1; /* 弹性填充 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直方向 */
}

.option-input {
  margin-bottom: 4px; /* 底部外边距 */
}

.option-actions {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 10px; /* 子元素间距 */
  margin-top: 8px; /* 顶部外边距 */
}

.radio-input,
.checkbox-input {
  margin: 0; /* 无外边距 */
}

.radio-label,
.checkbox-label {
  font-size: 13px; /* 小字体 */
  color: #606266; /* 中灰色文字 */
  white-space: nowrap; /* 不换行 */
}

/* ==================== 表单操作区域样式 ==================== */
.form-actions {
  display: flex; /* 弹性布局 */
  gap: 15px; /* 子元素间距 */
  margin-top: 30px; /* 顶部外边距 */
  padding-top: 20px; /* 顶部内边距 */
  border-top: 1px solid #e4e7ed; /* 顶部边框 */
  grid-column: 1 / -1; /* 网格布局中跨所有列 */
}

.submit-btn {
  flex: 1; /* 弹性填充 */
}

/* ==================== 数学公式预览样式 ==================== */
.math-preview {
  border: 1px solid #e4e7ed; /* 边框 */
  border-radius: 4px; /* 圆角 */
  padding: 10px; /* 内边距 */
  margin-top: 8px; /* 顶部外边距 */
  background: #f8f9fa; /* 浅灰色背景 */
  min-height: 40px; /* 最小高度 */
  line-height: 1.5; /* 行高 */
}

.math-preview.small {
  min-height: 30px; /* 较小高度 */
  padding: 6px 8px; /* 较小内边距 */
  font-size: 13px; /* 较小字体 */
}

.math-error {
  color: #f56c6c; /* 红色文字 */
  background: #fef0f0; /* 浅红色背景 */
  padding: 2px 4px; /* 内边距 */
  border-radius: 2px; /* 小圆角 */
  border: 1px solid #fbc4c4; /* 红色边框 */
}

/* ==================== KaTeX 公式样式 ==================== */
/* 深度选择器，确保样式能应用到子组件中的KaTeX元素 */
:deep(.katex) {
  font-size: 1.1em; /* 稍大的字体 */
}

:deep(.katex-display) {
  margin: 0.5em 0; /* 外边距 */
  overflow-x: auto; /* 水平滚动 */
  overflow-y: hidden; /* 垂直隐藏 */
}

/* ==================== 表格列宽设置 ==================== */
/* 按顺序为每个表格列设置固定宽度 */
.table-cell:nth-child(1) {
  width: 40px; /* ID列 */
}

.table-cell:nth-child(2) {
  width: 140px; /* 学校列 */
}

.table-cell:nth-child(3) {
  width: 80px; /* 年级列 */
}

.table-cell:nth-child(4) {
  width: 50px; /* 科目列 */
}

.table-cell:nth-child(5) {
  width: 120px; /* 问题类别列 */
}

.table-cell:nth-child(6) {
  width: 90px; /* 评分方法列 */
}

.table-cell:nth-child(7) {
  width: 120px; /* 知识点列 */
}

.table-cell:nth-child(8) {
  width: 120px; /* 解题思想列 */
}

.table-cell:nth-child(9) {
  width: 120px; /* 子知识点列 */
}

.table-cell:nth-child(10) {
  width: 60px; /* 难度列 */
}

.table-cell:nth-child(11) {
  width: 250px; /* 题目内容列 */
}

.table-cell:nth-child(12) {
  width: 150px; /* 备注列 */
}

.table-cell:nth-child(13) {
  width: 120px; /* 图片列 */
}

.table-cell:nth-child(14) {
  width: 150px; /* 操作列 */
}

/* 表格行边框 */
.table-row {
  border-bottom: 1px solid #e4e7ed; /* 底部边框 */
}

.table-header {
  border-bottom: 2px solid #e4e7ed; /* 更粗的底部边框 */
}

.table-row:last-child {
  border-bottom: none; /* 最后一行无边框 */
}

.actions-cell {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  height: 100%; /* 高度100% */
  min-height: 60px; /* 最小高度 */
}

.sub-knowledge-tag {
  margin: 2px; /* 外边距 */
}

/* ==================== 退出登录按钮样式 ==================== */
.logout-btn {
  background-color: #f56c6c; /* 红色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 10px 20px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  cursor: pointer; /* 鼠标手型 */
  font-size: 14px; /* 字体大小 */
  transition: background-color 0.3s; /* 背景色过渡 */
  float: right; /* 右浮动 */
}

.logout-btn:hover {
  background-color: red; /* 悬停时更红的红色 */
  transform: translateY(-1px); /* 上移效果 */
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3); /* 阴影效果 */
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  /* 在小屏幕上将选项项改为垂直布局 */
  .option-item {
    flex-direction: column; /* 垂直方向 */
    align-items: stretch; /* 拉伸对齐 */
  }

  .option-actions {
    justify-content: flex-start; /* 左对齐 */
    margin-top: 10px; /* 顶部外边距 */
  }

  /* 预览模态框在小屏幕上的适配 */
  .preview-modal-content {
    padding: 20px; /* 较小的内边距 */
    margin: 10px; /* 较小的外边距 */
  }

  .preview-grid {
    grid-template-columns: 1fr; /* 单列布局 */
  }

  .preview-actions {
    flex-direction: column; /* 垂直方向 */
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
}
</style>
