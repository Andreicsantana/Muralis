import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiRequest } from '../services/apiClient.js';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('muralis_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('muralis_refresh_token'));
  const isAuthenticated = computed(() => !!token.value);

  function setAuth(userData: User, authToken: string, newRefreshToken: string) {
    user.value = userData;
    token.value = authToken;
    refreshToken.value = newRefreshToken;

    localStorage.setItem('muralis_token', authToken);
    localStorage.setItem('muralis_refresh_token', newRefreshToken);
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    refreshToken.value = null;

    localStorage.removeItem('muralis_token');
    localStorage.removeItem('muralis_refresh_token');
  }

  async function fetchCurrentUser() {
    if (!token.value) return null;
    try {
      const profile = await apiRequest<User>('/auth/me');
      user.value = profile;
      return profile;
    } catch {
      clearAuth();
      return null;
    }
  }

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    setAuth,
    clearAuth,
    fetchCurrentUser
  };
});
