<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createBoardChair, fetchBoardChairDetail, updateBoardChair } from '@/api/boardChair';
import { uploadImage } from '@/api/upload';
import UEditor from '@/components/UEditor.vue';

const router = useRouter();
const route = useRoute();

const form = ref({
  name: '',
  nameEn: '',
  position: '',
  positionEn: '',
  avatar: '',
  introduction: '',
  introductionEn: '',
  sortOrder: 0
});
const isEdit = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const uploading = ref(false);
const introUploading = ref(false);
const introEnUploading = ref(false);

const handleIntroPending = (pending) => {
  introUploading.value = pending;
};
const handleIntroEnPending = (pending) => {
  introEnUploading.value = pending;
};

const apiBase = (import.meta.env.VITE_API_BASE || window.location.origin).replace(/\/$/, '');

function resolveImage(url) {
  if (!url) return '';
  try {
    return new URL(url, `${apiBase}/`).href;
  } catch (e) {
    return url;
  }
}

async function onUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const url = await uploadImage(file);
    form.value.avatar = url;
  } catch (e) {
    alert(e.message || '上传失败，请重试');
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

async function onSubmit() {
  errorMsg.value = '';
  if (!form.value.name || !form.value.nameEn || !form.value.avatar) {
    errorMsg.value = '请填写中文标题、英文标题并上传头像';
    return;
  }
  if (introUploading.value || introEnUploading.value) {
    errorMsg.value = '图片仍在上传，请稍候完成后再保存';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      nameEn: form.value.nameEn,
      position: form.value.position || '',
      positionEn: form.value.positionEn || '',
      avatar: form.value.avatar,
      introduction: form.value.introduction || '',
      introductionEn: form.value.introductionEn || '',
      sortOrder: form.value.sortOrder ?? 0
    };
    if (isEdit.value) {
      await updateBoardChair(route.params.id, payload);
    } else {
      await createBoardChair(payload);
    }
    router.replace('/admin/board-chair');
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
      const res = await fetchBoardChairDetail(id);
      if (res.success) {
        const d = res.data || {};
        form.value = {
          name: d.name || '',
          nameEn: d.nameEn || '',
          position: d.position || '',
          positionEn: d.positionEn || '',
          avatar: d.avatar || '',
          introduction: d.introduction || '',
          introductionEn: d.introductionEn || '',
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
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑董事会主席' : '新增董事会主席' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新主席信息' : '录入新的主席信息' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto">
      <div class="grid gap-5">
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">中文标题</label>
            <input v-model="form.name" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" />
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">英文标题</label>
            <input v-model="form.nameEn" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="Title in English" />
          </div>
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">职位</label>
          <input v-model="form.position" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="如：董事会主席、理事等" />
        </div>
        <div>
          <label class="block text-base font-medium text-slate-700">职位（英文）</label>
          <input v-model="form.positionEn" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="Position in English" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">头像</label>
          <div class="flex items-center gap-3">
            <input v-model="form.avatar" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
            <label class="ui-btn-outline relative overflow-hidden">
              <span>{{ uploading ? '上传中…' : '上传图片' }}</span>
              <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploading" @change="onUpload" />
            </label>
          </div>
          <p class="text-xs text-slate-400 mt-1">建议尺寸 480×480 以上，支持直接填写链接或上传</p>
          <img v-if="form.avatar" :src="resolveImage(form.avatar)" alt="头像预览" class="mt-3 h-32 w-32 rounded-full object-cover border" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700 mb-1">中文介绍</label>
          <UEditor
            v-model="form.introduction"
            :height="320"
            server-url="/api/ueditor/controller"
            @pending-change="handleIntroPending"
          />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700 mb-1">英文介绍</label>
          <UEditor
            v-model="form.introductionEn"
            :height="320"
            server-url="/api/ueditor/controller"
            @pending-change="handleIntroEnPending"
          />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">排序</label>
          <input
            v-model.number="form.sortOrder"
            type="number"
            class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
            placeholder="数字越小越靠前，默认为 0"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <p
          v-if="introUploading || introEnUploading"
          class="text-sm text-amber-600 mr-auto"
        >
          图片上传中，请稍候保存…
        </p>
        <button class="rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50" @click="() => router.back()">取消</button>
        <button
          :disabled="saving || introUploading || introEnUploading"
          class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
          @click="onSubmit"
        >
          {{ saving ? '保存中…' : (isEdit ? '更新' : '保存') }}
        </button>
      </div>
    </div>
  </div>
</template>


