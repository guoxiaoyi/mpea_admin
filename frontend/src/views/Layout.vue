<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { logoutApi } from '@/api/auth';

const router = useRouter();
const userStore = useUserStore();

async function onLogout() {
  try { await logoutApi(); } catch (e) {}
  userStore.logout();
  router.replace('/login');
}
</script>

<template>
  <div class="min-h-screen grid grid-cols-[264px_1fr] grid-rows-[72px_1fr]" style="background: var(--surface-muted)">
    <!-- Sidebar -->
    <aside class="row-span-2 col-start-1 bg-slate-900 text-white">
      <!-- Brand -->
      <div class="h-16 flex items-center px-6 gap-3">
        <div class="h-8 w-8 grid place-items-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/30">
          <span class="text-indigo-300 text-sm font-bold">MP</span>
        </div>
        <div class="font-semibold tracking-wide">MPEA Admin</div>
      </div>
      <!-- Nav -->
      <nav class="px-3 space-y-1">
        <RouterLink
          to="/admin"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'dashboard' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12l9-9 9 9"/><path d="M9 21V9h6v12"/></svg>
          <span>概览</span>
        </RouterLink>
        <RouterLink
          to="/admin/pages"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'pages' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h7M7 12h10M7 16h10"/></svg>
          <span>页面管理</span>
        </RouterLink>
        <RouterLink
          to="/admin/cases"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'cases' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7z"/><path d="M8 9h8M8 13h5M8 17h3"/></svg>
          <span>案例管理</span>
        </RouterLink>
        <RouterLink
          to="/admin/lecturers"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'lecturers' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/><path d="M4 20a8 8 0 0116 0"/></svg>
          <span>讲师管理</span>
        </RouterLink>
        <RouterLink
          to="/admin/certificates"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'certificates' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span>证书管理</span>
        </RouterLink>
        <RouterLink
          to="/admin/partners"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'partners' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <span>合作伙伴</span>
        </RouterLink>
        <RouterLink
          to="/admin/map/continents"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'map-continents' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3h18v18H3z" />
            <path d="M9 3v18M3 9h18" />
          </svg>
          <span>地图洲管理</span>
        </RouterLink>
        <RouterLink
          to="/admin/map/markers"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'map-markers' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2a6 6 0 016 6c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 016-6z" />
            <circle cx="12" cy="8" r="2" />
          </svg>
          <span>城市标记</span>
        </RouterLink>
        <RouterLink
          to="/admin/ai-images"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'ai-images' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7z"/><path d="M8 12l2.5 3 2-2.5L16 16"/><circle cx="9.5" cy="8.5" r="1.5"/></svg>
          <span>AI 图片生成</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Header -->
    <header class="col-start-2 h-16 border-b flex items-center justify-between px-8" style="background: var(--surface); border-color: var(--border)">
      <div class="flex items-center gap-3">
        <div class="text-base font-semibold text-slate-900">控制台</div>
        <span class="hidden sm:inline-block text-xs text-slate-500">v1.0</span>
      </div>
      <div class="flex items-center gap-3 text-sm">
        <div class="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5" style="border-color: var(--border); background: var(--surface-muted)">
          <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input placeholder="搜索…" class="bg-transparent outline-none placeholder:text-slate-400 text-slate-700 w-48" />
        </div>
        <span class="text-slate-700 font-medium">{{ userStore.admin?.username || '管理员' }}</span>
        <button @click="onLogout" class="ui-btn-outline">退出</button>
      </div>
    </header>

    <!-- Content -->
    <main class="col-start-2 p-8">
      <div class="mx-auto space-y-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>
