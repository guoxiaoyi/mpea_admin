<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createKindergarten, fetchKindergartenDetail, updateKindergarten } from '@/api/kindergarten';
import { uploadImage } from '@/api/upload';

const router = useRouter();
const route = useRoute();

const form = ref({
  name: '',
  nameEn: '',
  address: '',
  addressEn: '',
  logo: '',
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
  const current = form.value;
  if (!current.name || !current.nameEn || !current.address || !current.addressEn || !current.logo) {
    errorMsg.value = '请填写完整的名称、地址以及上传 Logo';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: current.name,
      nameEn: current.nameEn,
      address: current.address,
      addressEn: current.addressEn,
      logo: current.logo,
      sortOrder: current.sortOrder ?? 0,
      status: current.status || 'enabled'
    };
    if (isEdit.value) {
      await updateKindergarten(route.params.id, payload);
    } else {
      await createKindergarten(payload);
    }
    router.replace('/admin/kindergartens');
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
    form.value.logo = url;
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
      const res = await fetchKindergartenDetail(id);
      if (res.success) {
        const d = res.data || {};
        form.value = {
          name: d.name || '',
          nameEn: d.nameEn || '',
          address: d.address || '',
          addressEn: d.addressEn || '',
          logo: d.logo || '',
          sortOrder: Number.isFinite(d.sortOrder) ? d.sortOrder : Number(d.sortOrder) || 0,
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
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑推荐幼儿园' : '新增推荐幼儿园' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新幼儿园展示信息' : '录入新的推荐幼儿园' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto">
      <div class="grid gap-5">
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">中文名称</label>
            <input v-model="form.name" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" />
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">英文名称</label>
            <input v-model="form.nameEn" type="text" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="Kindergarten Name in English" />
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">中文地址</label>
            <textarea v-model="form.address" rows="3" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" placeholder="详细地址" />
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">英文地址</label>
            <textarea v-model="form.addressEn" rows="3" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Address in English" />
          </div>
        </div>

        <div class="grid gap-2">
          <label class="block text-base font-medium text-slate-700">Logo</label>
          <div class="flex items-center gap-3">
            <input v-model="form.logo" type="text" placeholder="/uploads/images/..." class="flex-1 rounded-md border border-slate-300 h-11 px-3 focus:border-indigo-500 focus:ring-indigo-500" />
            <label class="ui-btn-outline relative overflow-hidden">
              <span>{{ uploading ? '上传中…' : '上传图片' }}</span>
              <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="uploading" @change="onUpload" />
            </label>
          </div>
          <p class="text-xs text-slate-400">支持直接填写链接或上传图片，建议尺寸 360×360 以上</p>
          <img v-if="form.logo" :src="resolveImage(form.logo)" alt="Logo 预览" class="h-28 w-28 rounded object-cover border" />
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="block text-base font-medium text-slate-700">排序</label>
            <input v-model.number="form.sortOrder" type="number" class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base" placeholder="数字越小越靠前，默认为 0" />
          </div>
          <div>
            <label class="block text-base font-medium text-slate-700">状态</label>
            <select v-model="form.status" class="mt-1 w-full rounded-md border border-slate-300 h-12 px-3 focus:border-indigo-500 focus:ring-indigo-500 text-base">
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
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


