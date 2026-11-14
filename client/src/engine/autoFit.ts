import { Point2D } from './homography.js';

export interface WallPlane {
  topLine: { m: number; c: number };
  botLine: { m: number; c: number };
  wallTopY: number;
  wallBotY: number;
  slope: number;
  confidence: number;
}

export function calculateAutoFitCorners(
  baseElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null,
  artElement: HTMLImageElement | HTMLCanvasElement | null,
  options: {
    scaleFactor?: number;
    manualSlope?: number | null;
    verticalOffset?: number;
  } = {}
): [Point2D, Point2D, Point2D, Point2D] {
  const scale = options.scaleFactor ?? 0.70;
  const verticalOffset = options.verticalOffset ?? 0;

  if (!baseElement || !artElement) {
    return [
      { x: 0.20, y: 0.25 },
      { x: 0.80, y: 0.25 },
      { x: 0.80, y: 0.75 },
      { x: 0.20, y: 0.75 }
    ];
  }

  const baseW = 'videoWidth' in baseElement && baseElement.videoWidth
    ? baseElement.videoWidth
    : ('naturalWidth' in baseElement && baseElement.naturalWidth ? baseElement.naturalWidth : baseElement.width) || 800;

  const baseH = 'videoHeight' in baseElement && baseElement.videoHeight
    ? baseElement.videoHeight
    : ('naturalHeight' in baseElement && baseElement.naturalHeight ? baseElement.naturalHeight : baseElement.height) || 600;

  const artW = ('naturalWidth' in artElement && artElement.naturalWidth ? artElement.naturalWidth : artElement.width) || 400;
  const artH = ('naturalHeight' in artElement && artElement.naturalHeight ? artElement.naturalHeight : artElement.height) || 400;

  const wall = detectWallPlane(baseElement);

  const slope = options.manualSlope !== null && options.manualSlope !== undefined
    ? options.manualSlope
    : wall.slope;

  const wallTopY = wall.wallTopY;
  const wallBotY = wall.wallBotY;
  const wallHeight = Math.max(0.2, wallBotY - wallTopY);

  const targetArtHeight = wallHeight * scale;
  const wallCenterY = (wallTopY + wallBotY) / 2 + verticalOffset * (wallHeight * 0.4);

  const baseAspect = baseW / baseH;
  const artAspect = artW / artH;
  let targetArtWidth = (targetArtHeight * artAspect) / baseAspect;

  if (targetArtWidth > 0.85) {
    targetArtWidth = 0.85;
  }

  const centerX = 0.5;
  const halfW = targetArtWidth / 2;
  const halfH = targetArtHeight / 2;

  const xLeft = Math.max(0.05, centerX - halfW);
  const xRight = Math.min(0.95, centerX + halfW);

  const leftDx = xLeft - centerX;
  const rightDx = xRight - centerX;

  const leftSlopeOffset = leftDx * slope;
  const rightSlopeOffset = rightDx * slope;

  const foreshortening = slope * 0.35;
  const leftHeightRatio = 1 + foreshortening;
  const rightHeightRatio = 1 - foreshortening;

  const safeLeftHalfH = halfH * Math.max(0.4, Math.min(1.6, leftHeightRatio));
  const safeRightHalfH = halfH * Math.max(0.4, Math.min(1.6, rightHeightRatio));

  const p0: Point2D = {
    x: xLeft,
    y: Math.max(0.02, Math.min(0.95, (wallCenterY + leftSlopeOffset) - safeLeftHalfH))
  };

  const p1: Point2D = {
    x: xRight,
    y: Math.max(0.02, Math.min(0.95, (wallCenterY + rightSlopeOffset) - safeRightHalfH))
  };

  const p2: Point2D = {
    x: xRight,
    y: Math.max(0.05, Math.min(0.98, (wallCenterY + rightSlopeOffset) + safeRightHalfH))
  };

  const p3: Point2D = {
    x: xLeft,
    y: Math.max(0.05, Math.min(0.98, (wallCenterY + leftSlopeOffset) + safeLeftHalfH))
  };

  return [p0, p1, p2, p3];
}

