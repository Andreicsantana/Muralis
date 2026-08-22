import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Point2D } from '../engine/homography.js';
import { BlendMode } from '../engine/blendEngine.js';
import { apiRequest } from '../services/apiClient.js';
import { db } from '../services/offlineDb.js';

export interface ProjectState {
  id: string | null;
  title: string;
  basePhotoUrl: string | null;
  artAssetUrl: string | null;
  maskCanvas: HTMLCanvasElement | null;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  blendMode: BlendMode;
  opacity: number;
  brightness: number;
  contrast: number;
  isDirty: boolean;
}

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<ProjectState>({
    id: null,
    title: 'Novo Mural',
    basePhotoUrl: null,
    artAssetUrl: null,
    maskCanvas: null,
    cornerPoints: [
      { x: 0.15, y: 0.15 },
      { x: 0.85, y: 0.15 },
      { x: 0.85, y: 0.85 },
      { x: 0.15, y: 0.85 }
    ],
    blendMode: 'multiply',
    opacity: 0.9,
    brightness: 1.0,
    contrast: 1.0,
    isDirty: false
  });

  const history = ref<Array<[Point2D, Point2D, Point2D, Point2D]>>([]);
  const historyIndex = ref(-1);

  function pushHistory() {
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    history.value.push(JSON.parse(JSON.stringify(currentProject.value.cornerPoints)));
    historyIndex.value = history.value.length - 1;
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      currentProject.value.cornerPoints = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
      currentProject.value.isDirty = true;
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      currentProject.value.cornerPoints = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
      currentProject.value.isDirty = true;
    }
  }

  function setCornerPoint(index: number, point: Point2D) {
    if (index >= 0 && index < 4) {
      currentProject.value.cornerPoints[index] = {
        x: Math.max(0, Math.min(1, point.x)),
        y: Math.max(0, Math.min(1, point.y))
      };
      currentProject.value.isDirty = true;
    }
  }

  function setBasePhoto(url: string) {
    currentProject.value.basePhotoUrl = url;
    currentProject.value.isDirty = true;
  }

  function setArtAsset(url: string) {
    currentProject.value.artAssetUrl = url;
    currentProject.value.isDirty = true;
  }

  function setBlendMode(mode: BlendMode) {
    currentProject.value.blendMode = mode;
    currentProject.value.isDirty = true;
  }

  function setOpacity(val: number) {
    currentProject.value.opacity = val;
    currentProject.value.isDirty = true;
  }

  function setBrightness(val: number) {
    currentProject.value.brightness = val;
    currentProject.value.isDirty = true;
  }

  function setContrast(val: number) {
    currentProject.value.contrast = val;
    currentProject.value.isDirty = true;
  }

  function resetProject() {
    currentProject.value = {
      id: null,
      title: 'Novo Mural',
      basePhotoUrl: null,
      artAssetUrl: null,
      maskCanvas: null,
      cornerPoints: [
        { x: 0.15, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.85, y: 0.85 },
        { x: 0.15, y: 0.85 }
      ],
      blendMode: 'multiply',
      opacity: 0.9,
      brightness: 1.0,
      contrast: 1.0,
      isDirty: false
    };
    history.value = [];
    historyIndex.value = -1;
  }

  async function saveProject() {
    const p = currentProject.value;
    const payload = {
      title: p.title,
      cornerPoints: p.cornerPoints,
      blendMode: p.blendMode,
      opacity: p.opacity,
      brightness: p.brightness,
      contrast: p.contrast
    };

    try {
      if (p.id) {
        await apiRequest(`/projects/${p.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        const created = await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        p.id = created.id;
      }
      p.isDirty = false;
    } catch {
      if (p.id) {
        await db.projects.put({
          id: p.id,
          title: p.title,
          cornerPoints: p.cornerPoints,
          blendMode: p.blendMode,
          opacity: p.opacity,
          brightness: p.brightness,
          contrast: p.contrast,
          synced: false,
          updatedAt: Date.now()
        });
      }
    }
  }

  return {
    currentProject,
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
    setCornerPoint,
    setBasePhoto,
    setArtAsset,
    setBlendMode,
    setOpacity,
    setBrightness,
    setContrast,
    resetProject,
    saveProject
  };
});
