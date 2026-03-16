<template>
  <div class="container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">班级管理</h1>
      </div>
    </div>

    <!-- ==================== 教室管理 ==================== -->
    <div v-if="hasAnyPermission" class="card">
      <div class="section-header">
        <h2 class="section-title">教室管理</h2>
        <button class="btn-primary" @click="showClassroomForm = true">＋新建教室</button>
      </div>

      <!-- 教室列表加载动画 -->
      <div v-if="classroomLoading" class="loading-container">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">正在加载教室列表...</p>
        </div>
      </div>

      <!-- 教室列表内容 -->
      <div v-else-if="classroomList.length">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>教室名称</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in classroomList" :key="room.id">
                <td>{{ room.id }}</td>
                <td>
                  <div v-if="editingClassroom?.id === room.id" class="edit-input">
                    <input v-model="editingClassroom.name" class="form-input small" />
                  </div>
                  <span v-else>{{ room.name }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <template v-if="editingClassroom?.id === room.id">
                      <button class="action-btn save" @click="saveClassroomEdit">保存</button>
                      <button class="action-btn cancel" @click="cancelClassroomEdit">取消</button>
                    </template>
                    <template v-else>
                      <button class="action-btn edit" @click="startClassroomEdit(room)">编辑</button>
                      <button class="action-btn delete" @click="deleteClassroom(room.id)">删除</button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 教室列表空状态 -->
      <div v-else class="empty-tip">
        <p>暂无教室数据</p>
      </div>
    </div>

    <!-- ==================== 班级管理 ==================== -->
    <div v-if="hasAnyPermission" class="card">
      <div class="section-header">
        <h2 class="section-title">班级管理</h2>
        <button class="btn-primary" @click="showClassForm = true">＋新建班级</button>
      </div>

      <!-- 班级列表加载动画 -->
      <div v-if="classLoading" class="loading-container">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">正在加载班级列表...</p>
        </div>
      </div>

      <!-- 班级列表内容 -->
      <div v-else-if="classList.length">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>班级名称</th>
                <th>教室</th>
                <th>学生数</th>
                <th>教师数</th>
                <th>课程数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cls in classList" :key="cls.id">
                <td>{{ cls.id }}</td>
                <td>
                  <div v-if="editingClass?.id === cls.id" class="edit-input">
                    <input v-model="editingClass.class_name" class="form-input small" />
                  </div>
                  <span v-else>{{ cls.class_name }}</span>
                </td>
                <td>
                  <div v-if="editingClass?.id === cls.id" class="edit-input">
                    <select v-model="editingClass.classroom_id" class="form-select small">
                      <option value="">请选择教室</option>
                      <option v-for="room in classroomList" :key="room.id" :value="room.id">
                        {{ room.name }}
                      </option>
                    </select>
                  </div>
                  <span v-else>{{ getClassroomName(cls.classroom_id) }}</span>
                </td>
                <td>
                  <button class="link-btn" @click="showStudentList(cls)">
                    {{ getStudentCount(cls.id) }}
                  </button>
                </td>
                <td>
                  <button class="link-btn" @click="showTeacherList(cls)">
                    {{ getTeacherCount(cls.id) }}
                  </button>
                </td>
                <td>
                  <button class="link-btn" @click="showCourseList(cls)">
                    {{ getCourseCount(cls.id) }}
                  </button>
                </td>
                <td>
                  <div class="action-buttons">
                    <template v-if="editingClass?.id === cls.id">
                      <button class="action-btn save" @click="saveClassEdit">保存</button>
                      <button class="action-btn cancel" @click="cancelClassEdit">取消</button>
                    </template>
                    <template v-else>
                      <button class="action-btn edit" @click="startClassEdit(cls)">编辑</button>
                      <button class="action-btn delete" @click="deleteClass(cls.id)">删除</button>
                      <button class="action-btn info" @click="showClassDetail(cls)">详情</button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 班级列表空状态 -->
      <div v-else class="empty-tip">
        <p>暂无班级数据</p>
      </div>
    </div>

    <!-- ==================== 新建教室表单 ==================== -->
    <div v-if="showClassroomForm" class="card">
      <h2 class="section-title">新建教室</h2>
      <form class="criteria-grid" @submit.prevent="submitClassroom">
        <div class="criteria-item">
          <label class="criteria-label">教室名称</label>
          <input v-model="classroomForm.name" class="form-input" required />
        </div>
        <div class="criteria-item full-width form-actions">
          <button type="button" class="btn-cancel" @click="closeClassroomForm">取消</button>
          <button class="btn-primary" :disabled="classroomSubmitting">
            {{ classroomSubmitting ? "提交中..." : "创建教室" }}
          </button>
        </div>
      </form>
    </div>

    <!-- ==================== 新建班级表单 ==================== -->
    <div v-if="showClassForm" class="card">
      <h2 class="section-title">新建班级</h2>
      <form class="criteria-grid" @submit.prevent="submitClass">
        <div class="criteria-item">
          <label class="criteria-label">班级名称</label>
          <input v-model="classForm.class_name" class="form-input" required />
        </div>
        <div class="criteria-item">
          <label class="criteria-label">选择教室</label>
          <div class="select-wrapper">
            <select v-model="classForm.classroom_id" class="form-select" required>
              <option value="">请选择教室</option>
              <option v-for="room in classroomList" :key="room.id" :value="room.id">
                {{ room.name }}
              </option>
            </select>
            <span class="select-arrow">▾</span>
          </div>
        </div>
        <div class="criteria-item full-width form-actions">
          <button type="button" class="btn-cancel" @click="closeClassForm">取消</button>
          <button class="btn-primary" :disabled="classSubmitting">
            {{ classSubmitting ? "提交中..." : "创建班级" }}
          </button>
        </div>
      </form>
    </div>

    <!-- ==================== 班级详情弹窗 ==================== -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h2 class="modal-title">班级详情 - {{ selectedClass?.class_name }}</h2>
          <button class="modal-close" @click="closeDetailModal">×</button>
        </div>
        
        <div class="modal-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'students' }"
            @click="switchTab('students')"
          >
            学生管理
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'teachers' }"
            @click="switchTab('teachers')"
          >
            教师管理
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'courses' }"
            @click="switchTab('courses')"
          >
            课程管理
          </button>
        </div>

        <!-- ========== 学生管理 ========== -->
        <div v-if="activeTab === 'students'" class="tab-content">
          <div class="tab-header">
            <h3>学生列表</h3>
            <button class="btn-primary small" @click="showAddStudentModal = true">
              ＋添加学生
            </button>
          </div>

          <!-- 学生列表 -->
          <div v-if="studentListLoading" class="loading-container small">
            <div class="loading-content">
              <div class="loading-spinner small">
                <div class="spinner"></div>
              </div>
              <p class="loading-text">加载中...</p>
            </div>
          </div>

          <div v-else-if="studentList.length" class="table-wrapper">
            <table class="data-table compact">
              <thead>
                <tr>
                  <th>账号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>手机号</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stu in studentList" :key="stu.id">
                  <td>{{ stu.account }}</td>
                  <td>{{ stu.name || '-' }}</td>
                  <td>{{ formatGender(stu.gender) }}</td>
                  <td>{{ stu.phone || '-' }}</td>
                  <td>
                    <button class="action-btn delete small" @click="removeStudent(stu.account)">
                      移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-tip small">
            <p>暂无学生</p>
          </div>
        </div>

        <!-- ========== 教师管理 ========== -->
        <div v-if="activeTab === 'teachers'" class="tab-content">
          <div class="tab-header">
            <h3>教师列表</h3>
            <button class="btn-primary small" @click="showAddTeacherModal = true">
              ＋添加教师
            </button>
          </div>

          <!-- 教师列表 -->
          <div v-if="teacherListLoading" class="loading-container small">
            <div class="loading-content">
              <div class="loading-spinner small">
                <div class="spinner"></div>
              </div>
              <p class="loading-text">加载中...</p>
            </div>
          </div>

          <div v-else-if="teacherList.length" class="table-wrapper">
            <table class="data-table compact">
              <thead>
                <tr>
                  <th>账号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>手机号</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in teacherList" :key="teacher.id">
                  <td>{{ teacher.account }}</td>
                  <td>{{ teacher.name || '-' }}</td>
                  <td>{{ formatGender(teacher.gender) }}</td>
                  <td>{{ teacher.phone || '-' }}</td>
                  <td>
                    <button class="action-btn delete small" @click="removeTeacher(teacher.account)">
                      移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-tip small">
            <p>暂无教师</p>
          </div>
        </div>

        <!-- ========== 课程管理 ========== -->
        <div v-if="activeTab === 'courses'" class="tab-content">
          <div class="tab-header">
            <h3>课程列表</h3>
            <button class="btn-primary small" @click="showAddCourseModal = true">
              ＋添加课程
            </button>
          </div>

          <!-- 课程列表 -->
          <div v-if="courseListLoading" class="loading-container small">
            <div class="loading-content">
              <div class="loading-spinner small">
                <div class="spinner"></div>
              </div>
              <p class="loading-text">加载中...</p>
            </div>
          </div>

          <div v-else-if="courseList.length" class="table-wrapper">
            <table class="data-table compact">
              <thead>
                <tr>
                  <th>课程名称</th>
                  <th>开始时间</th>
                  <th>结束时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in courseList" :key="course.id">
                  <td>
                    <div v-if="editingCourse?.id === course.id" class="edit-input">
                      <input v-model="editingCourse.name" class="form-input small" />
                    </div>
                    <span v-else>{{ course.name }}</span>
                  </td>
                  <td>
                    <div v-if="editingCourse?.id === course.id" class="edit-input">
                      <input v-model="editingCourse.start_time" type="time" class="form-input small" />
                    </div>
                    <span v-else>{{ course.start_time?.substring(0, 5) }}</span>
                  </td>
                  <td>
                    <div v-if="editingCourse?.id === course.id" class="edit-input">
                      <input v-model="editingCourse.end_time" type="time" class="form-input small" />
                    </div>
                    <span v-else>{{ course.end_time?.substring(0, 5) }}</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <template v-if="editingCourse?.id === course.id">
                        <button class="action-btn save small" @click="saveCourseEdit">保存</button>
                        <button class="action-btn cancel small" @click="cancelCourseEdit">取消</button>
                      </template>
                      <template v-else>
                        <button class="action-btn edit small" @click="startCourseEdit(course)">编辑</button>
                        <button class="action-btn delete small" @click="deleteCourse(course.id)">删除</button>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-tip small">
            <p>暂无课程</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 添加学生弹窗（下拉选择版） ==================== -->
    <div v-if="showAddStudentModal" class="modal-overlay" @click.self="showAddStudentModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">添加学生</h3>
          <button class="modal-close" @click="showAddStudentModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="criteria-label">搜索学生</label>
            <input 
              v-model="studentSearchKeyword" 
              type="text" 
              class="form-input" 
              placeholder="输入账号关键词搜索..."
              @input="filterStudentList"
            />
          </div>
          <div class="form-group">
            <label class="criteria-label">选择学生（可多选）</label>
            <div v-if="studentListAllLoading" class="loading-container small">
              <div class="loading-content">
                <div class="loading-spinner small">
                  <div class="spinner"></div>
                </div>
                <p class="loading-text">加载学生列表...</p>
              </div>
            </div>
            <div v-else-if="filteredStudentList.length" class="checkbox-group">
              <div 
                v-for="stu in filteredStudentList" 
                :key="stu.id" 
                class="checkbox-item"
              >
                <label>
                  <input 
                    type="checkbox" 
                    :value="stu.account"
                    v-model="selectedStudents"
                  />
                  {{ stu.account }}
                </label>
              </div>
            </div>
            <div v-else class="empty-tip small">
              <p>暂无学生数据</p>
            </div>
          </div>
          <div class="form-group" v-if="selectedStudents.length">
            <label class="criteria-label">已选择 {{ selectedStudents.length }} 个学生</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel small" @click="closeAddStudentModal">取消</button>
          <button class="btn-primary small" @click="addStudents" :disabled="addStudentLoading || selectedStudents.length === 0">
            {{ addStudentLoading ? "提交中..." : "确认添加" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 添加教师弹窗（下拉选择版） ==================== -->
    <div v-if="showAddTeacherModal" class="modal-overlay" @click.self="showAddTeacherModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">添加教师</h3>
          <button class="modal-close" @click="showAddTeacherModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="criteria-label">搜索教师</label>
            <input 
              v-model="teacherSearchKeyword" 
              type="text" 
              class="form-input" 
              placeholder="输入账号关键词搜索..."
              @input="filterTeacherList"
            />
          </div>
          <div class="form-group">
            <label class="criteria-label">选择教师（可多选）</label>
            <div v-if="staffListLoading" class="loading-container small">
              <div class="loading-content">
                <div class="loading-spinner small">
                  <div class="spinner"></div>
                </div>
                <p class="loading-text">加载教师列表...</p>
              </div>
            </div>
            <div v-else-if="filteredTeacherList.length" class="checkbox-group">
              <div 
                v-for="teacher in filteredTeacherList" 
                :key="teacher.id" 
                class="checkbox-item"
              >
                <label>
                  <input 
                    type="checkbox" 
                    :value="teacher.account"
                    v-model="selectedTeachers"
                  />
                  {{ teacher.account }}
                </label>
              </div>
            </div>
            <div v-else class="empty-tip small">
              <p>暂无教师数据</p>
            </div>
          </div>
          <div class="form-group" v-if="selectedTeachers.length">
            <label class="criteria-label">已选择 {{ selectedTeachers.length }} 个教师</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel small" @click="closeAddTeacherModal">取消</button>
          <button class="btn-primary small" @click="addTeachers" :disabled="addTeacherLoading || selectedTeachers.length === 0">
            {{ addTeacherLoading ? "提交中..." : "确认添加" }}
          </button>
        </div>
      </div>
    </div>

<!-- ==================== 添加课程弹窗 ==================== -->
<div v-if="showAddCourseModal" class="modal-overlay" @click.self="showAddCourseModal = false">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">添加课程</h3>
      <button class="modal-close" @click="showAddCourseModal = false">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="criteria-label">课程名称</label>
        <input v-model="courseForm.name" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="criteria-label">开始时间</label>
        <input v-model="courseForm.start_time" type="time" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="criteria-label">结束时间</label>
        <input v-model="courseForm.end_time" type="time" class="form-input" required />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel small" @click="showAddCourseModal = false">取消</button>
      <button class="btn-primary small" @click="addCourse" :disabled="addCourseLoading">
        {{ addCourseLoading ? "提交中..." : "确认添加" }}
      </button>
    </div>
  </div>
</div>

    <!-- 无权限提示 -->
    <div v-if="!hasAnyPermission" class="card">
      <div class="no-permission-tip">
        <p>您没有班级管理权限，请联系管理员</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

const router = useRouter();

/* ==================== 权限相关 ==================== */
const getUserPermissions = () => {
  try {
    const permissionsStr = localStorage.getItem("userPermissions");
    if (!permissionsStr) return [];
    
    try {
      return JSON.parse(permissionsStr);
    } catch {
      return permissionsStr.split(',').map(p => p.trim());
    }
  } catch (error) {
    console.error("解析权限信息失败:", error);
    return [];
  }
};

// 获取用户角色
const getUserRoles = () => {
  const permissions = getUserPermissions();
  const roles = permissions.filter(p => p.startsWith('ROLE_'));
  
  if (roles.length === 0) {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.role) {
          roles.push(user.role);
        }
      }
    } catch (e) {
      console.error("获取用户信息失败:", e);
    }
  }
  
  return roles;
};

