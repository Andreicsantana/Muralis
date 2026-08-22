<template>
  <div class="h-full w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/authStore.js';

const authStore = useAuthStore();

onMounted(() => {
  authStore.fetchCurrentUser();
});
</script>
