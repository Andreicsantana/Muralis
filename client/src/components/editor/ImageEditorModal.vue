<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 select-none"
  >
    <div class="bg-asphalt-900 border-2 border-asphalt-700 rounded-sm shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="h-12 bg-asphalt-950 border-b-2 border-asphalt-700 px-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 bg-spray-pink text-white font-mono text-xs font-bold uppercase rounded-sm">
            EDITAR ARTE
          </span>
          <h3 class="text-sm font-display font-black text-white uppercase tracking-wider">
            Recortar & Transformar
          </h3>
        </div>
        <button
          class="p-1.5 text-slate-400 hover:text-white rounded-sm hover:bg-asphalt-800 transition-colors"
          @click="$emit('close')"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Controls Bar -->
      <div class="bg-asphalt-800/80 border-b border-asphalt-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <!-- Rotate & Flip -->
        <div class="flex items-center space-x-1 sm:space-x-2">
          <button
            class="px-2.5 py-1.5 bg-asphalt-900 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-slate-200 flex items-center space-x-1"
            title="Girar 90° Esquerda"
            @click="rotateCounterClockwise"
          >
            <RotateCcwIcon class="w-3.5 h-3.5 text-spray-pink" />
            <span class="hidden sm:inline">-90°</span>
          </button>
          <button
            class="px-2.5 py-1.5 bg-asphalt-900 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-slate-200 flex items-center space-x-1"
            title="Girar 90° Direita"
            @click="rotateClockwise"
          >
            <RotateCwIcon class="w-3.5 h-3.5 text-spray-volt" />
            <span class="hidden sm:inline">+90°</span>
          </button>
          <button
            class="px-2.5 py-1.5 bg-asphalt-900 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-slate-200 flex items-center space-x-1"
            :class="flipH ? 'bg-spray-pink/20 border-spray-pink text-white' : ''"
            title="Espelhar Horizontal"
            @click="flipH = !flipH; drawPreview()"
          >
            <FlipHorizontalIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Espelhar H</span>
          </button>
          <button
            class="px-2.5 py-1.5 bg-asphalt-900 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-slate-200 flex items-center space-x-1"
            :class="flipV ? 'bg-spray-pink/20 border-spray-pink text-white' : ''"
            title="Espelhar Vertical"
            @click="flipV = !flipV; drawPreview()"
          >
            <FlipVerticalIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Espelhar V</span>
          </button>
        </div>

        <!-- Crop Aspect Ratio -->
        <div class="flex items-center space-x-1">
          <span class="text-[11px] font-mono text-slate-400 mr-1 hidden md:inline">Corte:</span>
          <button
            v-for="aspect in aspectOptions"
            :key="aspect.id"
            class="px-2 py-1 text-xs font-mono font-bold rounded-sm border transition-colors"
            :class="selectedAspect === aspect.id ? 'bg-spray-volt text-asphalt-950 border-spray-volt' : 'bg-asphalt-900 border-asphalt-700 text-slate-300 hover:bg-asphalt-700'"
            @click="changeAspectRatio(aspect.id)"
          >
            {{ aspect.label }}
          </button>
        </div>
      </div>

      <!-- Preview Canvas & Interactive Crop Overlay -->
      <div
        ref="previewContainerRef"
        class="flex-1 bg-[#050608] overflow-hidden relative flex items-center justify-center p-4 min-h-[260px]"
      >
        <div
          ref="cropWrapperRef"
          class="relative shadow-2xl select-none"
          :style="{ width: `${stageWidth}px`, height: `${stageHeight}px` }"
        >
          <canvas
            ref="previewCanvasRef"
            :width="stageWidth"
            :height="stageHeight"
            class="block w-full h-full pointer-events-none rounded-sm"
          ></canvas>

          <!-- Dimmer Outside Crop Box -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <mask id="cropMask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  :x="cropRect.x"
                  :y="cropRect.y"
                  :width="cropRect.w"
                  :height="cropRect.h"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#cropMask)" />
          </svg>

          <!-- Interactive Crop Box -->
          <div
            class="absolute border-2 border-spray-volt z-20 cursor-move shadow-spray-volt"
            :style="{
              left: `${cropRect.x}px`,
              top: `${cropRect.y}px`,
              width: `${cropRect.w}px`,
              height: `${cropRect.h}px`
            }"
            @pointerdown="startCropMove"
          >
            <!-- Rule-of-thirds grid -->
            <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div class="border-r border-b border-spray-volt/40"></div>
              <div class="border-r border-b border-spray-volt/40"></div>
              <div class="border-b border-spray-volt/40"></div>
              <div class="border-r border-b border-spray-volt/40"></div>
              <div class="border-r border-b border-spray-volt/40"></div>
              <div class="border-b border-spray-volt/40"></div>
              <div class="border-r border-spray-volt/40"></div>
              <div class="border-r border-spray-volt/40"></div>
              <div></div>
            </div>

            <!-- Resize Handles -->
            <!-- Top Left -->
            <div
              class="absolute -top-2 -left-2 w-4 h-4 bg-spray-volt border-2 border-asphalt-950 rounded-xs cursor-nwse-resize z-30"
              @pointerdown.stop="(e) => startResize('tl', e)"
            ></div>
            <!-- Top Right -->
            <div
              class="absolute -top-2 -right-2 w-4 h-4 bg-spray-volt border-2 border-asphalt-950 rounded-xs cursor-nesw-resize z-30"
              @pointerdown.stop="(e) => startResize('tr', e)"
            ></div>
            <!-- Bottom Right -->
            <div
              class="absolute -bottom-2 -right-2 w-4 h-4 bg-spray-volt border-2 border-asphalt-950 rounded-xs cursor-nwse-resize z-30"
              @pointerdown.stop="(e) => startResize('br', e)"
            ></div>
            <!-- Bottom Left -->
            <div
              class="absolute -bottom-2 -left-2 w-4 h-4 bg-spray-volt border-2 border-asphalt-950 rounded-xs cursor-nesw-resize z-30"
              @pointerdown.stop="(e) => startResize('bl', e)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="h-14 bg-asphalt-950 border-t-2 border-asphalt-700 px-4 flex items-center justify-between shrink-0">
        <button
          class="px-3 py-1.5 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-slate-300 transition-colors"
          @click="resetAll"
        >
          Resetar
        </button>

        <div class="flex items-center space-x-2">
          <button
            class="px-4 py-1.5 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-white transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            class="px-5 py-1.5 bg-spray-volt hover:bg-spray-voltHover border border-spray-volt text-asphalt-950 rounded-sm text-xs font-mono font-black uppercase tracking-wider shadow-spray-volt transition-transform active:scale-95 flex items-center space-x-1.5"
            @click="applyAndSave"
          >
            <CheckIcon class="w-4 h-4 stroke-[3]" />
            <span>Aplicar Recorte</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue';