// 检查用户是否有管理权限
const hasManagementPermission = computed(() => {
  const roles = getUserRoles();
  const adminRoles = ['ROLE_ROOT', 'ROLE_ADMINISTRATOR', 'ROLE_TEACHER'];
  return roles.some(role => adminRoles.includes(role));
});

// 权限检查函数
const hasPermission = (permission) => {
  const userPermissions = getUserPermissions();
  
  if (hasManagementPermission.value) {
    return true;
  }
  
  return userPermissions.includes(permission);
};

// 计算属性：是否有任何班级管理权限
const hasAnyPermission = computed(() => {
  return hasManagementPermission.value || 
         hasPermission("class:*") || 
         hasPermission("class:read");
});

/* ==================== API基础路径 ==================== */
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==================== 教室管理状态 ==================== */
const classroomList = ref([]);
const classroomLoading = ref(false);
const showClassroomForm = ref(false);
const classroomSubmitting = ref(false);
const classroomForm = reactive({
  name: ""
});
const editingClassroom = ref(null);

/* ==================== 班级管理状态 ==================== */
const classList = ref([]);
const classLoading = ref(false);
const showClassForm = ref(false);
const classSubmitting = ref(false);
const classForm = reactive({
  class_name: "",
  classroom_id: ""
});
const editingClass = ref(null);

