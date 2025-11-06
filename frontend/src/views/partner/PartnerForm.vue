<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createPartner, getPartner, updatePartner } from '@/api/partner';
import { uploadImage } from '@/api/upload';

const router = useRouter();
const route = useRoute();

const form = ref({
  title: '',
  image: '',
  link: '',
  sortOrder: 0,
  status: 'enabled'
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
  if (!form.value.title || !form.value.image) {
    errorMsg.value = '标题与图片为必填项';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.value.title,
      image: form.value.image,
      link: form.value.link || '',
      sortOrder: form.value.sortOrder,
      status: form.value.status
    };
    if (isEdit.value) {
      await updatePartner(route.params.id, payload);
    } else {
      await createPartner(payload);
    }
    router.replace('/admin/partners');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function onUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // 检查文件大小（限制 5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB');
    return;
  }
  
  uploading.value = true;
  try {
    const url = await uploadImage(file);
    form.value.image = url;
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
      const res = await getPartner(id);
      if (res.data?.success) {
        const d = res.data.data || {};
        form.value = {
          title: d.title || '',
          image: d.image || '',
          link: d.link || '',
          sortOrder: d.sortOrder || 0,
          status: d.status || 'enabled'
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
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑合作伙伴' : '新增合作伙伴' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新合作伙伴信息' : '录入新的合作伙伴' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto">
      <div class="grid gap-5">
        <div>
          <label class="block text-base font-medium text-slate-700">标题</label>
          <input v-model="form.title" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="请输入标题" />
        </div>

        <div class="grid gap-2">
          <label class="block text-base font-medium text-slate-700">图片</label>
          <div class="flex items-center gap-3">
            <input v-model="form.image" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
            <label class="ui-btn-outline relative overflow-hidden">
              <span>{{ uploading ? '上传中…' : '上传图片' }}</span>
              <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploading" @change="onUpload" />
            </label>
          </div>
          <p class="text-xs text-slate-400">支持直接填写链接或上传图片，建议尺寸 200×80 以上</p>
          <img v-if="form.image" :src="resolveImage(form.image)" alt="合作伙伴图片预览" class="h-28 w-auto rounded object-contain border bg-gray-50 p-2" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">链接</label>
          <input v-model="form.link" type="url" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="请输入链接地址（可选）" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">排序</label>
          <input v-model.number="form.sortOrder" type="number" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="数字越小越靠前，默认为 0" />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700 mb-2">状态</label>
          <div class="flex gap-4">
            <label class="flex items-center cursor-pointer">
              <input v-model="form.status" type="radio" value="enabled" class="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-base text-slate-700">启用</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input v-model="form.status" type="radio" value="disabled" class="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-base text-slate-700">禁用</span>
            </label>
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
