<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createLecturer, fetchLecturerDetail, updateLecturer } from '@/api/lecturer';
import { uploadImage } from '@/api/upload';

const router = useRouter();
const route = useRoute();

const form = ref({
  name: '',
  photo: '',
  introduction: ''
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

async function onSubmit() {
  errorMsg.value = '';
  if (!form.value.name || !form.value.photo) {
    errorMsg.value = '姓名与照片为必填项';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      photo: form.value.photo,
      introduction: form.value.introduction || ''
    };
    if (isEdit.value) {
      await updateLecturer(route.params.id, payload);
    } else {
      await createLecturer(payload);
    }
    router.replace('/admin/lecturers');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function onUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const url = await uploadImage(file);
    form.value.photo = url;
  } catch (e) {
    alert(e.message || '上传失败，请重试');
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    isEdit.value = true;
    try {
      const res = await fetchLecturerDetail(id);
      if (res.success) {
        const d = res.data || {};
        form.value = {
          name: d.name || '',
          photo: d.photo || '',
          introduction: d.introduction || ''
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
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑讲师' : '新增讲师' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新讲师展示信息' : '录入新的讲师资料' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto">
      <div class="grid gap-5">
        <div>
          <label class="block text-base font-medium text-slate-700">姓名</label>
          <input v-model="form.name" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" />
        </div>

        <div class="grid gap-2">
          <label class="block text-base font-medium text-slate-700">照片</label>
          <div class="flex items-center gap-3">
            <input v-model="form.photo" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
            <label class="ui-btn-outline relative overflow-hidden">
              <span>{{ uploading ? '上传中…' : '上传图片' }}</span>
              <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploading" @change="onUpload" />
            </label>
          </div>
          <p class="text-xs text-slate-400">支持直接填写链接或上传图片，建议尺寸 360×360 以上</p>
          <img v-if="form.photo" :src="resolveImage(form.photo)" alt="讲师照片预览" class="h-28 w-28 rounded object-cover border" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">介绍</label>
          <textarea v-model="form.introduction" rows="6" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" placeholder="讲师介绍" />
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


