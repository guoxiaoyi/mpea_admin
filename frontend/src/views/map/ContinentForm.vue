<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  createMapContinent,
  getMapContinent,
  updateMapContinent,
  fetchLocationContinents
} from '@/api/map';
import { uploadImage } from '@/api/upload';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const uploadingIndex = ref(null);
const locationOptions = ref([]);
const loadingLocationOptions = ref(false);
const autoFillReady = ref(false);
const selectableLocationOptions = computed(() => {
  if (!form.value.code) return locationOptions.value;
  const exists = locationOptions.value.some((item) => item.code === form.value.code);
  if (exists) return locationOptions.value;
  const fallbackLabel = form.value.code.toUpperCase();
  return [
    ...locationOptions.value,
    {
      code: form.value.code,
      nameZh: fallbackLabel,
      nameEn: fallbackLabel
    }
  ];
});

const form = ref({
  name: '',
  code: '',
  description: '',
  sortOrder: 0,
  status: 'enabled',
  photos: []
});

const apiBase = (import.meta.env.VITE_API_BASE || window.location.origin).replace(/\/$/, '');

function resolveImage(url) {
  if (!url) return '';
  try {
    return new URL(url, `${apiBase}/`).href;
  } catch (e) {
    return url;
  }
}

function ensureAtLeastOnePhoto() {
  if (form.value.photos.length === 0) {
    form.value.photos.push({ url: '', sortOrder: form.value.photos.length });
  }
}

function addPhoto() {
  form.value.photos.push({
    url: '',
    sortOrder: form.value.photos.length
  });
}

function removePhoto(index) {
  form.value.photos.splice(index, 1);
  if (form.value.photos.length === 0) {
    ensureAtLeastOnePhoto();
  }
  syncPhotoSortOrders();
}

async function loadLocationOptions() {
  loadingLocationOptions.value = true;
  try {
    const res = await fetchLocationContinents();
    if (res.success) {
      locationOptions.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (error) {
    console.warn('加载洲列表失败', error);
  } finally {
    loadingLocationOptions.value = false;
  }
}

async function onUpload(event, index) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const oversize = files.find((file) => file.size > 5 * 1024 * 1024);
  if (oversize) {
    alert(`图片大小不能超过 5MB：${oversize.name}`);
    event.target.value = '';
    return;
  }

  uploadingIndex.value = index;
  try {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const url = await uploadImage(file);
      if (i === 0) {
        if (form.value.photos[index]) {
          form.value.photos[index].url = url;
        } else {
          form.value.photos[index] = {
            url,
            sortOrder: index
          };
        }
      } else {
        form.value.photos.push({
          url,
          sortOrder: form.value.photos.length
        });
      }
    }
    syncPhotoSortOrders();
  } catch (e) {
    alert(e.message || '上传失败，请重试');
  } finally {
    uploadingIndex.value = null;
    event.target.value = '';
  }
}

function syncPhotoSortOrders() {
  form.value.photos.forEach((photo, idx) => {
    photo.sortOrder = Number.isFinite(photo.sortOrder) ? Number(photo.sortOrder) : idx;
  });
}

function normalizePayload() {
  const payload = {
    name: form.value.name.trim(),
    code: form.value.code ? form.value.code.trim().toLowerCase() : null,
    description: form.value.description || '',
    sortOrder: Number(form.value.sortOrder) || 0,
    status: form.value.status,
    photos: (form.value.photos || [])
      .filter((p) => p && p.url)
      .map((p, index) => ({
        url: p.url,
        sortOrder: Number.isFinite(p.sortOrder) ? p.sortOrder : Number(p.sortOrder) || index
      }))
  };
  return payload;
}

