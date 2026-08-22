import { Point2D } from './homography.js';
import { drawWarpedImage } from './meshWarp.js';

export type BlendMode = 'normal' | 'multiply' | 'overlay' | 'soft-light';

export type ValidCanvasImage = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

export interface RenderState {
  baseImage: ValidCanvasImage | null;
  artImage: ValidCanvasImage | null;
  maskCanvas?: HTMLCanvasElement | OffscreenCanvas | null;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  blendMode: BlendMode;
  opacity: number;
  brightness: number;
  contrast: number;
}

export function compositeLayers(
  targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderState,
  subdivisions = 16
): void {
  targetCtx.clearRect(0, 0, width, height);

  if (state.baseImage) {
    targetCtx.drawImage(state.baseImage, 0, 0, width, height);
  }

  if (!state.artImage) {
    return;
  }

  const tempCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : document.createElement('canvas');

  if ('width' in tempCanvas && 'height' in tempCanvas) {
    tempCanvas.width = width;
    tempCanvas.height = height;
  }

  const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!tempCtx) {
    return;
  }

  const absoluteCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: state.cornerPoints[0].x * width, y: state.cornerPoints[0].y * height },
    { x: state.cornerPoints[1].x * width, y: state.cornerPoints[1].y * height },
    { x: state.cornerPoints[2].x * width, y: state.cornerPoints[2].y * height },
    { x: state.cornerPoints[3].x * width, y: state.cornerPoints[3].y * height }
  ];

  drawWarpedImage(tempCtx, state.artImage, absoluteCorners, { subdivisions });

  if (state.brightness !== 1.0 || state.contrast !== 1.0) {
    applyAdjustments(tempCtx, width, height, state.brightness, state.contrast);
  }

  if (state.maskCanvas) {
    tempCtx.save();
    tempCtx.globalCompositeOperation = 'destination-out';
    tempCtx.drawImage(state.maskCanvas, 0, 0, width, height);
    tempCtx.restore();
  }

  targetCtx.save();
  targetCtx.globalAlpha = Math.max(0, Math.min(1, state.opacity));

  switch (state.blendMode) {
    case 'multiply':
      targetCtx.globalCompositeOperation = 'multiply';
      break;
    case 'overlay':
      targetCtx.globalCompositeOperation = 'overlay';
      break;
    case 'soft-light':
      targetCtx.globalCompositeOperation = 'soft-light';
      break;
    default:
      targetCtx.globalCompositeOperation = 'source-over';
      break;
  }

  targetCtx.drawImage(tempCanvas, 0, 0);
  targetCtx.restore();
}

function applyAdjustments(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const factor = (259 * (contrast * 255 - 128 + 255)) / (255 * (259 - (contrast * 255 - 128)));
  const brightnessOffset = (brightness - 1.0) * 255;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    let r = data[i] + brightnessOffset;
    let g = data[i + 1] + brightnessOffset;
    let b = data[i + 2] + brightnessOffset;

    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}
