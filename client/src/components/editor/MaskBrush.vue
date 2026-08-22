<template>
  <div
    ref="maskContainerRef"
    class="absolute inset-0 z-20 cursor-crosshair touch-none"
    @pointerdown="handlePointerDown"
  >
    <canvas ref="maskCanvasRef" class="w-full h-full pointer-events-none"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  brushSize: number;
  isEraser: boolean;
}>();

const emit = defineEmits<{
  (e: 'maskUpdated', canvas: HTMLCanvasElement): void;
}>();

const maskContainerRef = ref<HTMLDivElement | null>(null);
const maskCanvasRef = ref<HTMLCanvasElement | null>(null);
let isDrawing = false;

function resizeMaskCanvas() {
  if (!maskContainerRef.value || !maskCanvasRef.value) return;
  const rect = maskContainerRef.value.getBoundingClientRect();

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = maskCanvasRef.value.width;
  tempCanvas.height = maskCanvasRef.value.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx && maskCanvasRef.value.width > 0) {
    tempCtx.drawImage(maskCanvasRef.value, 0, 0);
  }

  maskCanvasRef.value.width = rect.width;
  maskCanvasRef.value.height = rect.height;

  const ctx = maskCanvasRef.value.getContext('2d');
  if (ctx && tempCanvas.width > 0) {
    ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
  }
}

function handlePointerDown(e: PointerEvent) {
  if (!maskCanvasRef.value) return;
  const ctx = maskCanvasRef.value.getContext('2d');
  if (!ctx) return;

  isDrawing = true;
  const rect = maskCanvasRef.value.getBoundingClientRect();
  let lastX = e.clientX - rect.left;
  let lastY = e.clientY - rect.top;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = props.brushSize;

  if (props.isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
  }

  ctx.beginPath();
  ctx.arc(lastX, lastY, props.brushSize / 2, 0, Math.PI * 2);
  ctx.fill();

  const onPointerMove = (moveEvent: PointerEvent) => {
    if (!isDrawing || !ctx || !maskCanvasRef.value) return;
    const currentX = moveEvent.clientX - rect.left;
    const currentY = moveEvent.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastX = currentX;
    lastY = currentY;
    emit('maskUpdated', maskCanvasRef.value);
  };

  const onPointerUp = () => {
    isDrawing = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (maskCanvasRef.value) {
      emit('maskUpdated', maskCanvasRef.value);
    }
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function clearMask() {
  if (!maskCanvasRef.value) return;
  const ctx = maskCanvasRef.value.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, maskCanvasRef.value.width, maskCanvasRef.value.height);
    emit('maskUpdated', maskCanvasRef.value);
  }
}

defineExpose({
  clearMask,
  getCanvas: () => maskCanvasRef.value
});

onMounted(() => {
  resizeMaskCanvas();
});

watch([() => props.brushSize, () => props.isEraser], () => {});
</script>
