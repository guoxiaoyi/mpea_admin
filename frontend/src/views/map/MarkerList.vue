<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  fetchMapMarkers,
  deleteMapMarker,
  fetchMapContinentSimple,
  createMapMarkersBulk
} from '@/api/map';
import UiTable from '@/components/UiTable.vue';
import LocationExplorer from '@/components/LocationExplorer.vue';

const router = useRouter();
const route = useRoute();

const list = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const keyword = ref('');
const status = ref('');
const continentId = ref('');
const loading = ref(false);
const continentOptions = ref([]);
const locationExplorerRef = ref(null);
const selectedLocations = ref([]);
const locationMessage = ref('');
const locationPanelLoading = ref(false);
const savingSelected = ref(false);

const columns = [
  { key: 'city', label: '城市', width: '160px' },
  { key: 'country', label: '国家/地区', width: '160px' },
  { key: 'continentName', label: '所属洲', width: '140px' },
  { key: 'latitude', label: '纬度', width: '120px', align: 'right' },
  { key: 'longitude', label: '经度', width: '120px', align: 'right' },
  { key: 'status', label: '状态', width: '100px', align: 'center' },
  { key: 'sortOrder', label: '排序', width: '90px', align: 'center' },
  { key: 'actions', label: '操作', width: '160px', align: 'right' }
];

function formatCoord(value) {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toFixed(4);
}

function formatLocationCoordDisplay(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(4) : '-';
}

async function loadContinents() {
  try {
    const res = await fetchMapContinentSimple();
    if (res.success) {
      continentOptions.value = res.data || [];
    }
  } catch (e) {
    console.warn('加载洲选项失败', e);
  }
}

async function load() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value
    };
    if (keyword.value) params.keyword = keyword.value;
    if (status.value) params.status = status.value;
    if (continentId.value) params.continentId = continentId.value;
    const res = await fetchMapMarkers(params);
    if (res.success) {
      const payload = res.data || {};
      list.value = (payload.data || []).map((item) => ({
        ...item,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude)
      }));
      total.value = payload.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  router.push('/admin/map/markers/new');
}

function openEdit(row) {
  router.push(`/admin/map/markers/${row.id}`);
}

async function onDelete(id) {
  if (!confirm('确定删除该城市标记吗？')) return;
  await deleteMapMarker(id);
  await load();
}

function onSearch() {
  page.value = 1;
  load();
}

function matchContinentIdByCode(code) {
  if (!code) return '';
  const normalized = String(code).toLowerCase();
  const hit = continentOptions.value.find(
    (item) => item.code && item.code.toLowerCase() === normalized
  );
  return hit ? hit.id : '';
}

function onSelectionChange(locations) {
  const list = Array.isArray(locations) ? locations : [];
  selectedLocations.value = list;

  if (list.length) {
    const first = list[0];
    const matchedContinentId = matchContinentIdByCode(first?.continentCode);
    if (matchedContinentId) {
      continentId.value = String(matchedContinentId);
    }
    const preview = list
      .slice(0, 3)
      .map(
        (item) =>
          `${item.countryNameZh || item.countryNameEn || item.countryCode || ''} · ${
            item.cityName
          }`
      )
      .join('、');
    locationMessage.value = `已选择 ${list.length} 个城市：${preview}${
      list.length > 3 ? ' 等' : ''
    }`;
  } else {
    locationMessage.value = '';
  }
}

function onLocationLoadingChange(payload) {
  locationPanelLoading.value =
    payload?.continents || payload?.countries || payload?.cities || payload?.geocode || false;
}

async function saveSelectedLocations() {
  if (!selectedLocations.value.length || savingSelected.value) return;
  savingSelected.value = true;
  try {
    const payload = selectedLocations.value.map((loc, index) => ({
      continentCode: (loc.continentCode || '').toLowerCase(),
      country: loc.countryNameZh || loc.countryNameEn || loc.countryCode || '',
      countryCode: loc.countryCode || '',
      city: loc.cityName,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      sortOrder: index,
      status: 'enabled'
    }));
    const res = await createMapMarkersBulk(payload);
    if (res.success) {
      const summary = res.data?.summary || {};
      const resultLines = (res.data?.results || [])
        .slice(0, 5)
        .map((item) => `${item.country || item.countryCode || ''} · ${item.city} -> ${item.status}${item.reason ? ` (${item.reason})` : ''}`);
      const extraHint = (res.data?.results || []).length > 5 ? '\n…' : '';
      alert(
        `保存完成：新增 ${summary.created || 0} 条，已存在 ${summary.skipped || 0} 条，失败 ${
          summary.failed || 0
        } 条。\n${resultLines.join('\n')}${extraHint}`
      );
      clearSelectedLocations();
      await load();
    } else {
      alert(res.message || '保存失败');
    }
  } catch (error) {
    alert(error.response?.data?.message || error.message || '保存失败');
  } finally {
    savingSelected.value = false;
  }
}

