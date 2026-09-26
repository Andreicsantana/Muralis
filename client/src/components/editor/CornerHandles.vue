<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
    <svg class="w-full h-full pointer-events-auto">
      <!-- Draggable Area inside the Polygon -->
      <polygon
        :points="polygonPoints"
        class="fill-brand-500/20 hover:fill-brand-500/30 stroke-brand-500 stroke-2 stroke-dashed transition-colors cursor-move touch-none"
        @pointerdown="startMoveDrag"
      />
    </svg>

    <!-- Center Move Handle Badge -->
    <div
      v-if="centerPoint.x > 0 && centerPoint.y > 0"
      class="absolute -ml-5 -mt-5 w-10 h-10 rounded-full bg-slate-900/90 border-2 border-brand-500 shadow-xl cursor-move pointer-events-auto flex items-center justify-center transition-all hover:scale-110 hover:bg-brand-600 hover:border-white group touch-none z-10"
      :style="{ left: `${centerPoint.x}px`, top: `${centerPoint.y}px` }"
      @pointerdown="startMoveDrag"
      title="Clique e arraste para posicionar a arte no muro"
    >
      <svg
        class="w-5 h-5 text-brand-400 group-hover:text-white transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4M5 12h14M12 5v14" />
      </svg>
    </div>

    <!-- 4 Corner Handles for Perspective Warp / Scaling -->
    <div
      v-for="(point, index) in screenPoints"
      :key="index"
      class="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 border-white bg-brand-600 shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center transition-transform hover:scale-125 touch-none z-20"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      @pointerdown="(e) => startCornerDrag(index, e)"
      :title="`Ajustar vértice ${index + 1}`"
    >
      <div class="w-2 h-2 rounded-full bg-white"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Point2D } from '../../engine/homography.js';

const props = defineProps<{
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  canvasBounds: { width: number; height: number; left: number; top: number };
}>();

const emit = defineEmits<{
  (e: 'updatePoint', index: number, point: Point2D): void;
  (e: 'updatePoints', points: [Point2D, Point2D, Point2D, Point2D]): void;
  (e: 'dragStart'): void;
  (e: 'dragEnd'): void;
}>();

const screenPoints = computed(() => {
  const { width, height, left, top } = props.canvasBounds;
  return props.cornerPoints.map(p => ({
    x: left + p.x * width,
    y: top + p.y * height
  }));
});

const centerPoint = computed(() => {
  if (!screenPoints.value.length) return { x: 0, y: 0 };
  const avgX = screenPoints.value.reduce((sum, p) => sum + p.x, 0) / 4;
  const avgY = screenPoints.value.reduce((sum, p) => sum + p.y, 0) / 4;
  return { x: avgX, y: avgY };
});

const polygonPoints = computed(() => {
  return screenPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

// Drag a single corner handle
function startCornerDrag(index: number, event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget as HTMLElement;
  try {
    target.setPointerCapture(event.pointerId);
  } catch {}

  emit('dragStart');

  const onPointerMove = (moveEvent: PointerEvent) => {
    const { width, height, left, top } = props.canvasBounds;
    if (width === 0 || height === 0) return;

    const normalizedX = (moveEvent.clientX - left) / width;
    const normalizedY = (moveEvent.clientY - top) / height;

    emit('updatePoint', index, { x: normalizedX, y: normalizedY });
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    try {
      target.releasePointerCapture(upEvent.pointerId);
    } catch {}

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    emit('dragEnd');
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

// Drag and move the entire artwork
function startMoveDrag(event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget as HTMLElement | SVGElement;
  try {
    target.setPointerCapture(event.pointerId);
  } catch {}

  emit('dragStart');

  const startClientX = event.clientX;
  const startClientY = event.clientY;
  const startPoints = props.cornerPoints.map(p => ({ x: p.x, y: p.y }));

  const onPointerMove = (moveEvent: PointerEvent) => {
    const { width, height } = props.canvasBounds;
    if (width === 0 || height === 0) return;

    const dx = (moveEvent.clientX - startClientX) / width;
    const dy = (moveEvent.clientY - startClientY) / height;

    const newPoints = startPoints.map(p => ({
      x: p.x + dx,
      y: p.y + dy
    })) as [Point2D, Point2D, Point2D, Point2D];

    emit('updatePoints', newPoints);
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    try {
      target.releasePointerCapture(upEvent.pointerId);
    } catch {}

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    emit('dragEnd');
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}
</script>
