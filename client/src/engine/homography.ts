export interface Point2D {
  x: number;
  y: number;
}

export type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

export function computeHomography(src: [Point2D, Point2D, Point2D, Point2D], dst: [Point2D, Point2D, Point2D, Point2D]): Matrix3x3 {
  const matrixA: number[][] = [];
  const vectorB: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    matrixA.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    vectorB.push(dx);

    matrixA.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    vectorB.push(dy);
  }

  const solution = solveLinearSystem8x8(matrixA, vectorB);

  return [
    solution[0], solution[1], solution[2],
    solution[3], solution[4], solution[5],
    solution[6], solution[7], 1
  ];
}

function solveLinearSystem8x8(matrix: number[][], vector: number[]): number[] {
  const size = 8;
  const augmented: number[][] = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < size; col++) {
    let maxRow = col;
    let maxVal = Math.abs(augmented[col][col]);

    for (let row = col + 1; row < size; row++) {
      if (Math.abs(augmented[row][col]) > maxVal) {
        maxVal = Math.abs(augmented[row][col]);
        maxRow = row;
      }
    }

    if (maxRow !== col) {
      const temp = augmented[col];
      augmented[col] = augmented[maxRow];
      augmented[maxRow] = temp;
    }

    const pivot = augmented[col][col];
    if (Math.abs(pivot) < 1e-10) {
      continue;
    }

    for (let j = col; j <= size; j++) {
      augmented[col][j] /= pivot;
    }

    for (let row = 0; row < size; row++) {
      if (row !== col) {
        const factor = augmented[row][col];
        for (let j = col; j <= size; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }
  }

  return augmented.map(row => row[size]);
}

export function transformPoint(matrix: Matrix3x3, point: Point2D): Point2D {
  const x = point.x;
  const y = point.y;

  const w = matrix[6] * x + matrix[7] * y + matrix[8];
  const invW = w !== 0 ? 1 / w : 1;

  return {
    x: (matrix[0] * x + matrix[1] * y + matrix[2]) * invW,
    y: (matrix[3] * x + matrix[4] * y + matrix[5]) * invW
  };
}
