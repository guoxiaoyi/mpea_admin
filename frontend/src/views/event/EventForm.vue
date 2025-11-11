<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createEvent, fetchEventDetail, updateEvent } from '@/api/event';
import { uploadImage } from '@/api/upload';
import UEditor from '@/components/UEditor.vue';
import { AppDateTimePicker } from '@boichikpro/vue3-date-time-picker';
import '@boichikpro/vue3-date-time-picker/assets/style.css';
import '@boichikpro/vue3-date-time-picker/assets/variables.css';
import './my-custom-styles.css';

const router = useRouter();
const route = useRoute();

const form = ref({
  title: '',
  titleEn: '',
  cover: '',
  eventDate: '',
  content: '',
  contentEn: '',
  status: 'draft',
  sortOrder: 0
});
const isEdit = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const uploading = ref(false);

const apiBase = (import.meta.env.VITE_API_BASE || window.location.origin).replace(/\/$/, '');

function resolveImage(url) {
  if (!url) return '';
  try {
    return new URL(url, `${apiBase}/`).href;
  } catch (e) {
    return url;
  }
}

function normalizeDateInput(value) {
  if (!value) return null;
 
  return new Date(value);
}

async function onUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const url = await uploadImage(file);
    form.value.cover = url;
  } catch (e) {
    alert(e.message || '上传失败，请重试');
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

async function onSubmit() {
  errorMsg.value = '';
  const current = form.value;
  console.log(current.title)
  console.log(current.titleEn)
  console.log(current.eventDate)
  console.log(current.cover)
  if (!current.title || !current.titleEn || !current.eventDate || !current.cover) {
    errorMsg.value = '请填写标题、英文标题、活动时间，并上传封面';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: current.title,
      titleEn: current.titleEn,
      cover: current.cover,
      eventDate: current.eventDate,
      content: current.content || '',
      contentEn: current.contentEn || '',
      status: current.status || 'draft',
      sortOrder: current.sortOrder ?? 0
    };
    if (isEdit.value) {
      await updateEvent(route.params.id, payload);
    } else {
      await createEvent(payload);
    }
    router.replace('/admin/events');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    isEdit.value = true;
    try {
      const res = await fetchEventDetail(id);
      if (res.success) {
        const d = res.data || {};
        form.value = {
          title: d.title || '',
          titleEn: d.titleEn || '',
          cover: d.cover || '',
          eventDate: normalizeDateInput(d.eventDate || ''),
          content: d.content || '',
          contentEn: d.contentEn || '',
          status: d.status || 'draft',
          sortOrder: Number.isFinite(d.sortOrder) ? d.sortOrder : Number(d.sortOrder) || 0
        };
      }
    } catch (e) {
      errorMsg.value = e.response?.data?.message || '加载失败，但仍可编辑';
    }
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑活动' : '新增活动' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新活动内容与时间' : '录入新的活动信息' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto">
      <div class="grid gap-5">
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">中文标题</label>
            <input v-model="form.title" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" />
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">英文标题</label>
            <input v-model="form.titleEn" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="Event Title in English" />
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">活动时间</label>
            <AppDateTimePicker v-model="form.eventDate" type="datetime" date-format="yyyy-MM-dd" time-format="HH:mm" class="mt-1" />
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">状态</label>
            <select v-model="form.status" class="mt-1 w-full rounded-md border border-slate-300 h-12 px-3 focus:border-indigo-500 focus:ring-indigo-500 text-base">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">封面</label>
            <div class="flex items-center gap-3">
              <input v-model="form.cover" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
              <label class="ui-btn-outline relative overflow-hidden">
                <span>{{ uploading ? '上传中…' : '上传图片' }}</span>
                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploading" @change="onUpload" />
              </label>
            </div>
            <p class="text-xs text-slate-400 mt-1">建议尺寸 960×540 以上，支持直接填写链接或上传图片</p>
            <img v-if="form.cover" :src="resolveImage(form.cover)" alt="封面预览" class="mt-3 h-32 w-full max-w-xs rounded object-cover border" />
          </div>
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700 mb-1">中文内容</label>
          <UEditor v-model="form.content" :height="360" server-url="/api/ueditor/controller" />
        </div>
        <div>
          <label class="block text-base font-medium text-slate-700 mb-1">英文内容</label>
          <UEditor v-model="form.contentEn" :height="360" server-url="/api/ueditor/controller" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">排序</label>
          <input v-model.number="form.sortOrder" type="number" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="数字越小越靠前，默认为 0" />
        </div>

        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50" @click="() => router.back()">取消</button>
        <button :disabled="saving" class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-60" @click="onSubmit">
          {{ saving ? '保存中…' : (isEdit ? '更新' : '保存') }}
        </button>
      </div>
    </div>
  </div>
</template>


