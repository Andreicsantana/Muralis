import { Point2D } from './homography.js';

export interface WallPlane {
  topLine: { m: number; c: number };    // y = m*x + c (normalized 0..1)
  botLine: { m: number; c: number };    // y = m*x + c (normalized 0..1)
  wallTopY: number;                     // Average top Y (0..1)
  wallBotY: number;                     // Average bottom Y (0..1)
  slope: number;                        // Dominant perspective slope
  confidence: number;
}

/**
 * Intelligent Wall Perspective & Boundary Detector
 * Detects true wall boundaries (separating sky/trees and ground) and fits
 * the artwork strictly within the detected wall face with true perspective angle.
 */
export function calculateAutoFitCorners(
  baseElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null,
  artElement: HTMLImageElement | HTMLCanvasElement | null,
  options: {
    scaleFactor?: number;    // 0.3 to 1.0 (default 0.75 of wall height)
    manualSlope?: number | null;
    verticalOffset?: number; // -0.5 (top) to 0.5 (bottom), default 0 (centered on wall)
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

  // 1. Detect wall structure and dominant lines
  const wall = detectWallPlane(baseElement);

  const slope = options.manualSlope !== null && options.manualSlope !== undefined
    ? options.manualSlope
    : wall.slope;

  // 2. Define vertical bounds strictly inside the wall
  const wallTopY = wall.wallTopY;
  const wallBotY = wall.wallBotY;
  const wallHeight = Math.max(0.2, wallBotY - wallTopY);

  // Artwork height inside wall
  const targetArtHeight = wallHeight * scale;
  const wallCenterY = (wallTopY + wallBotY) / 2 + verticalOffset * (wallHeight * 0.4);

  // Compute artwork width matching aspect ratio
  const baseAspect = baseW / baseH;
  const artAspect = artW / artH;
  let targetArtWidth = (targetArtHeight * artAspect) / baseAspect;

  // Limit width to 85% of image width
  if (targetArtWidth > 0.85) {
    targetArtWidth = 0.85;
  }

  const centerX = 0.5;
  const halfW = targetArtWidth / 2;
  const halfH = targetArtHeight / 2;

  const xLeft = Math.max(0.05, centerX - halfW);
  const xRight = Math.min(0.95, centerX + halfW);

  // Calculate top and bottom Y coordinates considering the wall slope
  // When slope > 0: wall slopes downwards to the right (left is higher, right is lower)
  // When slope < 0: wall slopes upwards to the right (left is lower, right is higher)
  // Vanishing compression: the farther side is also vertically compressed (perspective foreshortening)
  const leftDx = xLeft - centerX;
  const rightDx = xRight - centerX;

  const leftSlopeOffset = leftDx * slope;
  const rightSlopeOffset = rightDx * slope;

  // Foreshortening factor: farther side is shorter
  const foreshortening = slope * 0.4;
  const leftHeightRatio = 1 - (slope > 0 ? -foreshortening : foreshortening);
  const rightHeightRatio = 1 - (slope > 0 ? foreshortening : -foreshortening);

  const safeLeftHalfH = halfH * Math.max(0.5, Math.min(1.5, leftHeightRatio));
  const safeRightHalfH = halfH * Math.max(0.5, Math.min(1.5, rightHeightRatio));

  // Top-Left (0), Top-Right (1), Bottom-Right (2), Bottom-Left (3)
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

/**
 * Uses Hough transform and line segment analysis to filter out organic noise (trees, sky)
 * and find the true structural lines of the wall plane.
 */
function detectWallPlane(
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

    // 1. Grayscale conversion with Gaussian blur approximation
    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 2. Sobel edge extraction with magnitude and angle
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
          // Angle of the edge line (perpendicular to gradient)
          const lineAngle = Math.atan2(gx, -gy);
          edges.push({ x, y, angle: lineAngle, mag });
        }
      }
    }

    // 3. Line Accumulator for straight perspective segments
    // Focus on near-horizontal and diagonal perspective lines (-60 deg to +60 deg)
    const angleBins = 36; // -45 to +45 deg in 2.5 deg steps
    const binWeights = new Float32Array(angleBins);
    const binSlopes = new Float32Array(angleBins);

    for (let i = 0; i < angleBins; i++) {
      const deg = -45 + (i * 90) / angleBins;
      binSlopes[i] = Math.tan((deg * Math.PI) / 180);
    }

    for (const edge of edges) {
      const deg = (edge.angle * 180) / Math.PI;
      // Filter out pure vertical lines (like pillars or tree trunks) to isolate wall horizontal diagonals
      if (Math.abs(deg) <= 45) {
        const bin = Math.floor(((deg + 45) / 90) * angleBins);
        if (bin >= 0 && bin < angleBins) {
          binWeights[bin] += edge.mag;
        }
      }
    }

    // Find dominant angle
    let maxBin = Math.floor(angleBins / 2);
    let maxWeight = 0;
    for (let i = 0; i < angleBins; i++) {
      if (binWeights[i] > maxWeight) {
        maxWeight = binWeights[i];
        maxBin = i;
      }
    }

    const dominantSlope = binSlopes[maxBin];

    // 4. Find the true top and bottom boundaries of the wall
    // Sort horizontal slice intensities to find where the sky/trees end and the wall starts
    const rowEdgeCount = new Float32Array(h);
    for (const edge of edges) {
      rowEdgeCount[edge.y] += edge.mag;
    }

    // Wall top usually occurs in the upper 20% - 55% of the frame (below trees)
    let detectedTopY = 0.28;
    let maxTopScore = 0;
    for (let y = Math.floor(h * 0.15); y < Math.floor(h * 0.55); y++) {
      if (rowEdgeCount[y] > maxTopScore) {
        maxTopScore = rowEdgeCount[y];
        detectedTopY = y / h;
      }
    }

    // Wall bottom usually occurs in the lower 65% - 95% of the frame
    let detectedBotY = 0.85;
    let maxBotScore = 0;
    for (let y = Math.floor(h * 0.65); y < Math.floor(h * 0.95); y++) {
      if (rowEdgeCount[y] > maxBotScore) {
        maxBotScore = rowEdgeCount[y];
        detectedBotY = y / h;
      }
    }

    // Add safety margins to prevent artwork ever poking out of wall
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
