<template>
   <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          课堂作业
        </h1>
      </div>
    </div>
    <div>
    <!-- 无任何权限 -->
    <el-empty
      v-if="!hasAnyHomeworkPermission"
      description="您暂无作业管理权限"
    />

    <!-- 主体 -->
    <div v-else>
      <!-- 操作栏 -->
      <div class="toolbar">
        <el-button
          type="primary"
          v-if="hasCreatePermission"
          @click="openCreateDialog"
        >
          上传作业
        </el-button>
      </div>

      <!-- 作业列表 -->
      <el-table
        v-if="hasReadPermission"
        :data="homeworkList"
        border
        stripe
      >
        <el-table-column prop="title" label="作业标题" />
        <el-table-column prop="description" label="作业说明" />
        <el-table-column prop="deadline" label="截止时间" width="180" />

        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button
              size="small"
              v-if="hasUpdatePermission"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>

            <el-button
              size="small"
              type="danger"
              v-if="hasDeletePermission"
              @click="handleDelete(row)"
            >
              删除
            </el-button>

            <el-button
              size="small"
              type="success"
              v-if="hasDownloadPermission"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑作业' : '上传作业'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>

        <el-form-item label="说明">
          <el-input
            type="textarea"
            v-model="form.description"
          />
        </el-form-item>

        <el-form-item label="截止时间">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";

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
  const perms = getUserPermissions();
  return perms.includes(permission) || perms.includes("homework:*");
};

const hasReadPermission = computed(() => hasPermission("homework:read"));
const hasCreatePermission = computed(() => hasPermission("homework:create"));
const hasUpdatePermission = computed(() => hasPermission("homework:update"));
const hasDeletePermission = computed(() => hasPermission("homework:delete"));
const hasDownloadPermission = computed(() => hasPermission("homework:download"));

const hasAnyHomeworkPermission = computed(() => {
  return [
    "homework:read",
    "homework:create",
    "homework:update",
    "homework:delete",
    "homework:download",
  ].some(p => hasPermission(p));
});

/* ==================== 数据 ==================== */
const homeworkList = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);

const form = ref({
  id: null,
  title: "",
  description: "",
  deadline: "",
});

/* ==================== API ==================== */
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const loadHomeworkList = async () => {
  if (!hasReadPermission.value) return;

  const res = await axios.get(`${API_BASE}/getHomeworkList`);
  homeworkList.value = res.data.data || [];
};

/* ==================== 操作 ==================== */
const openCreateDialog = () => {
  isEdit.value = false;
  form.value = {
    id: null,
    title: "",
    description: "",
    deadline: "",
  };
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (isEdit.value) {
    await axios.post(`${API_BASE}/updateHomework`, form.value);
    ElMessage.success("作业更新成功");
  } else {
    await axios.post(`${API_BASE}/uploadHomework`, form.value);
    ElMessage.success("作业上传成功");
  }

  dialogVisible.value = false;
  loadHomeworkList();
};

const handleDelete = async (row) => {
  await ElMessageBox.confirm("确认删除该作业？", "提示", {
    type: "warning",
  });

  await axios.post(`${API_BASE}/deleteHomework`, { id: row.id });
  ElMessage.success("删除成功");
  loadHomeworkList();
};

const handleDownload = (row) => {
  window.open(row.downloadUrl);
};

/* ==================== 生命周期 ==================== */
onMounted(() => {
  loadHomeworkList();
});
</script>

<style scoped>
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

.homework-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.toolbar {
  margin-bottom: 25px;
}
</style>
