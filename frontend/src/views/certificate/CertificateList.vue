<template>
  <div class="certificate-list">
    <div class="header">
      <h2>证书管理</h2>
      <div class="actions">
        <button @click="showImportDialog" class="btn-primary">
          导入Excel
        </button>
        <button @click="handleBatchDelete" class="btn-danger" :disabled="selectedIds.length === 0">
          批量删除
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="searchKeyword"
        @keyup.enter="handleSearch"
        placeholder="搜索证书编号或姓名"
        class="search-input"
      />
      <button @click="handleSearch" class="btn-search">搜索</button>
      <button @click="handleReset" class="btn-reset">重置</button>
    </div>

    <!-- 证书列表 -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th width="50">
              <input type="checkbox" v-model="selectAll" @change="handleSelectAll" />
            </th>
            <th width="80">ID</th>
            <th>证书编号</th>
            <th>姓名</th>
            <th>颁发时间</th>
            <th width="100">状态</th>
            <th width="180">创建时间</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>
              <input type="checkbox" :value="item.id" v-model="selectedIds" />
            </td>
            <td>{{ item.id }}</td>
            <td>{{ item.certificateNo }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.certDate }}</td>
            <td>
              <span :class="item.status === 'enabled' ? 'status-enabled' : 'status-disabled'">
                {{ item.status === 'enabled' ? '启用' : '禁用' }}
              </span>
            </td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <button @click="handleEdit(item)" class="btn-link">编辑</button>
              <button @click="handleDelete(item.id)" class="btn-link text-red">删除</button>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="8" class="text-center">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button @click="handlePageChange(currentPage - 1)" :disabled="currentPage === 1">
        上一页
      </button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button @click="handlePageChange(currentPage + 1)" :disabled="currentPage >= totalPages">
        下一页
      </button>
    </div>

    <!-- 导入对话框 -->
    <div v-if="importDialogVisible" class="modal-overlay" @click.self="closeImportDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h3>导入证书</h3>
          <button @click="closeImportDialog" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="upload-area">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept=".xlsx,.xls"
              style="display: none"
            />
            <div v-if="!selectedFile" @click="$refs.fileInput.click()" class="upload-placeholder">
              <div class="upload-icon">📁</div>
              <p>点击选择Excel文件</p>
              <p class="text-sm">支持 .xlsx 和 .xls 格式</p>
            </div>
            <div v-else class="file-info">
              <div class="file-name">📄 {{ selectedFile.name }}</div>
              <button @click="clearFile" class="btn-link text-red">移除</button>
            </div>
          </div>
          
          <div v-if="importResult" class="import-result">
            <h4>导入结果：</h4>
            <p>总共: {{ importResult.total }} 条</p>
            <p class="text-green">成功插入: {{ importResult.inserted }} 条</p>
            <p class="text-orange">跳过（重复）: {{ importResult.skipped }} 条</p>
            <p v-if="importResult.errors.length > 0" class="text-red">
              错误: {{ importResult.errors.length }} 条
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeImportDialog" class="btn-secondary">取消</button>
          <button @click="handleImport" class="btn-primary" :disabled="!selectedFile || importing">
            {{ importing ? '导入中...' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editDialogVisible" class="modal-overlay" @click.self="closeEditDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑证书</h3>
          <button @click="closeEditDialog" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>证书编号：</label>
            <input v-model="editForm.certificateNo" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>姓名：</label>
            <input v-model="editForm.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>颁发时间：</label>
            <input v-model="editForm.certDate" type="text" placeholder="格式：2025/03" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态：</label>
            <select v-model="editForm.status" class="form-input">
              <option value="enabled">启用</option>
              <option value="disabled">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditDialog" class="btn-secondary">取消</button>
          <button @click="handleUpdate" class="btn-primary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  getCertificateList,
  importCertificates,
  updateCertificate,
  deleteCertificate,
  batchDeleteCertificates
} from '@/api/certificate';

const list = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const selectedIds = ref([]);
const selectAll = ref(false);

const importDialogVisible = ref(false);
const selectedFile = ref(null);
const importing = ref(false);
const importResult = ref(null);

const editDialogVisible = ref(false);
const editForm = ref({
  id: null,
  certificateNo: '',
  name: '',
  certDate: '',
  status: 'enabled'
});

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 加载列表
const loadList = async () => {
  try {
    const res = await getCertificateList({
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value
    });
    if (res.success) {
      list.value = res.data.data;
      total.value = res.data.total;
      currentPage.value = res.data.page;
    }
  } catch (error) {
    console.error('加载证书列表失败:', error);
    alert('加载列表失败');
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadList();
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  currentPage.value = 1;
  loadList();
};

// 分页
const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadList();
  }
};

