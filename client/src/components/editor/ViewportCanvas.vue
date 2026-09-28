<template>
  <div
    ref="containerRef"
    class="relative w-full h-full bg-[#07080a] flex items-center justify-center overflow-hidden cursor-default"
    @pointerdown="handleContainerPointerDown"
  >
    <canvas ref="canvasRef" class="shadow-2xl rounded-sm"></canvas>

    <video
      ref="videoRef"
      class="hidden"
      playsinline
      autoplay
      muted
    ></video>

    <!-- Selection & Perspective Handles (Visible only when selected) -->
    <CornerHandles
      v-if="showHandles && isSelected && bounds.width > 0 && artImage"
      :corner-points="cornerPoints"
      :canvas-bounds="bounds"
      @update-point="(idx, pt) => $emit('updatePoint', idx, pt)"
      @update-points="(pts) => $emit('updatePoints', pts)"
      @drag-start="() => $emit('dragStart')"
      @drag-end="() => $emit('dragEnd')"
    />

    <!-- Quick Hint when deselected -->
    <div
      v-if="showHandles && !isSelected && artImage"
      class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-asphalt-950/80 border border-asphalt-700 text-slate-400 font-mono text-[10px] rounded-sm pointer-events-none shadow-md"
    >
      [ Clique na arte para selecionar // Esc para desmarcar ]
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, reactive, shallowRef } from 'vue';
import { Point2D } from '../../engine/homography.js';
import { BlendMode, compositeLayers, RenderState, ValidBaseImage } from '../../engine/blendEngine.js';
import { calculateAutoFitCorners, applyDirectionToQuad } from '../../engine/autoFit.js';
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
  isCameraActive?: boolean;
}>();

const emit = defineEmits<{
  (e: 'updatePoint', index: number, point: Point2D): void;
  (e: 'updatePoints', points: [Point2D, Point2D, Point2D, Point2D]): void;
  (e: 'dragStart'): void;
  (e: 'dragEnd'): void;
  (e: 'cameraFrameCaptured', dataUrl: string): void;
  (e: 'cameraError', error: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

const baseImage = shallowRef<HTMLImageElement | null>(null);
const artImage = shallowRef<HTMLImageElement | null>(null);
const mediaStream = shallowRef<MediaStream | null>(null);

const isSelected = ref(true);

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

/**
 * Ray casting point-in-polygon test for 4-point convex quad
 */
function isPointInsideQuad(pt: Point2D, quad: [Point2D, Point2D, Point2D, Point2D]): boolean {
  let inside = false;
  for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
    const xi = quad[i].x, yi = quad[i].y;
    const xj = quad[j].x, yj = quad[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function handleContainerPointerDown(e: PointerEvent) {
  if (!canvasRef.value) {
    isSelected.value = false;
    return;
  }

  const canvasRect = canvasRef.value.getBoundingClientRect();
  if (canvasRect.width === 0 || canvasRect.height === 0) {
    isSelected.value = false;
    return;
  }

  const normX = (e.clientX - canvasRect.left) / canvasRect.width;
  const normY = (e.clientY - canvasRect.top) / canvasRect.height;

  // Check if click is inside the canvas bounds and inside the artwork quad
  if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
    const inside = isPointInsideQuad({ x: normX, y: normY }, props.cornerPoints);
    isSelected.value = inside;
  } else {
    isSelected.value = false;
  }
}

async function startCamera() {
  stopCamera();
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaStream.value = stream;

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
      updateLayout();
      startContinuousRender();
      autoFitWall();
      isSelected.value = true;
    }
  } catch (err: any) {
    console.error('Failed to start camera', err);
    emit('cameraError', err.message || 'Não foi possível acessar a câmera.');
  }
}

function stopCamera() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  stopContinuousRender();
}

function captureCameraFrame(): string | null {
  if (!videoRef.value || !mediaStream.value) return null;

  const video = videoRef.value;
  const capCanvas = document.createElement('canvas');
  capCanvas.width = video.videoWidth || 1280;
  capCanvas.height = video.videoHeight || 720;
  const ctx = capCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, capCanvas.width, capCanvas.height);
  const dataUrl = capCanvas.toDataURL('image/jpeg', 0.92);
  emit('cameraFrameCaptured', dataUrl);
  return dataUrl;
}

