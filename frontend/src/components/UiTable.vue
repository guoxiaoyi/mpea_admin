<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  columns: { type: Array, required: true }, // [{key,label,width,align,sortable}]
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  // 选择与排序
  selectable: { type: Boolean, default: false },
  selectableLabel: { type: String, default: '' },
  rowKey: { type: String, default: 'id' },
  modelValue: { type: Array, default: () => [] }, // 选中 keys
  sortKey: { type: String, default: '' },
  sortOrder: { type: String, default: '' }, // 'asc' | 'desc' | ''
  density: { type: String, default: 'normal' }, // normal|compact
});

const emit = defineEmits(['update:modelValue', 'update:sortKey', 'update:sortOrder', 'sort-change']);

const selectedKeys = ref(new Set(props.modelValue));
watch(() => props.modelValue, v => { selectedKeys.value = new Set(v); });

const allSelected = computed(() => props.rows.length > 0 && props.rows.every(r => selectedKeys.value.has(r[props.rowKey])));
function toggleAll(e) {
  if (e.target.checked) {
    const all = props.rows.map(r => r[props.rowKey]);
    selectedKeys.value = new Set(all);
  } else {
    selectedKeys.value = new Set();
  }
  emit('update:modelValue', Array.from(selectedKeys.value));
}
function toggleRow(key, checked) {
  if (checked) selectedKeys.value.add(key); else selectedKeys.value.delete(key);
  emit('update:modelValue', Array.from(selectedKeys.value));
}

function onSort(col) {
  if (!col.sortable) return;
  const next = props.sortKey !== col.key ? 'asc' : (props.sortOrder === 'asc' ? 'desc' : props.sortOrder === 'desc' ? '' : 'asc');
  emit('update:sortKey', next ? col.key : '');
  emit('update:sortOrder', next);
  emit('sort-change', { sortKey: next ? col.key : '', sortOrder: next });
}

const thClasses = (col) => {
  return [
    'px-6 py-3 text-left text-slate-600 text-xs font-medium uppercase tracking-wide select-none',
    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
    col.sortable ? 'cursor-pointer hover:text-slate-800' : ''
  ].join(' ');
};
const tdClasses = (col) => {
  return [
    props.density === 'compact' ? 'px-4 py-2' : 'px-6 py-3',
    'text-sm text-slate-800 align-middle',
    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
  ].join(' ');
};
</script>

<template>
  <div class="overflow-x-auto bg-white shadow-sm">
    <table class="min-w-full text-sm border-separate" style="border-spacing:0">
      <thead class="sticky top-0 z-10 bg-transparent">
        <tr>
          <th v-if="selectable" class="px-4 py-2 w-10 border-b" :style="{ borderColor: 'var(--border)' }">
            <div class="flex items-center gap-2">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
              <span v-if="selectableLabel" class="text-sm text-slate-600">{{ selectableLabel }}</span>
            </div>
          </th>
          <th v-for="(col,idx) in columns" :key="col.key" :style="{ width: col.width, borderColor: 'var(--border)' }" :class="thClasses(col) + ' border-b'" @click="onSort(col)">
            <div class="inline-flex items-center gap-1">
              <span>{{ col.label }}</span>
              <svg v-if="col.sortable" class="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="sortKey===col.key && sortOrder==='asc'" d="M7 14l5-5 5 5H7z"/>
                <path v-else-if="sortKey===col.key && sortOrder==='desc'" d="M7 10l5 5 5-5H7z"/>
                <path v-else d="M7 10l5 5 5-5H7z" opacity=".35"/>
              </svg>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + (selectable?1:0)" class="px-4 py-6 text-slate-500 border-b" :style="{ borderColor: 'var(--border)' }">加载中…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length + (selectable?1:0)" class="px-4 py-6 text-slate-500 border-b" :style="{ borderColor: 'var(--border)' }">{{ emptyText }}</td>
        </tr>

        <tr v-else v-for="(row, idx) in rows" :key="row[rowKey] ?? idx" class="hover:bg-slate-50" style="--tw-bg-opacity:1;">
          <td v-if="selectable" :class="['px-4 py-2 w-10', idx === rows.length - 1 ? '' : 'border-b']" :style="{ borderColor: 'var(--border)' }">
            <input type="checkbox" :checked="selectedKeys.has(row[rowKey])" @change="(e)=>toggleRow(row[rowKey], e.target.checked)" />
          </td>
          <td v-for="col in columns" :key="col.key" :class="[tdClasses(col), idx === rows.length - 1 ? '' : 'border-b']" :style="{ color: 'var(--text)', borderColor: 'var(--border)' }">
            <slot :name="`cell:${col.key}`" :row="row">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
    <slot name="footer" />
  </div>
  
</template>


