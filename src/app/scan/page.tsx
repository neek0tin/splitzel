"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { captureVideoFrame, fileToJpegDataUrl } from "@/lib/imageCapture";
import { scanReceiptImage } from "@/lib/scanReceipt";
import { computeReceiptTotals, DEFAULT_SERVICE_CHARGE_RATE, DEFAULT_VAT_RATE } from "@/lib/splitEngine";
import { genId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PretzelIcon } from "@/components/ui/Logo";

const CORNER_CLASSES = [
  "-top-1 -left-1 border-t-2 border-l-2 rounded-tl-2xl",
  "-top-1 -right-1 border-t-2 border-r-2 rounded-tr-2xl",
  "-bottom-1 -left-1 border-b-2 border-l-2 rounded-bl-2xl",
  "-bottom-1 -right-1 border-b-2 border-r-2 rounded-br-2xl",
] as const;

export default function CapturePage() {
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const startDraftFromReceipt = useAppStore((s) => s.startDraftFromReceipt);
  const clearDraft = useAppStore((s) => s.clearDraft);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isPremium = user?.isPremium ?? false;

  useEffect(() => {
    // Scanning is a Premium feature — skip ever requesting camera access for a
    // free account rather than showing a live camera it isn't allowed to use.
    if (!isPremium) return;

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setCameraError("Camera access was denied or isn't available. You can still upload a photo.");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isPremium]);

  const handleScanResult = async (imageDataUrl: string) => {
    setProcessing(true);
    setError(null);
    try {
      const receipt = await scanReceiptImage(imageDataUrl);
      startDraftFromReceipt(receipt);
      router.push("/scan/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't process the receipt. Please try again.");
      setProcessing(false);
      setCapturedPreview(null);
    }
  };

  const handleCapture = () => {
    if (processing || !videoRef.current || videoRef.current.readyState < videoRef.current.HAVE_CURRENT_DATA) return;
    const dataUrl = captureVideoFrame(videoRef.current);
    setCapturedPreview(dataUrl);
    handleScanResult(dataUrl);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const dataUrl = await fileToJpegDataUrl(file);
      setCapturedPreview(dataUrl);
      await handleScanResult(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image. Please try again.");
      setProcessing(false);
    }
  };

  const handleEnterManually = () => {
    const totals = computeReceiptTotals([], DEFAULT_VAT_RATE, DEFAULT_SERVICE_CHARGE_RATE);
    startDraftFromReceipt({
      id: genId("receipt"),
      establishment: "",
      date: new Date().toISOString(),
      items: [],
      vatRate: DEFAULT_VAT_RATE,
      serviceChargeRate: DEFAULT_SERVICE_CHARGE_RATE,
      ...totals,
    });
    router.push("/scan/verify");
  };

  if (!initialized) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-navy-dark">
        <PretzelIcon size={40} className="animate-pulse" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="flex flex-1 flex-col bg-navy-dark text-white">
        <div className="flex items-center justify-between px-5 pt-6">
          <button
            onClick={() => {
              clearDraft();
              router.push("/home");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-1.5 rounded-2xl bg-skyblue/20 px-3 py-1.5">
            <Crown size={14} className="text-skyblue" />
            <span className="text-xs font-bold tracking-wide text-skyblue font-secondary">PREMIUM</span>
          </div>
          <div className="w-9" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-skyblue/15 text-skyblue">
            <Crown size={26} />
          </span>
          <div>
            <p className="font-primary text-lg font-bold tracking-brand text-white">
              Receipt scanning is a Premium feature
            </p>
            <p className="mt-1 text-sm text-white/60 font-secondary">
              Upgrade to snap a photo and let AI read the items for you — or enter this bill manually for free.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 pb-8 pt-2">
          <Button fullWidth size="lg" onClick={() => router.push("/premium")}>
            Go Premium
          </Button>
          <button
            onClick={handleEnterManually}
            className="text-center text-sm font-semibold text-white/60 font-secondary"
          >
            Enter Manually Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-navy-dark text-white">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={() => {
            clearDraft();
            router.push("/home");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 active:scale-95 transition-transform"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-1.5 rounded-2xl bg-skyblue/20 px-3 py-1.5">
          <Sparkles size={14} className="text-skyblue" />
          <span className="text-xs font-bold tracking-wide text-skyblue font-secondary">AI-POWERED</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="relative flex flex-1 items-center justify-center px-8">
        <div className="relative aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl bg-black/40">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

          {/* A frozen snapshot of the exact frame that was captured, covering the live
              feed entirely — without this, the video underneath keeps moving with the
              phone during processing, making it look like nothing was captured. */}
          {capturedPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}

          {CORNER_CLASSES.map((pos) => (
            <span key={pos} className={`pointer-events-none absolute h-10 w-10 border-skyblue ${pos}`} />
          ))}

          {processing && (
            <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.1s_ease-in-out_infinite] bg-skyblue/80" />
          )}

          {(cameraError || processing || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/80 p-6">
              <p className="text-center text-sm text-white/70 font-secondary">
                {processing ? "Reading receipt..." : error || cameraError}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-10 pb-12 pt-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 active:scale-95 transition-transform disabled:opacity-50"
        >
          <ImageIcon size={20} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

        <button
          onClick={handleCapture}
          disabled={processing || !!cameraError}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 active:scale-95 transition-transform disabled:opacity-30"
        >
          <span className={`h-16 w-16 rounded-full bg-white ${processing ? "animate-pulse" : ""}`} />
        </button>

        <div className="h-12 w-12" />
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(280px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