function autoFitWall(options?: { scaleFactor?: number; manualSlope?: number | null; verticalOffset?: number }) {
  const baseTarget: ValidBaseImage | null = props.isCameraActive && videoRef.value
    ? videoRef.value
    : baseImage.value;

  if (artImage.value) {
    const autoCorners = calculateAutoFitCorners(baseTarget, artImage.value, options);
    emit('updatePoints', autoCorners);
    isSelected.value = true;
  }
}

function applyDirectionPreset(slope: number) {
  if (props.cornerPoints) {
    const updatedCorners = applyDirectionToQuad(props.cornerPoints, slope);
    emit('updatePoints', updatedCorners);
    isSelected.value = true;
    requestRender();
  }
}

async function updateBaseImage() {
  if (props.isCameraActive) return;

  if (!props.basePhotoUrl) {
    baseImage.value = null;
    requestRender();
    return;
  }
  try {
    baseImage.value = await loadImage(props.basePhotoUrl);
    updateLayout();
    autoFitWall();
    isSelected.value = true;
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
    autoFitWall();
    isSelected.value = true;
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

  let imgW = 800;
  let imgH = 600;

  if (props.isCameraActive && videoRef.value && videoRef.value.videoWidth > 0) {
    imgW = videoRef.value.videoWidth;
    imgH = videoRef.value.videoHeight;
  } else if (baseImage.value) {
    imgW = baseImage.value.naturalWidth;
    imgH = baseImage.value.naturalHeight;
  }

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

function startContinuousRender() {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

  const loop = () => {
    render();
    if (props.isCameraActive) {
      animationFrameId = requestAnimationFrame(loop);
    }
  };
  animationFrameId = requestAnimationFrame(loop);
}

function stopContinuousRender() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function requestRender() {
  if (props.isCameraActive) return;
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

  const currentBase: ValidBaseImage | null = props.isCameraActive && videoRef.value
    ? videoRef.value
    : baseImage.value;

  const state: RenderState = {
    baseImage: currentBase,
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
  const currentBase = props.isCameraActive && videoRef.value ? videoRef.value : baseImage.value;
  const naturalW = currentBase ? ('videoWidth' in currentBase ? currentBase.videoWidth : currentBase.naturalWidth) : 1920;
  const naturalH = currentBase ? ('videoHeight' in currentBase ? currentBase.videoHeight : currentBase.naturalHeight) : 1080;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = naturalW || 1920;
  exportCanvas.height = naturalH || 1080;

  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) throw new Error('Could not create export canvas context');

  const state: RenderState = {
    baseImage: currentBase,
    artImage: artImage.value,
    maskCanvas: props.maskCanvas,
    cornerPoints: props.cornerPoints,
    blendMode: props.blendMode,
    opacity: props.opacity,
    brightness: props.brightness,
    contrast: props.contrast
  };

  compositeLayers(exportCtx, exportCanvas.width, exportCanvas.height, state, 32);
  return exportCanvas.toDataURL(mimeType, 0.95);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isSelected.value = false;
  }
}

defineExpose({
  exportHighRes,
  updateLayout,
  startCamera,
  stopCamera,
  captureCameraFrame,
  autoFitWall,
  applyDirectionPreset,
  select: () => (isSelected.value = true),
  deselect: () => (isSelected.value = false)
});

watch(() => props.isCameraActive, (active) => {
  if (active) {
    startCamera();
  } else {
    stopCamera();
    updateBaseImage();
  }
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
  () => {
    if (!props.isCameraActive) requestRender();
  },
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
  if (props.isCameraActive) {
    startCamera();
  } else {
    updateBaseImage();
  }
  updateArtImage();

  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  stopCamera();
  if (resizeObserver) resizeObserver.disconnect();
  stopContinuousRender();
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
