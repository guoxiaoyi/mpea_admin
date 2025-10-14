<script setup>
import { ref, onMounted } from 'vue';
import { fetchPages } from '@/api/page';

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
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">概览</div>
        <p class="text-sm text-slate-500 mt-1">内容与页面的总体情况</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50" @click="load">刷新</button>
    </div>

    <!-- Stat cards -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="s in stats" :key="s.label" class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <p class="text-sm text-slate-500">{{ s.label }}</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900" :class="{ 'animate-pulse': loading }">{{ s.value }}</p>
      </div>
    </div>

    <!-- Recent table -->
    <div class="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200">
        <div class="font-medium text-slate-900">最近页面</div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="px-6 py-2 text-left">标题</th>
              <th class="px-6 py-2 text-left">路径</th>
              <th class="px-6 py-2 text-left">状态</th>
              <th class="px-6 py-2 text-left">更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="px-6 py-4 text-slate-500" colspan="4">加载中…</td>
            </tr>
            <tr v-else-if="recent.length === 0">
              <td class="px-6 py-4 text-slate-500" colspan="4">暂无数据</td>
            </tr>
            <tr v-else v-for="row in recent" :key="row.id" class="border-t">
              <td class="px-6 py-2">{{ row.title }}</td>
              <td class="px-6 py-2">{{ row.path }}</td>
              <td class="px-6 py-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="row.status === 'published' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'">
                  {{ row.status === 'published' ? '已发布' : '草稿' }}
                </span>
              </td>
              <td class="px-6 py-2">{{ row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