// 班级统计数据
const studentCountMap = ref(new Map());
const teacherCountMap = ref(new Map());
const courseCountMap = ref(new Map());

/* ==================== 详情弹窗状态 ==================== */
const showDetailModal = ref(false);
const selectedClass = ref(null);
const activeTab = ref("students");

// 学生列表（当前班级）
const studentList = ref([]);
const studentListLoading = ref(false);

// 教师列表（当前班级）
const teacherList = ref([]);
const teacherListLoading = ref(false);

// 课程列表
const courseList = ref([]);
const courseListLoading = ref(false);
const showAddCourseModal = ref(false);
const addCourseLoading = ref(false);
const courseForm = reactive({
  name: "",
  start_time: "",
  end_time: ""
});
const editingCourse = ref(null);

/* ==================== 教师选择相关 ==================== */
const staffList = ref([]);
const staffListLoading = ref(false);
const selectedTeachers = ref([]);
const teacherSearchKeyword = ref('');
const filteredTeacherList = ref([]);

/* ==================== 学生选择相关 ==================== */
const studentListAll = ref([]); // 所有学生列表
const studentListAllLoading = ref(false);
const selectedStudents = ref([]);
const studentSearchKeyword = ref('');
const filteredStudentList = ref([]);

/* ==================== 添加学生弹窗状态 ==================== */
const showAddStudentModal = ref(false);
const addStudentLoading = ref(false);

