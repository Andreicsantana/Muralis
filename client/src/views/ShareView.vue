<template>
  <div class="h-full bg-asphalt-950 flex flex-col overflow-hidden select-none">
    <!-- Street Presentation Header -->
    <header class="h-16 bg-asphalt-900 border-b-2 border-asphalt-700 flex items-center justify-between px-6 z-10">
      <div class="flex items-center space-x-3">
        <div class="px-2.5 py-1 bg-spray-pink text-white font-tag text-base tracking-wider rounded-sm shadow-spray-pink transform -rotate-1">
          M
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="font-display font-black text-sm text-white uppercase tracking-tight">
              {{ project?.title || 'Simulação de Mural' }}
            </h1>
            <span class="px-1.5 py-0.5 bg-spray-volt/20 text-spray-volt text-[9px] font-mono font-bold tracking-widest uppercase">
              3D PREVIEW
            </span>
          </div>
          <span class="text-[10px] font-mono text-slate-400 block -mt-0.5">
            MURALIS STREET LAB // VISUALIZAÇÃO PÚBLICA
          </span>
        </div>
      </div>

      <button
        v-if="project"
        class="py-2 px-4 bg-spray-volt hover:bg-spray-voltHover text-asphalt-950 rounded-sm text-xs font-mono font-black uppercase tracking-wider flex items-center space-x-2 shadow-spray-volt transition-all active:scale-95"
        @click="downloadPreview"
      >
        <DownloadIcon class="w-4 h-4 stroke-[3]" />
        <span>Baixar Imagem HD</span>
      </button>
    </header>

    <main class="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-[#07080a]">
      <div v-if="loading" class="text-xs font-mono text-slate-400 animate-pulse">
        [ CARREGANDO SIMULAÇÃO DE MURO... ]
      </div>

      <div v-else-if="error" class="text-xs font-mono text-rose-400 bg-rose-950/40 p-4 border border-rose-700">
        [!] {{ error }}
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
  try {
    const dataUrl = await viewportRef.value.exportHighRes('image/png');
    const link = document.createElement('a');
    link.download = `${project.value?.title || 'mural'}-muralis.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export preview', err);
  }
}

onMounted(() => {
  fetchSharedProject();
});
</script>
