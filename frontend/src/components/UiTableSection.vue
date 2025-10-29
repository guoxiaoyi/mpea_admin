<script setup>
const props = defineProps({
  title: { type: String, required: true },
  progressText: { type: String, default: '' }, // e.g., 1/7 (14%)
});
</script>

<template>
  <section class="bg-white shadow-sm" style="border-color: var(--border); border-radius: 0">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-slate-900">{{ title }}</h3>
        <span v-if="progressText" class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-slate-600">{{ progressText }}</span>
      </div>
      <div>
        <slot name="actions" />
      </div>
    </div>
    <div class="p-0">
      <slot />
    </div>
  </section>
</template>


