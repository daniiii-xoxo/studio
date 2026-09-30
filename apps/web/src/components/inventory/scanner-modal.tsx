"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@studio/ui';
import { decodeQrFromImageData } from '@/lib/qr-decoder';

interface ScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onScan: (payload: string) => void;
}

export function ScannerModal({ isOpen = true, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const tick = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = await decodeQrFromImageData(imageData);

        if (code) {
          stopCamera();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
          }
          onScan(code);
          return;
        }
      }
    }

    if (streamRef.current) {
      animFrameIdRef.current = requestAnimationFrame(tick);
    }
  }, [onScan, stopCamera]);

  const startCamera = async () => {
    setError('');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          // Ignore AbortError when video is interrupted by reload/unmount
          if (playErr.name !== 'AbortError') {
            throw playErr;
          }
        }
        animFrameIdRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied or unavailable. Please grant camera permission.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan QR / Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at an item's QR code or barcode to scan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-medium">Starting camera...</span>
              </div>
            )}

            {/* Target Reticle */}
            <div className="absolute inset-[15%] border-2 border-dashed border-white/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
