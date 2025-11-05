<script setup>
import { ref, computed } from 'vue';

const promptLimit = 800;
const seedMin = 1;
const seedMax = 2147483647;

const prompt = ref('');
const sizeOptions = [
  { label: '1280×1280', value: '1280x1280' },
  { label: '1696×960', value: '1696x960' },
  { label: '960×1696', value: '960x1696' },
  { label: '1472×1104', value: '1472x1104' },
  { label: '1104×1472', value: '1104x1472' },
];
const selectedSize = ref(sizeOptions[0].value);

const countOptions = [
  { label: '1张', value: 1 },
  { label: '2张', value: 2 },
  { label: '3张', value: 3 },
  { label: '4张', value: 4 },
];
const imageCount = ref(1);

const seed = ref(1234);
const autoEnhance = ref(false);

const generating = ref(false);
const history = ref([]);

const promptLength = computed(() => prompt.value.trim().length);

function handleSelect(optionRef, value) {
  optionRef.value = value;
}

function handleSubmit() {
  generating.value = true;

  const timestamp = new Date();
  const record = {
    id: `${timestamp.getTime()}`,
    createdAt: timestamp,
    prompt: prompt.value,
    size: selectedSize.value,
    count: imageCount.value,
    seed: seed.value,
    autoEnhance: autoEnhance.value,
    images: Array.from({ length: imageCount.value }, (_, idx) => ({
      id: `${timestamp.getTime()}-${idx}`,
      status: 'pending',
    })),
  };

  history.value = [record, ...history.value];

  // Simulate async generation completion for the UI demo
  setTimeout(() => {
    record.images = record.images.map((img, idx) => ({
      ...img,
      status: 'ready',
      url: 'https://placehold.co/640x640/png?text=Preview',
    }));
    generating.value = false;
  }, 600);
}

function formatDate(date) {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-semibold text-slate-900">通义万相 · 文生图</h1>
      <p class="text-sm text-slate-500">配置提示词与参数，生成高质量的 AI 图片。目前仅支持预览效果。</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form class="ui-panel p-6 space-y-6 h-fit" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">正向 Prompt</label>
          <div class="relative">
            <textarea
              v-model="prompt"
              :maxlength="promptLimit"
              rows="5"
              class="ui-input resize-none pr-16"
              placeholder="请输入详细描述，例如：阳光下的未来城市，霓虹光影，超现实主义"
            ></textarea>
            <span class="absolute bottom-2 right-3 text-xs text-slate-400">{{ promptLength }}/{{ promptLimit }}</span>
          </div>
        </div>

        <div class="space-y-3">
          <div class="text-sm font-medium text-slate-700">尺寸</div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="option in sizeOptions"
              :key="option.value"
              type="button"
              @click="handleSelect(selectedSize, option.value)"
              class="rounded-xl border px-3 py-2 text-sm transition"
              :class="selectedSize === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div class="text-sm font-medium text-slate-700">生成张数</div>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="option in countOptions"
              :key="option.value"
              type="button"
              @click="handleSelect(imageCount, option.value)"
              class="rounded-xl border px-3 py-2 text-sm transition"
              :class="imageCount === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-700">seed</span>
            <input
              v-model.number="seed"
              type="number"
              :min="seedMin"
              :max="seedMax"
              class="ui-input w-28 text-right"
            />
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model.number="seed"
              type="range"
              :min="seedMin"
              :max="seedMax"
              class="w-full accent-indigo-500"
            />
          </div>
          <div class="flex justify-between text-xs text-slate-400">
            <span>{{ seedMin }}</span>
            <span>{{ seedMax }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between rounded-xl border px-4 py-3" style="border-color: var(--border); background: var(--surface-muted)">
          <div>
            <div class="text-sm font-medium text-slate-700">智能扩写</div>
            <p class="text-xs text-slate-500 mt-1">开启后将自动丰富提示词，提升出图质量。</p>
          </div>
          <button
            type="button"
            class="relative h-6 w-11 rounded-full transition"
            :class="autoEnhance ? 'bg-indigo-500' : 'bg-slate-200'"
            @click="autoEnhance = !autoEnhance"
          >
            <span
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition"
              :class="autoEnhance ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <button type="submit" class="ui-btn ui-btn-primary w-full h-11" :disabled="generating">
          {{ generating ? '正在生成…' : '开始生成' }}
        </button>
      </form>

      <div class="ui-panel p-0 flex flex-col min-h-[540px]">
        <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--border)">
          <div class="font-medium text-slate-900">通义万相2.5-文生图 · Preview</div>
          <span class="text-xs text-slate-400">{{ history.length ? '生成记录' : '暂无记录' }}</span>
        </div>

        <div v-if="history.length === 0" class="flex-1 grid place-items-center px-6 py-12 text-center text-slate-400 text-sm">
          <div class="space-y-3 max-w-xs">
            <svg class="mx-auto h-12 w-12 text-slate-300" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="9" y="12" width="30" height="24" rx="4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M15 28l5-6 6 8 4-5 3 3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="space-y-1">
              <div class="font-medium text-slate-500">您还没有生成记录</div>
              <p class="text-xs text-slate-400">请在左侧填写 Prompt 与参数，点击“开始生成”查看预览效果。</p>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div
            v-for="item in history"
            :key="item.id"
            class="border rounded-2xl p-4 space-y-4"
            style="border-color: var(--border); background: var(--surface)"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-slate-800">{{ formatDate(item.createdAt) }}</div>
                <div class="text-xs text-slate-400 mt-1">尺寸 {{ item.size }} · seed {{ item.seed }} · {{ item.count }} 张</div>
              </div>
              <span class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {{ generating && history[0].id === item.id ? '生成中' : '预览' }}
              </span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="image in item.images"
                :key="image.id"
                class="relative aspect-square overflow-hidden rounded-xl border"
                style="border-color: var(--border); background: var(--surface-muted)"
              >
                <div v-if="image.status !== 'ready'" class="absolute inset-0 grid place-items-center text-xs text-slate-400">
                  生成中…
                </div>
                <img
                  v-else
                  :src="image.url"
                  alt="生成结果预览"
                  class="h-full w-full object-cover"
                >
              </div>
            </div>

            <div v-if="item.prompt" class="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {{ item.prompt }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea.ui-input {
  min-height: 140px;
}
</style>