export function applyDirectionToQuad(
  currentQuad: [Point2D, Point2D, Point2D, Point2D],
  slope: number
): [Point2D, Point2D, Point2D, Point2D] {

  const cx = (currentQuad[0].x + currentQuad[1].x + currentQuad[2].x + currentQuad[3].x) / 4;
  const cy = (currentQuad[0].y + currentQuad[1].y + currentQuad[2].y + currentQuad[3].y) / 4;

  const topW = Math.hypot(currentQuad[1].x - currentQuad[0].x, currentQuad[1].y - currentQuad[0].y);
  const botW = Math.hypot(currentQuad[2].x - currentQuad[3].x, currentQuad[2].y - currentQuad[3].y);
  const avgW = (topW + botW) / 2;

  const leftH = Math.hypot(currentQuad[3].x - currentQuad[0].x, currentQuad[3].y - currentQuad[0].y);
  const rightH = Math.hypot(currentQuad[2].x - currentQuad[1].x, currentQuad[2].y - currentQuad[1].y);
  const avgH = (leftH + rightH) / 2;

  const halfW = Math.max(0.04, Math.min(0.48, avgW / 2));
  const halfH = Math.max(0.04, Math.min(0.48, avgH / 2));

  const foreshortening = slope * 0.35;
  const leftHalfH = halfH * Math.max(0.4, Math.min(1.6, 1 + foreshortening));
  const rightHalfH = halfH * Math.max(0.4, Math.min(1.6, 1 - foreshortening));

  const leftSlopeOffset = -halfW * slope;
  const rightSlopeOffset = halfW * slope;

  const xLeft = Math.max(0.01, Math.min(0.99, cx - halfW));
  const xRight = Math.max(0.01, Math.min(0.99, cx + halfW));

  const p0: Point2D = {
    x: Number(xLeft.toFixed(4)),
    y: Number(Math.max(0.01, Math.min(0.98, (cy + leftSlopeOffset) - leftHalfH)).toFixed(4))
  };

  const p1: Point2D = {
    x: Number(xRight.toFixed(4)),
    y: Number(Math.max(0.01, Math.min(0.98, (cy + rightSlopeOffset) - rightHalfH)).toFixed(4))
  };

  const p2: Point2D = {
    x: Number(xRight.toFixed(4)),
    y: Number(Math.max(0.02, Math.min(0.99, (cy + rightSlopeOffset) + rightHalfH)).toFixed(4))
  };

  const p3: Point2D = {
    x: Number(xLeft.toFixed(4)),
    y: Number(Math.max(0.02, Math.min(0.99, (cy + leftSlopeOffset) + leftHalfH)).toFixed(4))
  };

  return [p0, p1, p2, p3];
}

export function detectWallPlane(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): WallPlane {
  try {
    const w = 240;
    const h = 160;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        topLine: { m: 0, c: 0.2 },
        botLine: { m: 0, c: 0.8 },
        wallTopY: 0.25,
        wallBotY: 0.85,
        slope: 0,
        confidence: 0
      };
    }

    ctx.drawImage(source, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const edges: Array<{ x: number; y: number; angle: number; mag: number }> = [];
    const minMag = 35;

    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const idx = y * w + x;
        const gx =
          -gray[idx - w - 1] + gray[idx - w + 1] +
          -2 * gray[idx - 1] + 2 * gray[idx + 1] +
          -gray[idx + w - 1] + gray[idx + w + 1];

        const gy =
          -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] +
          gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];

        const mag = Math.sqrt(gx * gx + gy * gy);
        if (mag > minMag) {

          const lineAngle = Math.atan2(gx, -gy);
          edges.push({ x, y, angle: lineAngle, mag });
        }
      }
    }

    const angleBins = 36;
    const binWeights = new Float32Array(angleBins);
    const binSlopes = new Float32Array(angleBins);

    for (let i = 0; i < angleBins; i++) {
      const deg = -45 + (i * 90) / angleBins;
      binSlopes[i] = Math.tan((deg * Math.PI) / 180);
    }

    for (const edge of edges) {
      const deg = (edge.angle * 180) / Math.PI;

      if (Math.abs(deg) <= 45) {
        const bin = Math.floor(((deg + 45) / 90) * angleBins);
        if (bin >= 0 && bin < angleBins) {
          binWeights[bin] += edge.mag;
        }
      }
    }

    let maxBin = Math.floor(angleBins / 2);
    let maxWeight = 0;
    for (let i = 0; i < angleBins; i++) {
      if (binWeights[i] > maxWeight) {
        maxWeight = binWeights[i];
        maxBin = i;
      }
    }

    const dominantSlope = binSlopes[maxBin];

    const rowEdgeCount = new Float32Array(h);
    for (const edge of edges) {
      rowEdgeCount[edge.y] += edge.mag;
    }

    let detectedTopY = 0.28;
    let maxTopScore = 0;
    for (let y = Math.floor(h * 0.15); y < Math.floor(h * 0.55); y++) {
      if (rowEdgeCount[y] > maxTopScore) {
        maxTopScore = rowEdgeCount[y];
        detectedTopY = y / h;
      }
    }

    let detectedBotY = 0.85;
    let maxBotScore = 0;
    for (let y = Math.floor(h * 0.65); y < Math.floor(h * 0.95); y++) {
      if (rowEdgeCount[y] > maxBotScore) {
        maxBotScore = rowEdgeCount[y];
        detectedBotY = y / h;
      }
    }

    const safeTopY = Math.min(0.40, Math.max(0.18, detectedTopY + 0.05));
    const safeBotY = Math.max(0.70, Math.min(0.92, detectedBotY - 0.04));

    return {
      topLine: { m: dominantSlope, c: safeTopY },
      botLine: { m: dominantSlope, c: safeBotY },
      wallTopY: safeTopY,
      wallBotY: safeBotY,
      slope: dominantSlope,
      confidence: maxWeight
    };
  } catch {
    return {
      topLine: { m: 0, c: 0.25 },
      botLine: { m: 0, c: 0.85 },
      wallTopY: 0.28,
      wallBotY: 0.85,
      slope: 0,
      confidence: 0
    };
  }
}
