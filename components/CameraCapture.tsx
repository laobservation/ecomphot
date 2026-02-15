import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon, RefreshIcon, CheckIcon, ErrorIcon } from './Icons';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera(); 
    setError(null);
    setCapturedImage(null);
    setIsCameraInitializing(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('cameraCapture.error.noDevice'));
      }

      let mediaStream;
      try {
        // Prefer rear camera
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" },
          audio: false 
        });
      } catch (e) {
        console.warn("Could not get environment camera, trying default camera.", e);
        // Fallback to any available video camera
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
            setIsCameraInitializing(false);
        };
      } else {
        setIsCameraInitializing(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
          setError(t('cameraCapture.error.noAccess'));
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
          setError(t('cameraCapture.error.noDevice'));
      } else {
          setError(t('cameraCapture.error.generic'));
      }
      setIsCameraInitializing(false);
    }
  }, [stopCamera, t]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && !isCameraInitializing) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUsePhoto = useCallback(() => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const photoFile = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          onCapture(photoFile);
        }
      }, 'image/png');
    }
  }, [capturedImage, onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center p-4">
        <h2 id="camera-title" className="sr-only">{t('cameraCapture.title')}</h2>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors z-20" aria-label="Close camera">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="relative w-full aspect-[4/3] max-h-[80vh] bg-black rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
              <ErrorIcon className="w-16 h-16 text-red-500 mb-4" />
              <p className="font-semibold">{t('cameraCapture.error.title')}</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {isCameraInitializing && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4 animate-pulse">
                <CameraIcon className="w-16 h-16 mb-4"/>
                <p>Starting camera...</p>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${(capturedImage || isCameraInitializing || !!error) ? 'opacity-0' : 'opacity-100'}`} />
          {capturedImage && (
            <img src={capturedImage} alt="Captured preview" className="absolute inset-0 w-full h-full object-contain" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="flex items-center justify-center gap-8 mt-6">
          {!capturedImage ? (
            <button
              onClick={handleCapture}
              disabled={!!error || isCameraInitializing}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center ring-4 ring-white ring-opacity-50 hover:ring-opacity-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('cameraCapture.capture')}
            >
              <CameraIcon className="w-8 h-8 text-gray-800" />
            </button>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="flex flex-col items-center justify-center text-white gap-2 font-semibold hover:text-yellow-300 transition-colors"
                aria-label={t('cameraCapture.retake')}
              >
                <span className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full">
                  <RefreshIcon className="w-8 h-8" />
                </span>
                <span>{t('cameraCapture.retake')}</span>
              </button>
              <button
                onClick={handleUsePhoto}
                className="flex flex-col items-center justify-center text-white gap-2 font-semibold hover:text-green-300 transition-colors"
                aria-label={t('cameraCapture.usePhoto')}
              >
                <span className="flex items-center justify-center w-16 h-16 bg-green-500 rounded-full">
                  <CheckIcon className="w-8 h-8" />
                </span>
                <span>{t('cameraCapture.usePhoto')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
