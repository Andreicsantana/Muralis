<template>
  <div class="flex flex-col md:flex-row h-full w-full bg-asphalt-950 overflow-hidden select-none safe-top safe-bottom relative">
    <main class="flex-1 relative flex flex-col h-full overflow-hidden">
      <!-- Street Artist Header -->
      <header class="h-14 bg-asphalt-900 border-b-2 border-asphalt-700 flex items-center justify-between px-3 md:px-4 z-10">
        <div class="flex items-center space-x-2 md:space-x-3 min-w-0">
          <router-link
            to="/projects"
            class="text-xs font-mono font-bold text-slate-400 hover:text-spray-pink flex items-center space-x-1 uppercase transition-colors shrink-0"
          >
            <ArrowLeftIcon class="w-4 h-4 stroke-[2.5]" />
            <span class="hidden sm:inline">Galeria</span>
          </router-link>

          <div class="h-4 w-px bg-asphalt-700 shrink-0"></div>

          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="text-spray-pink font-mono text-xs font-bold shrink-0">[MURAL]</span>
            <input
              v-model="projectStore.currentProject.title"
              type="text"
              class="bg-transparent border-b border-transparent hover:border-asphalt-600 focus:border-spray-pink text-xs font-mono font-bold text-white px-1 py-0.5 focus:outline-none uppercase tracking-wider truncate max-w-[130px] sm:max-w-xs"
              placeholder="NOME DO MURAL"
            />
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <span
            v-if="isCameraActive"
            class="px-2 py-0.5 bg-rose-500/20 border border-rose-500 text-rose-300 rounded-sm text-[9px] md:text-[10px] font-mono font-black tracking-widest flex items-center space-x-1 animate-pulse"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>CÂMERA ATIVA</span>
          </span>
          <span
            v-else-if="projectStore.currentProject.isDirty"
            class="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-sm text-[9px] md:text-[10px] font-mono font-bold"
          >
            ● NÃO SALVO
          </span>
          <span
            v-else
            class="px-2 py-0.5 bg-spray-volt/15 border border-spray-volt/40 text-spray-volt rounded-sm text-[9px] md:text-[10px] font-mono font-bold"
          >
            ✓ SALVO
          </span>

          <!-- Mobile Toggle Toolbar Button: Opens Drawer from Bottom -->
          <button
            class="md:hidden p-2 rounded-sm font-mono text-xs font-bold uppercase flex items-center space-x-1 transition-all active:scale-95 shadow-md"
            :class="isMobileToolbarOpen ? 'bg-asphalt-800 border border-asphalt-600 text-white' : 'bg-spray-pink text-white shadow-spray-pink'"
            @click="isMobileToolbarOpen = !isMobileToolbarOpen"
            title="Ajustes e Camadas"
          >
            <SlidersIcon class="w-3.5 h-3.5" />
            <span>{{ isMobileToolbarOpen ? 'Fechar' : 'Ajustes' }}</span>
          </button>
        </div>
      </header>

      <!-- Viewport Canvas Work Area -->
      <div class="flex-1 relative overflow-hidden flex items-center justify-center p-2 md:p-4 bg-[#07080a]">
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
          :is-camera-active="isCameraActive"
          @update-point="handleUpdatePoint"
          @update-points="handleUpdatePoints"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @camera-frame-captured="handleCameraFrameCaptured"
          @camera-error="handleCameraError"
        />

        <MaskBrush
          v-if="isMaskMode"
          ref="maskBrushRef"
          :brush-size="brushSize"
          :is-eraser="isEraser"
          @mask-updated="handleMaskUpdated"
        />
      </div>

      <!-- Mobile Quick Floating Action Bar on Bottom -->
      <div
        v-if="!isMobileToolbarOpen"
        class="md:hidden absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center space-x-2 pointer-events-none"
      >
        <div class="bg-asphalt-900/90 backdrop-blur-md border-2 border-asphalt-700 p-1.5 rounded-sm shadow-2xl flex items-center space-x-2 pointer-events-auto">
          <button
            class="py-1.5 px-3 bg-spray-pink text-white font-mono text-xs font-bold uppercase rounded-sm flex items-center space-x-1 shadow-spray-pink active:scale-95"
            @click="handleToggleCamera"
          >
            <CameraIcon class="w-3.5 h-3.5" />
            <span>{{ isCameraActive ? 'Parar Câmera' : 'Ligar Câmera' }}</span>
          </button>

          <button
            v-if="isCameraActive"
            class="py-1.5 px-3 bg-spray-volt text-asphalt-950 font-mono text-xs font-black uppercase rounded-sm shadow-spray-volt active:scale-95"
            @click="handleCaptureCamera"
          >
            <CheckIcon class="w-3.5 h-3.5 stroke-[3]" />
            <span>Congelar Foto</span>
          </button>

          <button
            class="py-1.5 px-3 bg-asphalt-800 text-slate-200 border border-asphalt-600 font-mono text-xs font-bold uppercase rounded-sm flex items-center space-x-1 active:scale-95"
            @click="isMobileToolbarOpen = true"
          >
            <SlidersIcon class="w-3.5 h-3.5 text-spray-volt" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Mobile Drawer (Top-Down Slide) / Desktop Sidebar -->
    <div
      class="fixed md:static inset-x-0 bottom-0 md:inset-auto z-40 md:z-auto transition-transform duration-300 ease-out md:translate-y-0"
      :class="isMobileToolbarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0 pointer-events-none md:pointer-events-auto'"
    >
      <!-- Mobile Backdrop below drawer -->
      <div
        v-if="isMobileToolbarOpen"
        class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs -z-10"
        @click="isMobileToolbarOpen = false"
      ></div>

      <!-- Drawer Body: Max 70% of screen height from top on mobile, full height on desktop -->
      <div class="h-[75vh] md:h-full w-full md:w-80 shadow-2xl border-t-2 md:border-t-0 md:border-l-2 rounded-t-xl md:rounded-none border-asphalt-700 flex flex-col pointer-events-auto bg-asphalt-900">
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
          :is-camera-active="isCameraActive"
          :art-scale="artScale"
          :vertical-position="verticalPosition"
          :current-slope="manualSlope"
          @update:blend-mode="projectStore.setBlendMode"
          @update:opacity="projectStore.setOpacity"
          @update:brightness="projectStore.setBrightness"
          @update:contrast="projectStore.setContrast"
          @update:brush-size="(val) => (brushSize = val)"
          @update:is-eraser="(val) => (isEraser = val)"
          @update:art-scale="handleUpdateArtScale"
          @update:vertical-position="handleUpdateVerticalPosition"
          @apply-preset="handleApplyPreset"
          @toggle-mask-mode="isMaskMode = !isMaskMode"
          @clear-mask="handleClearMask"
          @undo="projectStore.undo"
          @redo="projectStore.redo"
          @save="handleSave"
          @share="handleShare"
          @export="handleExport"
          @base-loaded="handleBaseLoaded"
          @art-loaded="handleArtLoaded"
          @toggle-camera="handleToggleCamera"
          @capture-camera="handleCaptureCamera"
          @auto-fit="handleAutoFit"
          @close-mobile="isMobileToolbarOpen = false"
          :has-art="!!projectStore.currentProject.artAssetUrl"
          @open-image-editor="handleOpenImageEditor"
        />
      </div>
    </div>

    <!-- Image Editor Modal -->
    <ImageEditorModal
      :is-open="isImageEditorOpen"
      :image-url="projectStore.currentProject.artAssetUrl"
      @close="isImageEditorOpen = false"
      @save="handleSaveEditedArt"
    />

    <!-- Share Modal -->
    <div
      v-if="shareModalOpen"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-text"
    >
      <div class="bg-asphalt-900 border-2 border-asphalt-700 shadow-brutalist max-w-md w-full p-6 space-y-4 rounded-sm relative">
        <div class="flex items-center space-x-2">
          <div class="px-2 py-0.5 bg-spray-pink text-white font-tag text-xs tracking-wider">
            SHARE TAG
          </div>
          <h3 class="text-base font-display font-black text-white uppercase tracking-tight">
            Compartilhar Simulação
          </h3>
        </div>

        <p class="text-xs font-mono text-slate-400 leading-relaxed">
          Envie o link público para seu cliente ou contratante visualizar o mural no muro em qualquer dispositivo.
        </p>

        <div class="flex items-center space-x-2">
          <input
            :value="shareUrl"
            readonly
            class="flex-1 bg-asphalt-950 border border-asphalt-700 rounded-sm px-3 py-2 text-xs font-mono text-spray-volt focus:outline-none select-all"
          />
          <button
            class="py-2 px-3 bg-spray-pink hover:bg-spray-pinkHover text-white rounded-sm text-xs font-mono font-bold uppercase transition-all shadow-spray-pink active:scale-95"
            @click="copyShareLink"
          >
            {{ copied ? 'COPIADO!' : 'COPIAR' }}
          </button>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-4 py-1.5 bg-asphalt-800 hover:bg-asphalt-700 text-slate-300 font-mono text-xs uppercase rounded-sm border border-asphalt-700 transition-colors"
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
import { ArrowLeft as ArrowLeftIcon, Sliders as SlidersIcon, Camera as CameraIcon, Check as CheckIcon } from 'lucide-vue-next';
import { useProjectStore } from '../stores/projectStore.js';
import { Point2D } from '../engine/homography.js';
import ViewportCanvas from '../components/editor/ViewportCanvas.vue';
import Toolbar from '../components/editor/Toolbar.vue';
import MaskBrush from '../components/editor/MaskBrush.vue';
import ImageEditorModal from '../components/editor/ImageEditorModal.vue';
import { apiRequest } from '../services/apiClient.js';
import { ensureCameraPermissions } from '../services/permissionService.js';

