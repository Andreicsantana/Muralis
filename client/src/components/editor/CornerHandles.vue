<template>
  <div
    ref="handlesContainerRef"
    class="absolute inset-0 pointer-events-none overflow-visible select-none"
    @wheel="handleWheel"
  >
    <!-- Bounding Polygon Guide -->
    <svg class="w-full h-full pointer-events-none">
      <polygon
        :points="polygonPoints"
        fill="rgba(238, 90, 60, 0.08)"
        stroke="#ee5a3c"
        stroke-width="1.5"
        stroke-dasharray="4,3"
        class="pointer-events-auto cursor-move touch-none transition-colors hover:fill-[rgba(238,90,60,0.16)]"
        @pointerdown="startMoveOrPinch"
      />
      <!-- Diagonal Guide Crosslines -->
      <line
        v-if="screenPoints.length === 4"
        :x1="screenPoints[0].x"
        :y1="screenPoints[0].y"
        :x2="screenPoints[2].x"
        :y2="screenPoints[2].y"
        stroke="rgba(238, 90, 60, 0.22)"
        stroke-width="1"
        stroke-dasharray="3,3"
        class="pointer-events-none"
      />
      <line
        v-if="screenPoints.length === 4"
        :x1="screenPoints[1].x"
        :y1="screenPoints[1].y"
        :x2="screenPoints[3].x"
        :y2="screenPoints[3].y"
        stroke="rgba(238, 90, 60, 0.22)"
        stroke-width="1"
        stroke-dasharray="3,3"
        class="pointer-events-none"
      />
    </svg>

    <!-- Center Move Handle: Stencil Target -->
    <div
      v-if="centerPoint.x > 0 && centerPoint.y > 0"
      class="absolute -ml-6 -mt-6 w-12 h-12 rounded-[2px] bg-[#262523] border border-[#55514b] shadow-md cursor-move pointer-events-auto flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group touch-none z-30"
      :style="{ left: `${centerPoint.x}px`, top: `${centerPoint.y}px` }"
      @pointerdown="startMoveOrPinch"
      title="Mover arte pelo muro"
    >
      <div class="w-2.5 h-2.5 rounded-[1px] bg-[#ee5a3c]"></div>
      <svg
        class="absolute w-6 h-6 text-[#a8a196] group-hover:text-[#ece6d8] transition-colors pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4M5 12h14M12 5v14" />
      </svg>
    </div>

    <!-- 4 Corner Handles: Squares in paper with dark border (Min 44x44px touch area) -->
    <div
      v-for="(point, index) in screenPoints"
      :key="index"
      class="absolute min-w-[44px] min-h-[44px] w-11 h-11 -ml-[22px] -mt-[22px] flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto touch-none z-40 group"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      @pointerdown="(e) => startCornerDrag(index, e)"
      :title="`Vértice ${index + 1}`"
    >
      <!-- Visual handle square: 12px desktop / 16px touch -->
      <div class="w-3.5 h-3.5 md:w-3 md:h-3 bg-[#ece6d8] border border-[#151413] shadow-sm rounded-[1px] group-hover:scale-125 transition-transform"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Point2D } from '../../engine/homography.js';

const props = defineProps<{
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  canvasBounds: { width: number; height: number; screenX?: number; screenY?: number };
}>();

const emit = defineEmits<{
  (e: 'updatePoint', index: number, point: Point2D): void;
  (e: 'updatePoints', points: [Point2D, Point2D, Point2D, Point2D]): void;
  (e: 'dragStart'): void;
  (e: 'dragEnd'): void;
}>();

const handlesContainerRef = ref<HTMLDivElement | null>(null);

