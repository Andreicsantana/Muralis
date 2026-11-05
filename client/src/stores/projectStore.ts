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
        x: point.x,
        y: point.y
      };
      currentProject.value.isDirty = true;
    }
  }

  function setCornerPoints(points: [Point2D, Point2D, Point2D, Point2D]) {
    currentProject.value.cornerPoints = points;
    currentProject.value.isDirty = true;
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
    const projectId = p.id || ('local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
    p.id = projectId;
    if (!p.id) {
      p.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    const payload = {
      title: p.title,
      cornerPoints: p.cornerPoints,
      blendMode: p.blendMode,
      opacity: p.opacity,
      brightness: p.brightness,
      contrast: p.contrast
    };

    let savedRemote = false;
    try {
      if (p.id.startsWith('local_')) {
        const created = await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        p.id = created.id;
      } else {
        await apiRequest(`/projects/${p.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      }
      savedRemote = true;
    } catch {
      savedRemote = false;
    }

    let maskData: string | null = null;
    if (p.maskCanvas) {
      try {
        maskData = p.maskCanvas.toDataURL();
      } catch {}
    }

    await db.projects.put({
      id: projectId,
      title: p.title,
      basePhotoUrl: p.basePhotoUrl,
      artAssetUrl: p.artAssetUrl,
      maskCanvasData: maskData,
      cornerPoints: p.cornerPoints,
      blendMode: p.blendMode,
      opacity: p.opacity,
      brightness: p.brightness,
      contrast: p.contrast,
      synced: savedRemote,
      updatedAt: Date.now()
    });

    p.isDirty = false;
  }

  async function loadProject(id: string) {
    try {
      const p = await apiRequest(`/projects/${id}`);
      currentProject.value = {
        id: p.id,
        title: p.title || 'Mural',
        basePhotoUrl: p.basePhoto?.url || null,
        artAssetUrl: p.artAsset?.url || null,
        maskCanvas: null,
        cornerPoints: p.cornerPoints || [
          { x: 0.15, y: 0.15 },
          { x: 0.85, y: 0.15 },
          { x: 0.85, y: 0.85 },
          { x: 0.15, y: 0.85 }
        ],
        blendMode: p.blendMode || 'multiply',
        opacity: p.opacity ?? 0.9,
        brightness: p.brightness ?? 1.0,
        contrast: p.contrast ?? 1.0,
        isDirty: false
      };
      return;
    } catch {}

    const offlineP = await db.projects.get(id);
    if (offlineP) {
      let maskCanvasElement: HTMLCanvasElement | null = null;
      if (offlineP.maskCanvasData) {
        const img = new Image();
        img.src = offlineP.maskCanvasData;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        maskCanvasElement = document.createElement('canvas');
        maskCanvasElement.width = img.naturalWidth || 800;
        maskCanvasElement.height = img.naturalHeight || 600;
        const ctx = maskCanvasElement.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
      }

      currentProject.value = {
        id: offlineP.id,
        title: offlineP.title,
        basePhotoUrl: offlineP.basePhotoUrl || null,
        artAssetUrl: offlineP.artAssetUrl || null,
        maskCanvas: maskCanvasElement,
        cornerPoints: offlineP.cornerPoints as any,
        blendMode: offlineP.blendMode as any,
        opacity: offlineP.opacity,
        brightness: offlineP.brightness,
        contrast: offlineP.contrast,
        isDirty: false
      };
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
    setCornerPoints,
    setBasePhoto,
    setArtAsset,
    setBlendMode,
    setOpacity,
    setBrightness,
    setContrast,
    resetProject,
    saveProject,
    loadProject
  };
});
