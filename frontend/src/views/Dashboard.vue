<script setup>
import { ref, onMounted } from 'vue';
import { fetchPages } from '@/api/page';
import UiTable from '@/components/UiTable.vue';

const loading = ref(true);
const stats = ref([
  { label: '页面总数', value: '—' },
  { label: '发布页面', value: '—' },
  { label: '草稿', value: '—' },
  { label: '最近更新', value: '—' },
]);
const recent = ref([]);

async function load() {
  loading.value = true;
  try {
    const res = await fetchPages({ page: 1, limit: 5, keyword: '' });
    if (res.success) {
      const rows = res.data.data || [];
      recent.value = rows.slice(0, 5);
      const total = res.data.total ?? rows.length;
      const published = rows.filter(r => r.status === 'published').length;
      const drafts = total - published;
      stats.value = [
        { label: '页面总数', value: String(total) },
        { label: '发布页面', value: String(published) },
        { label: '草稿', value: String(drafts) },
        { label: '最近更新', value: rows[0]?.updatedAt ? new Date(rows[0].updatedAt).toLocaleString() : '—' },
      ];
    }
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">概览</h1>
        <p class="text-sm text-slate-500 mt-1">站点关键指标与最近动态</p>
      </div>
      <button class="ui-btn-outline" @click="load">刷新</button>
    </div>

    <!-- KPI cards BankDash 风格：左色条，右侧数值 -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="s in stats" :key="s.label" class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div class="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center">{{ s.label.slice(0,1) }}</div>
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-wide text-slate-500">{{ s.label }}</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900" :class="{ 'animate-pulse': loading }">{{ s.value }}</p>
        </div>
      </div>
    </div>

    <!-- Recent table: 与 /pages 使用同一 UiTable 组件，确保一致 -->
    <div class="ui-panel border-none p-0 overflow-hidden">
      <div class="px-6 py-4 border-b" style="border-color: var(--border)">
        <div class="font-medium text-slate-900">最近页面</div>
      </div>
      <UiTable
        :columns="[
          { key: 'title', label: '标题' },
          { key: 'path', label: '路径' },
          { key: 'status', label: '状态' },
          { key: 'updatedAt', label: '更新时间' },
        ]"
        :rows="recent.map(r => ({...r, updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}))"
        :loading="loading"
        density="normal"
      >
        <template #cell:status="{ row }">
          <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="row.status === 'published' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </span>
        </template>
      </UiTable>
    </div>
  </div>
</template>