/* ==================== 添加教师弹窗状态 ==================== */
const showAddTeacherModal = ref(false);
const addTeacherLoading = ref(false);

/* ==================== 工具函数 ==================== */
const formatGender = (g) => {
  if (g === 1) return "男";
  if (g === 0) return "女";
  return "-";
};

const getClassroomName = (classroomId) => {
  const room = classroomList.value.find(r => r.id === classroomId);
  return room ? room.name : "-";
};

const getStudentCount = (classId) => {
  return studentCountMap.value.get(classId) || 0;
};

const getTeacherCount = (classId) => {
  return teacherCountMap.value.get(classId) || 0;
};

const getCourseCount = (classId) => {
  return courseCountMap.value.get(classId) || 0;
};

/* ==================== 教室API ==================== */
// 获取教室列表
const fetchClassroomList = async () => {
  classroomLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/class/getClassroomList`);
    classroomList.value = res.data.data || [];
  } catch (error) {
    console.error("获取教室列表失败:", error);
    ElMessage.error("获取教室列表失败");
  } finally {
    classroomLoading.value = false;
  }
};

// 创建教室
const submitClassroom = async () => {
  if (!classroomForm.name.trim()) {
    ElMessage.warning("请输入教室名称");
    return;
  }

  classroomSubmitting.value = true;
  try {
    await axios.post(`${API_BASE}/class/uploadClassroom`, {
      name: classroomForm.name
    });
    ElMessage.success("教室创建成功");
    closeClassroomForm();
    fetchClassroomList();
  } catch (error) {
    console.error("创建教室失败:", error);
    ElMessage.error("创建教室失败");
  } finally {
    classroomSubmitting.value = false;
  }
};

// 删除教室
const deleteClassroom = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE}/class/deleteClassroom/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      fetchClassroomList();
    } else if (res.data.code === 409) {
      ElMessage.warning(res.data.message || "当前要删除的教室已被绑定，删除失败");
    }
  } catch (error) {
    if (error.response?.status === 409) {
      ElMessage.warning(error.response.data?.message || "当前要删除的教室已被绑定，删除失败");
    } else {
      console.error("删除教室失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 开始编辑教室
const startClassroomEdit = (room) => {
  editingClassroom.value = { ...room };
};

// 取消编辑教室
const cancelClassroomEdit = () => {
  editingClassroom.value = null;
};

// 保存教室编辑
const saveClassroomEdit = async () => {
  if (!editingClassroom.value?.name.trim()) {
    ElMessage.warning("请输入教室名称");
    return;
  }

  try {
    await axios.post(`${API_BASE}/class/updateClassroomName`, {
      id: editingClassroom.value.id,
      name: editingClassroom.value.name
    });
    ElMessage.success("修改成功");
    editingClassroom.value = null;
    fetchClassroomList();
  } catch (error) {
    console.error("修改教室失败:", error);
    ElMessage.error("修改失败");
  }
};

// 关闭教室表单
const closeClassroomForm = () => {
  showClassroomForm.value = false;
  classroomForm.name = "";
};

/* ==================== 班级API ==================== */
// 获取班级列表
const fetchClassList = async () => {
  classLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/class/getClassList`);
    classList.value = res.data.data || [];
    
    // 获取各班级的统计数据
    await Promise.all([
      fetchAllStudentCounts(),
      fetchAllTeacherCounts(),
      fetchAllCourseCounts()
    ]);
  } catch (error) {
    console.error("获取班级列表失败:", error);
    ElMessage.error("获取班级列表失败");
  } finally {
    classLoading.value = false;
  }
};

