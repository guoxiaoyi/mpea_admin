<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchMapContinents, deleteMapContinent } from '@/api/map';
import UiTable from '@/components/UiTable.vue';

const router = useRouter();

const list = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const keyword = ref('');
const status = ref('');
const loading = ref(false);

const columns = [
  { key: 'name', label: '洲名称', width: '160px' },
  { key: 'code', label: '编号/代号', width: '140px' },
  { key: 'status', label: '状态', width: '100px', align: 'center' },
  { key: 'sortOrder', label: '排序', width: '90px', align: 'center' },
  { key: 'markerCount', label: '城市数', width: '100px', align: 'center' },
  { key: 'photos', label: '展示图片', width: '220px' },
  { key: 'updatedAt', label: '更新时间', width: '180px' },
  { key: 'actions', label: '操作', width: '200px', align: 'right' }
];

const apiBase = (import.meta.env.VITE_API_BASE || window.location.origin).replace(/\/$/, '');

function resolveImage(url) {
  if (!url) return '';
  try {
    return new URL(url, `${apiBase}/`).href;
  } catch (e) {
    return url;
  }
}

async function load() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value
    };
    if (keyword.value) params.keyword = keyword.value;
    if (status.value) params.status = status.value;
    const res = await fetchMapContinents(params);
    if (res.success) {
      const payload = res.data || {};
      list.value = payload.data || [];
      total.value = payload.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  router.push('/admin/map/continents/new');
}

function openEdit(row) {
  router.push(`/admin/map/continents/${row.id}`);
}

function goMarkers(row) {
  router.push({ path: '/admin/map/markers', query: { continentId: row.id } });
}

async function onDelete(id) {
  if (!confirm('确定删除该洲及相关城市标记吗？')) return;
  await deleteMapContinent(id);
  await load();
}

function onSearch() {
  page.value = 1;
  load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">地图洲管理</div>
        <p class="text-sm text-slate-500 mt-1">维护洲信息、展示图片，并查看洲内城市标记</p>
      </div>
      <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="openCreate">
        新增洲信息
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 w-80 rounded-full border px-3 py-1.5" style="border-color: var(--border); background: var(--surface)">
        <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input v-model="keyword" type="text" placeholder="搜索名称或编号" class="w-full bg-transparent outline-none" />
      </div>
      <select
        v-model="status"
        class="h-10 rounded-full border px-4 text-sm"
        style="border-color: var(--border); background: var(--surface)"
      >
        <option value="">全部状态</option>
        <option value="enabled">启用</option>
        <option value="disabled">禁用</option>
      </select>
      <button class="ui-btn-primary" @click="onSearch">筛选</button>
    </div>

    <div class="ui-panel border-none p-0 overflow-hidden">
      <div class="px-6 py-4 border-b" style="border-color: var(--border)">
        <div class="font-medium text-slate-900">洲列表（共 {{ total }} 条）</div>
      </div>
      <UiTable :columns="columns" :rows="list" :loading="loading" density="normal">
        <template #cell:status="{ row }">
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            :class="row.status === 'enabled' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'"
          >
            {{ row.status === 'enabled' ? '启用' : '禁用' }}
          </span>
        </template>
        <template #cell:sortOrder="{ row }">
          <span class="text-sm text-slate-700">{{ row.sortOrder ?? 0 }}</span>
        </template>
        <template #cell:markerCount="{ row }">
          <span class="text-sm text-slate-700">{{ row.markerCount ?? 0 }}</span>
        </template>
        <template #cell:photos="{ row }">
          <div class="flex items-center gap-2">
            <template v-if="row.photos && row.photos.length">
              <img
                v-for="(photo, index) in row.photos.slice(0, 3)"
                :key="photo.id || index"
                :src="resolveImage(photo.url)"
                alt="continent photo"
                class="h-10 w-16 object-cover rounded-md border"
                style="border-color: var(--border)"
              />
              <span v-if="row.photos.length > 3" class="text-xs text-slate-500">
                +{{ row.photos.length - 3 }}
              </span>
            </template>
            <span v-else class="text-xs text-slate-400">未上传</span>
          </div>
        </template>
        <template #cell:updatedAt="{ row }">
          <span class="text-xs text-slate-500">
            {{ row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-' }}
          </span>
        </template>
        <template #cell:actions="{ row }">
          <div class="flex justify-end gap-2">
            <button
              class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              @click="goMarkers(row)"
            >
              城市管理
            </button>
            <button
              class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50"
              @click="openEdit(row)"
              aria-label="编辑"
            >
              <svg class="h-3.5 w-3.5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                <path d="M14.06 5.94l3.75 3.75" />
              </svg>
            </button>
            <button
              class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
              @click="onDelete(row.id)"
              aria-label="删除"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <rect x="6" y="6" width="12" height="14" rx="2" />
              </svg>
            </button>
          </div>
        </template>
      </UiTable>
    </div>
  </div>
</template>


