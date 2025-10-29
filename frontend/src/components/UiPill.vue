<script setup>
const props = defineProps({
  color: { type: String, default: 'slate' }, // slate|indigo|green|red|yellow
  tone: { type: String, default: 'soft' },   // soft|solid
});

const map = {
  slate:   { soft: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',   solid: 'bg-slate-600 text-white' },
  indigo:  { soft: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', solid: 'bg-indigo-600 text-white' },
  green:   { soft: 'bg-green-50 text-green-700 ring-1 ring-green-200',   solid: 'bg-green-600 text-white' },
  red:     { soft: 'bg-red-50 text-red-700 ring-1 ring-red-200',         solid: 'bg-red-600 text-white' },
  yellow:  { soft: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200', solid: 'bg-yellow-500 text-white' },
};
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="map[color]?.[tone] || map.slate.soft">
    <slot />
  </span>
</template>