const route = useRoute();
const projectStore = useProjectStore();

const viewportRef = ref<InstanceType<typeof ViewportCanvas> | null>(null);
const maskBrushRef = ref<InstanceType<typeof MaskBrush> | null>(null);

const isMobileToolbarOpen = ref(false);
const isMaskMode = ref(false);
const brushSize = ref(30);
const isEraser = ref(false);
const maskCanvas = ref<HTMLCanvasElement | null>(null);
const isCameraActive = ref(false);
const artScale = ref(0.70);
const verticalPosition = ref(0);
const manualSlope = ref<number | null>(null);
const isImageEditorOpen = ref(false);

function handleOpenImageEditor() {
  if (projectStore.currentProject.artAssetUrl) {
    isImageEditorOpen.value = true;
  }
}

function handleSaveEditedArt(newUrl: string) {
  projectStore.pushHistory();
  projectStore.setArtAsset(newUrl);
  projectStore.saveProject();
}

const shareModalOpen = ref(false);
const shareUrl = ref('');
const copied = ref(false);

function handleUpdatePoint(index: number, point: Point2D) {
  projectStore.setCornerPoint(index, point);
}

function handleUpdatePoints(points: [Point2D, Point2D, Point2D, Point2D]) {
  projectStore.setCornerPoints(points);
}

