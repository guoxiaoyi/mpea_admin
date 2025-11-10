<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  fetchLocationContinents,
  fetchLocationCountries,
  fetchLocationCities,
  fetchLocationCityInfo
} from '@/api/map';

const props = defineProps({
  title: { type: String, default: '位置快速选择' },
  dense: { type: Boolean, default: false },
  showFooterNote: { type: Boolean, default: true },
  initialLocation: {
    type: Object,
    default: () => ({})
  },
  selectMode: {
    type: String,
    default: 'single',
    validator: (value) => ['single', 'multiple'].includes(value)
  }
});

const emit = defineEmits(['location-selected', 'loading-change', 'selection-change']);

const isMultiple = computed(() => props.selectMode === 'multiple');

const continents = ref([]);
const countries = ref([]);
const cities = ref([]);

const selectedContinent = ref('');
const selectedCountry = ref('');
const selectedCity = ref('');

const cityFilter = ref('');

const loadingContinents = ref(false);
const loadingCountries = ref(false);
const loadingCities = ref(false);
const loadingGeocode = ref(false);

const selectedCityMap = ref(new Map());
const cityLoadingKeys = ref(new Set());

const errorMsg = ref('');

const filteredCities = computed(() => {
  if (!cityFilter.value) return cities.value;
  const keyword = cityFilter.value.toLowerCase();
  return cities.value.filter((city) => city.toLowerCase().includes(keyword));
});

function notifyLoading() {
  emit('loading-change', {
    continents: loadingContinents.value,
    countries: loadingCountries.value,
    cities: loadingCities.value,
    geocode: loadingGeocode.value
  });
}

function emitSelectionChange() {
  emit('selection-change', Array.from(selectedCityMap.value.values()));
}

function getCityKey(countryCode, cityName) {
  return `${(countryCode || '').toUpperCase()}|${cityName.toLowerCase()}`;
}

function setSelectedCity(key, info) {
  const next = new Map(selectedCityMap.value);
  next.set(key, info);
  selectedCityMap.value = next;
  emitSelectionChange();
}

function removeSelectedCity(key) {
  if (!selectedCityMap.value.has(key)) return;
  const next = new Map(selectedCityMap.value);
  next.delete(key);
  selectedCityMap.value = next;
  emitSelectionChange();
}

function addCityLoading(key) {
  const next = new Set(cityLoadingKeys.value);
  next.add(key);
  cityLoadingKeys.value = next;
}

function removeCityLoading(key) {
  const next = new Set(cityLoadingKeys.value);
  next.delete(key);
  cityLoadingKeys.value = next;
}

function isCitySelected(key) {
  return selectedCityMap.value.has(key);
}

function isCityLoading(key) {
  return cityLoadingKeys.value.has(key);
}

async function loadContinents() {
  loadingContinents.value = true;
  notifyLoading();
  try {
    const res = await fetchLocationContinents();
    if (res.success) {
      continents.value = res.data || [];
    }
  } catch (error) {
    console.error('加载洲列表失败', error);
    errorMsg.value = '加载洲列表失败，请稍后重试';
  } finally {
    loadingContinents.value = false;
    notifyLoading();
  }
}

async function loadCountries(code) {
  if (!code) {
    countries.value = [];
    return;
  }
  loadingCountries.value = true;
  notifyLoading();
  try {
    const res = await fetchLocationCountries(code);
    if (res.success) {
      countries.value = res.data || [];
    } else {
      errorMsg.value = res.message || '加载国家失败';
    }
  } catch (error) {
    console.error('加载国家失败', error);
    errorMsg.value = '加载国家失败，请稍后重试';
  } finally {
    loadingCountries.value = false;
    notifyLoading();
  }
}

async function loadCities(code) {
  if (!code) {
    cities.value = [];
    return;
  }
  loadingCities.value = true;
  notifyLoading();
  try {
    const res = await fetchLocationCities(code);
    if (res.success) {
      cities.value = res.data || [];
    } else {
      errorMsg.value = res.message || '加载城市失败';
    }
  } catch (error) {
    console.error('加载城市失败', error);
    errorMsg.value = '加载城市失败，请稍后重试';
  } finally {
    loadingCities.value = false;
    notifyLoading();
  }
}

async function pickCity(city) {
  if (isMultiple.value || !selectedCountry.value) return;
  selectedCity.value = city;
  loadingGeocode.value = true;
  notifyLoading();
  errorMsg.value = '';
  try {
    const res = await fetchLocationCityInfo(selectedCountry.value, city);
    if (res.success && res.data) {
      const info = {
        ...res.data,
        continentCode: res.data.continentCode,
        countryCode: selectedCountry.value,
        cityName: res.data.cityName,
        countryNameZh: res.data.countryNameZh,
        countryNameEn: res.data.countryNameEn
      };
      emit('location-selected', info);
    } else {
      errorMsg.value = res.message || '未找到该城市的地理信息';
    }
  } catch (error) {
    console.error('获取城市信息失败', error);
    errorMsg.value = '获取城市坐标失败，请稍后重试';
  } finally {
    loadingGeocode.value = false;
    notifyLoading();
  }
}

