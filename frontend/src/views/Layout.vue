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
  <div class="min-h-screen grid grid-cols-[260px_1fr] grid-rows-[64px_1fr] bg-slate-50">
    <!-- Sidebar -->
    <aside class="row-span-2 col-start-1 bg-slate-900 text-white">
      <!-- Brand -->
      <div class="h-16 flex items-center px-5 gap-2">
        <div class="h-8 w-8 grid place-items-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/30">
          <span class="text-indigo-300 text-sm font-bold">MP</span>
        </div>
        <div class="font-semibold tracking-wide">MPEA Admin</div>
      </div>
      <!-- Nav -->
      <nav class="px-3 space-y-1">
        <RouterLink
          to="/admin"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'dashboard' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12l9-9 9 9"/><path d="M9 21V9h6v12"/></svg>
          <span>概览</span>
        </RouterLink>
        <RouterLink
          to="/admin/pages"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
          aria-current="$route.name === 'pages' ? 'page' : undefined"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h7M7 12h10M7 16h10"/></svg>
          <span>页面管理</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Header -->
    <header class="col-start-2 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <div class="text-base font-medium text-slate-800">控制台</div>
        <span class="hidden sm:inline-block text-xs text-slate-500">v1.0</span>
      </div>
      <div class="flex items-center gap-3 text-sm">
        <div class="hidden sm:flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 bg-slate-50">
          <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input placeholder="搜索…" class="bg-transparent outline-none placeholder:text-slate-400 text-slate-700 w-48" />
        </div>
        <span class="text-slate-600">{{ userStore.admin?.username || '管理员' }}</span>
        <button @click="onLogout" class="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50">退出</button>
      </div>
    </header>

    <!-- Content -->
    <main class="col-start-2 p-6">
      <div class="mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>
