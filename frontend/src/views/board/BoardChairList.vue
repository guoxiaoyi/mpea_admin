<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchBoardChairs, deleteBoardChair } from '@/api/boardChair';
import UiTable from '@/components/UiTable.vue';

const router = useRouter();
const list = ref([]);
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

function truncate(text, max = 80) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchBoardChairs();
    if (res.success) {
      list.value = (res.data || []).map((item) => ({
        ...item,
        sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : Number(item.sortOrder) || 0
      }));
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  router.push('/admin/board-chair/new');
}

function openEdit(row) {
  router.push(`/admin/board-chair/${row.id}`);
}

async function onDelete(id) {
  if (!confirm('确定删除该主席信息吗？')) return;
  await deleteBoardChair(id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">董事会主席</div>
        <p class="text-sm text-slate-500 mt-1">维护董事会主席信息，支持中英文标题与介绍</p>
      </div>
      <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="openCreate">新增主席</button>
    </div>

    <div class="ui-panel border-none p-0 overflow-hidden">
      <div class="px-6 py-4 border-b" style="border-color: var(--border)">
        <div class="font-medium text-slate-900">主席列表（共 {{ list.length }} 位）</div>
      </div>
      <UiTable
        :columns="[
          { key: 'sortOrder', label: '排序', width: '80px' },
          { key: 'avatar', label: '头像', width: '120px' },
          { key: 'name', label: '中文标题' },
          { key: 'nameEn', label: '英文标题' },
          { key: 'position', label: '职位' },
          { key: 'positionEn', label: '职位（英文）' },
          { key: 'introduction', label: '中文介绍' },
          { key: 'introductionEn', label: '英文介绍' },
          { key: 'actions', label: '操作', align: 'right', width: '140px' }
        ]"
        :rows="list"
        :loading="loading"
        density="comfortable"
      >
        <template #cell:sortOrder="{ row }">
          <span class="text-slate-700">{{ row.sortOrder ?? 0 }}</span>
        </template>
        <template #cell:avatar="{ row }">
          <div class="flex items-center justify-start">
            <img v-if="row.avatar" :src="resolveImage(row.avatar)" alt="头像" class="h-12 w-12 rounded-full object-cover border" />
            <span v-else class="text-slate-400">-</span>
          </div>
        </template>
        <template #cell:introduction="{ row }">
          <span class="text-slate-600">{{ truncate(row.introduction) }}</span>
        </template>
        <template #cell:introductionEn="{ row }">
          <span class="text-slate-600">{{ truncate(row.introductionEn) }}</span>
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


