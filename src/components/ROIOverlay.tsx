import React, { useRef, useEffect } from 'react';
import { ROI } from '../lib/faceUtils';

interface ROIOverlayProps {
  rois: ROI[];
  width: number;
  height: number;
  className?: string;
}

export const ROIOverlay: React.FC<ROIOverlayProps> = ({ rois, width, height, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    rois.forEach(roi => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 1;

      const points = roi.points;
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }
      ctx.closePath();
      ctx.stroke();
    });
  }, [rois, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};