function handleDragStart() {
  projectStore.pushHistory();
}

function handleDragEnd() {
  projectStore.saveProject();
}

async function handleToggleCamera() {
  if (!isCameraActive.value) {
    const perm = await ensureCameraPermissions();
    if (!perm.granted) {
      alert(perm.error || 'Permissão para usar a câmera não concedida.');
      return;
    }
    isCameraActive.value = true;
  } else {
    isCameraActive.value = false;
  }
}

function handleCaptureCamera() {
  if (viewportRef.value) {
    const frame = viewportRef.value.captureCameraFrame();
    if (frame) {
      projectStore.pushHistory();
      projectStore.setBasePhoto(frame);
      isCameraActive.value = false;
    }
  }
}

function handleCameraFrameCaptured(frame: string) {
  projectStore.setBasePhoto(frame);
}

function handleCameraError(errorMsg: string) {
  alert(errorMsg);
  isCameraActive.value = false;
}

function handleAutoFit() {
  if (viewportRef.value) {
    projectStore.pushHistory();
    viewportRef.value.autoFitWall({
      scaleFactor: artScale.value,
      verticalOffset: verticalPosition.value,
      manualSlope: manualSlope.value
    });
  }
}

function handleApplyPreset(slope: number) {
  manualSlope.value = slope;
  if (viewportRef.value) {
    projectStore.pushHistory();
    viewportRef.value.applyDirectionPreset(slope);
  }
}

function handleUpdateArtScale(val: number) {
  artScale.value = val;
  handleAutoFit();
}

function handleUpdateVerticalPosition(val: number) {
  verticalPosition.value = val;
  handleAutoFit();
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
  isCameraActive.value = false;
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
    const origin = window.location.origin;
    shareUrl.value = `${origin}/share/${res.token}`;
    shareModalOpen.value = true;
  } catch (err) {
    console.error('Failed to create share link', err);
    shareUrl.value = window.location.href;
    shareModalOpen.value = true;
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(shareUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2500);
}

async function handleExport() {
  if (!viewportRef.value) return;
  try {
    const dataUrl = await viewportRef.value.exportHighRes('image/png');
    const link = document.createElement('a');
    link.download = `${projectStore.currentProject.title.toLowerCase().replace(/\s+/g, '-')}-muralis.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export project', err);
  }
}

onMounted(async () => {
  const projectId = route.params.id as string;
  if (projectId) {
    await projectStore.loadProject(projectId);
  }

  // Camera active by default if no static base photo is already loaded
  if (!projectStore.currentProject.basePhotoUrl) {
    try {
      const perm = await ensureCameraPermissions();
      if (perm.granted) {
        isCameraActive.value = true;
      }
    } catch (e) {
      console.warn('Auto camera start skipped:', e);
    }
  }
});
</script>
