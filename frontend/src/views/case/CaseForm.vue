<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createCase, fetchCaseDetail, updateCase } from '@/api/case';
import { uploadImage } from '@/api/upload';

const router = useRouter();
const route = useRoute();

const form = ref({
  title: '',
  titleEn: '',
  professionalPhoto: '',
  childPhoto: '',
  introduction: '',
  introductionEn: '',
  featured: false
});
const isEdit = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const uploadingField = ref('');

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
  if (!form.value.title || !form.value.professionalPhoto || !form.value.childPhoto) {
    errorMsg.value = '标题、职业照、孩子照均为必填项';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.value.title,
      titleEn: form.value.titleEn || '',
      professionalPhoto: form.value.professionalPhoto,
      childPhoto: form.value.childPhoto,
      introduction: form.value.introduction || '',
      introductionEn: form.value.introductionEn || '',
      featured: !!form.value.featured
    };
    if (isEdit.value) {
      await updateCase(route.params.id, payload);
    } else {
      await createCase(payload);
    }
    router.replace('/admin/cases');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function onUpload(event, field) {
  const file = event.target.files?.[0];
  if (!file) return;
  uploadingField.value = field;
  try {
    const url = await uploadImage(file);
    form.value[field] = url;
  } catch (e) {
    alert(e.message || '上传失败，请重试');
  } finally {
    uploadingField.value = '';
    event.target.value = '';
  }
}

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    isEdit.value = true;
    try {
      const res = await fetchCaseDetail(id);
      if (res.success) {
        const d = res.data || {};
        form.value = {
          title: d.title || '',
          titleEn: d.titleEn || '',
          professionalPhoto: d.professionalPhoto || '',
          childPhoto: d.childPhoto || '',
          introduction: d.introduction || '',
          introductionEn: d.introductionEn || '',
          featured: !!d.featured
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
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑案例' : '新增案例' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新案例展示内容' : '录入新的案例信息' }}</p>
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
          <label class="block text-base font-medium text-slate-700">英文标题</label>
          <input v-model="form.titleEn" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="Optional English title" />
        </div>

        <div class="grid gap-2">
          <label class="block text-base font-medium text-slate-700">职业照</label>
          <div class="flex items-center gap-3">
            <input v-model="form.professionalPhoto" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
            <label class="ui-btn-outline relative overflow-hidden">
              <span>{{ uploadingField === 'professionalPhoto' ? '上传中…' : '上传图片' }}</span>
              <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploadingField === 'professionalPhoto'" @change="(e) => onUpload(e, 'professionalPhoto')" />
            </label>
          </div>
          <p class="text-xs text-slate-400">支持直接填写链接或上传图片，建议尺寸 480×480 以上</p>
          <img v-if="form.professionalPhoto" :src="resolveImage(form.professionalPhoto)" alt="职业照预览" class="h-28 w-28 rounded object-cover border" />
        </div>

        <div class="grid gap-2">
          <label class="block text-base font-medium text-slate-700">孩子照</label>
          <div class="flex items-center gap-3">
            <input v-model="form.childPhoto" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
            <label class="ui-btn-outline relative overflow-hidden">
              <span>{{ uploadingField === 'childPhoto' ? '上传中…' : '上传图片' }}</span>
              <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploadingField === 'childPhoto'" @change="(e) => onUpload(e, 'childPhoto')" />
            </label>
          </div>
          <p class="text-xs text-slate-400">支持直接填写链接或上传图片，建议尺寸 480×480 以上</p>
          <img v-if="form.childPhoto" :src="resolveImage(form.childPhoto)" alt="孩子照预览" class="h-28 w-28 rounded object-cover border" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">介绍</label>
          <textarea v-model="form.introduction" rows="6" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" placeholder="案例介绍" />
        </div>
        <div>
          <label class="block text-base font-medium text-slate-700">英文介绍</label>
          <textarea v-model="form.introductionEn" rows="6" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Case introduction in English" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">添加到首页</label>
          <div class="mt-2 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-pressed="form.featured"
              @click="form.featured = !form.featured"
              class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              :class="form.featured ? 'bg-indigo-600' : 'bg-slate-200'"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                :class="form.featured ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
            <span class="text-slate-700 text-base">{{ form.featured ? '是' : '否' }}</span>
          </div>
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


