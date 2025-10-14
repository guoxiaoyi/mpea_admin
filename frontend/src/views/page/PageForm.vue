<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createPage } from '@/api/page';

const router = useRouter();
const saving = ref(false);
const errorMsg = ref('');
const form = ref({ title: '', path: '', content: '', status: 'draft' });

const published = computed({
  get: () => form.value.status === 'published',
  set: (val) => {
    form.value.status = val ? 'published' : 'draft';
  }
});

async function onSubmit() {
  errorMsg.value = '';
  if (!form.value.title || !form.value.path) {
    errorMsg.value = '标题和路径必填';
    return;
  }
  saving.value = true;
  try {
    await createPage({
      title: form.value.title,
      path: form.value.path,
      content: form.value.content,
      status: form.value.status,
    });
    router.replace('/admin/pages');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '保存失败';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">新增页面</div>
        <p class="text-sm text-slate-500 mt-1">创建站点页面，支持草稿/发布</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto">
      <div class="grid gap-5">
        <div>
          <label class="block text-base font-medium text-slate-700">标题</label>
          <input v-model="form.title" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" />
        </div>
        <div>
          <label class="block text-base font-medium text-slate-700">路径</label>
          <input v-model="form.path" type="text" placeholder="/about" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" />
        </div>
        <div>
          <label class="block text-base font-medium text-slate-700">内容</label>
          <textarea v-model="form.content" rows="12" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-base p-3"></textarea>
        </div>
        <div>
          <label class="block text-base font-medium text-slate-700">状态</label>
          <div class="mt-2 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-pressed="published"
              @click="published = !published"
              class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              :class="published ? 'bg-indigo-600' : 'bg-slate-200'"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                :class="published ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
            <span class="text-slate-700 text-base">{{ published ? '发布' : '草稿' }}</span>
          </div>
        </div>
        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50" @click="() => router.back()">取消</button>
        <button :disabled="saving" class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-60" @click="onSubmit">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>


