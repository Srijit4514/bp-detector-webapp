import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WebcamProps {
  onFrame: (video: HTMLVideoElement) => void;
  className?: string;
}

export const Webcam: React.FC<WebcamProps> = ({ onFrame, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access webcam. Please ensure permissions are granted.");
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVideoMetadata = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();

      const processFrame = () => {
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          onFrame(videoRef.current);
          requestAnimationFrame(processFrame);
        }
      };

      requestAnimationFrame(processFrame);
    }
  }, [onFrame]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <video
      ref={videoRef}
      className={className}
      onLoadedMetadata={handleVideoMetadata}
      playsInline
      muted
    />
  );
};