// 获取所有班级的学生数
const fetchAllStudentCounts = async () => {
  const counts = new Map();
  for (const cls of classList.value) {
    try {
      const res = await axios.get(`${API_BASE}/class/getStudentList/${cls.id}`);
      counts.set(cls.id, res.data.data?.length || 0);
    } catch {
      counts.set(cls.id, 0);
    }
  }
  studentCountMap.value = counts;
};

// 获取所有班级的教师数
const fetchAllTeacherCounts = async () => {
  const counts = new Map();
  for (const cls of classList.value) {
    try {
      const res = await axios.get(`${API_BASE}/class/getTeacherList/${cls.id}`);
      counts.set(cls.id, res.data.data?.length || 0);
    } catch {
      counts.set(cls.id, 0);
    }
  }
  teacherCountMap.value = counts;
};

// 获取所有班级的课程数
const fetchAllCourseCounts = async () => {
  const counts = new Map();
  for (const cls of classList.value) {
    try {
      const res = await axios.get(`${API_BASE}/class/getCourseList/${cls.id}`);
      counts.set(cls.id, res.data.data?.length || 0);
    } catch {
      counts.set(cls.id, 0);
    }
  }
  courseCountMap.value = counts;
};

// 创建班级
const submitClass = async () => {
  if (!classForm.class_name.trim()) {
    ElMessage.warning("请输入班级名称");
    return;
  }
  if (!classForm.classroom_id) {
    ElMessage.warning("请选择教室");
    return;
  }

  classSubmitting.value = true;
  try {
    await axios.post(`${API_BASE}/class/createClass`, {
      class_name: classForm.class_name,
      classroom_id: parseInt(classForm.classroom_id)
    });
    ElMessage.success("班级创建成功");
    closeClassForm();
    fetchClassList();
  } catch (error) {
    console.error("创建班级失败:", error);
    ElMessage.error("创建班级失败");
  } finally {
    classSubmitting.value = false;
  }
};

// 删除班级
const deleteClass = async (id) => {
  try {
    await axios.delete(`${API_BASE}/class/deleteClass/${id}`);
    ElMessage.success("删除成功");
    fetchClassList();
  } catch (error) {
    console.error("删除班级失败:", error);
    ElMessage.error("删除失败");
  }
};

// 开始编辑班级
const startClassEdit = (cls) => {
  editingClass.value = { ...cls };
};

// 取消编辑班级
const cancelClassEdit = () => {
  editingClass.value = null;
};

// 保存班级编辑
const saveClassEdit = async () => {
  if (!editingClass.value?.class_name.trim()) {
    ElMessage.warning("请输入班级名称");
    return;
  }

  try {
    await axios.post(`${API_BASE}/class/updateClassName`, {
      id: editingClass.value.id,
      class_name: editingClass.value.class_name,
      classroom_id: parseInt(editingClass.value.classroom_id)
    });
    ElMessage.success("修改成功");
    editingClass.value = null;
    fetchClassList();
  } catch (error) {
    console.error("修改班级失败:", error);
    ElMessage.error("修改失败");
  }
};

// 关闭班级表单
const closeClassForm = () => {
  showClassForm.value = false;
  classForm.class_name = "";
  classForm.classroom_id = "";
};

/* ==================== 详情弹窗相关 ==================== */
const showStudentList = (cls) => {
  selectedClass.value = cls;
  activeTab.value = "students";
  showDetailModal.value = true;
  // 加载所有数据
  fetchAllClassData(cls.id);
};