async function toggleCitySelection(city, checked) {
  if (!isMultiple.value || !selectedCountry.value) return;
  const key = getCityKey(selectedCountry.value, city);
  if (checked) {
    if (selectedCityMap.value.has(key)) return;
    addCityLoading(key);
    loadingGeocode.value = true;
    notifyLoading();
    errorMsg.value = '';
    try {
      const res = await fetchLocationCityInfo(selectedCountry.value, city);
      if (res.success && res.data) {
        const info = {
          ...res.data,
          continentCode: res.data.continentCode,
          countryCode: selectedCountry.value,
          cityName: res.data.cityName,
          countryNameZh: res.data.countryNameZh,
          countryNameEn: res.data.countryNameEn
        };
        setSelectedCity(key, info);
        emit('location-selected', info);
      } else {
        errorMsg.value = res.message || '未找到该城市的地理信息';
      }
    } catch (error) {
      console.error('获取城市信息失败', error);
      errorMsg.value = '获取城市坐标失败，请稍后重试';
    } finally {
      removeCityLoading(key);
      loadingGeocode.value = cityLoadingKeys.value.size > 0;
      notifyLoading();
    }
  } else {
    removeSelectedCity(key);
  }
}

function applyInitial() {
  const { continentCode, countryCode, cityName } = props.initialLocation || {};
  if (continentCode) {
    selectedContinent.value = continentCode;
  }
  if (countryCode) {
    selectedCountry.value = countryCode.toUpperCase();
  }
  if (!isMultiple.value && cityName) {
    selectedCity.value = cityName;
  }
}

watch(selectedContinent, async (code, prev) => {
  if (code !== prev) {
    selectedCountry.value = '';
    if (!isMultiple.value) {
      selectedCity.value = '';
    }
    countries.value = [];
    cities.value = [];
    cityFilter.value = '';
  }
  if (code) {
    await loadCountries(code);
    const { countryCode } = props.initialLocation || {};
    if (countryCode && !prev) {
      selectedCountry.value = countryCode.toUpperCase();
    }
  }
});

watch(selectedCountry, async (code, prev) => {
  if (code !== prev) {
    if (!isMultiple.value) {
      selectedCity.value = '';
    }
    cities.value = [];
    cityFilter.value = '';
  }
  if (code) {
    await loadCities(code);
    const { cityName } = props.initialLocation || {};
    if (!isMultiple.value && cityName && !prev) {
      selectedCity.value = cityName;
      pickCity(cityName);
    }
  }
});

function clearSelections() {
  selectedCityMap.value = new Map();
  emitSelectionChange();
}

defineExpose({ clearSelections });

onMounted(async () => {
  await loadContinents();
  applyInitial();
});
</script>

<template>
  <div class="space-y-4" :class="dense ? 'text-sm' : ''">
    <div class="flex items-center justify-between">
      <div class="text-base font-semibold text-slate-900">{{ title }}</div>
      <span v-if="loadingGeocode" class="text-xs text-indigo-600">正在获取坐标…</span>
    </div>

    <div class="grid gap-3" :class="dense ? 'md:grid-cols-3' : 'md:grid-cols-3'">
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-700">洲</label>
        <select
          v-model="selectedContinent"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="" disabled>选择洲</option>
          <option v-for="item in continents" :key="item.code" :value="item.code">
            {{ item.nameZh }} ({{ item.nameEn }})
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-700">国家/地区</label>
        <select
          v-model="selectedCountry"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          :disabled="!selectedContinent"
        >
          <option value="" disabled>选择国家/地区</option>
          <option v-for="item in countries" :key="item.iso2" :value="item.iso2">
            {{ item.nameZh }} ({{ item.iso2 }})
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-700">城市列表</label>
        <input
          v-model="cityFilter"
          type="text"
          placeholder="搜索城市"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          :disabled="!selectedCountry"
        />
        <div
          class="mt-2 rounded-lg border bg-white"
          style="border-color: var(--border); max-height: 220px; overflow-y: auto;"
        >
          <div v-if="loadingCities" class="px-3 py-2 text-xs text-slate-500">加载城市列表中…</div>
          <div v-else-if="!filteredCities.length" class="px-3 py-2 text-xs text-slate-400">
            {{ selectedCountry ? '暂无城市数据' : '请选择国家' }}
          </div>
          <template v-else>
            <template v-if="isMultiple">
              <label
                v-for="city in filteredCities"
                :key="city"
                class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
                :class="isCitySelected(getCityKey(selectedCountry, city)) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700'"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                  :checked="isCitySelected(getCityKey(selectedCountry, city))"
                  :disabled="isCityLoading(getCityKey(selectedCountry, city))"
                  @change="toggleCitySelection(city, $event.target.checked)"
                />
                <span class="flex-1">{{ city }}</span>
                <span
                  v-if="isCityLoading(getCityKey(selectedCountry, city))"
                  class="text-xs text-indigo-500"
                >
                  获取中…
                </span>
              </label>
            </template>
            <template v-else>
              <button
                v-for="city in filteredCities"
                :key="city"
                type="button"
                class="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                :class="selectedCity === city ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700'"
                @click="pickCity(city)"
              >
                {{ city }}
              </button>
            </template>
          </template>
        </div>
      </div>
    </div>

    <p v-if="errorMsg" class="text-xs text-red-600">{{ errorMsg }}</p>

    <p v-if="showFooterNote" class="text-xs text-slate-400">
      经纬度使用 Open-Meteo Geocoding API 自动获取，可能存在少量偏差，仅供定位参考。
    </p>
  </div>
</template>


