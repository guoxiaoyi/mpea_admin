<script setup>
import { ref, onMounted } from 'vue';
import { fetchContactMessages, updateContactMessageStatus, deleteContactMessage } from '@/api/contactMessage';
import UiTable from '@/components/UiTable.vue';

const list = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const type = ref('');
const status = ref('');
const keyword = ref('');
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await fetchContactMessages({
      page: page.value,
      limit: limit.value,
      type: type.value || undefined,
      status: status.value || undefined,
      keyword: keyword.value || undefined
    });
    if (res.success) {
      list.value = res.data.data || [];
      total.value = res.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

async function onMarkStatus(row, newStatus) {
  if (row.status === newStatus) return;
  await updateContactMessageStatus(row.id, newStatus);
  await load();
}

async function onDelete(row) {
  if (!confirm('确定删除该条提交记录吗？')) return;
  await deleteContactMessage(row.id);
  await load();
}

function formatType(value) {
  if (value === 'business') return '机构合作';
  if (value === 'parenting') return '家庭/亲子';
  return value || '-';
}

function formatStatus(value) {
  if (value === 'processed') return '已处理';
  if (value === 'spam') return '疑似垃圾';
  return '新提交';
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">联系表单提交</div>
        <p class="text-sm text-slate-500 mt-1">查看用户通过官网联系表单提交的咨询与合作意向</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 items-center">
      <div class="flex items-center gap-2 w-72 rounded-full border px-3 py-1.5" style="border-color: var(--border); background: var(--surface)">
        <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="keyword" type="text" placeholder="搜索电话、机构名称或内容" class="w-full bg-transparent outline-none" />
      </div>
      <select v-model="type" class="rounded-full border px-3 py-1.5 text-sm" style="border-color: var(--border); background: var(--surface)">
        <option value="">全部类型</option>
        <option value="parenting">家庭/亲子</option>
        <option value="business">机构合作</option>
      </select>
      <select v-model="status" class="rounded-full border px-3 py-1.5 text-sm" style="border-color: var(--border); background: var(--surface)">
        <option value="">全部状态</option>
        <option value="new">新提交</option>
        <option value="processed">已处理</option>
        <option value="spam">疑似垃圾</option>
      </select>
      <button class="ui-btn-primary" @click="() => { page.value = 1; load(); }">筛选</button>
    </div>

    <div class="ui-panel border-none p-0 overflow-hidden">
      <div class="px-6 py-4 border-b" style="border-color: var(--border)">
        <div class="font-medium text-slate-900">提交列表（共 {{ total }} 条）</div>
      </div>

      <UiTable
        :columns="[
          { key: 'createdAt', label: '提交时间', width: '160px' },
          { key: 'type', label: '类型', width: '100px' },
          { key: 'phone', label: '联系方式', width: '140px' },
          { key: 'company', label: '公司/机构' },
          { key: 'childAge', label: '孩子年龄', width: '100px' },
          { key: 'status', label: '状态', width: '100px' },
          { key: 'content', label: '内容摘要' },
          { key: 'actions', label: '操作', width: '200px', align: 'right' },
        ]"
        :rows="list"
        :loading="loading"
        density="normal"
      >
        <template #cell:createdAt="{ row }">
          <span class="text-slate-600 text-xs">{{ row.createdAt }}</span>
        </template>
        <template #cell:type="{ row }">
          <span class="text-slate-700 text-sm">{{ formatType(row.type) }}</span>
        </template>
        <template #cell:status="{ row }">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="{
              'bg-emerald-100 text-emerald-700': row.status === 'processed',
              'bg-amber-100 text-amber-700': row.status === 'new',
              'bg-rose-100 text-rose-700': row.status === 'spam',
            }"
          >
            {{ formatStatus(row.status) }}
          </span>
        </template>
        <template #cell:childAge="{ row }">
          <span class="text-slate-700 text-sm">
            {{ row.childAge != null ? row.childAge + ' 岁' : '-' }}
          </span>
        </template>
        <template #cell:content="{ row }">
          <span class="text-slate-600 text-xs leading-snug line-clamp-3">
            <!-- parenting 优先展示问题，business 展示意向 -->
            {{ row.problem || row.intention || row.interest || '-' }}
          </span>
        </template>
        <template #cell:actions="{ row }">
          <div class="flex justify-end gap-2">
            <button
              class="inline-flex items-center rounded-full px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50"
              @click="onMarkStatus(row, 'processed')"
            >
              标记已处理
            </button>
            <button
              class="inline-flex items-center rounded-full px-2.5 py-1 text-xs border border-rose-200 text-rose-600 hover:bg-rose-50"
              @click="onMarkStatus(row, 'spam')"
            >
              标记垃圾
            </button>
            <button
              class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
              @click="onDelete(row)"
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


