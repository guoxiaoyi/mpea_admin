<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchKindergartens, deleteKindergarten } from '@/api/kindergarten';
import UiTable from '@/components/UiTable.vue';

const router = useRouter();
const list = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const keyword = ref('');
const status = ref('');
const loading = ref(false);

const apiBase = (import.meta.env.VITE_API_BASE || window.location.origin).replace(/\/$/, '');

function resolveImage(url) {
  if (!url) return '';
  try {
    return new URL(url, `${apiBase}/`).href;
  } catch (e) {
    return url;
  }
}

function truncate(text, max = 60) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function load() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      keyword: keyword.value || undefined,
      status: status.value || undefined
    };
    const res = await fetchKindergartens(params);
    if (res.success) {
      list.value = res.data.data || [];
      total.value = res.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  router.push('/admin/kindergartens/new');
}

function openEdit(row) {
  router.push(`/admin/kindergartens/${row.id}`);
}

async function onDelete(id) {
  if (!confirm('确定删除该幼儿园吗？')) return;
  await deleteKindergarten(id);
  await load();
}

function onSearch() {
  page.value = 1;
  load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">推荐幼儿园</div>
        <p class="text-sm text-slate-500 mt-1">维护推荐幼儿园信息，支持中英双语字段</p>
      </div>
      <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="openCreate">新增幼儿园</button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-2 w-80 rounded-full border px-3 py-1.5" style="border-color: var(--border); background: var(--surface)">
        <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="keyword" type="text" placeholder="搜索名称或地址" class="w-full bg-transparent outline-none" />
      </div>
      <select v-model="status" class="rounded-lg border px-3 py-1.5 text-sm text-slate-600" style="border-color: var(--border); background: var(--surface)">
        <option value="">全部状态</option>
        <option value="enabled">启用</option>
        <option value="disabled">停用</option>
      </select>
      <button class="ui-btn-primary" @click="onSearch">搜索</button>
    </div>

    <div class="ui-panel border-none p-0 overflow-hidden">
      <div class="px-6 py-4 border-b" style="border-color: var(--border)">
        <div class="font-medium text-slate-900">幼儿园列表（共 {{ total }} 所）</div>
      </div>
      <UiTable
        :columns="[
          { key: 'sortOrder', label: '排序', width: '80px' },
          { key: 'name', label: '中文名称' },
          { key: 'nameEn', label: '英文名称' },
          { key: 'logo', label: 'Logo' },
          { key: 'address', label: '中文地址' },
          { key: 'addressEn', label: '英文地址' },
          { key: 'status', label: '状态', width: '90px' },
          { key: 'actions', label: '操作', align: 'right', width: '140px' },
        ]"
        :rows="list"
        :loading="loading"
        density="normal"
      >
        <template #cell:sortOrder="{ row }">
          <span class="text-slate-700">{{ row.sortOrder ?? 0 }}</span>
        </template>
        <template #cell:logo="{ row }">
          <div class="flex items-center gap-3">
            <img v-if="row.logo" :src="resolveImage(row.logo)" alt="logo" class="h-12 w-12 object-cover rounded border" />
            <span v-else class="text-slate-400">-</span>
          </div>
        </template>
        <template #cell:address="{ row }">
          <span class="text-slate-600">{{ truncate(row.address, 40) }}</span>
        </template>
        <template #cell:addressEn="{ row }">
          <span class="text-slate-600">{{ truncate(row.addressEn, 40) }}</span>
        </template>
        <template #cell:status="{ row }">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="row.status === 'enabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
          >
            {{ row.status === 'enabled' ? '启用' : '停用' }}
          </span>
        </template>
        <template #cell:actions="{ row }">
          <div class="flex justify-end gap-2">
            <button class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50" @click="openEdit(row)" aria-label="编辑">
              <svg class="h-3.5 w-3.5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M14.06 5.94l3.75 3.75"/></svg>
            </button>
            <button class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50" @click="onDelete(row.id)" aria-label="删除">
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="6" y="6" width="12" height="14" rx="2"/></svg>
            </button>
          </div>
        </template>
      </UiTable>
    </div>
  </div>
</template>


