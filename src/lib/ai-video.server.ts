// Server-only helpers for the APIDot AI Video Generator.
// Never imported from client code.

export const GENERIC_ERROR = "Video generation failed. Please try again.";

export type CreateInput = {
  family: string;
  mode: "text_to_video" | "image_to_video";
  duration: number;
  resolution: string | null;
  aspectRatio: string;
  prompt: string;
  imagePath: string | null;
};

/** Builds the documented APIDot `input` payload for a given model id. */
export function buildApiDotInput(
  modelId: string,
  data: CreateInput,
  imageUrl: string | null,
): Record<string, unknown> | { error: string } {
  if (modelId.includes("kling-video/v3/pro/text-to-video")) {
    return {
      prompt: data.prompt,
      duration: String(data.duration),
      aspect_ratio: data.aspectRatio,
      generate_audio: true,
    };
  }

  if (modelId.includes("kling-video/v3/pro/image-to-video")) {
    if (!imageUrl) return { error: "Please upload an image." };
    return {
      prompt: data.prompt,
      duration: String(data.duration),
      start_image_url: imageUrl,
      generate_audio: true,
    };
  }

  if (modelId === "fal-ai/veo3.1") {
    return {
      prompt: data.prompt,
      duration: `${data.duration}s`,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "720p",
      generate_audio: true,
    };
  }

  if (modelId === "fal-ai/veo3.1/image-to-video") {
    if (!imageUrl) return { error: "Please upload an image." };
    return {
      prompt: data.prompt,
      duration: `${data.duration}s`,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "720p",
      generate_audio: true,
      image_url: imageUrl,
    };
  }

  if (modelId === "fal-ai/sora-2/text-to-video") {
    return {
      prompt: data.prompt,
      duration: data.duration,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "720p",
    };
  }

  if (modelId === "fal-ai/sora-2/image-to-video" || modelId === "fal-ai/sora-2/image-to-video/pro") {
    if (!imageUrl) return { error: "Please upload an image." };
    return {
      prompt: data.prompt,
      duration: data.duration,
      image_url: imageUrl,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "720p",
    };
  }

  if (modelId === "fal-ai/sora-2/text-to-video/pro") {
    return {
      prompt: data.prompt,
      duration: data.duration,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "720p",
    };
  }

  if (modelId === "fal-ai/wan/v2.7/text-to-video") {
    return {
      prompt: data.prompt,
      duration: data.duration,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "1080p",
      enable_prompt_expansion: true,
      enable_safety_checker: true,
    };
  }

  if (modelId === "fal-ai/wan/v2.7/image-to-video") {
    if (!imageUrl) return { error: "Please upload an image." };
    return {
      prompt: data.prompt,
      image_url: imageUrl,
      duration: data.duration,
      aspect_ratio: data.aspectRatio,
      resolution: data.resolution ?? "1080p",
      enable_prompt_expansion: true,
      enable_safety_checker: true,
    };
  }

  return { error: "This model is not available." };
}

export function isTerminalFailure(state: string | null): boolean {
  return Boolean(state && ["failed", "error", "canceled", "cancelled"].includes(state));
}

export function isSuccess(state: string | null): boolean {
  return Boolean(state && ["completed", "succeeded", "success", "done"].includes(state));
}
