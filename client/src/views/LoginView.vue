<template>
  <div class="h-full bg-asphalt-950 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Street background glow & spray splatter elements -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-spray-pink/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-spray-volt/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="max-w-md w-full bg-asphalt-900 border-2 border-asphalt-700 shadow-brutalist relative p-8 space-y-6 z-10">
      <!-- Tape / Stencil accent on corner -->
      <div class="absolute -top-3 -right-3 px-3 py-0.5 bg-spray-yellow text-asphalt-950 text-[10px] font-black tracking-widest uppercase transform rotate-3 shadow-md">
        STREET LAB v2.0
      </div>

      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center px-4 py-1.5 bg-spray-pink text-white font-tag text-2xl tracking-wider rounded-sm shadow-spray-pink transform -rotate-1 mb-1">
          MURALIS
        </div>
        <h2 class="text-xl font-display font-black text-white tracking-tight uppercase">
          {{ isRegister ? 'Cadastre seu Tag' : 'Acesse o Estúdio' }}
        </h2>
        <p class="text-xs text-slate-400 font-mono tracking-wide">
          // SIMULADOR DE ARTE URBANA, PIXO E FACHADAS
        </p>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="isRegister">
          <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Nome de Artista / Tag
          </label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full bg-asphalt-950 border border-asphalt-700 focus:border-spray-pink focus:ring-1 focus:ring-spray-pink px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
            placeholder="Ex: OSGEMEOS, KOBRA, NOME..."
          />
        </div>

        <div>
          <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1">
            E-mail
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full bg-asphalt-950 border border-asphalt-700 focus:border-spray-pink focus:ring-1 focus:ring-spray-pink px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
            placeholder="artista@rua.com"
          />
        </div>

        <div>
          <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Senha
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full bg-asphalt-950 border border-asphalt-700 focus:border-spray-pink focus:ring-1 focus:ring-spray-pink px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMessage" class="p-2.5 bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-mono">
          [!] {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 px-4 bg-spray-pink hover:bg-spray-pinkHover text-white text-xs font-black uppercase tracking-widest transition-all shadow-spray-pink active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>{{ loading ? 'Carregando Sprays...' : isRegister ? 'Criar Registro de Artista' : 'Entrar no Estúdio' }}</span>
        </button>
      </form>

      <!-- Footer switch -->
      <div class="text-center pt-2 border-t border-asphalt-800">
        <button
          type="button"
          class="text-xs text-slate-400 hover:text-spray-volt transition-colors font-mono tracking-wide"
          @click="isRegister = !isRegister; errorMessage = ''"
        >
          {{ isRegister ? '← Já possui tag? Entrar no estúdio' : '+ Novo na cena? Cadastre-se' }}
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
