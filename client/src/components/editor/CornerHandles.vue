<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <svg class="w-full h-full">
      <polygon
        :points="polygonPoints"
        class="fill-brand-500/15 stroke-brand-500 stroke-2 stroke-dashed transition-colors"
      />
    </svg>

    <div
      v-for="(point, index) in screenPoints"
      :key="index"
      class="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 border-white bg-brand-600 shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center transition-transform hover:scale-125 touch-none"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      @pointerdown="(e) => startDrag(index, e)"
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

const polygonPoints = computed(() => {
  return screenPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

function startDrag(index: number, event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);

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
</script>
