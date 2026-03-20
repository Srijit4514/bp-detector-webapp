export function extractRGB(
  video: HTMLVideoElement,
  roiPoints: { x: number; y: number }[],
  canvas: HTMLCanvasElement
): { r: number; g: number; b: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { width, height } = video;
  canvas.width = width;
  canvas.height = height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw ROI polygon
  ctx.beginPath();
  ctx.moveTo(roiPoints[0].x * width, roiPoints[0].y * height);
  for (let i = 1; i < roiPoints.length; i++) {
    ctx.lineTo(roiPoints[i].x * width, roiPoints[i].y * height);
  }
  ctx.closePath();

  // Create clipping region
  ctx.save();
  ctx.clip();

  // Draw only the ROI from the video onto the canvas
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();

  // Calculate average RGB values
  // Performance optimization: we could just sample points instead of getting the entire imageData
  // But for better accuracy, let's get the imageData for now.
  // Actually, let's use a bounding box for ROI and then filter the mask if needed.

  const minX = Math.min(...roiPoints.map(p => p.x)) * width;
  const minY = Math.min(...roiPoints.map(p => p.y)) * height;
  const maxX = Math.max(...roiPoints.map(p => p.x)) * width;
  const maxY = Math.max(...roiPoints.map(p => p.y)) * height;

  const roiWidth = Math.max(1, Math.floor(maxX - minX));
  const roiHeight = Math.max(1, Math.floor(maxY - minY));

  const imageData = ctx.getImageData(
    Math.floor(minX),
    Math.floor(minY),
    roiWidth,
    roiHeight
  );

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    // If pixel is not transparent (within the clipped region)
    if (imageData.data[i+3] > 0) {
      rSum += imageData.data[i];
      gSum += imageData.data[i+1];
      bSum += imageData.data[i+2];
      count++;
    }
  }

  if (count === 0) return null;

  return {
    r: rSum / count,
    g: gSum / count,
    b: bSum / count
  };
}