function clearSelectedLocations() {
  selectedLocations.value = [];
  locationMessage.value = '';
  locationExplorerRef.value?.clearSelections?.();
}

onMounted(async () => {
  await loadContinents();
  if (route.query.continentId) {
    continentId.value = String(route.query.continentId);
  }
  await load();
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-end justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-900">城市标记管理</div>
        <p class="text-sm text-slate-500 mt-1">维护地图中的国家及城市坐标点</p>
      </div>
      <button class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500" @click="openCreate">
        新增城市标记
      </button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div class="space-y-5">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 w-64 rounded-full border px-3 py-1.5" style="border-color: var(--border); background: var(--surface)">
            <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input v-model="keyword" type="text" placeholder="搜索城市或国家" class="w-full bg-transparent outline-none" />
          </div>
          <select
            v-model="continentId"
            class="h-10 rounded-full border px-4 text-sm"
            style="border-color: var(--border); background: var(--surface)"
          >
            <option value="">全部洲</option>
            <option v-for="item in continentOptions" :key="item.id" :value="String(item.id)">{{ item.name }}</option>
          </select>
          <select
            v-model="status"
            class="h-10 rounded-full border px-4 text-sm"
            style="border-color: var(--border); background: var(--surface)"
          >
            <option value="">全部状态</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
          <button class="ui-btn-primary" @click="onSearch">筛选</button>
        </div>

        <div class="ui-panel border-none p-0 overflow-hidden">
          <div class="px-6 py-4 border-b" style="border-color: var(--border)">
            <div class="font-medium text-slate-900">城市标记列表（共 {{ total }} 条）</div>
          </div>
          <UiTable :columns="columns" :rows="list" :loading="loading" density="normal">
            <template #cell:latitude="{ row }">
              <span class="font-mono text-sm text-slate-700">{{ formatCoord(row.latitude) }}</span>
            </template>
            <template #cell:longitude="{ row }">
              <span class="font-mono text-sm text-slate-700">{{ formatCoord(row.longitude) }}</span>
            </template>
            <template #cell:status="{ row }">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="row.status === 'enabled' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'"
              >
                {{ row.status === 'enabled' ? '启用' : '禁用' }}
              </span>
            </template>
            <template #cell:sortOrder="{ row }">
              <span class="text-sm text-slate-700">{{ row.sortOrder ?? 0 }}</span>
            </template>
            <template #cell:actions="{ row }">
              <div class="flex justify-end gap-2">
                <button
                  class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50"
                  @click="openEdit(row)"
                  aria-label="编辑"
                >
                  <svg class="h-3.5 w-3.5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M14.06 5.94l3.75 3.75" />
                  </svg>
                </button>
                <button
                  class="inline-grid place-items-center h-7 w-7 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                  @click="onDelete(row.id)"
                  aria-label="删除"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <rect x="6" y="6" width="12" height="14" rx="2" />
                  </svg>
                </button>
              </div>
            </template>
          </UiTable>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
          <LocationExplorer
            ref="locationExplorerRef"
            dense
            select-mode="multiple"
            @selection-change="onSelectionChange"
            @loading-change="onLocationLoadingChange"
          />
          <div v-if="locationPanelLoading" class="mt-3 text-xs text-slate-500">正在加载数据…</div>
          <div v-if="locationMessage" class="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            {{ locationMessage }}
          </div>
          <div v-else-if="selectedLocations.length" class="mt-3 text-xs text-slate-500">
            已选择 {{ selectedLocations.length }} 个城市。
          </div>
          <div class="mt-4 flex flex-col gap-2">
            <button
              class="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-60"
              :disabled="!selectedLocations.length || savingSelected"
              @click="saveSelectedLocations"
            >
              {{ savingSelected ? '保存中…' : '保存选中城市' }}
            </button>
            <button
              class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              :disabled="!selectedLocations.length"
              @click="clearSelectedLocations"
            >
              清除选择
            </button>
          </div>
          <p class="mt-4 text-xs text-slate-400">
            选择洲 → 国家 → 城市并勾选目标城市，点击“保存选中城市”即可批量创建，坐标由地图接口自动提供。
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

