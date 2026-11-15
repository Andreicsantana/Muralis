import { Point2D } from './homography.js';

export interface WallPlane {
  topLine: { m: number; c: number };
  botLine: { m: number; c: number };
  wallLeftX: number;
  wallRightX: number;
  wallTopY: number;
  wallBotY: number;
  slope: number;
  confidence: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function bilerpQuad(
  quad: [Point2D, Point2D, Point2D, Point2D],
  u: number,
  v: number
): Point2D {
  const [tl, tr, br, bl] = quad;
  const topX = tl.x + (tr.x - tl.x) * u;
  const topY = tl.y + (tr.y - tl.y) * u;
  const botX = bl.x + (br.x - bl.x) * u;
  const botY = bl.y + (br.y - bl.y) * u;
  return {
    x: Number(clamp(topX + (botX - topX) * v, 0.01, 0.99).toFixed(4)),
    y: Number(clamp(topY + (botY - topY) * v, 0.01, 0.99).toFixed(4))
  };
}

function fitRobustLine(points: Array<{ x: number; y: number }>, fallbackY: number): { m: number; c: number } {
  if (points.length < 4) {
    return { m: 0, c: fallbackY };
  }

  const slopes: number[] = [];
  const step = Math.max(1, Math.floor(points.length / 28));
  const sampled = points.filter((_, idx) => idx % step === 0);

  for (let i = 0; i < sampled.length; i++) {
    for (let j = i + 1; j < sampled.length; j++) {
      const dx = sampled[j].x - sampled[i].x;
      if (Math.abs(dx) > 0.03) {
        const m = (sampled[j].y - sampled[i].y) / dx;
        if (Math.abs(m) <= 1.2) {
          slopes.push(m);
        }
      }
    }
  }

  if (slopes.length === 0) {
    const ys = points.map((p) => p.y).sort((a, b) => a - b);
    return { m: 0, c: ys[Math.floor(ys.length / 2)] };
  }

  slopes.sort((a, b) => a - b);
  const medianSlope = slopes[Math.floor(slopes.length / 2)];
  const intercepts = points.map((p) => p.y - medianSlope * p.x).sort((a, b) => a - b);
  const medianIntercept = intercepts[Math.floor(intercepts.length / 2)];

  return { m: medianSlope, c: medianIntercept };
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
  const scale = clamp(options.scaleFactor ?? 0.8, 0.15, 1.0);
  const verticalOffset = clamp(options.verticalOffset ?? 0, -0.5, 0.5);

  if (!baseElement || !artElement) {
    return [
      { x: 0.2, y: 0.25 },
      { x: 0.8, y: 0.25 },
      { x: 0.8, y: 0.75 },
      { x: 0.2, y: 0.75 }
    ];
  }

  const baseW =
    'videoWidth' in baseElement && baseElement.videoWidth
      ? baseElement.videoWidth
      : ('naturalWidth' in baseElement && baseElement.naturalWidth ? baseElement.naturalWidth : baseElement.width) || 800;

  const baseH =
    'videoHeight' in baseElement && baseElement.videoHeight
      ? baseElement.videoHeight
      : ('naturalHeight' in baseElement && baseElement.naturalHeight ? baseElement.naturalHeight : baseElement.height) || 600;

  const artW = ('naturalWidth' in artElement && artElement.naturalWidth ? artElement.naturalWidth : artElement.width) || 400;
  const artH = ('naturalHeight' in artElement && artElement.naturalHeight ? artElement.naturalHeight : artElement.height) || 400;

  const wall = detectWallPlane(baseElement);
  const xLeft = wall.wallLeftX;
  const xRight = wall.wallRightX;

  let wallTL: Point2D;
  let wallTR: Point2D;
  let wallBR: Point2D;
  let wallBL: Point2D;

  if (options.manualSlope !== null && options.manualSlope !== undefined) {
    const slope = options.manualSlope;
    const midX = (xLeft + xRight) / 2;
    const midY = (wall.wallTopY + wall.wallBotY) / 2;
    const wallH = Math.max(0.2, wall.wallBotY - wall.wallTopY);
    const halfH = wallH / 2;
    const leftDx = xLeft - midX;
    const rightDx = xRight - midX;
    const foreshortening = slope * 0.35;
    const leftHalfH = halfH * clamp(1 + foreshortening, 0.4, 1.6);
    const rightHalfH = halfH * clamp(1 - foreshortening, 0.4, 1.6);

    wallTL = { x: xLeft, y: clamp(midY + leftDx * slope - leftHalfH, 0.02, 0.92) };
    wallTR = { x: xRight, y: clamp(midY + rightDx * slope - rightHalfH, 0.02, 0.92) };
    wallBR = { x: xRight, y: clamp(midY + rightDx * slope + rightHalfH, wallTR.y + 0.1, 0.98) };
    wallBL = { x: xLeft, y: clamp(midY + leftDx * slope + leftHalfH, wallTL.y + 0.1, 0.98) };
  } else {
    const topL = clamp(wall.topLine.m * xLeft + wall.topLine.c, 0.02, 0.85);
    const topR = clamp(wall.topLine.m * xRight + wall.topLine.c, 0.02, 0.85);
    const botL = clamp(wall.botLine.m * xLeft + wall.botLine.c, topL + 0.14, 0.98);
    const botR = clamp(wall.botLine.m * xRight + wall.botLine.c, topR + 0.14, 0.98);

    wallTL = { x: xLeft, y: topL };
    wallTR = { x: xRight, y: topR };
    wallBR = { x: xRight, y: botR };
    wallBL = { x: xLeft, y: botL };
  }

  const wallVisualW = Math.max(20, (xRight - xLeft) * baseW);
  const wallVisualH = Math.max(20, (((wallBL.y - wallTL.y) + (wallBR.y - wallTR.y)) / 2) * baseH);
  const wallAspect = wallVisualW / wallVisualH;
  const artAspect = artW / artH;

  let uSpan = scale;
  let vSpan = scale;
  if (artAspect > wallAspect) {
    vSpan = clamp(scale * (wallAspect / artAspect), 0.25, scale);
  } else {
    uSpan = clamp(scale * (artAspect / wallAspect), 0.25, scale);
  }

  const uCenter = 0.5;
  const vCenter = clamp(0.5 + verticalOffset * (1 - vSpan * 0.5), vSpan / 2 + 0.02, 1 - vSpan / 2 - 0.02);

  const u0 = clamp(uCenter - uSpan / 2, 0.02, 0.98);
  const u1 = clamp(uCenter + uSpan / 2, 0.02, 0.98);
  const v0 = clamp(vCenter - vSpan / 2, 0.02, 0.98);
  const v1 = clamp(vCenter + vSpan / 2, 0.02, 0.98);

  const wallQuad: [Point2D, Point2D, Point2D, Point2D] = [wallTL, wallTR, wallBR, wallBL];

  return [
    bilerpQuad(wallQuad, u0, v0),
    bilerpQuad(wallQuad, u1, v0),
    bilerpQuad(wallQuad, u1, v1),
    bilerpQuad(wallQuad, u0, v1)
  ];
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
    y: Number(Math.max(0.01, Math.min(0.98, cy + leftSlopeOffset - leftHalfH)).toFixed(4))
  };

