import { createServerFn } from "@tanstack/react-start";

const HIGGSFIELD_BASE = "https://api.higgsfield.ai";

export type HiggsfieldModel = {
  id: string;
  label: string;
  kind: "image" | "video" | "workflow";
  description: string;
  input: "prompt" | "image" | "video" | "product" | "soul";
};

export const HIGGSFIELD_MODELS: HiggsfieldModel[] = [
  { id: "higgsfield-ai/soul/standard", label: "Soul Standard", kind: "image", description: "Text → image, lifestyle & fashion", input: "prompt" },
  { id: "higgsfield-ai/soul/v2/standard", label: "Soul 2", kind: "image", description: "Text → image, advanced Soul generation", input: "prompt" },
  { id: "wan/v2.7/text-to-video", label: "Wan 2.7", kind: "video", description: "Text → video", input: "prompt" },
  { id: "alibaba/happy-horse/v1.1/text-to-video", label: "HappyHorse 1.1", kind: "video", description: "Text → video", input: "prompt" },
  { id: "wan/v2.6/reference-to-video", label: "Wan 2.6 Reference", kind: "video", description: "Reference video → video", input: "video" },
  { id: "kling-video/o3/image-reference", label: "Kling O3 Image Reference", kind: "video", description: "Image reference → video", input: "image" },
  { id: "kling-video/o3/video-reference", label: "Kling O3 Video Reference", kind: "video", description: "Video reference → video", input: "video" },
  { id: "alibaba/happy-horse/reference-to-video", label: "Happy Horse Reference", kind: "video", description: "Image references → video", input: "image" },
  { id: "higgsfield/cinema-studio/4.0", label: "Cinema Studio 4.0", kind: "video", description: "Cinéma génératif avec direction de scène automatique, jusqu'à 30 s", input: "prompt" },
  { id: "higgsfiled/genjutsu/motion-transfer/v1.0", label: "Genjutsu Motion Transfer", kind: "video", description: "Transfère le mouvement d'une vidéo vers des personnages, produits ou vêtements", input: "video" },
  { id: "higgsfiled/genjutsu/object-swap/v1.0", label: "Genjutsu Object Swap", kind: "video", description: "Remplace un objet ou personnage dans une vidéo avec des images de référence", input: "video" },
  { id: "marketing-studio/image", label: "Marketing Studio Image", kind: "image", description: "Images de campagne 1K–4K, génération ou édition", input: "image" },
  { id: "marketing-studio/product-shots", label: "Product Shots", kind: "workflow", description: "Transforme une photo produit en visuels publicitaires", input: "product" },
];

function credentials() {
  const value = process.env.HF_CREDENTIALS?.trim();
  if (!value) throw new Error("HF_CREDENTIALS n'est pas configurée sur le serveur. Ajoutez-la dans Vercel → Settings → Environment Variables.");
  if (!value.includes(":")) throw new Error("HF_CREDENTIALS doit avoir le format KEY_ID:KEY_SECRET.");
  return value;
}

function authHeaders() {
  return { Authorization: `Key ${credentials()}`, "Content-Type": "application/json" };
}

function parseResponse(text: string) {
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { return { raw: text } as Record<string, unknown>; }
}