const showTeacherList = (cls) => {
  selectedClass.value = cls;
  activeTab.value = "teachers";
  showDetailModal.value = true;
  // 加载所有数据
  fetchAllClassData(cls.id);
};

const showCourseList = (cls) => {
  selectedClass.value = cls;
  activeTab.value = "courses";
  showDetailModal.value = true;
  // 加载所有数据
  fetchAllClassData(cls.id);
};

const showClassDetail = (cls) => {
  selectedClass.value = cls;
  activeTab.value = "students";
  showDetailModal.value = true;
  // 加载所有数据
  fetchAllClassData(cls.id);
};

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab;
  // 如果当前标签页的数据为空，重新加载（可选）
  if (tab === 'students' && studentList.value.length === 0 && selectedClass.value) {
    fetchStudentList(selectedClass.value.id);
  } else if (tab === 'teachers' && teacherList.value.length === 0 && selectedClass.value) {
    fetchTeacherList(selectedClass.value.id);
  } else if (tab === 'courses' && courseList.value.length === 0 && selectedClass.value) {
    fetchCourseList(selectedClass.value.id);
  }
};

// 新增：一次性加载班级的所有数据
const fetchAllClassData = async (classId) => {
  // 重置所有数据（可选）
  studentList.value = [];
  teacherList.value = [];
  courseList.value = [];
  
  // 并行加载所有数据
  await Promise.allSettled([
    fetchStudentList(classId),
    fetchTeacherList(classId),
    fetchCourseList(classId)
  ]);
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedClass.value = null;
  activeTab.value = "students";
  studentList.value = [];
  teacherList.value = [];
  courseList.value = [];
};

/* ==================== 学生管理API ==================== */
const fetchStudentList = async (classId) => {
  // 如果已经在加载中，不重复加载
  if (studentListLoading.value) return;
  
  studentListLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/class/getStudentList/${classId}`);
    studentList.value = res.data.data || [];
  } catch (error) {
    console.error("获取学生列表失败:", error);
    ElMessage.error("获取学生列表失败");
  } finally {
    studentListLoading.value = false;
  }
};

// 获取所有学生列表
const fetchAllStudentList = async () => {
  studentListAllLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/user/getStudentList`);
    if (res.data.code === 200) {
      studentListAll.value = res.data.data || [];
      filterStudentList();
    }
  } catch (error) {
    console.error("获取学生列表失败:", error);
    ElMessage.error("获取学生列表失败");
  } finally {
    studentListAllLoading.value = false;
  }
};

// 过滤学生列表
const filterStudentList = () => {
  if (!studentSearchKeyword.value.trim()) {
    filteredStudentList.value = studentListAll.value;
  } else {
    const keyword = studentSearchKeyword.value.toLowerCase();
    filteredStudentList.value = studentListAll.value.filter(stu => 
      stu.account && stu.account.toLowerCase().includes(keyword)
    );
  }
};

// 打开添加学生弹窗
const openAddStudentModal = () => {
  selectedStudents.value = [];
  studentSearchKeyword.value = '';
  fetchAllStudentList();
  showAddStudentModal.value = true;
};

// 关闭添加学生弹窗
const closeAddStudentModal = () => {
  showAddStudentModal.value = false;
  selectedStudents.value = [];
  studentSearchKeyword.value = '';
  filteredStudentList.value = [];
};

// 添加学生
const addStudents = async () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning("请选择要添加的学生");
    return;
  }

  addStudentLoading.value = true;
  try {
    await axios.post(`${API_BASE}/class/addStudent`, {
      class_id: selectedClass.value.id,
      students: selectedStudents.value
    });
    ElMessage.success(`成功添加 ${selectedStudents.value.length} 个学生`);
    closeAddStudentModal();
    fetchStudentList(selectedClass.value.id);
    fetchAllStudentCounts();
  } catch (error) {
    console.error("添加学生失败:", error);
    ElMessage.error("添加失败");
  } finally {
    addStudentLoading.value = false;
  }
};

const removeStudent = async (account) => {
  try {
    await axios.post(`${API_BASE}/class/deleteStudent`, {
      class_id: selectedClass.value.id,
      students: [account]
    });
    ElMessage.success("移除成功");
    fetchStudentList(selectedClass.value.id);
    fetchAllStudentCounts();
  } catch (error) {
    console.error("移除学生失败:", error);
    ElMessage.error("移除失败");
  }
};

/* ==================== 教师管理API ==================== */
const fetchTeacherList = async (classId) => {
  // 如果已经在加载中，不重复加载
  if (teacherListLoading.value) return;
  
  teacherListLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/class/getTeacherList/${classId}`);
    teacherList.value = res.data.data || [];
  } catch (error) {
    console.error("获取教师列表失败:", error);
    ElMessage.error("获取教师列表失败");
  } finally {
    teacherListLoading.value = false;
  }
};

// 获取所有教师列表
const fetchAllStaffList = async () => {
  staffListLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/user/getStaffList`);
    if (res.data.code === 200) {
      staffList.value = res.data.data || [];
      filterTeacherList();
    }
  } catch (error) {
    console.error("获取教师列表失败:", error);
    ElMessage.error("获取教师列表失败");
  } finally {
    staffListLoading.value = false;
  }
};

