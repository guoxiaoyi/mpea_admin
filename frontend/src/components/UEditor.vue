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
const emit = defineEmits(['update:modelValue', 'ready', 'pending-change']);

const mountEl = ref(null);
let editor;
let containerId = '';
let editorReady = false;
let hasPendingUploads = false;
let mutationObserver;
let rafId = null;
let lastSyncedHtml = (typeof props.modelValue === 'string' ? props.modelValue : '') || '';

const scriptPromises = new Map();

function loadScript(src) {
  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const existing = document.querySelector(`script[src="${src}"]`);

  const promise = new Promise((resolve, reject) => {
    const target = existing || document.createElement('script');

    if (existing && existing.getAttribute('data-loaded') === 'true') {
      resolve();
      return;
    }

    const cleanup = () => {
      target.removeEventListener('load', onLoad);
      target.removeEventListener('error', onError);
    };

    const onLoad = () => {
      target.setAttribute('data-loaded', 'true');
      cleanup();
      resolve();
    };

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    target.addEventListener('load', onLoad);
    target.addEventListener('error', onError);

    if (!existing) {
      target.src = src;
      document.head.appendChild(target);
    } else if (existing.readyState === 'complete') {
      // 兼容部分浏览器 load 已经触发但 data-loaded 未设置的情况
      onLoad();
    }
  });

  scriptPromises.set(src, promise);
  return promise;
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

    // 全局 config 兜底：关闭自动保存、防止销毁后计时器访问已清理的实例
    if (window.UEDITOR_CONFIG) {
      window.UEDITOR_CONFIG.enableAutoSave = false;
      window.UEDITOR_CONFIG.saveInterval = 0;
    }

    // 启用并扩展 XSS 白名单，追加 section 的 class/style
    if (window.UEDITOR_CONFIG) {
      window.UEDITOR_CONFIG.xssFilterRules = true;
      window.UEDITOR_CONFIG.inputXssFilter = true;
      window.UEDITOR_CONFIG.outputXssFilter = true;
      const wl = window.UEDITOR_CONFIG.whitList || {};
      wl.section = wl.section || ['class', 'style'];
      window.UEDITOR_CONFIG.whitList = wl;
    }

    const scheduleSync = () => {
      if (!editor) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!editor) return;
        const html = editor.getContent();
        const pending = !!editor.body?.querySelector('.loadingclass');
        if (pending !== hasPendingUploads) {
          hasPendingUploads = pending;
          emit('pending-change', pending);
        }
        if (html !== lastSyncedHtml) {
          lastSyncedHtml = html;
          emit('update:modelValue', html);
        }
      });
    };

    const startObserver = () => {
      if (!editor?.body) return;
      mutationObserver?.disconnect();
      mutationObserver = new MutationObserver(() => scheduleSync());
      mutationObserver.observe(editor.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'src', 'style'],
      });
    };

    editor = window.UE.getEditor(containerId, {
      initialFrameWidth: '100%',
      initialFrameHeight: props.height,
      autoHeightEnabled: false,
      serverUrl: resolvedServerUrl,
    });

    editor.addListener('ready', () => {
      editorReady = true;
      if (props.modelValue) editor.setContent(props.modelValue);
      lastSyncedHtml = editor.getContent();
      startObserver();
      scheduleSync();
      emit('ready');
    });
    editor.addListener('contentChange', scheduleSync);
  } catch (e) {
    // 简单兜底，避免页面阻断
    console.error('UEditor init error:', e);
  }
});

onBeforeUnmount(() => {
  if (hasPendingUploads) {
    emit('pending-change', false);
    hasPendingUploads = false;
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  if (editor?._saveFlag) {
    window.clearTimeout(editor._saveFlag);
    editor._saveFlag = null;
  }
  try { editor?.destroy(); } catch (_) {}
  editor = null;
  editorReady = false;
});

watch(() => props.modelValue, (v) => {
  if (!editor || !editorReady || !editor.body) return;
  const cur = editor.getContent();
  const next = v || '';
  if (next !== cur) editor.setContent(next);
  lastSyncedHtml = next;
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


