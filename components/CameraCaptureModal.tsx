import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCapture: (imageData: { base64: string; file: File }) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onImageCapture }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setError('Camera not supported by your browser.');
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };
  
  const blobToFile = (theBlob: Blob, fileName: string): File => {
    return new File([theBlob], fileName, { lastModified: new Date().getTime(), type: theBlob.type })
  };

  const handleConfirm = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = blobToFile(blob, `capture-${Date.now()}.jpg`);
          const base64 = capturedImage.split(',')[1];
          onImageCapture({ base64, file });
          onClose();
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 md:p-4">
      <div className="bg-[#11111b] w-full h-full md:h-auto md:w-full md:max-w-2xl md:rounded-lg md:shadow-xl p-4 md:p-6 md:border border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4 shrink-0">Take a Photo</h2>
        <div className="relative w-full bg-black rounded-md overflow-hidden flex-1">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">{error}</div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="mt-6 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition">
            Cancel
          </button>
          <div className="flex gap-4">
            {capturedImage ? (
              <>
                <button onClick={handleRetake} className="px-4 py-2 rounded-lg text-white bg-yellow-600 hover:bg-yellow-500 transition">
                  Retake
                </button>
                <button onClick={handleConfirm} className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-500 transition">
                  Confirm
                </button>
              </>
            ) : (
              <button onClick={handleCapture} disabled={!stream} className="px-6 py-3 rounded-full text-white bg-gradient-to-r from-purple-600 to-blue-500 disabled:opacity-50 transition glow-border">
                Capture
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