  const p1: Point2D = {
    x: Number(xRight.toFixed(4)),
    y: Number(Math.max(0.01, Math.min(0.98, cy + rightSlopeOffset - rightHalfH)).toFixed(4))
  };

  const p2: Point2D = {
    x: Number(xRight.toFixed(4)),
    y: Number(Math.max(0.02, Math.min(0.99, cy + rightSlopeOffset + rightHalfH)).toFixed(4))
  };

  const p3: Point2D = {
    x: Number(xLeft.toFixed(4)),
    y: Number(Math.max(0.02, Math.min(0.99, cy + leftSlopeOffset + leftHalfH)).toFixed(4))
  };

  return [p0, p1, p2, p3];
}

export function detectWallPlane(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): WallPlane {
  const fallback: WallPlane = {
    topLine: { m: 0, c: 0.2 },
    botLine: { m: 0, c: 0.85 },
    wallLeftX: 0.12,
    wallRightX: 0.88,
    wallTopY: 0.2,
    wallBotY: 0.85,
    slope: 0,
    confidence: 0
  };

  try {
    const w = 180;
    const h = 120;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallback;

    ctx.drawImage(source, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const gray = new Float32Array(w * h);
    const isNonWall = new Uint8Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = y * w + x;
        const p = j * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[j] = lum;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;

        const skyLike = (b - r > 18 && lum > 110 && y < h * 0.6) || (lum > 228 && sat < 0.18 && y < h * 0.45);
        const foliageLike = g > r * 1.07 && g > b * 1.12 && g - r > 8;

        if (skyLike || foliageLike) {
          isNonWall[j] = 1;
        }
      }
    }

    let seedR = 0;
    let seedG = 0;
    let seedB = 0;
    let seedCount = 0;
    const sx0 = Math.floor(w * 0.22);
    const sx1 = Math.floor(w * 0.78);
    const sy0 = Math.floor(h * 0.35);
    const sy1 = Math.floor(h * 0.78);

    for (let y = sy0; y < sy1; y++) {
      for (let x = sx0; x < sx1; x++) {
        const j = y * w + x;
        if (isNonWall[j]) continue;
        const p = j * 4;
        seedR += data[p];
        seedG += data[p + 1];
        seedB += data[p + 2];
        seedCount++;
      }
    }

    if (seedCount > 0) {
      seedR /= seedCount;
      seedG /= seedCount;
      seedB /= seedCount;
    }

    const wallMask = new Uint8Array(w * h);
    const colWallCounts = new Float32Array(w);

    for (let y = Math.floor(h * 0.04); y < Math.floor(h * 0.94); y++) {
      for (let x = 2; x < w - 2; x++) {
        const j = y * w + x;
        if (isNonWall[j]) continue;
        const p = j * 4;
        const colorDist = Math.hypot(data[p] - seedR, data[p + 1] - seedG, data[p + 2] - seedB);
        if (seedCount === 0 || colorDist < 95) {
          wallMask[j] = 1;
          colWallCounts[x]++;
        }
      }
    }

    let peakCol = Math.floor(w / 2);
    let peakCount = 0;
    for (let x = Math.floor(w * 0.1); x < Math.floor(w * 0.9); x++) {
      if (colWallCounts[x] > peakCount) {
        peakCount = colWallCounts[x];
        peakCol = x;
      }
    }

    let leftCol = peakCol;
    while (leftCol > 3 && colWallCounts[leftCol - 1] >= peakCount * 0.3) {
      leftCol--;
    }
    let rightCol = peakCol;
    while (rightCol < w - 4 && colWallCounts[rightCol + 1] >= peakCount * 0.3) {
      rightCol++;
    }

    let wallLeftX = clamp(leftCol / w, 0.05, 0.45);
    let wallRightX = clamp(rightCol / w, 0.55, 0.95);
    if (wallRightX - wallLeftX < 0.25) {
      wallLeftX = 0.12;
      wallRightX = 0.88;
    }

    const topPoints: Array<{ x: number; y: number }> = [];
    const botPoints: Array<{ x: number; y: number }> = [];

    const xStart = Math.max(2, Math.floor(wallLeftX * w));
    const xEnd = Math.min(w - 3, Math.ceil(wallRightX * w));

    for (let x = xStart; x <= xEnd; x += 2) {
      let colTop: number | null = null;
      for (let y = 3; y < Math.floor(h * 0.78); y++) {
        const j = y * w + x;
        if (wallMask[j] && wallMask[j + w] && wallMask[j + 2 * w]) {
          colTop = y;
          break;
        }
      }

      let colBot: number | null = null;
      for (let y = h - 4; y > Math.floor(h * 0.35); y--) {
        const j = y * w + x;
        if (wallMask[j] && wallMask[j - w] && wallMask[j - 2 * w]) {
          colBot = y;
          break;
        }
      }

      if (colTop !== null && colBot !== null && colBot - colTop >= h * 0.15) {
        topPoints.push({ x: x / w, y: clamp((colTop + 2) / h, 0.03, 0.82) });
        botPoints.push({ x: x / w, y: clamp((colBot - 2) / h, 0.2, 0.96) });
      }
    }

    const topLine = fitRobustLine(topPoints, 0.2);
    const botLine = fitRobustLine(botPoints, 0.85);
    const midSlope = (topLine.m + botLine.m) / 2;

    const midX = (wallLeftX + wallRightX) / 2;
    const wallTopY = clamp(topLine.m * midX + topLine.c, 0.04, 0.75);
    const wallBotY = clamp(botLine.m * midX + botLine.c, wallTopY + 0.18, 0.96);

    return {
      topLine,
      botLine,
      wallLeftX,
      wallRightX,
      wallTopY,
      wallBotY,
      slope: clamp(midSlope, -0.6, 0.6),
      confidence: topPoints.length
    };
  } catch {
    return fallback;
  }
}
