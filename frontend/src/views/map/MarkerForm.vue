<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  fetchMapContinentSimple,
  createMapMarker,
  getMapMarker,
  updateMapMarker
} from '@/api/map';
import LocationExplorer from '@/components/LocationExplorer.vue';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const continentOptions = ref([]);
const locationFeedback = ref('');

const form = ref({
  continentId: '',
  country: '',
  city: '',
  latitude: '',
  longitude: '',
  sortOrder: 0,
  status: 'enabled'
});

const initialLocation = computed(() => ({
  continentCode: route.query.continentCode ? String(route.query.continentCode) : '',
  countryCode: route.query.countryCode ? String(route.query.countryCode).toUpperCase() : '',
  cityName: route.query.city ? String(route.query.city) : '',
  countryName: route.query.country ? String(route.query.country) : ''
}));

const explorerInitialLocation = computed(() => (isEdit.value ? {} : initialLocation.value));

async function loadContinents() {
  try {
    const res = await fetchMapContinentSimple();
    if (res.success) {
      continentOptions.value = res.data || [];
    }
  } catch (error) {
    console.warn('加载洲选项失败', error);
  }
}

function matchContinentId(hints = {}) {
  if (!continentOptions.value.length) return '';
  const normalizedCode = hints.code ? String(hints.code).toLowerCase() : '';
  const normalizedZh = hints.zh ? hints.zh.replace(/\s/g, '').toLowerCase() : '';
  const normalizedEn = hints.en ? hints.en.replace(/\s/g, '').toLowerCase() : '';

  if (normalizedCode) {
    const hit = continentOptions.value.find(
      (item) => item.code && item.code.toLowerCase() === normalizedCode
    );
    if (hit) return hit.id;
  }

  if (normalizedZh) {
    const hit = continentOptions.value.find(
      (item) => item.name && item.name.replace(/\s/g, '').toLowerCase() === normalizedZh
    );
    if (hit) return hit.id;
  }

  if (normalizedEn) {
    const hit = continentOptions.value.find(
      (item) => item.code && item.code.toLowerCase() === normalizedEn
    );
    if (hit) return hit.id;
  }

  return '';
}

