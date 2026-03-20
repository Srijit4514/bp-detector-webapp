import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  data: number[];
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ data, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Normalize data for plotting
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = Math.max(0.0001, max - min);

    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const step = width / (data.length - 1);

    data.forEach((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className={className}
    />
  );
};