// 过滤教师列表
const filterTeacherList = () => {
  if (!teacherSearchKeyword.value.trim()) {
    filteredTeacherList.value = staffList.value;
  } else {
    const keyword = teacherSearchKeyword.value.toLowerCase();
    filteredTeacherList.value = staffList.value.filter(teacher => 
      teacher.account && teacher.account.toLowerCase().includes(keyword)
    );
  }
};

// 打开添加教师弹窗
const openAddTeacherModal = () => {
  selectedTeachers.value = [];
  teacherSearchKeyword.value = '';
  fetchAllStaffList();
  showAddTeacherModal.value = true;
};

// 关闭添加教师弹窗
const closeAddTeacherModal = () => {
  showAddTeacherModal.value = false;
  selectedTeachers.value = [];
  teacherSearchKeyword.value = '';
  filteredTeacherList.value = [];
};

// 添加教师
const addTeachers = async () => {
  if (selectedTeachers.value.length === 0) {
    ElMessage.warning("请选择要添加的教师");
    return;
  }

  addTeacherLoading.value = true;
  try {
    await axios.post(`${API_BASE}/class/addTeacher`, {
      class_id: selectedClass.value.id,
      teachers: selectedTeachers.value
    });
    ElMessage.success(`成功添加 ${selectedTeachers.value.length} 个教师`);
    closeAddTeacherModal();
    fetchTeacherList(selectedClass.value.id);
    fetchAllTeacherCounts();
  } catch (error) {
    console.error("添加教师失败:", error);
    ElMessage.error("添加失败");
  } finally {
    addTeacherLoading.value = false;
  }
};

const removeTeacher = async (account) => {
  try {
    await axios.post(`${API_BASE}/class/deleteTeacher`, {
      class_id: selectedClass.value.id,
      teachers: [account]
    });
    ElMessage.success("移除成功");
    fetchTeacherList(selectedClass.value.id);
    fetchAllTeacherCounts();
  } catch (error) {
    console.error("移除教师失败:", error);
    ElMessage.error("移除失败");
  }
};

