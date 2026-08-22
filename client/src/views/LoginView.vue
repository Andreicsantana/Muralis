<template>
  <div class="h-full bg-slate-950 flex items-center justify-center p-4">
    <div class="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl">
      <div class="text-center space-y-1">
        <div class="w-10 h-10 rounded-lg bg-brand-600 mx-auto flex items-center justify-center font-black text-white text-lg tracking-wider mb-2">
          M
        </div>
        <h2 class="text-lg font-bold text-white">{{ isRegister ? 'Criar Conta' : 'Entrar no Muralis' }}</h2>
        <p class="text-xs text-slate-400">Simulador de Arte Urbana e Fachadas</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="isRegister">
          <label class="block text-xs font-medium text-slate-300 mb-1">Nome</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full bg-slate-950 border border-slate-700 focus:border-brand-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
            placeholder="Seu nome ou estúdio"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full bg-slate-950 border border-slate-700 focus:border-brand-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
            placeholder="email@dominio.com"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Senha</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full bg-slate-950 border border-slate-700 focus:border-brand-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMessage" class="text-xs text-red-400">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-md transition-all active:scale-95"
        >
          {{ loading ? 'Processando...' : isRegister ? 'Cadastrar' : 'Entrar' }}
        </button>
      </form>

      <div class="text-center pt-2">
        <button
          type="button"
          class="text-xs text-slate-400 hover:text-brand-400 underline"
          @click="isRegister = !isRegister; errorMessage = ''"
        >
          {{ isRegister ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { apiRequest } from '../services/apiClient.js';

const router = useRouter();
const authStore = useAuthStore();

const isRegister = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const endpoint = isRegister.value ? '/auth/register' : '/auth/login';
    const payload = isRegister.value
      ? { name: name.value, email: email.value, password: password.value }
      : { email: email.value, password: password.value };

    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    authStore.setAuth(res.user, res.token, res.refreshToken);
    router.push('/projects');
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha na autenticação';
  } finally {
    loading.value = false;
  }
}
</script>
