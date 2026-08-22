<template>
  <div class="flex h-full w-full bg-slate-950 overflow-hidden select-none">
    <main class="flex-1 relative flex flex-col h-full overflow-hidden">
      <header class="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-10">
        <div class="flex items-center space-x-3">
          <router-link to="/projects" class="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
            <ArrowLeftIcon class="w-4 h-4" />
            <span>Projetos</span>
          </router-link>
          <div class="h-4 w-px bg-slate-700"></div>
          <input
            v-model="projectStore.currentProject.title"
            type="text"
            class="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-brand-500 text-sm font-semibold text-white px-1 py-0.5 focus:outline-none"
            placeholder="Nome do Projeto"
          />
        </div>

        <div class="flex items-center space-x-3">
          <span v-if="projectStore.currentProject.isDirty" class="text-xs text-amber-400">● Não salvo</span>
          <span v-else class="text-xs text-emerald-400">✓ Salvo</span>
        </div>
      </header>

      <div class="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        <ViewportCanvas
          ref="viewportRef"
          :base-photo-url="projectStore.currentProject.basePhotoUrl"
          :art-asset-url="projectStore.currentProject.artAssetUrl"
          :corner-points="projectStore.currentProject.cornerPoints"
          :blend-mode="projectStore.currentProject.blendMode"
          :opacity="projectStore.currentProject.opacity"
          :brightness="projectStore.currentProject.brightness"
          :contrast="projectStore.currentProject.contrast"
          :show-handles="!isMaskMode"
          :mask-canvas="maskCanvas"
          @update-point="handleUpdatePoint"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
        />

        <MaskBrush
          v-if="isMaskMode"
          ref="maskBrushRef"
          :brush-size="brushSize"
          :is-eraser="isEraser"
          @mask-updated="handleMaskUpdated"
        />
      </div>
    </main>

    <Toolbar
      :blend-mode="projectStore.currentProject.blendMode"
      :opacity="projectStore.currentProject.opacity"
      :brightness="projectStore.currentProject.brightness"
      :contrast="projectStore.currentProject.contrast"
      :can-undo="projectStore.historyIndex > 0"
      :can-redo="projectStore.historyIndex < projectStore.history.length - 1"
      :is-mask-mode="isMaskMode"
      :brush-size="brushSize"
      :is-eraser="isEraser"
      @update:blend-mode="projectStore.setBlendMode"
      @update:opacity="projectStore.setOpacity"
      @update:brightness="projectStore.setBrightness"
      @update:contrast="projectStore.setContrast"
      @update:brush-size="(val) => (brushSize = val)"
      @update:is-eraser="(val) => (isEraser = val)"
      @toggle-mask-mode="isMaskMode = !isMaskMode"
      @clear-mask="handleClearMask"
      @undo="projectStore.undo"
      @redo="projectStore.redo"
      @save="handleSave"
      @share="handleShare"
      @export="handleExport"
      @base-loaded="handleBaseLoaded"
      @art-loaded="handleArtLoaded"
    />

    <div
      v-if="shareModalOpen"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 class="text-base font-semibold text-white">Compartilhar com Cliente</h3>
        <p class="text-xs text-slate-400">
          Envie o link abaixo para seu cliente visualizar a simulação em qualquer dispositivo.
        </p>

        <div class="flex items-center space-x-2">
          <input
            :value="shareUrl"
            readonly
            class="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
          />
          <button
            class="py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium"
            @click="copyShareLink"
          >
            {{ copied ? 'Copiado!' : 'Copiar' }}
          </button>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
            @click="shareModalOpen = false"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next';
import { useProjectStore } from '../stores/projectStore.js';
import { Point2D } from '../engine/homography.js';
import ViewportCanvas from '../components/editor/ViewportCanvas.vue';
import Toolbar from '../components/editor/Toolbar.vue';
import MaskBrush from '../components/editor/MaskBrush.vue';
import { apiRequest } from '../services/apiClient.js';

const route = useRoute();
const projectStore = useProjectStore();

const viewportRef = ref<InstanceType<typeof ViewportCanvas> | null>(null);
const maskBrushRef = ref<InstanceType<typeof MaskBrush> | null>(null);

const isMaskMode = ref(false);
const brushSize = ref(30);
const isEraser = ref(false);
const maskCanvas = ref<HTMLCanvasElement | null>(null);

const shareModalOpen = ref(false);
const shareUrl = ref('');
const copied = ref(false);

function handleUpdatePoint(index: number, point: Point2D) {
  projectStore.setCornerPoint(index, point);
}

function handleDragStart() {
  projectStore.pushHistory();
}

function handleDragEnd() {
  projectStore.saveProject();
}

function handleMaskUpdated(canvas: HTMLCanvasElement) {
  maskCanvas.value = canvas;
  projectStore.currentProject.maskCanvas = canvas;
}

function handleClearMask() {
  if (maskBrushRef.value) {
    maskBrushRef.value.clearMask();
  }
  maskCanvas.value = null;
  projectStore.currentProject.maskCanvas = null;
}

function handleBaseLoaded(url: string) {
  projectStore.pushHistory();
  projectStore.setBasePhoto(url);
}

function handleArtLoaded(url: string) {
  projectStore.pushHistory();
  projectStore.setArtAsset(url);
}

async function handleSave() {
  await projectStore.saveProject();
}

async function handleShare() {
  if (!projectStore.currentProject.id) {
    await projectStore.saveProject();
  }
  if (!projectStore.currentProject.id) {
    shareUrl.value = window.location.href;
    shareModalOpen.value = true;
    return;
  }

  try {
    const res = await apiRequest(`/projects/${projectStore.currentProject.id}/share`, {
      method: 'POST',
      body: JSON.stringify({ expiresInDays: 30 })
    });
    shareUrl.value = `${window.location.origin}/share/${res.token}`;
    shareModalOpen.value = true;
  } catch {
    shareUrl.value = window.location.href;
    shareModalOpen.value = true;
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(shareUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

async function handleExport() {
  if (!viewportRef.value) return;
  const dataUrl = await viewportRef.value.exportHighRes();
  const link = document.createElement('a');
  link.download = `${projectStore.currentProject.title.replace(/\s+/g, '_')}_export.png`;
  link.href = dataUrl;
  link.click();
}

onMounted(async () => {
  projectStore.pushHistory();
  const projectId = route.params.id as string | undefined;
  if (projectId) {
    try {
      const project = await apiRequest(`/projects/${projectId}`);
      projectStore.currentProject.id = project.id;
      projectStore.currentProject.title = project.title;
      projectStore.currentProject.cornerPoints = project.cornerPoints;
      projectStore.currentProject.blendMode = project.blendMode;
      projectStore.currentProject.opacity = project.opacity;
      projectStore.currentProject.brightness = project.brightness;
      projectStore.currentProject.contrast = project.contrast;
      if (project.basePhoto?.storageKey) {
        projectStore.currentProject.basePhotoUrl = `/api/assets/${project.basePhoto.id}/stream`;
      }
      if (project.artAsset?.storageKey) {
        projectStore.currentProject.artAssetUrl = `/api/assets/${project.artAsset.id}/stream`;
      }
    } catch {}
  }
});
</script>
