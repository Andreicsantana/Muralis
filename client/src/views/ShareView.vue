<template>
  <div class="h-full bg-slate-950 flex flex-col overflow-hidden">
    <header class="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10">
      <div class="flex items-center space-x-3">
        <div class="w-7 h-7 rounded bg-brand-600 flex items-center justify-center font-bold text-white text-xs">
          M
        </div>
        <div>
          <h1 class="text-xs font-bold text-white">{{ project?.title || 'Visualização do Mural' }}</h1>
          <span class="text-[10px] text-slate-400">Modo Somente Visualização</span>
        </div>
      </div>

      <button
        v-if="project"
        class="py-1.5 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium flex items-center space-x-1.5"
        @click="downloadPreview"
      >
        <DownloadIcon class="w-3.5 h-3.5" />
        <span>Baixar Imagem</span>
      </button>
    </header>

    <main class="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
      <div v-if="loading" class="text-xs text-slate-500">
        Carregando simulação...
      </div>

      <div v-else-if="error" class="text-xs text-red-400">
        {{ error }}
      </div>

      <ViewportCanvas
        v-else-if="project"
        ref="viewportRef"
        :base-photo-url="project.basePhoto?.url || null"
        :art-asset-url="project.artAsset?.url || null"
        :corner-points="project.cornerPoints"
        :blend-mode="project.blendMode"
        :opacity="project.opacity"
        :brightness="project.brightness"
        :contrast="project.contrast"
        :show-handles="false"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Download as DownloadIcon } from 'lucide-vue-next';
import ViewportCanvas from '../components/editor/ViewportCanvas.vue';
import { apiRequest } from '../services/apiClient.js';

const route = useRoute();
const viewportRef = ref<InstanceType<typeof ViewportCanvas> | null>(null);

const project = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function fetchSharedProject() {
  const token = route.params.token as string;
  try {
    const res = await apiRequest(`/share/${token}`);
    project.value = res.project;
  } catch (err: any) {
    error.value = err.message || 'Link expirado ou inexistente';
  } finally {
    loading.value = false;
  }
}

async function downloadPreview() {
  if (!viewportRef.value) return;
  const dataUrl = await viewportRef.value.exportHighRes();
  const link = document.createElement('a');
  link.download = `${project.value?.title || 'mural'}_preview.png`;
  link.href = dataUrl;
  link.click();
}

onMounted(() => {
  fetchSharedProject();
});
</script>
