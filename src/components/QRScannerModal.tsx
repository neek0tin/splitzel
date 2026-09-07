"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import jsQR from "jsqr";

const CORNER_CLASSES = [
  "-top-1 -left-1 border-t-2 border-l-2 rounded-tl-2xl",
  "-top-1 -right-1 border-t-2 border-r-2 rounded-tr-2xl",
  "-bottom-1 -left-1 border-b-2 border-l-2 rounded-bl-2xl",
  "-bottom-1 -right-1 border-b-2 border-r-2 rounded-br-2xl",
] as const;

interface QRScannerModalProps {
  onClose: () => void;
  onScan: (data: string) => void;
}

/** Mount only while it should be visible — each mount starts fresh (fresh camera stream, no stale error). */
export function QRScannerModal({ onClose, onScan }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function tick() {
      if (scannedRef.current || cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code?.data) {
            scannedRef.current = true;
            onScan(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        if (!cancelled) setError("Camera access was denied or isn't available on this device.");
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="flex items-center justify-between px-5 pt-6">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
          <span className="text-sm font-semibold text-white/80 font-secondary">Scan a Friend&apos;s QR</span>
          <div className="h-9 w-9" />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-8">
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl bg-white/5">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            {CORNER_CLASSES.map((pos) => (
              <span key={pos} className={`pointer-events-none absolute h-10 w-10 border-skyblue ${pos}`} />
            ))}
          </div>
        </div>

        <div className="px-8 pb-12 text-center">
          {error ? (
            <p className="text-sm text-orange font-secondary">{error}</p>
          ) : (
            <p className="text-sm text-white/50 font-secondary">Point your camera at their QR code</p>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
