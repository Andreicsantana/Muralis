<template>
  <div class="flex flex-col md:flex-row landscape:flex-row h-full w-full bg-concrete-900 text-paper overflow-hidden select-none safe-top safe-bottom relative">
    <main class="flex-1 relative flex flex-col h-full overflow-hidden">
      <!-- Urban Header with 2px accent bottom line -->
      <header class="h-14 bg-concrete-800 border-b-2 border-paint flex items-center justify-between px-3 md:px-4 z-10 shrink-0">
        <div class="flex items-center space-x-2 md:space-x-3 min-w-0">
          <router-link
            to="/projects"
            class="text-xs font-mono font-bold text-concrete-300 hover:text-paper flex items-center space-x-1 uppercase transition-colors shrink-0"
            aria-label="Ir para a galeria de murais"
          >
            <ArrowLeftIcon class="w-4 h-4 stroke-[2.5]" />
            <span class="hidden sm:inline">Galeria</span>
          </router-link>

          <div class="h-4 w-px bg-concrete-600 shrink-0"></div>

          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="text-paint font-mono text-xs font-bold shrink-0">MURAL:</span>
            <input
              v-model="projectStore.currentProject.title"
              type="text"
              class="bg-transparent border-b border-transparent hover:border-concrete-500 focus:border-paint text-base md:text-xs font-mono font-bold text-paper px-1 py-0.5 focus:outline-none uppercase tracking-wider truncate max-w-[140px] sm:max-w-xs"
              placeholder="NOME DO MURAL"
            />
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <!-- Status Chip -->
          <span
            v-if="isCameraActive"
            class="px-2 py-0.5 border border-paint text-paint rounded-xs text-[10px] font-mono font-bold tracking-wider flex items-center space-x-1 bg-concrete-900"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-paint"></span>
            <span>CÂMERA AO VIVO</span>
          </span>
          <span
            v-else-if="projectStore.currentProject.basePhotoUrl"
            class="px-2 py-0.5 border border-concrete-500 text-concrete-300 rounded-xs text-[10px] font-mono font-bold tracking-wider flex items-center space-x-1 bg-concrete-900"
          >
            <span>FOTO ESTÁTICA</span>
          </span>
          <span
            v-if="projectStore.currentProject.isDirty"
            class="hidden sm:inline-block px-2 py-0.5 border border-concrete-600 text-concrete-300 rounded-xs text-[10px] font-mono"
          >
            ALTERADO
          </span>
        </div>
      </header>

      <!-- Viewport Canvas Work Area -->
      <div class="flex-1 relative overflow-hidden flex items-center justify-center p-2 md:p-4 bg-concrete-950">
        <!-- Viewport Top-Left Live Camera Indicator Chip -->
        <div
          v-if="isCameraActive"
          class="absolute top-4 left-4 z-20 pointer-events-none px-2 py-1 bg-concrete-900 border border-paint text-paint rounded-xs text-[10px] font-mono font-bold tracking-wider flex items-center space-x-1.5"
        >
          <span class="w-2 h-2 rounded-full bg-paint"></span>
          <span>● CÂMERA AO VIVO</span>
        </div>

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
          :is-mask-mode="isMaskMode"
          :brush-size="brushSize"
          :is-eraser="isEraser"
          @update-point="handleUpdatePoint"
          @update-points="handleUpdatePoints"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @camera-frame-captured="handleCameraFrameCaptured"
          @camera-error="handleCameraError"
          @mask-updated="handleMaskUpdated"
        />
      </div>

      <!-- Mobile Floating Shortcut Bar (Visible only when sheet is closed or half) -->
      <div
        v-if="mobileSnap !== 'open'"
        class="md:hidden landscape:hidden absolute bottom-16 left-4 right-4 z-20 flex items-center justify-center pointer-events-none"
      >
        <div class="bg-concrete-800 border border-concrete-600 p-1.5 rounded-xs shadow-brutalist flex items-center space-x-2 pointer-events-auto">
          <button
            type="button"
            class="py-1.5 px-3 border text-xs font-mono font-bold uppercase rounded-xs flex items-center space-x-1.5 transition-colors"
            :class="isCameraActive ? 'bg-danger text-paper border-danger-border' : 'bg-paint text-paint-dark border-paint'"
            @click="handleToggleCamera"
          >
            <CameraIcon class="w-3.5 h-3.5" />
            <span>{{ isCameraActive ? 'Parar Câmera' : 'Ligar Câmera' }}</span>
          </button>

          <button
            v-if="isCameraActive"
            type="button"
            class="py-1.5 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-500 text-paper font-mono text-xs font-bold uppercase rounded-xs flex items-center space-x-1 transition-colors"
            @click="handleCaptureCamera"
          >
            <CheckIcon class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Congelar Foto</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Desktop & Landscape Fixed Sidebar (320px) -->
    <div class="hidden md:flex landscape:flex w-80 shrink-0 h-full border-l-2 border-concrete-600">
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
        :has-art="!!projectStore.currentProject.artAssetUrl"
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
        @open-image-editor="handleOpenImageEditor"
      />
    </div>

    <!-- Mobile Portrait Draggable Bottom Sheet -->
    <BottomSheet v-model="mobileSnap">
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
        :has-art="!!projectStore.currentProject.artAssetUrl"
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
        @open-image-editor="handleOpenImageEditor"
      />
    </BottomSheet>

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
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 select-text"
    >
      <div class="bg-concrete-800 border-2 border-concrete-600 shadow-brutalist max-w-md w-full p-6 space-y-4 rounded-xs relative">
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-4 bg-paint"></span>
          <h3 class="text-base font-display font-black text-paper uppercase tracking-tight">
            Compartilhar Simulação
          </h3>
        </div>

        <p class="text-xs font-mono text-concrete-300 leading-relaxed">
          Link público para visualização da arte na fachada em qualquer dispositivo:
        </p>

        <div class="flex items-center space-x-2">
          <input
            type="text"
            readonly
            :value="shareUrl"
            class="flex-1 bg-concrete-900 border border-concrete-600 px-3 py-2 text-base md:text-xs font-mono text-paper rounded-xs focus:outline-none select-all"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <button
            type="button"
            class="px-4 py-2 border rounded-xs text-xs font-mono font-bold uppercase transition-colors shrink-0"
            :class="copied ? 'bg-concrete-700 text-paint border-paint' : 'bg-paint hover:bg-paint-hover text-paint-dark border-paint'"
            @click="copyShareLink"
          >
            {{ copied ? 'Copiado!' : 'Copiar' }}
          </button>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            class="px-4 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 text-xs font-mono font-bold text-paper rounded-xs transition-colors"
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft as ArrowLeftIcon, Camera as CameraIcon, Check as CheckIcon } from 'lucide-vue-next';
import { useProjectStore } from '../stores/projectStore.js';
import { Point2D } from '../engine/homography.js';
import ViewportCanvas from '../components/editor/ViewportCanvas.vue';
import Toolbar from '../components/editor/Toolbar.vue';
import BottomSheet, { SnapState } from '../components/editor/BottomSheet.vue';
import ImageEditorModal from '../components/editor/ImageEditorModal.vue';
import { apiRequest } from '../services/apiClient.js';
import { ensureCameraPermissions } from '../services/permissionService.js';

