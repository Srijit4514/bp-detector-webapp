import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export const useFaceLandmarker = () => {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize FaceLandmarker:", err);
        setError("Failed to initialize face detection model.");
        setIsLoading(false);
      }
    };

    initFaceLandmarker();
  }, []);

  return { faceLandmarker, isLoading, error };
};
