/**
 * Appends Uploadcare CDN image transformation operations to a URL.
 * Safe to call on non-Uploadcare URLs — returns them unchanged.
 *
 * Usage:
 *   ucareUrl(url, "scale_crop/1200x900/center")
 *   ucareUrl(url, "resize/600x")
 */
export function ucareUrl(url: string, ops: string): string {
  if (!url || !url.includes("ucarecd.net")) return url;
  // Strip trailing slash, append ops, re-add trailing slash
  return `${url.replace(/\/$/, "")}/-/${ops}/`;
}

/** Pre-defined transforms for consistent sizing across the app */
export const ucareTransforms = {
  /** 4:3 card thumbnail — used in listing grids */
  cardThumb: (url: string) => ucareUrl(url, "scale_crop/800x600/center"),
  /** Resize to max width only, preserving natural aspect ratio — no cropping */
  galleryMain: (url: string) => ucareUrl(url, "resize/1200x"),
  /** Small thumbnail strip */
  galleryThumb: (url: string) => ucareUrl(url, "scale_crop/240x180/center"),
};

/**
 * Upload a single File to UploadCare using their direct upload API.
 * Returns the CDN URL on success.
 */
const UPLOADCARE_PUBKEY = "f6a66e6c2fd1eee14caf";

export async function uploadFileToUploadCare(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("UPLOADCARE_PUB_KEY", UPLOADCARE_PUBKEY);
  formData.append("UPLOADCARE_STORE", "1");
  formData.append("file", file);

  const res = await fetch("https://upload.uploadcare.com/base/", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`UploadCare upload failed: ${res.statusText}`);

  const json = await res.json();
  return `https://ucarecdn.com/${json.file}/`;
}

/**
 * Upload multiple files concurrently. Returns CDN URLs in the same order.
 */
export async function uploadFilesToUploadCare(files: File[]): Promise<string[]> {
  return Promise.all(files.map(uploadFileToUploadCare));
}
