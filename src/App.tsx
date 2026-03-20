import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Webcam } from './components/Webcam';
import { Waveform } from './components/Waveform';
import { ROIOverlay } from './components/ROIOverlay';
import { useFaceLandmarker } from './hooks/useFaceLandmarker';
import { useRPPG } from './hooks/useRPPG';
import { getROIs, ROI } from './lib/faceUtils';
import { Heart, Camera, Settings, Info, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const { faceLandmarker, isLoading: modelsLoading, error: modelError } = useFaceLandmarker();
  const { bpm, confidence, signalBuffer, processFrame } = useRPPG();
  const [rois, setRois] = useState<ROI[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const onFrame = useCallback((video: HTMLVideoElement) => {
    if (video.videoWidth !== videoDimensions.width || video.videoHeight !== videoDimensions.height) {
      setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
    }

    if (faceLandmarker) {
      const results = faceLandmarker.detectForVideo(video, performance.now());
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        setIsFaceDetected(true);
        const faceROIs = getROIs(results.faceLandmarks[0]);
        setRois(faceROIs);
        processFrame(video, faceROIs);
      } else {
        setIsFaceDetected(false);
        setRois([]);
      }
    }
  }, [faceLandmarker, videoDimensions, processFrame]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="text-red-500 fill-current animate-pulse" size={32} />
          <h1 className="text-4xl font-bold tracking-tight">rPPG Heart Monitor</h1>
        </div>
        <p className="text-gray-400">Non-contact heart rate estimation in your browser</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Left column: Video Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-800 shadow-2xl">
            {modelsLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                <p className="text-xl font-semibold">Loading Models...</p>
              </div>
            )}

            {modelError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/80 p-4 text-center">
                <div className="text-red-500 mb-4 text-4xl">⚠️</div>
                <p className="text-red-400 font-semibold">{modelError}</p>
              </div>
            )}

            {!isFaceDetected && !modelsLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
                <div className="border-2 border-dashed border-white/30 rounded-full w-48 h-64 mb-4 flex items-center justify-center">
                  <Camera className="text-white/30" size={32} />
                </div>
                <p className="text-white/80 font-medium">Position your face in the frame</p>
              </div>
            )}

            <Webcam
              onFrame={onFrame}
              className="absolute inset-0 w-full h-full object-cover mirror-x"
            />

            {videoDimensions.width > 0 && (
              <ROIOverlay
                rois={rois}
                width={videoDimensions.width}
                height={videoDimensions.height}
                className="absolute inset-0 w-full h-full object-cover mirror-x pointer-events-none opacity-50"
              />
            )}
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-300">Pulse Waveform</h3>
              <div className="flex gap-2">
                <div className={cn("w-2 h-2 rounded-full", confidence > 2 ? "bg-green-500" : confidence > 1.5 ? "bg-yellow-500" : "bg-red-500")}></div>
                <span className="text-xs text-gray-500 uppercase">Signal {confidence > 2 ? "Stable" : "Weak"}</span>
              </div>
            </div>
            <Waveform data={signalBuffer} className="w-full h-32" />
          </div>
        </div>

        {/* Right column: Stats & Info */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center justify-center h-full">
            <h3 className="text-gray-400 uppercase tracking-wider text-sm mb-4">Heart Rate (BPM)</h3>
            <div className="relative">
              <span className={cn("text-8xl font-black tabular-nums transition-colors duration-500", !isFaceDetected ? "text-gray-800" : "text-red-500")}>
                {bpm ? Math.round(bpm) : '--'}
              </span>
              <Heart className={cn("absolute -top-4 -right-8 text-red-500 fill-current", bpm ? "animate-pulse" : "opacity-20")} size={32} />
            </div>

            <div className="mt-8 w-full space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 uppercase tracking-tighter">Confidence</span>
                <span className="font-mono text-blue-400">{(Math.min(100, (confidence / 4) * 100)).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (confidence / 4) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-900/20">
            <div className="flex items-center gap-2 mb-3 text-blue-400">
              <Info size={20} />
              <h4 className="font-semibold">How to get accurate results</h4>
            </div>
            <ul className="text-sm text-blue-300/80 space-y-2 list-disc pl-4">
              <li>Ensure your face is well lit and evenly illuminated.</li>
              <li>Remain still and minimize head movements.</li>
              <li>Avoid talking or significant facial expressions.</li>
              <li>The measurement takes about 10 seconds to stabilize.</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        <p>Built using MediaPipe FaceMesh & POS rPPG Algorithm</p>
      </footer>
    </div>
  );
}

export default App;
