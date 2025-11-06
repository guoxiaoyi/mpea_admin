<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">合作伙伴管理</h1>
      <button
        @click="handleAdd"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        添加合作伙伴
      </button>
    </div>

    <!-- 搜索 -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索标题..."
        class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @keyup.enter="handleSearch"
      />
      <button
        @click="handleSearch"
        class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        搜索
      </button>
      <button
        @click="handleReset"
        class="rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
      >
        重置
      </button>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedIds.length > 0" class="mb-4 flex items-center gap-2">
      <span class="text-sm text-gray-600">已选择 {{ selectedIds.length }} 项</span>
      <button
        @click="handleBatchDelete"
        class="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
      >
        批量删除
      </button>
    </div>

    <!-- 表格 -->
    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="handleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              图片
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              标题
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              链接
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              排序
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              状态
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              创建时间
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-if="loading">
            <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500">
              加载中...
            </td>
          </tr>
          <tr v-else-if="!list.length">
            <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500">
              暂无数据
            </td>
          </tr>
          <tr v-else v-for="item in list" :key="item.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                @change="handleSelectItem(item.id)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td class="px-4 py-3">
              <img :src="item.image" alt="" class="h-12 w-12 rounded object-cover" />
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ item.title }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">
              <a v-if="item.link" :href="item.link" target="_blank" class="text-blue-600 hover:underline">
                {{ item.link }}
              </a>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ item.sortOrder }}</td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5',
                  item.status === 'enabled'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ item.status === 'enabled' ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ formatDate(item.createdAt) }}
            </td>
            <td class="px-4 py-3 text-right text-sm font-medium">
              <button
                @click="handleEdit(item)"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                编辑
              </button>
              <button
                @click="handleDelete(item)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm text-gray-700">
        共 {{ pagination.total }} 条记录，当前第 {{ pagination.page }} / {{ totalPages }} 页
      </div>
      <div class="flex gap-2">
        <button
          @click="handlePageChange(pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          上一页
        </button>
        <button
          @click="handlePageChange(pagination.page + 1)"
          :disabled="pagination.page >= totalPages"
          class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPartners, deletePartner, batchDeletePartners } from '@/api/partner';

const router = useRouter();

const list = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const selectedIds = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
});

const totalPages = computed(() => {
  return Math.ceil(pagination.value.total / pagination.value.limit);
});

const isAllSelected = computed(() => {
  return list.value.length > 0 && selectedIds.value.length === list.value.length;
});

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getPartners({
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: searchKeyword.value
    });
    if (res.success) {
      list.value = res.data.data;
      pagination.value.total = res.data.total;
    }
  } catch (error) {
    console.error('获取列表失败:', error);
    alert('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  fetchList();
};

const handleReset = () => {
  searchKeyword.value = '';
  pagination.value.page = 1;
  fetchList();
};

const handlePageChange = (page) => {
  pagination.value.page = page;
  fetchList();
};

const handleAdd = () => {
  router.push('/admin/partners/new');
};

const handleEdit = (item) => {
  router.push(`/admin/partners/${item.id}`);
};

const handleDelete = async (item) => {
  if (!confirm(`确定要删除「${item.title}」吗？`)) return;
  
  try {
    const res = await deletePartner(item.id);
    if (res.data.success) {
      alert('删除成功');
      fetchList();
    }
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
  }
};

const handleSelectAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = list.value.map(item => item.id);
  } else {
    selectedIds.value = [];
  }
};

const handleSelectItem = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const handleBatchDelete = async () => {
  if (!confirm(`确定要删除选中的 ${selectedIds.value.length} 项吗？`)) return;
  
  try {
    const res = await batchDeletePartners(selectedIds.value);
    if (res.data.success) {
      alert('批量删除成功');
      selectedIds.value = [];
      fetchList();
    }
  } catch (error) {
    console.error('批量删除失败:', error);
    alert('批量删除失败');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

onMounted(() => {
  fetchList();
});
</script>

