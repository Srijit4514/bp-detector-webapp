// Indices for MediaPipe FaceMesh
// Forehead: 10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14, 15, 16, 17
// Actually, simple rectangular ROIs are easier to work with.
// Forehead center: 151 or 10
// Left cheek: 118 or 123
// Right cheek: 347 or 352

export const ROIS = {
  FOREHEAD: [151, 10, 67, 103, 109, 338, 297, 298],
  LEFT_CHEEK: [118, 117, 123, 147, 213, 192, 214],
  RIGHT_CHEEK: [347, 346, 352, 376, 433, 416, 434]
};

export interface Point {
  x: number;
  y: number;
}

export interface ROI {
  points: Point[];
  label: string;
}

export function getROIs(landmarks: any[]): ROI[] {
  if (!landmarks || landmarks.length === 0) return [];

  const foreheadPoints = ROIS.FOREHEAD.map(idx => ({
    x: landmarks[idx].x,
    y: landmarks[idx].y
  }));

  const leftCheekPoints = ROIS.LEFT_CHEEK.map(idx => ({
    x: landmarks[idx].x,
    y: landmarks[idx].y
  }));

  const rightCheekPoints = ROIS.RIGHT_CHEEK.map(idx => ({
    x: landmarks[idx].x,
    y: landmarks[idx].y
  }));

  return [
    { points: foreheadPoints, label: 'Forehead' },
    { points: leftCheekPoints, label: 'Left Cheek' },
    { points: rightCheekPoints, label: 'Right Cheek' }
  ];
}
