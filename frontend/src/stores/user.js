import { defineStore } from 'pinia';
import { setToken as saveToken, removeToken as clearToken, getToken } from '@/utils/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    admin: null,
  }),
  actions: {
    setAuth(token, admin) {
      this.token = token;
      this.admin = admin || null;
      if (token) saveToken(token);
    },
    logout() {
      this.token = '';
      this.admin = null;
      clearToken();
    }
  }
});