/* ==================== 课程管理API ==================== */
const fetchCourseList = async (classId) => {
  // 如果已经在加载中，不重复加载
  if (courseListLoading.value) return;
  
  courseListLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/class/getCourseList/${classId}`);
    courseList.value = res.data.data || [];
  } catch (error) {
    console.error("获取课程列表失败:", error);
    ElMessage.error("获取课程列表失败");
  } finally {
    courseListLoading.value = false;
  }
};

// 添加课程
const addCourse = async () => {
  if (!courseForm.name.trim()) {
    ElMessage.warning("请输入课程名称");
    return;
  }
  if (!courseForm.start_time) {
    ElMessage.warning("请选择开始时间");
    return;
  }
  if (!courseForm.end_time) {
    ElMessage.warning("请选择结束时间");
    return;
  }

  addCourseLoading.value = true;
  try {
    // 添加课程时不需要传id，由后端自动生成
    await axios.post(`${API_BASE}/class/addCourse`, {
      name: courseForm.name,
      start_time: courseForm.start_time + ":00",
      end_time: courseForm.end_time + ":00",
      class_id: selectedClass.value.id
    });
    ElMessage.success("添加成功");
    showAddCourseModal.value = false;
    resetCourseForm();
    fetchCourseList(selectedClass.value.id);
    fetchAllCourseCounts();
  } catch (error) {
    console.error("添加课程失败:", error);
    ElMessage.error("添加失败");
  } finally {
    addCourseLoading.value = false;
  }
};

// 开始编辑课程
const startCourseEdit = (course) => {
  editingCourse.value = {
    id: course.id,
    name: course.name,
    start_time: course.start_time?.substring(0, 5),
    end_time: course.end_time?.substring(0, 5),
    class_id: course.class_id
  };
};

// 取消编辑课程
const cancelCourseEdit = () => {
  editingCourse.value = null;
};

// 保存课程编辑
const saveCourseEdit = async () => {
  if (!editingCourse.value?.name.trim()) {
    ElMessage.warning("请输入课程名称");
    return;
  }
  if (!editingCourse.value?.start_time) {
    ElMessage.warning("请选择开始时间");
    return;
  }
  if (!editingCourse.value?.end_time) {
    ElMessage.warning("请选择结束时间");
    return;
  }

  try {
    // 更新课程时需要传id，但class_id保持不变（不能修改绑定的班级）
    await axios.post(`${API_BASE}/class/updateCourse`, {
      id: editingCourse.value.id,
      name: editingCourse.value.name,
      start_time: editingCourse.value.start_time + ":00",
      end_time: editingCourse.value.end_time + ":00",
      class_id: selectedClass.value.id // 保持原班级ID不变
    });
    ElMessage.success("修改成功");
    editingCourse.value = null;
    fetchCourseList(selectedClass.value.id);
  } catch (error) {
    console.error("修改课程失败:", error);
    ElMessage.error("修改失败");
  }
};

// 删除课程
const deleteCourse = async (courseId) => {
  try {
    await axios.delete(`${API_BASE}/class/deleteCourse/${courseId}`);
    ElMessage.success("删除成功");
    fetchCourseList(selectedClass.value.id);
    fetchAllCourseCounts();
  } catch (error) {
    console.error("删除课程失败:", error);
    ElMessage.error("删除失败");
  }
};

// 重置课程表单
const resetCourseForm = () => {
  courseForm.name = "";
  courseForm.start_time = "";
  courseForm.end_time = "";
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  if (hasAnyPermission.value) {
    fetchClassroomList();
    fetchClassList();
  }
});

// 监听添加学生弹窗的打开
watch(showAddStudentModal, (newVal) => {
  if (newVal) {
    openAddStudentModal();
  }
});

// 监听添加教师弹窗的打开
watch(showAddTeacherModal, (newVal) => {
  if (newVal) {
    openAddTeacherModal();
  }
});
</script>

<style scoped>
/* ===== 基础 ===== */
.container {
  max-width: 2000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
}

.page-header {
  background: linear-gradient(135deg, #409eff, #3375e0);
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
}

.page-title {
  color: #fff;
  font-size: 28px;
  margin: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* ===== 加载动画 ===== */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 40px 0;
}

.loading-container.small {
  min-height: 100px;
  padding: 20px 0;
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.loading-spinner.small {
  width: 40px;
  height: 40px;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 4px solid rgba(64, 158, 255, 0.1);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #606266;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* ===== 表格 ===== */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.data-table th {
  background: #c0e0ff;
  color: #303133;
  font-weight: 600;
  text-align: center;
  padding: 16px 12px;
  border-bottom: 2px solid #ebeef5;
}

.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #dcdee4;
  color: #606266;
  text-align: center;
}

.data-table tbody tr:hover {
  background-color: #f0f9ff;
}

.data-table.compact th,
.data-table.compact td {
  padding: 10px 8px;
  font-size: 14px;
}

/* ===== 按钮样式 ===== */
.btn-primary {
  border: none;
  font-size: 14px;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #409eff;
  color: #fff;
  font-weight: 500;
}

.btn-primary.small {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f56c6c;
  border: 1px solid #f56c6c;
  color: #fff;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-cancel.small {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-cancel:hover {
  background: #f78989;
  border-color: #f78989;
}

/* 操作按钮组 */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.small {
  padding: 4px 8px;
  font-size: 12px;
}

.action-btn.edit {
  background: #409eff;
  color: #fff;
}

.action-btn.edit:hover {
  background: #66b1ff;
}

.action-btn.delete {
  background: #f56c6c;
  color: #fff;
}

.action-btn.delete:hover {
  background: #f78989;
}

.action-btn.save {
  background: #67c23a;
  color: #fff;
}

.action-btn.save:hover {
  background: #85ce61;
}

.action-btn.cancel {
  background: #909399;
  color: #fff;
}

.action-btn.cancel:hover {
  background: #a6a9ad;
}

.action-btn.info {
  background: #909399;
  color: #fff;
}

.action-btn.info:hover {
  background: #a6a9ad;
}

.link-btn {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
}

.link-btn:hover {
  color: #66b1ff;
}

/* ===== 表单 ===== */
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
  margin-bottom: 8px;
  color: #606266;
  font-weight: 500;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  transition: all 0.3s;
  width: 100%;
  box-sizing: border-box;
}

.form-input.small,
.form-select.small {
  padding: 8px 12px;
  font-size: 13px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

/* 下拉框包装器 */
.select-wrapper {
  position: relative;
  width: 100%;
}

.form-select {
  width: 100%;
  padding: 12px 44px 12px 16px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #909399;
  pointer-events: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 编辑输入框 */
.edit-input {
  width: 100%;
}

/* ===== 复选框组样式 ===== */
.checkbox-group {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  background-color: #fff;
}

.checkbox-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.checkbox-item:last-child {
  border-bottom: none;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-item:hover {
  background-color: #f5f7fa;
}

/* ===== 空状态提示 ===== */
.empty-tip {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin: 20px 0;
}

.empty-tip.small {
  padding: 20px;
  font-size: 14px;
  margin: 10px 0;
}

/* ===== 无权限提示 ===== */
.no-permission-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-permission-tip p {
  color: #909399;
  font-size: 16px;
  margin: 0;
}

/* ===== 弹窗样式 ===== */
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-content.large {
  max-width: 1000px;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #409eff;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 弹窗选项卡 */
.modal-tabs {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  padding: 0 24px;
  gap: 20px;
}

.tab-btn {
  padding: 16px 0;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #909399;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #409eff;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #409eff;
}

.tab-content {
  padding: 24px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tab-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

/* ===== 响应式设计 ===== */
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

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .card {
    padding: 16px;
  }

  .criteria-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .modal-tabs {
    padding: 0 16px;
    gap: 12px;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 12px 0;
    font-size: 14px;
    white-space: nowrap;
  }

  .tab-content {
    padding: 16px;
  }

  .modal-header,
  .modal-footer {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .btn-primary,
  .btn-cancel {
    width: 100%;
    text-align: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }

  .modal-content {
    width: 95%;
  }
}
</style>