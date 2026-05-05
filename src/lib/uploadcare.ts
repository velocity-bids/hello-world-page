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
