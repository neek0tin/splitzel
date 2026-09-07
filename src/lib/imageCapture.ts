const MAX_DIMENSION = 1568; // Anthropic's recommended max image dimension for vision requests

function resizeToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  let targetWidth = width;
  let targetHeight = height;
  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(targetWidth, targetHeight);
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

/** Captures the current frame of a playing <video> element as a resized JPEG data URL. */
export function captureVideoFrame(video: HTMLVideoElement, quality = 0.85): string {
  const canvas = resizeToCanvas(video, video.videoWidth, video.videoHeight);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Reads a user-selected image file, resized to a JPEG data URL. */
export function fileToJpegDataUrl(file: File, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the selected image."));
      img.onload = () => {
        const canvas = resizeToCanvas(img, img.naturalWidth, img.naturalHeight);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
