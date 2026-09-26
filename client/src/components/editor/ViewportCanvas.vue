<template>
  <div ref="containerRef" class="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
    <canvas ref="canvasRef" class="shadow-2xl rounded-sm"></canvas>

    <CornerHandles
      v-if="showHandles && bounds.width > 0 && artImage"
      :corner-points="cornerPoints"
      :canvas-bounds="bounds"
      @update-point="(idx, pt) => $emit('updatePoint', idx, pt)"
      @update-points="(pts) => $emit('updatePoints', pts)"
      @drag-start="() => $emit('dragStart')"
      @drag-end="() => $emit('dragEnd')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, reactive, shallowRef } from 'vue';
import { Point2D } from '../../engine/homography.js';
import { BlendMode, compositeLayers, RenderState } from '../../engine/blendEngine.js';
import CornerHandles from './CornerHandles.vue';

const props = defineProps<{
  basePhotoUrl: string | null;
  artAssetUrl: string | null;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  blendMode: BlendMode;
  opacity: number;
  brightness: number;
  contrast: number;
  showHandles: boolean;
  maskCanvas?: HTMLCanvasElement | null;
}>();

defineEmits<{
  (e: 'updatePoint', index: number, point: Point2D): void;
  (e: 'updatePoints', points: [Point2D, Point2D, Point2D, Point2D]): void;
  (e: 'dragStart'): void;
  (e: 'dragEnd'): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const baseImage = shallowRef<HTMLImageElement | null>(null);
const artImage = shallowRef<HTMLImageElement | null>(null);

const bounds = reactive({
  width: 0,
  height: 0,
  left: 0,
  top: 0
});

let animationFrameId: number | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function updateBaseImage() {
  if (!props.basePhotoUrl) {
    baseImage.value = null;
    requestRender();
    return;
  }
  try {
    baseImage.value = await loadImage(props.basePhotoUrl);
    updateLayout();
    requestRender();
  } catch (err) {
    console.error('Failed to load base photo', err);
  }
}

async function updateArtImage() {
  if (!props.artAssetUrl) {
    artImage.value = null;
    requestRender();
    return;
  }
  try {
    artImage.value = await loadImage(props.artAssetUrl);
    requestRender();
  } catch (err) {
    console.error('Failed to load art asset', err);
  }
}

function updateLayout() {
  if (!containerRef.value || !canvasRef.value) return;

  const containerRect = containerRef.value.getBoundingClientRect();
  const cWidth = containerRect.width - 32;
  const cHeight = containerRect.height - 32;

  let imgW = baseImage.value?.naturalWidth || 800;
  let imgH = baseImage.value?.naturalHeight || 600;

  const aspect = imgW / imgH;
  let renderW = cWidth;
  let renderH = cWidth / aspect;

  if (renderH > cHeight) {
    renderH = cHeight;
    renderW = cHeight * aspect;
  }

  renderW = Math.max(100, Math.floor(renderW));
  renderH = Math.max(100, Math.floor(renderH));

  const canvas = canvasRef.value;
  canvas.width = renderW;
  canvas.height = renderH;
  canvas.style.width = `${renderW}px`;
  canvas.style.height = `${renderH}px`;

  const canvasRect = canvas.getBoundingClientRect();
  bounds.width = renderW;
  bounds.height = renderH;
  bounds.left = canvasRect.left;
  bounds.top = canvasRect.top;
}

function requestRender() {
  if (animationFrameId !== null) return;
  animationFrameId = requestAnimationFrame(() => {
    animationFrameId = null;
    render();
  });
}

function render() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const state: RenderState = {
    baseImage: baseImage.value,
    artImage: artImage.value,
    maskCanvas: props.maskCanvas,
    cornerPoints: props.cornerPoints,
    blendMode: props.blendMode,
    opacity: props.opacity,
    brightness: props.brightness,
    contrast: props.contrast
  };

  compositeLayers(ctx, canvasRef.value.width, canvasRef.value.height, state);
}

async function exportHighRes(mimeType = 'image/png'): Promise<string> {
  const naturalW = baseImage.value?.naturalWidth || 1920;
  const naturalH = baseImage.value?.naturalHeight || 1080;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = naturalW;
  exportCanvas.height = naturalH;

  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) throw new Error('Could not create export canvas context');

  const state: RenderState = {
    baseImage: baseImage.value,
    artImage: artImage.value,
    maskCanvas: props.maskCanvas,
    cornerPoints: props.cornerPoints,
    blendMode: props.blendMode,
    opacity: props.opacity,
    brightness: props.brightness,
    contrast: props.contrast
  };

  compositeLayers(exportCtx, naturalW, naturalH, state, 32);
  return exportCanvas.toDataURL(mimeType, 0.95);
}

defineExpose({
  exportHighRes,
  updateLayout
});

watch(() => props.basePhotoUrl, updateBaseImage);
watch(() => props.artAssetUrl, updateArtImage);
watch(
  [
    () => props.cornerPoints,
    () => props.blendMode,
    () => props.opacity,
    () => props.brightness,
    () => props.contrast,
    () => props.maskCanvas
  ],
  requestRender,
  { deep: true }
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateLayout();
      requestRender();
    });
    resizeObserver.observe(containerRef.value);
  }
  updateBaseImage();
  updateArtImage();
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
});
</script>
