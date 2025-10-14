<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginApi } from '@/api/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function onSubmit() {
  errorMsg.value = '';
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  loading.value = true;
  try {
    const res = await loginApi({ username: username.value, password: password.value });
    if (res.success) {
      const { token, admin } = res.data;
      userStore.setAuth(token, admin);
      router.replace('/admin/pages');
    } else {
      errorMsg.value = res.message || '登录失败';
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow ring-1 ring-slate-200">
      <h1 class="text-xl font-semibold text-slate-900">管理员登录</h1>
      <p class="mt-1 text-sm text-slate-600">请输入账号密码登录系统</p>
      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-700">用户名</label>
          <input v-model="username" type="text" class="mt-1 w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">密码</label>
          <input v-model="password" type="password" class="mt-1 w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
        <button :disabled="loading" type="submit" class="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-500 disabled:opacity-50">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>