// 全选
const handleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = list.value.map(item => item.id);
  } else {
    selectedIds.value = [];
  }
};

// 显示导入对话框
const showImportDialog = () => {
  importDialogVisible.value = true;
  selectedFile.value = null;
  importResult.value = null;
};

// 关闭导入对话框
const closeImportDialog = () => {
  importDialogVisible.value = false;
  selectedFile.value = null;
  importResult.value = null;
  importing.value = false;
};

// 选择文件
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    importResult.value = null;
  }
};

// 清除文件
const clearFile = () => {
  selectedFile.value = null;
  importResult.value = null;
};

// 导入
const handleImport = async () => {
  if (!selectedFile.value) {
    alert('请选择文件');
    return;
  }

  try {
    importing.value = true;
    const res = await importCertificates(selectedFile.value);
    if (res.success) {
      importResult.value = res.data;
      alert('导入完成！');
      loadList();
      setTimeout(() => {
        closeImportDialog();
      }, 3000);
    } else {
      alert('导入失败：' + res.message);
    }
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败');
  } finally {
    importing.value = false;
  }
};

// 编辑
const handleEdit = (item) => {
  editForm.value = {
    id: item.id,
    certificateNo: item.certificateNo,
    name: item.name,
    certDate: item.certDate,
    status: item.status || 'enabled'
  };
  editDialogVisible.value = true;
};

// 关闭编辑对话框
const closeEditDialog = () => {
  editDialogVisible.value = false;
  editForm.value = {
    id: null,
    certificateNo: '',
    name: '',
    certDate: '',
    status: 'enabled'
  };
};

// 更新
const handleUpdate = async () => {
  if (!editForm.value.certificateNo || !editForm.value.name || !editForm.value.certDate) {
    alert('请填写完整信息');
    return;
  }

  try {
    const res = await updateCertificate(editForm.value.id, {
      certificateNo: editForm.value.certificateNo,
      name: editForm.value.name,
      certDate: editForm.value.certDate,
      status: editForm.value.status
    });
    if (res.success) {
      alert('更新成功');
      closeEditDialog();
      loadList();
    } else {
      alert('更新失败：' + res.message);
    }
  } catch (error) {
    console.error('更新失败:', error);
    alert('更新失败');
  }
};

// 删除
const handleDelete = async (id) => {
  if (!confirm('确定要删除这条证书记录吗？')) {
    return;
  }

  try {
    const res = await deleteCertificate(id);
    if (res.success) {
      alert('删除成功');
      loadList();
    } else {
      alert('删除失败：' + res.message);
    }
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    alert('请选择要删除的证书');
    return;
  }

  if (!confirm(`确定要删除选中的 ${selectedIds.value.length} 条证书记录吗？`)) {
    return;
  }

  try {
    const res = await batchDeleteCertificates(selectedIds.value);
    if (res.success) {
      alert('批量删除成功');
      selectedIds.value = [];
      selectAll.value = false;
      loadList();
    } else {
      alert('批量删除失败：' + res.message);
    }
  } catch (error) {
    console.error('批量删除失败:', error);
    alert('批量删除失败');
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadList();
});
</script>

<style scoped>
.certificate-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-search,
.btn-reset {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-search {
  background-color: #409eff;
  color: white;
}

.btn-reset {
  background-color: #909399;
  color: white;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background-color: #f5f7fa;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.data-table th {
  font-weight: 600;
  color: #606266;
}

.data-table tbody tr:hover {
  background-color: #f5f7fa;
}

.text-center {
  text-align: center;
}

.btn-link {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
}

.btn-link:hover {
  text-decoration: underline;
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}

.text-orange {
  color: #e6a23c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background-color: #909399;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger {
  padding: 10px 20px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-placeholder {
  color: #606266;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.text-sm {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.file-name {
  font-size: 14px;
  color: #606266;
}

.import-result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.import-result h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.import-result p {
  margin: 5px 0;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.status-enabled {
  display: inline-block;
  padding: 4px 12px;
  background-color: #67c23a;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.status-disabled {
  display: inline-block;
  padding: 4px 12px;
  background-color: #909399;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}
</style>

