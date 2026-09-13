const MAX_DIMENSION = 1568; // Anthropic's recommended max image dimension for vision requests
const QR_MAX_DIMENSION = 1000; // a QR only needs enough pixels to stay scannable

function resizeToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxDimension: number = MAX_DIMENSION
): HTMLCanvasElement {
  let targetWidth = width;
  let targetHeight = height;
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = maxDimension / Math.max(targetWidth, targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/** Decodes a user-selected image file into a resized canvas. */
function fileToCanvas(file: File, maxDimension: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the selected image."));
      img.onload = () => resolve(resizeToCanvas(img, img.naturalWidth, img.naturalHeight, maxDimension));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Captures the current frame of a playing <video> element as a resized JPEG data URL. */
export function captureVideoFrame(video: HTMLVideoElement, quality = 0.85): string {
  const canvas = resizeToCanvas(video, video.videoWidth, video.videoHeight);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Reads a user-selected image file, resized to a JPEG data URL. */
export async function fileToJpegDataUrl(file: File, quality = 0.85): Promise<string> {
  const canvas = await fileToCanvas(file, MAX_DIMENSION);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Reads a user-selected QR screenshot into a JPEG Blob ready to upload.
 *
 * Higher quality and a tighter dimension cap than the receipt path: a receipt
 * only has to survive being read by a model, whereas a QR has to survive being
 * re-photographed off someone else's screen by a phone camera.
 */
export async function fileToJpegBlob(file: File, quality = 0.92): Promise<Blob> {
  const canvas = await fileToCanvas(file, QR_MAX_DIMENSION);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process that image."))),
      "image/jpeg",
      quality
    );
  });
}