async function loadDetail() {
  if (!isEdit.value) {
    const {
      continentId,
      continentCode,
      country,
      city,
      latitude,
      longitude
    } = route.query;

    if (continentId) {
      form.value.continentId = String(continentId);
    } else if (continentCode) {
      const matched = matchContinentId({ code: String(continentCode).toLowerCase() });
      if (matched) {
        form.value.continentId = String(matched);
      }
    }

    if (country) form.value.country = String(country);
    if (city) form.value.city = String(city);

    if (latitude) {
      const latNum = Number(latitude);
      if (Number.isFinite(latNum)) form.value.latitude = Number(latNum.toFixed(6));
    }
    if (longitude) {
      const lonNum = Number(longitude);
      if (Number.isFinite(lonNum)) form.value.longitude = Number(lonNum.toFixed(6));
    }

    if (city && latitude && longitude) {
      locationFeedback.value = `已从位置选择填充 ${country || ''} ${city} 的经纬度，可根据需要调整。`;
    }
    return;
  }

  loading.value = true;
  try {
    const res = await getMapMarker(route.params.id);
    if (res.success) {
      const data = res.data || {};
      form.value = {
        continentId: data.continentId ? String(data.continentId) : '',
        country: data.country || '',
        city: data.city || '',
        latitude: data.latitude ?? '',
        longitude: data.longitude ?? '',
        sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : Number(data.sortOrder) || 0,
        status: data.status || 'enabled'
      };
    } else {
      errorMsg.value = res.message || '未能加载标记详情';
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function validateForm() {
  if (!form.value.continentId) {
    errorMsg.value = '请选择所属洲';
    return false;
  }
  if (!form.value.country.trim()) {
    errorMsg.value = '请输入国家/地区';
    return false;
  }
  if (!form.value.city.trim()) {
    errorMsg.value = '请输入城市名称';
    return false;
  }
  if (form.value.latitude === '' || form.value.latitude === null) {
    errorMsg.value = '请先通过上方快速选择或手动输入纬度';
    return false;
  }
  if (form.value.longitude === '' || form.value.longitude === null) {
    errorMsg.value = '请先通过上方快速选择或手动输入经度';
    return false;
  }
  return true;
}

function applyLocationToForm(location) {
  if (!location) return;
  const countryName = location.countryNameZh || location.countryNameEn || '';
  const cityName = location.cityName || '';

  if (countryName) form.value.country = countryName;
  if (cityName) form.value.city = cityName;

  if (Number.isFinite(location.latitude)) {
    form.value.latitude = Number(location.latitude.toFixed(6));
  }
  if (Number.isFinite(location.longitude)) {
    form.value.longitude = Number(location.longitude.toFixed(6));
  }

  const matched = matchContinentId({
    code: location.continentCode,
    zh: location.continentNameZh,
    en: location.continentNameEn
  });
  if (matched) {
    form.value.continentId = String(matched);
    locationFeedback.value = `已定位：${location.continentNameZh || location.continentNameEn} / ${countryName} / ${cityName}，经纬度已自动填充。`;
  } else {
    locationFeedback.value = `已定位：${countryName} / ${cityName}，经纬度已填充，请手动选择所属洲。`;
  }
  errorMsg.value = '';
}

async function onSubmit() {
  errorMsg.value = '';
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = {
      continentId: Number(form.value.continentId),
      country: form.value.country.trim(),
      city: form.value.city.trim(),
      latitude: Number(form.value.latitude),
      longitude: Number(form.value.longitude),
      sortOrder: Number(form.value.sortOrder) || 0,
      status: form.value.status
    };
    if (isEdit.value) {
      await updateMapMarker(route.params.id, payload);
    } else {
      await createMapMarker(payload);
    }
    router.replace('/admin/map/markers');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadContinents();
  await loadDetail();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">{{ isEdit ? '编辑城市标记' : '新增城市标记' }}</div>
        <p class="text-sm text-slate-500 mt-1">{{ isEdit ? '更新坐标信息与状态' : '设置地图城市坐标点' }}</p>
      </div>
      <button class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50" @click="() => router.back()">返回</button>
    </div>

    <div class="rounded-xl bg-white p-8 ring-1 ring-slate-200 mx-auto max-w-3xl">
      <div v-if="loading" class="text-center text-slate-500 py-12">加载中…</div>
      <div v-else class="space-y-6">
        <div class="rounded-lg border border-indigo-100 bg-indigo-50/50 p-5">
          <LocationExplorer
            dense
            :initial-location="explorerInitialLocation"
            @location-selected="applyLocationToForm"
          />
          <p v-if="locationFeedback" class="mt-3 text-xs text-indigo-600">{{ locationFeedback }}</p>
        </div>

        <div class="grid gap-6">
          <div>
            <label class="block text-base font-medium text-slate-700">所属洲</label>
            <select
              v-model="form.continentId"
              class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
            >
              <option value="" disabled>请选择洲</option>
              <option v-for="item in continentOptions" :key="item.id" :value="String(item.id)">
                {{ item.name }}
              </option>
            </select>
          </div>

          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-base font-medium text-slate-700">国家/地区</label>
              <input
                v-model="form.country"
                type="text"
                placeholder="可通过上方快速选择自动填充"
                class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
              />
            </div>
            <div>
              <label class="block text-base font-medium text-slate-700">城市</label>
              <input
                v-model="form.city"
                type="text"
                placeholder="可通过上方快速选择自动填充"
                class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
              />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-base font-medium text-slate-700">纬度（-90 ~ 90）</label>
              <input
                v-model="form.latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="通过快速选择自动获取，或手动填写"
                class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
              />
            </div>
            <div>
              <label class="block text-base font-medium text-slate-700">经度（-180 ~ 180）</label>
              <input
                v-model="form.longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="通过快速选择自动获取，或手动填写"
                class="mt-1 w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 h-12 px-3 text-base"
              />
            </div>
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

          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button class="rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50" @click="() => router.back()">取消</button>
          <button
            :disabled="saving"
            class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
            @click="onSubmit"
          >
            {{ saving ? '保存中…' : (isEdit ? '更新' : '保存') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