async function higgsfieldFetch(path: string, init: RequestInit = {}) {
  return fetch(`${HIGGSFIELD_BASE}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
}

function modelExists(modelId: string) { return HIGGSFIELD_MODELS.some((model) => model.id === modelId); }

function inputForModel(modelId: string, prompt: string, imageUrl?: string, videoUrl?: string, imageUrls: string[] = [], presetId?: string) {
  const cleanPrompt = prompt.trim() || "A cinematic, high quality scene.";
  if (modelId === "higgsfield-ai/soul/standard" || modelId === "higgsfield-ai/soul/v2/standard") {
    return { prompt: cleanPrompt, batch_size: 1, resolution: "720p", aspect_ratio: "4:3", enhance_prompt: true };
  }
  if (modelId === "wan/v2.7/text-to-video") return { prompt: cleanPrompt, duration: 5, resolution: "720p", aspect_ratio: "16:9", prompt_extend: false };
  if (modelId === "alibaba/happy-horse/v1.1/text-to-video") return { prompt: cleanPrompt, duration: 5, resolution: "1080p", aspect_ratio: "16:9" };
  if (modelId === "wan/v2.6/reference-to-video") {
    if (!videoUrl) throw new Error("Wan 2.6 Reference nécessite une URL vidéo.");
    return { prompt: cleanPrompt, duration: 5, resolution: "720p", video_urls: [videoUrl], aspect_ratio: "16:9" };
  }
  if (modelId === "kling-video/o3/image-reference") {
    if (!imageUrl) throw new Error("Kling O3 Image Reference nécessite une URL image.");
    return { mode: "std", sound: "off", prompt: cleanPrompt, duration: 5, image_urls: [imageUrl], aspect_ratio: "16:9" };
  }
  if (modelId === "kling-video/o3/video-reference") {
    if (!videoUrl) throw new Error("Kling O3 Video Reference nécessite une URL vidéo.");
    return { mode: "pro", prompt: cleanPrompt, duration: 5, video_urls: [videoUrl], aspect_ratio: "16:9" };
  }
  if (modelId === "alibaba/happy-horse/reference-to-video") {
    if (!imageUrl) throw new Error("Happy Horse Reference nécessite une URL image.");
    return { prompt: cleanPrompt, duration: 5, image_urls: [imageUrl], resolution: "720p" };
  }
  if (modelId === "higgsfield/cinema-studio/4.0") {
    const refs = imageUrls.filter(Boolean).slice(0, 30);
    return { prompt: cleanPrompt, duration: 5, resolution: "720p", aspect_ratio: "16:9", ...(refs.length ? { image_urls: refs } : {}) };
  }
  if (modelId === "higgsfiled/genjutsu/motion-transfer/v1.0") {
    if (!videoUrl) throw new Error("Genjutsu Motion Transfer nécessite une vidéo source.");
    if (!imageUrls.length && imageUrl) imageUrls = [imageUrl];
    if (!imageUrls.length) throw new Error("Genjutsu Motion Transfer nécessite au moins une image de référence.");
    return { prompt: prompt.trim(), video_url: videoUrl, image_urls: imageUrls.slice(0, 8), resolution: "720p" };
  }
  if (modelId === "higgsfiled/genjutsu/object-swap/v1.0") {
    if (!videoUrl) throw new Error("Genjutsu Object Swap nécessite une vidéo source.");
    if (!imageUrls.length && imageUrl) imageUrls = [imageUrl];
    if (!imageUrls.length) throw new Error("Genjutsu Object Swap nécessite au moins une image de référence.");
    return { prompt: cleanPrompt, video_url: videoUrl, image_urls: imageUrls.slice(0, 8), resolution: "720p" };
  }
  if (modelId === "marketing-studio/image") {
    const body: Record<string, unknown> = { prompt: cleanPrompt, quality: "high", moderation: "auto", resolution: "2k", aspect_ratio: "auto", enhance_prompt: Boolean(presetId) };
    if (imageUrls.length) body.image_urls = imageUrls.slice(0, 16);
    if (presetId) body.preset_id = presetId;
    return body;
  }
  if (modelId === "marketing-studio/product-shots") {
    if (!imageUrl) throw new Error("Product Shots nécessite l'URL d'une photo produit.");
    if (!presetId) throw new Error("Product Shots nécessite un preset Marketing Studio. Sélectionnez-en un.");
    return { prompt: cleanPrompt, quality: "high", preset_id: presetId, moderation: "auto", resolution: "2k", aspect_ratio: "auto", enhance_prompt: true, image_urls: [imageUrl] };
  }
  return { prompt: cleanPrompt };
}

function findRequestId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["request_id", "requestId", "id"]) if (typeof record[key] === "string") return record[key] as string;
  return null;
}

function findResultUrl(value: unknown): string | null {
  const seen = new Set<unknown>();
  let found: string | null = null;
  const walk = (node: unknown) => {
    if (found || node === null || node === undefined || seen.has(node)) return;
    if (typeof node === "string") {
      if (/^https?:\/\//i.test(node) && /\.(png|jpg|jpeg|webp|mp4|mov|webm|gif)(\?|$)/i.test(node)) found = node;
      return;
    }
    if (typeof node !== "object") return;
    seen.add(node);
    for (const value of Object.values(node as Record<string, unknown>)) walk(value);
  };
  walk(value);
  return found;
}

export const getHiggsfieldConfig = createServerFn({ method: "GET" }).handler(async () => ({ configured: Boolean(process.env.HF_CREDENTIALS?.trim()), models: HIGGSFIELD_MODELS }));

export const getMarketingPresets = createServerFn({ method: "GET" }).handler(async () => {
  const response = await higgsfieldFetch("/marketing-studio/image/presets?size=50", { method: "GET" });
  const text = await response.text();
  const parsed = parseResponse(text);
  if (!response.ok) throw new Error(typeof parsed.error === "string" ? parsed.error : `Impossible de charger les presets Marketing Studio (${response.status}).`);
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return { items: items.map((item) => ({ id: String((item as Record<string, unknown>).id ?? ""), name: String((item as Record<string, unknown>).name ?? "Preset") })).filter((item) => item.id) };
});

export const runHiggsfield = createServerFn({ method: "POST" })
  .inputValidator((input: { modelId: string; prompt: string; imageUrl?: string; videoUrl?: string; imageUrls?: string[]; presetId?: string }) => input)
  .handler(async ({ data }) => {
    if (!modelExists(data.modelId)) throw new Error("Modèle Higgsfield non configuré dans IA-67.");
    const body = inputForModel(data.modelId, data.prompt, data.imageUrl, data.videoUrl, data.imageUrls ?? [], data.presetId);
    const response = await higgsfieldFetch(data.modelId, { method: "POST", body: JSON.stringify(body) });
    const text = await response.text();
    const parsed = parseResponse(text);
    if (!response.ok) {
      const message = typeof parsed.error === "string" ? parsed.error : `Higgsfield API error (${response.status}).`;
      throw new Error(message);
    }
    const requestId = findRequestId(parsed);
    if (!requestId) return { status: "completed" as const, url: findResultUrl(parsed), data: parsed };
    return { status: "processing" as const, requestId, modelId: data.modelId };
  });

export const pollHiggsfield = createServerFn({ method: "POST" })
  .inputValidator((input: { requestId: string }) => input)
  .handler(async ({ data }) => {
    const response = await higgsfieldFetch(`/requests/${encodeURIComponent(data.requestId)}`, { method: "GET" });
    const text = await response.text();
    const parsed = parseResponse(text);
    if (!response.ok) return { status: "error" as const, message: `Impossible de récupérer la génération Higgsfield (${response.status}).` };
    const state = String(parsed.status ?? parsed.state ?? "").toLowerCase();
    if (["queued", "pending", "processing", "in_progress", "in_queue", "not_ready"].includes(state)) return { status: "processing" as const };
    if (["failed", "error", "cancelled", "canceled"].includes(state)) return { status: "error" as const, message: String(parsed.error ?? "La génération Higgsfield a échoué.") };
    return { status: "completed" as const, url: findResultUrl(parsed), data: parsed };
  });

export const createSoulId = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; imageUrls: string[]; modelVersion?: "v1" | "v2" }) => input)
  .handler(async ({ data }) => {
    if (!data.name.trim()) throw new Error("Donnez un nom au Soul ID.");
    if (!data.imageUrls.length) throw new Error("Ajoutez au moins une URL image.");
    const response = await higgsfieldFetch("/v1/custom-references", { method: "POST", body: JSON.stringify({ name: data.name.trim(), model_version: data.modelVersion ?? "v2", input_images: data.imageUrls.slice(0, 100).map((image_url) => ({ type: "image_url", image_url })) }) });
    const text = await response.text();
    const parsed = parseResponse(text);
    if (!response.ok) throw new Error(typeof parsed.error === "string" ? parsed.error : `Création du Soul ID impossible (${response.status}).`);
    return parsed;
  });

export const listSoulIds = createServerFn({ method: "GET" }).handler(async () => {
  const response = await higgsfieldFetch("/v1/custom-references/list?page=1&page_size=20", { method: "GET" });
  const text = await response.text();
  const parsed = parseResponse(text);
  if (!response.ok) throw new Error(typeof parsed.error === "string" ? parsed.error : `Impossible de charger les Soul IDs (${response.status}).`);
  return parsed;
});
