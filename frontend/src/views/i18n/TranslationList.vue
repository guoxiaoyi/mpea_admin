<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import {
  fetchTranslations,
  fetchTranslationMeta,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  importTranslations
} from '@/api/translation';

// Refs
const loading = ref(false);
const rawList = ref([]);
const namespaces = ref([]);
const locales = ref(['zh', 'en']);
const selectedLocale = ref('zh');

// Editor state
const editorVisible = ref(false);
const editing = ref(null);
const saving = ref(false);

// Import state
const importVisible = ref(false);
const importLocale = ref('zh');
const importPayload = ref('');
const importing = ref(false);

// Search
const keyword = ref('');

// Helper: Ensure locale object
function ensureLocaleValues(values = {}) {
  const normalized = {};
  locales.value.forEach((locale) => {
    normalized[locale] = values[locale] ?? '';
  });
  return normalized;
}

// 1. Load Data (No Pagination)
async function loadData() {
  loading.value = true;
  try {
    const res = await fetchTranslations({
      page: 1,
      limit: 10000, // Load all for client-side processing
      keyword: keyword.value
    });
    if (res.success) {
      rawList.value = res.data.data || [];
    }
  } catch (error) {
    console.error('loadData error', error);
  } finally {
    loading.value = false;
  }
}

async function loadMeta() {
  const res = await fetchTranslationMeta();
  if (res.success && res.data) {
    locales.value = res.data.locales || ['zh', 'en'];
    namespaces.value = res.data.namespaces || [];
  }
}

// 2. Process Data for Table
// We need to group list items into logical rows.
// - Regular keys: 1 row
// - Array keys (e.g. features.0.title): Grouped into 1 row representing the array
const tableData = computed(() => {
  const groups = new Map();
  const singles = [];

  // Sort by fullKey first to ensure order
  const sortedRaw = [...rawList.value].sort((a, b) => a.fullKey.localeCompare(b.fullKey));

  // Regex to detect array pattern: some.path.0.field
  const arrayPattern = /^(.+)\.(\d+)\.([^.]+.*)$/; 
  // OR simply ending in number: some.path.0 (value is string)
  const arrayLeafPattern = /^(.+)\.(\d+)$/;

  const processedKeys = new Set();

  // First pass: Identify array groups
  sortedRaw.forEach(row => {
    const matchObj = row.fullKey.match(arrayPattern);
    const matchLeaf = row.fullKey.match(arrayLeafPattern);
    
    let arrayPath = null;
    let index = -1;
    let field = null;

    if (matchObj) {
      arrayPath = matchObj[1];
      index = parseInt(matchObj[2], 10);
      field = matchObj[3];
    } else if (matchLeaf) {
      arrayPath = matchLeaf[1];
      index = parseInt(matchLeaf[2], 10);
      field = '_self'; // It's a primitive array [ "a", "b" ]
    }

    if (arrayPath) {
      if (!groups.has(arrayPath)) {
        groups.set(arrayPath, {
          type: 'array',
          fullKey: arrayPath,
          namespace: arrayPath.split('.')[0],
          items: [], // Map<index, { id, fields... }>
          updatedAt: row.updatedAt // Use latest
        });
      }
      const group = groups.get(arrayPath);
      // Ensure item object exists
      if (!group.items[index]) {
        group.items[index] = { index, rows: [] };
      }
      group.items[index].rows.push({ field, row });
      // Update metadata
      if (new Date(row.updatedAt) > new Date(group.updatedAt)) {
        group.updatedAt = row.updatedAt;
      }
      processedKeys.add(row.id);
    }
  });

  // Second pass: Collect non-array items
  sortedRaw.forEach(row => {
    if (!processedKeys.has(row.id)) {
      singles.push({
        type: 'single',
        fullKey: row.fullKey,
        namespace: row.namespace,
        row,
        updatedAt: row.updatedAt
      });
    }
  });

  // Combine and sort all rows
  const allRows = [...singles, ...groups.values()];
  
  // Sort by fullKey (Namespace -> Path)
  allRows.sort((a, b) => a.fullKey.localeCompare(b.fullKey));

  // Compute Rowspans
  const finalRows = [];
  let currentNamespace = null;
  let namespaceCount = 0;
  
  // We need to calculate spans ahead of time.
  // Group by namespace first
  const byNs = new Map();
  allRows.forEach(item => {
    const ns = item.namespace;
    if (!byNs.has(ns)) byNs.set(ns, []);
    byNs.get(ns).push(item);
  });

  // Flatten back with spans
  // Sort namespaces alphabetically
  const sortedNs = Array.from(byNs.keys()).sort();
  
  sortedNs.forEach(ns => {
    const items = byNs.get(ns);
    items.forEach((item, idx) => {
      // Calculate display key (strip namespace)
      const displayKey = item.fullKey.startsWith(ns + '.') 
        ? item.fullKey.slice(ns.length + 1) 
        : (item.fullKey === ns ? '(root)' : item.fullKey);

      finalRows.push({
        ...item,
        displayKey,
        nsSpan: idx === 0 ? items.length : 0
      });
    });
  });

  return finalRows;
});

