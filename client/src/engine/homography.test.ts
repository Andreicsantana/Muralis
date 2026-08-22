import { computeHomography, transformPoint, Point2D } from './homography.js';

function assertApprox(actual: number, expected: number, tolerance = 1e-4, msg = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion failed: ${actual} !~= ${expected} (${msg})`);
  }
}

function runTests() {
  const src: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ];

  const dstIdentity: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ];

  const hIdentity = computeHomography(src, dstIdentity);
  const p1 = transformPoint(hIdentity, { x: 50, y: 50 });
  assertApprox(p1.x, 50, 1e-4, 'Identity center X');
  assertApprox(p1.y, 50, 1e-4, 'Identity center Y');

  const dstPerspective: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 20, y: 10 },
    { x: 80, y: 30 },
    { x: 90, y: 90 },
    { x: 10, y: 80 }
  ];

  const hPersp = computeHomography(src, dstPerspective);

  for (let i = 0; i < 4; i++) {
    const transformed = transformPoint(hPersp, src[i]);
    assertApprox(transformed.x, dstPerspective[i].x, 1e-4, `Corner ${i} X`);
    assertApprox(transformed.y, dstPerspective[i].y, 1e-4, `Corner ${i} Y`);
  }

  process.stdout.write('All homography mathematical assertions passed!\n');
}

runTests();
