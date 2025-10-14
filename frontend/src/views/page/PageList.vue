<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPages, createPage, updatePage, deletePage } from '@/api/page';

const router = useRouter();
const list = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const keyword = ref('');
const loading = ref(false);

const showModal = ref(false);
const isEdit = ref(false);
const form = ref({ id: null, title: '', path: '', content: '', status: 'draft' });
const errorMsg = ref('');

async function load() {
  loading.value = true;
  try {
    const res = await fetchPages({ page: page.value, limit: limit.value, keyword: keyword.value });
    if (res.success) {
      list.value = res.data.data;
      total.value = res.data.total;
    }
  } finally {
    loading.value = false;
  }
}

function openEdit(row) {
  isEdit.value = true;
  form.value = { id: row.id, title: row.title, path: row.path, content: row.content || '', status: row.status };
  errorMsg.value = '';
  showModal.value = true;
}

async function onSubmit() {
  errorMsg.value = '';
  if (!form.value.title || !form.value.path) {
    errorMsg.value = '标题和路径必填';
    return;
  }
  try {
    if (isEdit.value) {
      await updatePage(form.value.id, {
        title: form.value.title,
        path: form.value.path,
        content: form.value.content,
        status: form.value.status,
      });
    } else {
      await createPage({
        title: form.value.title,
        path: form.value.path,
        content: form.value.content,
        status: form.value.status,
      });
    }
    showModal.value = false;
    await load();
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '保存失败';
  }
}

async function onDelete(id) {
  if (!confirm('确定删除该页面吗？')) return;
  await deletePage(id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">页面管理</div>
        <p class="text-sm text-slate-500 mt-1">管理站点内容页面，支持搜索与编辑</p>
      </div>
      <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="() => router.push('/admin/pages/new')">新增页面</button>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 w-72 rounded-md border border-slate-300 px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-indigo-500">
        <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="keyword" type="text" placeholder="搜索标题/路径" class="w-full bg-transparent outline-none" />
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50" @click="() => { page.value = 1; load(); }">搜索</button>
    </div>

    <div class="overflow-x-auto rounded-xl ring-1 ring-slate-200 bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-3 py-2 text-left">ID</th>
            <th class="px-3 py-2 text-left">标题</th>
            <th class="px-3 py-2 text-left">路径</th>
            <th class="px-3 py-2 text-left">状态</th>
            <th class="px-3 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row.id" class="border-t hover:bg-slate-50/50">
            <td class="px-3 py-2">{{ row.id }}</td>
            <td class="px-3 py-2">{{ row.title }}</td>
            <td class="px-3 py-2">{{ row.path }}</td>
            <td class="px-3 py-2">
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="row.status === 'published' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="px-3 py-2 space-x-2">
              <button class="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-slate-50" @click="openEdit(row)">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M14.06 5.94l3.75 3.75"/></svg>
                编辑
              </button>
              <button class="inline-flex items-center gap-1 rounded border px-2 py-1 text-red-600 hover:bg-red-50" @click="onDelete(row.id)">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="6" y="6" width="12" height="14" rx="2"/></svg>
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal：编辑用（新增改为新页面） -->
    <div v-if="showModal" class="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">{{ isEdit ? '编辑页面' : '新增页面' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-700">标题</label>
            <input v-model="form.title" type="text" class="mt-1 w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">路径</label>
            <input v-model="form.path" type="text" placeholder="/about" class="mt-1 w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">内容</label>
            <textarea v-model="form.content" rows="5" class="mt-1 w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">状态</label>
            <select v-model="form.status" class="mt-1 w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </div>
          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50" @click="showModal = false">取消</button>
          <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="onSubmit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
