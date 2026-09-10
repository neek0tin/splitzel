import { createClient } from "@/lib/supabase/client";
import { fileToJpegBlob } from "@/lib/imageCapture";

const BUCKET = "gcash-qr";

/** Max size we'll accept before resizing, purely to reject absurd inputs early. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Lazy singleton: creating the client at module scope would throw during the
// production build, the same way src/lib/supabase/queries.ts currently does.
let cached: ReturnType<typeof createClient> | null = null;
function db() {
  return (cached ??= createClient());
}

/**
 * Public URL for a stored QR, or null when the profile hasn't uploaded one.
 *
 * The bucket is public by design (see 0008_gcash_qr.sql) -- the unguessable
 * filename is what keeps the image from being enumerable, not the ACL.
 */
export function gcashQrUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Resizes and uploads a QR screenshot, returning the storage path to persist on
 * the profile. Each upload gets a fresh random filename rather than overwriting
 * a stable one, so a replaced QR can never be served from a stale CDN cache.
 */
export async function uploadGcashQr(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file isn't an image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("That image is too large. Try a screenshot instead of a photo.");
  }

  const blob = await fileToJpegBlob(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await db().storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return path;
}

/** Deletes a stored QR. Best-effort: a failure here shouldn't block the profile update. */
export async function removeGcashQr(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await db().storage.from(BUCKET).remove([path]);
}