import {
  X as XIcon,
  RotateCw as RotateCwIcon,
  RotateCcw as RotateCcwIcon,
  FlipHorizontal as FlipHorizontalIcon,
  FlipVertical as FlipVerticalIcon,
  Check as CheckIcon
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  imageUrl: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', newUrl: string): void;
}>();

const previewContainerRef = ref<HTMLDivElement | null>(null);
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const cropWrapperRef = ref<HTMLDivElement | null>(null);

const sourceImage = ref<HTMLImageElement | null>(null);

const rotation = ref(0); // 0, 90, 180, 270
const flipH = ref(false);
const flipV = ref(false);

const stageWidth = ref(400);
const stageHeight = ref(300);

const selectedAspect = ref<'free' | '1:1' | '4:3' | '16:9'>('free');

const aspectOptions = [
  { id: 'free' as const, label: 'Livre' },
  { id: '1:1' as const, label: '1:1' },
  { id: '4:3' as const, label: '4:3' },
  { id: '16:9' as const, label: '16:9' }
];

const cropRect = reactive({
  x: 20,
  y: 20,
  w: 200,
  h: 200
});

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.imageUrl) {
      resetAll();
      loadImage(props.imageUrl);
    }
  }
);

function loadImage(src: string) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    sourceImage.value = img;
    nextTick(() => {
      calculateStageSize();
      initCropRect();
      drawPreview();
    });
  };
  img.src = src;
}

