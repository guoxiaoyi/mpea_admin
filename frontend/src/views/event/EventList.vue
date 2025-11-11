<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchEvents, deleteEvent } from '@/api/event';
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

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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
    const res = await fetchEvents(params);
    if (res.success) {
      list.value = res.data.data || [];
      total.value = res.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  router.push('/admin/events/new');
}

function openEdit(row) {
  router.push(`/admin/events/${row.id}`);
}

async function onDelete(id) {
  if (!confirm('确定删除该活动吗？')) return;
  await deleteEvent(id);
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
        <div class="text-lg font-semibold text-slate-900">MPEA 活动</div>
        <p class="text-sm text-slate-500 mt-1">维护活动信息，支持中文与英文内容</p>
      </div>
      <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="openCreate">新增活动</button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-2 w-80 rounded-full border px-3 py-1.5" style="border-color: var(--border); background: var(--surface)">
        <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="keyword" type="text" placeholder="搜索标题或内容" class="w-full bg-transparent outline-none" />
      </div>
      <select v-model="status" class="rounded-lg border px-3 py-1.5 text-sm text-slate-600" style="border-color: var(--border); background: var(--surface)">
        <option value="">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
      </select>
      <button class="ui-btn-primary" @click="onSearch">搜索</button>
    </div>

    <div class="ui-panel border-none p-0 overflow-hidden">
      <div class="px-6 py-4 border-b" style="border-color: var(--border)">
        <div class="font-medium text-slate-900">活动列表（共 {{ total }} 条）</div>
      </div>
      <UiTable
        :columns="[
          { key: 'sortOrder', label: '排序', width: '80px' },
          { key: 'title', label: '中文标题' },
          { key: 'titleEn', label: '英文标题' },
          { key: 'cover', label: '封面', width: '120px' },
          { key: 'eventDate', label: '活动时间', width: '180px' },
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
        <template #cell:cover="{ row }">
          <div class="flex items-center justify-start">
            <img v-if="row.cover" :src="resolveImage(row.cover)" alt="封面" class="h-12 w-20 rounded object-cover border" />
            <span v-else class="text-slate-400">-</span>
          </div>
        </template>
        <template #cell:eventDate="{ row }">
          <span class="text-slate-600">{{ formatDate(row.eventDate) }}</span>
        </template>
        <template #cell:status="{ row }">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
          >
            {{ row.status === 'published' ? '已发布' : '草稿' }}
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