const route = useRoute();
const projectStore = useProjectStore();

const viewportRef = ref<InstanceType<typeof ViewportCanvas> | null>(null);

const mobileSnap = ref<SnapState>('closed');
const isMaskMode = ref(false);
const brushSize = ref(30);
const isEraser = ref(false);
const maskCanvas = ref<HTMLCanvasElement | null>(null);
const isCameraActive = ref(false);
const artScale = ref(0.70);
const verticalPosition = ref(0);
const manualSlope = ref<number | null>(null);
const isImageEditorOpen = ref(false);

const shareModalOpen = ref(false);
const shareUrl = ref('');
const copied = ref(false);

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
  if (viewportRef.value) {
    viewportRef.value.clearMask();
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
  let targetUrl = window.location.href;
  if (projectStore.currentProject.id) {
    try {
      const res = await apiRequest(`/projects/${projectStore.currentProject.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ expiresInDays: 30 })
      });
      targetUrl = `${window.location.origin}/share/${res.token}`;
    } catch (err) {
      console.warn('API share link generation skipped, using current url', err);
    }
  }

  shareUrl.value = targetUrl;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: projectStore.currentProject.title || 'Muralis — Simulação',
        text: 'Confira a simulação de mural na fachada:',
        url: targetUrl
      });
      return;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        shareModalOpen.value = true;
      }
      return;
    }
  }

  shareModalOpen.value = true;
}

function copyShareLink() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2500);
  }
}

async function handleExport() {
  if (!viewportRef.value) return;
  try {
    const dataUrl = await viewportRef.value.exportHighRes('image/png');
    const safeTitle = (projectStore.currentProject.title || 'mural').toLowerCase().replace(/\s+/g, '-');
    const fileName = `${safeTitle}-muralis.png`;

    // Native file sharing if supported
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: projectStore.currentProject.title || 'Muralis',
          text: 'Simulação de mural em alta resolução gerada no Muralis'
        });
        return;
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') return;
      console.warn('Native file share failed or unsupported, downloading file', shareErr);
    }

    // Standard download
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export project', err);
  }
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (isInputFocused()) return;

  const isCtrlOrMeta = e.ctrlKey || e.metaKey;

  // Undo / Redo
  if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    projectStore.undo();
    return;
  }
  if ((isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'z') || (isCtrlOrMeta && e.key.toLowerCase() === 'y')) {
    e.preventDefault();
    projectStore.redo();
    return;
  }

  // Escape: deselect artwork
  if (e.key === 'Escape') {
    e.preventDefault();
    viewportRef.value?.deselect();
    return;
  }

  // Delete / Backspace: clear mask only when mask mode is active
  if ((e.key === 'Delete' || e.key === 'Backspace') && isMaskMode.value) {
    e.preventDefault();
    handleClearMask();
    return;
  }

  // Arrow keys: move art (1px, 10px with Shift)
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    if (!projectStore.currentProject.cornerPoints || !projectStore.currentProject.artAssetUrl) return;
    e.preventDefault();
    const stepPx = e.shiftKey ? 10 : 1;
    const dx = (e.key === 'ArrowLeft' ? -stepPx : e.key === 'ArrowRight' ? stepPx : 0) / 800;
    const dy = (e.key === 'ArrowUp' ? -stepPx : e.key === 'ArrowDown' ? stepPx : 0) / 600;

    const currentCorners = projectStore.currentProject.cornerPoints;
    const updated = currentCorners.map(p => ({
      x: Number((p.x + dx).toFixed(4)),
      y: Number((p.y + dy).toFixed(4))
    })) as [Point2D, Point2D, Point2D, Point2D];

    projectStore.pushHistory();
    projectStore.setCornerPoints(updated);
    projectStore.saveProject();
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeyDown);

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

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>