async function onSubmit() {
  errorMsg.value = '';
  if (!form.value.name.trim()) {
    errorMsg.value = '请填写洲名称';
    return;
  }
  saving.value = true;
  try {
    const payload = normalizePayload();
    if (isEdit.value) {
      await updateMapContinent(route.params.id, payload);
    } else {
      await createMapContinent(payload);
    }
    router.replace('/admin/map/continents');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function loadDetail() {
  if (!isEdit.value) {
    ensureAtLeastOnePhoto();
    return;
  }
  loading.value = true;
  try {
    const res = await getMapContinent(route.params.id);
    if (res.success) {
      const data = res.data || {};
      form.value = {
        name: data.name || '',
        code: data.code ? String(data.code).toLowerCase() : '',
        description: data.description || '',
        sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : Number(data.sortOrder) || 0,
        status: data.status || 'enabled',
        photos: Array.isArray(data.photos)
          ? data.photos.map((p, index) => ({
              id: p.id,
              url: p.url || '',
              sortOrder: Number.isFinite(p.sortOrder) ? p.sortOrder : Number(p.sortOrder) || index
            }))
          : []
      };
      ensureAtLeastOnePhoto();
    } else {
      errorMsg.value = res.message || '未能加载洲信息';
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

watch(
  () => form.value.code,
  (code, prev) => {
    if (!code) return;
    const normalized = code.toLowerCase();
    if (code !== normalized) {
      form.value.code = normalized;
      return;
    }
    if (!autoFillReady.value) return;
    const option = locationOptions.value.find((item) => item.code === normalized);
    if (!option) return;
    if (!form.value.name.trim()) {
      form.value.name = option.nameZh || option.nameEn || form.value.name;
    }
    if (!form.value.description.trim() && option.nameEn) {
      form.value.description = option.nameEn;
    }
  }
);

onMounted(async () => {
  await loadLocationOptions();
  await loadDetail();
  autoFillReady.value = true;
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑洲信息' : '新增洲信息' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新洲详情、图片与状态' : '配置新的洲及展示图片' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto max-w-3xl">
      <div v-if="loading" class="text-center text-slate-500 py-12">加载中…</div>
      <div v-else class="grid gap-6">
        <div>
          <label class="block text-base font-medium text-slate-700">洲名称</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="例如：亚洲、欧洲"
            class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
          />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">洲代号</label>
          <select
            v-model="form.code"
            :disabled="loadingLocationOptions"
            class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base disabled:opacity-60"
          >
            <option value="" disabled>{{ loadingLocationOptions ? '加载中…' : '请选择洲代号' }}</option>
            <option
              v-for="item in selectableLocationOptions"
              :key="item.code"
              :value="item.code"
            >
              {{ item.nameZh || item.nameEn || item.code }} ({{ item.code }})
            </option>
          </select>
          <p class="text-xs text-slate-400 mt-1">请选择洲代号，便于批量导入时自动匹配。如果需要新增代号，请先在后台新增城市标记时使用国家选择以自动创建。</p>
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">简介描述（可选）</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="补充介绍该洲的内容，支持多行"
            class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-base"
          />
        </div>

        <div>
          <label class="block text-base font-medium text-slate-700">排序</label>
          <input
            v-model.number="form.sortOrder"
            type="number"
            placeholder="数字越小越靠前，默认为 0"
            class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
          />
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

        <div>
          <div class="flex items-center justify-between">
            <label class="block text-base font-medium text-slate-700">展示图片</label>
            <button class="text-sm text-indigo-600 hover:text-indigo-500" type="button" @click="addPhoto">新增图片</button>
          </div>
          <p class="text-xs text-slate-400 mt-1">可上传多张图片用于前端展示，支持一次性选择多文件并调整顺序</p>

          <div class="mt-4 space-y-4">
            <div
              v-for="(photo, index) in form.photos"
              :key="index"
              class="rounded-lg border p-4"
              style="border-color: var(--border); background: var(--surface)"
            >
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">图片地址</label>
                  <div class="flex gap-3 items-center">
                    <input
                      v-model="photo.url"
                      type="text"
                      placeholder="/uploads/images/..."
                      class="flex-1 rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-11 px-3 text-base"
                    />
                    <label class="ui-btn-outline relative overflow-hidden">
                      <span>{{ uploadingIndex === index ? '上传中…' : '上传图片' }}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        class="absolute inset-0 opacity-0 cursor-pointer"
                        :disabled="uploadingIndex === index"
                        @change="(e) => onUpload(e, index)"
                      />
                    </label>
                    <button
                      v-if="form.photos.length > 1"
                      class="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600"
                      type="button"
                      @click="removePhoto(index)"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 items-center">
                  <div>
                    <label class="text-sm font-medium text-slate-700">排序值</label>
                    <input
                      v-model.number="photo.sortOrder"
                      type="number"
                      class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-11 px-3 text-base"
                    />
                  </div>
                  <div class="min-h-[120px] rounded-lg border bg-white flex items-center justify-center overflow-hidden" style="border-color: var(--border)">
                    <img v-if="photo.url" :src="resolveImage(photo.url)" alt="预览图" class="h-full w-full object-cover" />
                    <span v-else class="text-xs text-slate-400">暂无预览</span>
                  </div>
                </div>
              </div>
            </div>
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