function calculateStageSize() {
  if (!sourceImage.value || !previewContainerRef.value) return;

  const containerRect = previewContainerRef.value.getBoundingClientRect();
  const maxW = Math.max(200, containerRect.width - 40);
  const maxH = Math.max(180, containerRect.height - 40);

  const isRotated90 = rotation.value === 90 || rotation.value === 270;
  const rawW = isRotated90 ? sourceImage.value.naturalHeight : sourceImage.value.naturalWidth;
  const rawH = isRotated90 ? sourceImage.value.naturalWidth : sourceImage.value.naturalHeight;

  const aspect = rawW / rawH;
  let w = maxW;
  let h = maxW / aspect;

  if (h > maxH) {
    h = maxH;
    w = maxH * aspect;
  }

  stageWidth.value = Math.floor(w);
  stageHeight.value = Math.floor(h);
}

function initCropRect() {
  const margin = 16;
  cropRect.x = margin;
  cropRect.y = margin;
  cropRect.w = Math.max(60, stageWidth.value - margin * 2);
  cropRect.h = Math.max(60, stageHeight.value - margin * 2);
  enforceAspectRatio();
}

function changeAspectRatio(aspect: 'free' | '1:1' | '4:3' | '16:9') {
  selectedAspect.value = aspect;
  enforceAspectRatio();
}

function enforceAspectRatio() {
  if (selectedAspect.value === 'free') return;

  let ratio = 1;
  if (selectedAspect.value === '4:3') ratio = 4 / 3;
  if (selectedAspect.value === '16:9') ratio = 16 / 9;

  let targetW = cropRect.w;
  let targetH = targetW / ratio;

  if (cropRect.y + targetH > stageHeight.value) {
    targetH = stageHeight.value - cropRect.y;
    targetW = targetH * ratio;
  }
  if (cropRect.x + targetW > stageWidth.value) {
    targetW = stageWidth.value - cropRect.x;
    targetH = targetW / ratio;
  }

  cropRect.w = Math.max(40, targetW);
  cropRect.h = Math.max(40, targetH);
}

function rotateClockwise() {
  rotation.value = (rotation.value + 90) % 360;
  calculateStageSize();
  initCropRect();
  drawPreview();
}

function rotateCounterClockwise() {
  rotation.value = (rotation.value + 270) % 360;
  calculateStageSize();
  initCropRect();
  drawPreview();
}

function resetAll() {
  rotation.value = 0;
  flipH.value = false;
  flipV.value = false;
  selectedAspect.value = 'free';
  if (sourceImage.value) {
    calculateStageSize();
    initCropRect();
    drawPreview();
  }
}