const screenPoints = computed(() => {
  const { width, height } = props.canvasBounds;
  return props.cornerPoints.map(p => ({
    x: p.x * width,
    y: p.y * height
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

function scaleQuad(factor: number) {
  if (props.cornerPoints.length !== 4) return;
  const cx = (props.cornerPoints[0].x + props.cornerPoints[1].x + props.cornerPoints[2].x + props.cornerPoints[3].x) / 4;
  const cy = (props.cornerPoints[0].y + props.cornerPoints[1].y + props.cornerPoints[2].y + props.cornerPoints[3].y) / 4;

  const newPoints = props.cornerPoints.map(p => ({
    x: Math.max(0, Math.min(1, cx + (p.x - cx) * factor)),
    y: Math.max(0, Math.min(1, cy + (p.y - cy) * factor))
  })) as [Point2D, Point2D, Point2D, Point2D];

  emit('dragStart');
  emit('updatePoints', newPoints);
  emit('dragEnd');
}

function handleWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    scaleQuad(factor);
  }
}

function startCornerDrag(index: number, event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget as HTMLElement;
  try {
    target.setPointerCapture(event.pointerId);
  } catch {}

  emit('dragStart');

  const containerRect = handlesContainerRef.value?.getBoundingClientRect();
  const screenX = containerRect ? containerRect.left : (props.canvasBounds.screenX ?? 0);
  const screenY = containerRect ? containerRect.top : (props.canvasBounds.screenY ?? 0);

  const onPointerMove = (moveEvent: PointerEvent) => {
    const { width, height } = props.canvasBounds;
    if (width === 0 || height === 0) return;

    const normalizedX = (moveEvent.clientX - screenX) / width;
    const normalizedY = (moveEvent.clientY - screenY) / height;

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

// Multi-touch gestures: 1-finger move drag, 2-finger pinch-to-scale
const activePointers = new Map<number, { x: number; y: number }>();
let initialQuad: [Point2D, Point2D, Point2D, Point2D] | null = null;
let initialDistance = 0;
let initialCenter: { x: number; y: number } = { x: 0, y: 0 };
let startMoveX = 0;
let startMoveY = 0;

function startMoveOrPinch(event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget as HTMLElement | SVGElement;
  try {
    target.setPointerCapture(event.pointerId);
  } catch {}

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size === 1) {
    emit('dragStart');
    startMoveX = event.clientX;
    startMoveY = event.clientY;
    initialQuad = props.cornerPoints.map(p => ({ x: p.x, y: p.y })) as [Point2D, Point2D, Point2D, Point2D];
  } else if (activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    initialDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    const avgX = (props.cornerPoints[0].x + props.cornerPoints[1].x + props.cornerPoints[2].x + props.cornerPoints[3].x) / 4;
    const avgY = (props.cornerPoints[0].y + props.cornerPoints[1].y + props.cornerPoints[2].y + props.cornerPoints[3].y) / 4;
    initialCenter = { x: avgX, y: avgY };
    initialQuad = props.cornerPoints.map(p => ({ x: p.x, y: p.y })) as [Point2D, Point2D, Point2D, Point2D];
  }

  const onPointerMove = (moveEvent: PointerEvent) => {
    if (!activePointers.has(moveEvent.pointerId)) return;
    activePointers.set(moveEvent.pointerId, { x: moveEvent.clientX, y: moveEvent.clientY });

    const { width, height } = props.canvasBounds;
    if (width === 0 || height === 0 || !initialQuad) return;

    if (activePointers.size === 1) {
      // 1-finger drag moves the entire artwork
      const dx = (moveEvent.clientX - startMoveX) / width;
      const dy = (moveEvent.clientY - startMoveY) / height;

      const newPoints = initialQuad.map(p => ({
        x: p.x + dx,
        y: p.y + dy
      })) as [Point2D, Point2D, Point2D, Point2D];

      emit('updatePoints', newPoints);
    } else if (activePointers.size >= 2 && initialDistance > 10) {
      // 2-finger pinch scales artwork around center
      const pts = Array.from(activePointers.values());
      const currentDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ratio = currentDistance / initialDistance;

      const newPoints = initialQuad.map(p => ({
        x: initialCenter.x + (p.x - initialCenter.x) * ratio,
        y: initialCenter.y + (p.y - initialCenter.y) * ratio
      })) as [Point2D, Point2D, Point2D, Point2D];

      emit('updatePoints', newPoints);
    }
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    activePointers.delete(upEvent.pointerId);
    try {
      target.releasePointerCapture(upEvent.pointerId);
    } catch {}

    if (activePointers.size === 0) {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      emit('dragEnd');
      initialQuad = null;
    }
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}
</script>
