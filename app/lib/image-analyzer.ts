export type DishCandidate = { name: string; confidence: number; reason: string };
export type FoodImageAnalysis = { candidates: DishCandidate[]; ingredients: string[]; message: string };

function getApiUrl() {
  const configured = import.meta.env?.VITE_SNAPCHEF_API_URL?.trim();
  return configured ? `${configured.replace(/\/$/, "")}/api/analyze-image` : "/api/analyze-image";
}

async function resizeImage(image: File): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This device could not prepare the photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("This device could not prepare the photo.")),
    "image/jpeg", 0.78,
  ));
}

export async function analyzeFoodImage(image: File): Promise<FoodImageAnalysis> {
  const body = new FormData();
  body.append("image", await resizeImage(image), "snapchef-photo.jpg");
  const response = await fetch(getApiUrl(), { method: "POST", body });
  const payload = await response.json().catch(() => null) as (FoodImageAnalysis & { error?: string }) | null;
  if (!response.ok) throw new Error(payload?.error || "The photo could not be analyzed. Please try again.");
  if (!payload || !Array.isArray(payload.candidates) || !Array.isArray(payload.ingredients)) throw new Error("The analyzer returned an unexpected result.");
  return payload;
}