function drawPreview() {
  if (!previewCanvasRef.value || !sourceImage.value) return;
  const canvas = previewCanvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation.value * Math.PI) / 180);
  ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1);

  const isRotated90 = rotation.value === 90 || rotation.value === 270;
  const drawW = isRotated90 ? canvas.height : canvas.width;
  const drawH = isRotated90 ? canvas.width : canvas.height;

  ctx.drawImage(sourceImage.value, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function startCropMove(e: PointerEvent) {
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const initialX = cropRect.x;
  const initialY = cropRect.y;

  const onPointerMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    const newX = Math.max(0, Math.min(stageWidth.value - cropRect.w, initialX + dx));
    const newY = Math.max(0, Math.min(stageHeight.value - cropRect.h, initialY + dy));

    cropRect.x = newX;
    cropRect.y = newY;
  };

  const onPointerUp = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function startResize(handle: 'tl' | 'tr' | 'bl' | 'br', e: PointerEvent) {
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const initialX = cropRect.x;
  const initialY = cropRect.y;
  const initialW = cropRect.w;
  const initialH = cropRect.h;

  let ratio: number | null = null;
  if (selectedAspect.value === '1:1') ratio = 1;
  else if (selectedAspect.value === '4:3') ratio = 4 / 3;
  else if (selectedAspect.value === '16:9') ratio = 16 / 9;

  const onPointerMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    if (handle === 'br') {
      let newW = Math.max(40, Math.min(stageWidth.value - initialX, initialW + dx));
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(stageHeight.value - initialY, initialH + dy));
      if (initialY + newH > stageHeight.value && ratio) {
        newH = stageHeight.value - initialY;
        newW = newH * ratio;
      }
      cropRect.w = newW;
      cropRect.h = newH;
    } else if (handle === 'bl') {
      let newW = Math.max(40, Math.min(initialX + initialW, initialW - dx));
      let newX = initialX + (initialW - newW);
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(stageHeight.value - initialY, initialH + dy));
      if (initialY + newH > stageHeight.value && ratio) {
        newH = stageHeight.value - initialY;
        newW = newH * ratio;
        newX = initialX + (initialW - newW);
      }
      cropRect.x = newX;
      cropRect.w = newW;
      cropRect.h = newH;
    } else if (handle === 'tr') {
      let newW = Math.max(40, Math.min(stageWidth.value - initialX, initialW + dx));
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(initialY + initialH, initialH - dy));
      let newY = initialY + (initialH - newH);
      if (newY < 0 && ratio) {
        newY = 0;
        newH = initialY + initialH;
        newW = newH * ratio;
      }
      cropRect.y = newY;
      cropRect.w = newW;
      cropRect.h = newH;
    } else if (handle === 'tl') {
      let newW = Math.max(40, Math.min(initialX + initialW, initialW - dx));
      let newX = initialX + (initialW - newW);
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(initialY + initialH, initialH - dy));
      let newY = initialY + (initialH - newH);
      if (newY < 0 && ratio) {
        newY = 0;
        newH = initialY + initialH;
        newW = newH * ratio;
        newX = initialX + (initialW - newW);
      }
      cropRect.x = newX;
      cropRect.y = newY;
      cropRect.w = newW;
      cropRect.h = newH;
    }
  };

  const onPointerUp = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function applyAndSave() {
  if (!sourceImage.value) return;

  const isRotated90 = rotation.value === 90 || rotation.value === 270;
  const transformedW = isRotated90 ? sourceImage.value.naturalHeight : sourceImage.value.naturalWidth;
  const transformedH = isRotated90 ? sourceImage.value.naturalWidth : sourceImage.value.naturalHeight;

  // Render transformed full-resolution image
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = transformedW;
  fullCanvas.height = transformedH;
  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) return;

  fullCtx.save();
  fullCtx.translate(transformedW / 2, transformedH / 2);
  fullCtx.rotate((rotation.value * Math.PI) / 180);
  fullCtx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1);

  const drawW = isRotated90 ? transformedH : transformedW;
  const drawH = isRotated90 ? transformedW : transformedH;

  fullCtx.drawImage(sourceImage.value, -drawW / 2, -drawH / 2, drawW, drawH);
  fullCtx.restore();

  // Map preview crop coordinates to full resolution coordinates
  const scaleX = transformedW / stageWidth.value;
  const scaleY = transformedH / stageHeight.value;

  const cropX = Math.floor(cropRect.x * scaleX);
  const cropY = Math.floor(cropRect.y * scaleY);
  const cropW = Math.floor(cropRect.w * scaleX);
  const cropH = Math.floor(cropRect.h * scaleY);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = Math.max(1, cropW);
  croppedCanvas.height = Math.max(1, cropH);
  const cropCtx = croppedCanvas.getContext('2d');
  if (!cropCtx) return;

  cropCtx.drawImage(
    fullCanvas,
    cropX, cropY, cropW, cropH,
    0, 0, cropW, cropH
  );

  const resultDataUrl = croppedCanvas.toDataURL('image/png');
  emit('save', resultDataUrl);
  emit('close');
}
</script>
