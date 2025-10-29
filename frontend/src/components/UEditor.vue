<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: Number, default: 520 },
  withXiumi: { type: Boolean, default: true },
  withJquery: { type: Boolean, default: true },
  // 静态资源根路径（指向 public 下的目录），例如 '/ueditor/' 或 '/ueditor-dev-1.5.0/'
  assetsBase: { type: String, default: '/ueditor/' },
  // 后端接口地址（留空则使用 VITE_API_BASE 推导）
  serverUrl: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'ready']);

const mountEl = ref(null);
let editor;
let containerId = '';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

onMounted(async () => {
  // 统一资源根路径（确保以 / 结尾）
  const base = props.assetsBase.endsWith('/') ? props.assetsBase : props.assetsBase + '/';
  // 指向静态资源根：ueditor.config.js 会读取该值拼装内部资源路径
  window.UEDITOR_HOME_URL = base;

  try {
    if (props.withJquery && !window.jQuery) {
      await loadScript(base + 'third-party/jquery-1.10.2.min.js');
    }
    await loadScript(base + 'ueditor.config.js');
    await loadScript(base + 'ueditor.all.js');
    if (props.withXiumi) {
      await loadScript(base + 'third-party/xiumi/xiumi-ue-dialog-v5.js');
    }

    // 在运行时创建官方要求的 <script type="text/plain"> 容器，避免在模板中使用 <script>
    containerId = `ueditor-${Math.random().toString(36).slice(2)}`;
    const holder = document.createElement('script');
    holder.type = 'text/plain';
    holder.id = containerId;
    mountEl.value.appendChild(holder);

    // 计算服务端 URL：优先使用 props.serverUrl，否则用 VITE_API_BASE 推导
    const apiBase = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || '';
    const resolvedServerUrl = props.serverUrl || (apiBase ? apiBase + '/api/ueditor/controller' : '/api/ueditor/controller');

    // 启用并扩展 XSS 白名单，追加 section 的 class/style
    if (window.UEDITOR_CONFIG) {
      window.UEDITOR_CONFIG.xssFilterRules = true;
      window.UEDITOR_CONFIG.inputXssFilter = true;
      window.UEDITOR_CONFIG.outputXssFilter = true;
      const wl = window.UEDITOR_CONFIG.whitList || {};
      wl.section = wl.section || ['class', 'style'];
      window.UEDITOR_CONFIG.whitList = wl;
    }

    editor = window.UE.getEditor(containerId, {
      initialFrameWidth: '100%',
      initialFrameHeight: props.height,
      autoHeightEnabled: false,
      serverUrl: resolvedServerUrl,
    });

    editor.addListener('ready', () => {
      if (props.modelValue) editor.setContent(props.modelValue);
      emit('ready');
    });
    editor.addListener('contentChange', () => {
      emit('update:modelValue', editor.getContent());
    });
  } catch (e) {
    // 简单兜底，避免页面阻断
    console.error('UEditor init error:', e);
  }
});

onBeforeUnmount(() => {
  try { editor?.destroy(); } catch (_) {}
  editor = null;
});

watch(() => props.modelValue, (v) => {
  if (!editor) return;
  const cur = editor.getContent();
  if ((v || '') !== cur) editor.setContent(v || '');
});
</script>

<template>
  <div ref="mountEl" style="max-width: 100%;"></div>
  <!-- 资源路径放在 public/ueditor/ 下：
       - ueditor.config.js
       - ueditor.all.js
       - lang/zh-cn/
       - third-party/jquery.min.js (如需)
       - third-party/xiumi/xiumi-ue-v5.js (如需) -->
</template>