// View Helpers
function previewValue(row) {
  return row?.values?.[selectedLocale.value] ?? '';
}

// Actions
function openCreate() {
  const values = ensureLocaleValues();
  editing.value = {
    id: null,
    fullKey: '',
    label: '',
    description: '',
    sortOrder: 0,
    values
  };
  editorVisible.value = true;
}

function openEdit(row) {
  if (!row) return;
  const values = ensureLocaleValues(row.values || {});
  editing.value = {
    id: row.id,
    fullKey: row.fullKey,
    label: row.label || '',
    description: row.description || '',
    sortOrder: row.sortOrder ?? 0,
    values
  };
  editorVisible.value = true;
}

async function saveTranslation() {
  if (!editing.value?.fullKey) {
    alert('请填写 Key');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      fullKey: editing.value.fullKey,
      label: editing.value.label,
      description: editing.value.description,
      sortOrder: editing.value.sortOrder,
      values: editing.value.values
    };
    if (editing.value.id) {
      await updateTranslation(editing.value.id, payload);
    } else {
      await createTranslation(payload);
    }
    await loadData(); // Reload all
    editorVisible.value = false;
  } catch (e) {
    console.error(e);
    alert('保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  if (!confirm(`确定删除 ${row.fullKey} 吗？`)) return;
  try {
    await deleteTranslation(row.id);
    await loadData();
  } catch (e) {
    alert('删除失败');
  }
}

// Array Group Actions
function openEditGroupItem(item) {
  // item: { index, rows: [{field, row}, ...] }
  // We can just pick the first row to edit, or if we want to support adding items/reordering, that's more complex.
  // For now, let's just allow editing existing fields.
  // Maybe we open the first field?
  if (item.rows.length > 0) {
    openEdit(item.rows[0].row);
  }
}

// Import
function openImport() {
  importPayload.value = '';
  importVisible.value = true;
}
async function submitImport() {
  if (!importPayload.value) return;
  importing.value = true;
  try {
    const data = JSON.parse(importPayload.value);
    await importTranslations({ locale: importLocale.value, data });
    await loadData();
    importVisible.value = false;
    alert('导入成功');
  } catch (e) {
    alert('导入失败: ' + e.message);
  } finally {
    importing.value = false;
  }
}

onMounted(() => {
  loadMeta();
  loadData();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header / Toolbar -->
    <div class="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl border shadow-sm" style="border-color: var(--border)">
      <div class="flex items-center gap-4">
        <div class="font-bold text-lg text-slate-900">文案管理</div>
        <div class="h-6 w-px bg-slate-200"></div>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">当前预览：</span>
          <select v-model="selectedLocale" class="bg-slate-50 border rounded px-2 py-1 outline-none text-slate-700 font-medium">
            <option v-for="l in locales" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div class="relative">
          <input v-model="keyword" class="pl-8 pr-3 py-1.5 rounded-full border text-sm w-48 outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow" placeholder="搜索 Key..." @keyup.enter="loadData" />
          <svg class="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
        <button class="text-slate-500 hover:text-indigo-600" @click="loadData" title="刷新">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v-3a8 8 0 0116 0"/><path d="M4 12h4"/><path d="M4 12l4 4"/><path d="M20 12v3a8 8 0 01-16 0"/><path d="M20 12h-4"/><path d="M20 12l-4-4"/></svg>
        </button>
      </div>
      <div class="flex gap-2">
        <button class="ui-btn-outline" @click="openImport">导入 JSON</button>
        <button class="ui-btn-primary" @click="openCreate">新增文案</button>
      </div>
    </div>

    <!-- Main Table -->
    <div class="bg-white rounded-xl border shadow-sm overflow-hidden" style="border-color: var(--border)">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b" style="border-color: var(--border)">
              <th class="px-6 py-3 font-semibold text-slate-700 w-32">模块</th>
              <th class="px-6 py-3 font-semibold text-slate-700 w-48">Key 路径</th>
              <th class="px-6 py-3 font-semibold text-slate-700">内容</th>
              <th class="px-6 py-3 font-semibold text-slate-700 w-32">更新时间</th>
              <th class="px-6 py-3 font-semibold text-slate-700 w-20 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y" style="border-color: var(--border)">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">加载中...</td>
            </tr>
            <tr v-else-if="tableData.length === 0" style="border-color: var(--border)">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">暂无数据</td>
            </tr>
            <tr v-else v-for="row in tableData" :key="row.type === 'array' ? row.fullKey : row.row.id" class="hover:bg-slate-50/50" style="border-color: var(--border)">
              <!-- Namespace Column (Merged) -->
              <td 
                v-if="row.nsSpan > 0" 
                :rowspan="row.nsSpan" 
                class="px-6 py-4 font-bold text-slate-800 align-top border-r bg-white"
                style="border-color: var(--border)"
              >
                {{ row.namespace }}
              </td>

              <!-- Key Path -->
              <td class="px-6 py-4 font-mono text-xs text-slate-600 align-top border-r" style="border-color: var(--border)">
                <div class="break-all">{{ row.displayKey }}</div>
                <div v-if="row.type === 'array'" class="mt-1">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                    ARRAY ({{ row.items.length }})
                  </span>
                </div>
              </td>

              <!-- Content -->
              <td class="px-6 py-4 align-top">
                <!-- Array View -->
                <div v-if="row.type === 'array'" class="space-y-3">
                  <div 
                    v-for="item in row.items" 
                    :key="item.index" 
                    class="rounded-lg border bg-slate-50/50 p-3 text-xs"
                    style="border-color: var(--border)"
                  >
                    <div class="mb-2 flex items-center justify-between border-b pb-2" style="border-color: var(--border)">
                      <span class="font-bold text-slate-500">Index #{{ item.index }}</span>
                      <!-- For simple arrays, maybe a quick edit for the first field -->
                    </div>
                    <div class="space-y-1.5">
                      <div v-for="fieldRow in item.rows" :key="fieldRow.row.id" class="grid grid-cols-[100px_1fr_40px] gap-2 items-start">
                        <span class="font-mono text-slate-500 truncate text-right pr-2">{{ fieldRow.field === '_self' ? 'Value' : fieldRow.field }}</span>
                        <span class="text-slate-800 break-words whitespace-pre-wrap">{{ previewValue(fieldRow.row) || '-' }}</span>
                        <button class="text-indigo-600 hover:text-indigo-800 text-right" @click="openEdit(fieldRow.row)">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Single Value View -->
                <div v-else class="text-slate-800 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {{ previewValue(row.row) }}
                  <div v-if="!previewValue(row.row)" class="text-slate-400 italic">（未填写）</div>
                </div>
              </td>

              <!-- Updated At -->
              <td class="px-6 py-4 text-xs text-slate-500 align-top">
                {{ row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-' }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-right align-top">
                <div v-if="row.type === 'single'" class="flex flex-col gap-2 items-end">
                  <button class="text-indigo-600 hover:underline text-xs" @click="openEdit(row.row)">编辑</button>
                  <button class="text-red-600 hover:underline text-xs" @click="handleDelete(row.row)">删除</button>
                </div>
                <div v-else class="text-xs text-slate-400">
                  组操作
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Editor Modal -->
    <div v-if="editorVisible" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800">{{ editing.id ? '编辑文案' : '新增文案' }}</h3>
          <button @click="editorVisible = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-5">
          <div v-if="!editing.id">
            <label class="block text-sm font-medium text-slate-700 mb-1">Key (完整路径)</label>
            <input v-model="editing.fullKey" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. nav.home.title" />
          </div>
          <div v-else class="text-sm">
            <span class="text-slate-500">正在编辑：</span>
            <span class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{{ editing.fullKey }}</span>
          </div>

          <div class="space-y-4">
            <div v-for="l in locales" :key="l">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ l }}</label>
              <textarea v-model="editing.values[l]" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="输入内容..."></textarea>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <input v-model="editing.description" class="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
        </div>
        <div class="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button class="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-slate-50" @click="editorVisible = false">取消</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50" :disabled="saving" @click="saveTranslation">保存</button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="importVisible" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800">导入 JSON</h3>
          <button @click="importVisible = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-4">
          <div class="flex gap-2">
            <button 
              v-for="l in locales" :key="l"
              class="px-3 py-1.5 text-sm border rounded-md transition-colors"
              :class="importLocale === l ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-slate-50'"
              @click="importLocale = l"
            >
              {{ l }}
            </button>
          </div>
          <textarea v-model="importPayload" rows="10" class="w-full border rounded-lg px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500" placeholder='{"nav": {"home": "首页"}}'></textarea>
        </div>
        <div class="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50" :disabled="importing" @click="submitImport">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>
