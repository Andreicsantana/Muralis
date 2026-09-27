<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
    <!-- Graffiti Bounding Polygon -->
    <svg class="w-full h-full pointer-events-none">
      <polygon
        :points="polygonPoints"
        fill="rgba(255, 0, 85, 0.08)"
        stroke="#ff0055"
        stroke-width="2"
        stroke-dasharray="6,4"
        class="pointer-events-auto cursor-move touch-none transition-colors hover:fill-[rgba(255,0,85,0.18)]"
        @pointerdown="startMoveDrag"
      />
      <!-- Diagonal Guide Crosslines -->
      <line
        v-if="screenPoints.length === 4"
        :x1="screenPoints[0].x"
        :y1="screenPoints[0].y"
        :x2="screenPoints[2].x"
        :y2="screenPoints[2].y"
        stroke="rgba(255, 0, 85, 0.25)"
        stroke-width="1"
        stroke-dasharray="4,4"
        class="pointer-events-none"
      />
      <line
        v-if="screenPoints.length === 4"
        :x1="screenPoints[1].x"
        :y1="screenPoints[1].y"
        :x2="screenPoints[3].x"
        :y2="screenPoints[3].y"
        stroke="rgba(255, 0, 85, 0.25)"
        stroke-width="1"
        stroke-dasharray="4,4"
        class="pointer-events-none"
      />
    </svg>

    <!-- Center Move Handle: Spray Nozzle / Crosshair Tag -->
    <div
      v-if="centerPoint.x > 0 && centerPoint.y > 0"
      class="absolute -ml-6 -mt-6 w-12 h-12 rounded-full bg-asphalt-950/95 border-2 border-spray-pink shadow-spray-pink cursor-move pointer-events-auto flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group touch-none z-30"
      :style="{ left: `${centerPoint.x}px`, top: `${centerPoint.y}px` }"
      @pointerdown="startMoveDrag"
      title="Segure e arraste para mover toda a arte pelo muro"
    >
      <div class="w-2.5 h-2.5 rounded-full bg-spray-pink group-hover:bg-spray-volt transition-colors shadow-spray-pink"></div>
      <svg
        class="absolute w-7 h-7 text-spray-pink/70 group-hover:text-spray-volt transition-colors pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4M5 12h14M12 5v14" />
      </svg>
    </div>

    <!-- 4 Corner Handles: Stencil Neon Reticles -->
    <div
      v-for="(point, index) in screenPoints"
      :key="index"
      class="absolute w-8 h-8 -ml-4 -mt-4 rounded-sm bg-asphalt-950 border-2 border-spray-volt shadow-spray-volt cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center transition-transform hover:scale-125 touch-none z-40 group"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      @pointerdown="(e) => startCornerDrag(index, e)"
      :title="`Vértice ${index + 1} - Ajustar Perspectiva`"
    >
      <div class="w-2 h-2 rounded-full bg-spray-volt group-hover:bg-white transition-colors"></div>
      <span class="absolute -bottom-4 text-[9px] font-mono font-bold text-spray-volt tracking-tighter pointer-events-none bg-asphalt-950/80 px-1">
        V{{ index + 1 }}
      </span>
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
