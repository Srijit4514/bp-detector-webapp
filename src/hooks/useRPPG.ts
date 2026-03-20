import { useState, useCallback, useRef } from 'react';
import { SignalPoint, pos, estimateBPM, bandpassFilter } from '../lib/rppg/posAlgorithm';
import { extractRGB } from '../lib/rppg/signalExtraction';
import { ROI } from '../lib/faceUtils';

const WINDOW_SIZE = 256; // About 8-10 seconds at 30fps
const STEP_SIZE = 30; // Update BPM every 30 frames (~1 sec)

export const useRPPG = () => {
  const [bpm, setBpm] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [signalBuffer, setSignalBuffer] = useState<number[]>([]);

  const rawSignalBuffer = useRef<SignalPoint[]>([]);
  const frameCount = useRef(0);
  const extractionCanvas = useRef<HTMLCanvasElement | null>(null);

  const processFrame = useCallback((video: HTMLVideoElement, rois: ROI[]) => {
    if (!extractionCanvas.current) {
      extractionCanvas.current = document.createElement('canvas');
    }

    if (rois.length === 0) return;

    // We can average results from multiple ROIs (forehead + cheeks)
    const rgbValues: { r: number; g: number; b: number }[] = [];

    for (const roi of rois) {
      const rgb = extractRGB(video, roi.points, extractionCanvas.current);
      if (rgb) rgbValues.push(rgb);
    }

    if (rgbValues.length === 0) return;

    // Average across ROIs
    const avgRGB = {
      r: rgbValues.reduce((a, b) => a + b.r, 0) / rgbValues.length,
      g: rgbValues.reduce((a, b) => a + b.g, 0) / rgbValues.length,
      b: rgbValues.reduce((a, b) => a + b.b, 0) / rgbValues.length,
      timestamp: performance.now()
    };

    rawSignalBuffer.current.push(avgRGB);

    if (rawSignalBuffer.current.length > WINDOW_SIZE) {
      rawSignalBuffer.current.shift();
    }

    frameCount.current++;

    if (frameCount.current % STEP_SIZE === 0 && rawSignalBuffer.current.length >= WINDOW_SIZE) {
      const duration = (rawSignalBuffer.current[rawSignalBuffer.current.length-1].timestamp - rawSignalBuffer.current[0].timestamp) / 1000;
      const fs = rawSignalBuffer.current.length / duration;

      let processedSignal = pos(rawSignalBuffer.current);
      // Apply bandpass filter for 0.7 - 3.5 Hz (approx 40 - 210 BPM)
      processedSignal = bandpassFilter(processedSignal, fs, 0.7, 3.5);

      const { bpm: estimatedBpm, confidence: estConfidence } = estimateBPM(processedSignal, fs);

      if (estConfidence > 1.2) { // Simple threshold for valid BPM
        setBpm(prev => {
          if (prev === null) return estimatedBpm;
          // Filter out sudden jumps
          if (Math.abs(estimatedBpm - prev) > 20) {
            return prev * 0.9 + estimatedBpm * 0.1;
          }
          // Exponential moving average for stability
          return prev * 0.7 + estimatedBpm * 0.3;
        });
      }
      setConfidence(estConfidence);
      setSignalBuffer(processedSignal.slice(-100)); // Last 100 points for visualization
    }
  }, []);

  return { bpm, confidence, signalBuffer, processFrame };
};
