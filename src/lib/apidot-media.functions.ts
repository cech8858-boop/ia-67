import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  extractMediaUrl,
  extractResultAudioUrl,
  extractResultImageUrl,
  extractTaskId,
  extractTaskStatus,
  getTaskStatus,
  safeErrorMessage,
  submitGeneration,
} from "./apidot.server";

export type NanoBananaOutput =
  | { status: "processing"; generationId: string }
  | { status: "completed"; generationId: string; imageUrl: string }
  | { status: "error"; message: string };

export type ElevenLabsOutput =
  | { status: "processing"; generationId: string }
  | { status: "completed"; generationId: string; audioUrl: string }
  | { status: "error"; message: string };

export type ElevenLabsMusicOutput =
  | { status: "processing"; generationId: string }
  | { status: "completed"; generationId: string; audioUrl: string }
  | { status: "error"; message: string };

export type Tripo3dOutput =
  | { status: "processing"; generationId: string }
  | { status: "completed"; generationId: string; modelUrl: string }
  | { status: "error"; message: string };

export type MeshyOutput =
  | { status: "processing"; generationId: string }
  | { status: "completed"; generationId: string; modelUrl: string }
  | { status: "error"; message: string };

export const generateNanoBanana = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string; aspectRatio?: string }) => {
    const prompt = input?.prompt?.trim();
    if (!prompt) throw new Error("Please provide a prompt.");
    return {
      prompt,
      aspectRatio: input.aspectRatio ?? "1:1",
    };
  })
  .handler(async ({ data, context }): Promise<NanoBananaOutput> => {
    const model = "nano-banana";
    const payload = {
      prompt: data.prompt,
      aspect_ratio: data.aspectRatio,
      size: "1024x1024",
    };

    const result = await submitGeneration(model, payload);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Nano Banana generation failed." };
    }

    const imageUrl = extractResultImageUrl(result.body);
    if (imageUrl) {
      return { status: "completed", generationId: context.userId ?? "nano-banana", imageUrl };
    }

    const taskId = extractTaskId(result.body);
    if (!taskId) {
      return { status: "error", message: "Nano Banana did not return a task id." };
    }

    return { status: "processing", generationId: taskId };
  });

export const pollNanoBanana = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId?.trim();
    if (!id) throw new Error("Missing generation id.");
    return { generationId: id };
  })
  .handler(async ({ data }): Promise<NanoBananaOutput> => {
    const result = await getTaskStatus(data.generationId);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Nano Banana task failed." };
    }

    const imageUrl = extractResultImageUrl(result.body);
    if (imageUrl) {
      return { status: "completed", generationId: data.generationId, imageUrl };
    }

    return { status: "processing", generationId: data.generationId };
  });

export const generateElevenLabs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; voiceId?: string }) => {
    const text = input?.text?.trim();
    if (!text) throw new Error("Please provide text to convert to speech.");
    return {
      text,
      voiceId: input.voiceId ?? "default",
    };
  })
  .handler(async ({ data }): Promise<ElevenLabsOutput> => {
    const model = "elevenlabs";
    const payload = {
      text: data.text,
      voice_id: data.voiceId,
      model_id: "eleven_multilingual_v2",
    };

    const result = await submitGeneration(model, payload);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "ElevenLabs generation failed." };
    }

    const audioUrl = extractResultAudioUrl(result.body);
    if (audioUrl) {
      return { status: "completed", generationId: "elevenlabs", audioUrl };
    }

    const taskId = extractTaskId(result.body);
    if (!taskId) {
      return { status: "error", message: "ElevenLabs did not return a task id." };
    }

    return { status: "processing", generationId: taskId };
  });

export const pollElevenLabs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId?.trim();
    if (!id) throw new Error("Missing generation id.");
    return { generationId: id };
  })
  .handler(async ({ data }): Promise<ElevenLabsOutput> => {
    const result = await getTaskStatus(data.generationId);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "ElevenLabs task failed." };
    }

    const audioUrl = extractResultAudioUrl(result.body);
    if (audioUrl) {
      return { status: "completed", generationId: data.generationId, audioUrl };
    }

    return { status: "processing", generationId: data.generationId };
  });

export const generateElevenLabsMusic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string }) => {
    const prompt = input?.prompt?.trim();
    if (!prompt) throw new Error("Please provide a music prompt.");
    return { prompt };
  })
  .handler(async ({ data }): Promise<ElevenLabsMusicOutput> => {
    const result = await submitGeneration("elevenlabs-music", { prompt: data.prompt });
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "ElevenLabs Music generation failed." };
    }

    const audioUrl = extractResultAudioUrl(result.body);
    if (audioUrl) return { status: "completed", generationId: "elevenlabs-music", audioUrl };

    const taskId = extractTaskId(result.body);
    return taskId
      ? { status: "processing", generationId: taskId }
      : { status: "error", message: "ElevenLabs Music did not return a task id." };
  });

export const pollElevenLabsMusic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId?.trim();
    if (!id) throw new Error("Missing generation id.");
    return { generationId: id };
  })
  .handler(async ({ data }): Promise<ElevenLabsMusicOutput> => {
    const result = await getTaskStatus(data.generationId);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "ElevenLabs Music task failed." };
    }
    const audioUrl = extractResultAudioUrl(result.body);
    return audioUrl
      ? { status: "completed", generationId: data.generationId, audioUrl }
      : { status: "processing", generationId: data.generationId };
  });

export const generateTripo3d = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string }) => {
    const prompt = input?.prompt?.trim();
    if (!prompt) throw new Error("Please provide a 3D model prompt.");
    return { prompt };
  })
  .handler(async ({ data }): Promise<Tripo3dOutput> => {
    const result = await submitGeneration("tripo3d-h3.1-text-to-3d", { prompt: data.prompt });
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Tripo3D generation failed." };
    }

    const modelUrl = extractMediaUrl(result.body, ["glb", "gltf", "obj", "fbx", "model", "3d"]);
    if (modelUrl) return { status: "completed", generationId: "tripo3d-h3.1-text-to-3d", modelUrl };

    const taskId = extractTaskId(result.body);
    return taskId
      ? { status: "processing", generationId: taskId }
      : { status: "error", message: "Tripo3D did not return a task id." };
  });

export const pollTripo3d = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId?.trim();
    if (!id) throw new Error("Missing generation id.");
    return { generationId: id };
  })
  .handler(async ({ data }): Promise<Tripo3dOutput> => {
    const result = await getTaskStatus(data.generationId);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Tripo3D task failed." };
    }
    const modelUrl = extractMediaUrl(result.body, ["glb", "gltf", "obj", "fbx", "model", "3d"]);
    return modelUrl
      ? { status: "completed", generationId: data.generationId, modelUrl }
      : { status: "processing", generationId: data.generationId };
  });


export type Hunyuan3dOutput =
  | { status: "processing"; generationId: string }
  | { status: "completed"; generationId: string; modelUrl: string }
  | { status: "error"; message: string };

export const generateHunyuan3d = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    mode: "text" | "image";
    prompt?: string;
    imagePath?: string;
    model?: string;
    generateType?: string;
    enablePbr?: boolean;
    faceCount?: number;
  }) => {
    const mode = input?.mode === "image" ? "image" : "text";
    const prompt = input?.prompt?.trim() ?? "";
    const imagePath = input?.imagePath?.trim();
    if (mode === "text" && !prompt) throw new Error("Please provide a 3D prompt.");
    if (mode === "image" && !imagePath) throw new Error("Please provide an image.");
    return {
      mode, prompt, imagePath,
      model: input?.model ?? "hunyuan-3d/v3.1/pro",
      generateType: input?.generateType ?? "Normal",
      enablePbr: input?.enablePbr ?? true,
      faceCount: input?.faceCount ?? 800000,
    };
  })
  .handler(async ({ data }): Promise<Hunyuan3dOutput> => {
    let imageUrl: string | undefined;
    if (data.mode === "image" && data.imagePath) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const signed = await supabaseAdmin.storage
        .from("character-swap")
        .createSignedUrls([data.imagePath], 60 * 60);
      imageUrl = signed.data?.[0]?.signedUrl;
      if (signed.error || !imageUrl) return { status: "error", message: "Could not prepare the reference image." };
    }

    const model = data.mode === "image"
      ? "hunyuan-3d/v3.1/pro/image-to-3d"
      : "hunyuan-3d/v3.1/pro/text-to-3d";
    const input: Record<string, unknown> = {
      generate_type: data.generateType,
      enable_pbr: data.enablePbr,
      face_count: data.faceCount,
    };
    if (data.mode === "image") input.image_urls = [imageUrl];
    else input.prompt = data.prompt;

    const result = await submitGeneration(model, input);
    if (!result.ok) return { status: "error", message: safeErrorMessage(result.body) ?? "Hunyuan 3D generation failed." };
    const modelUrl = extractMediaUrl(result.body, ["glb", "gltf", "obj", "fbx", "model", "3d"]);
    if (modelUrl) return { status: "completed", generationId: model, modelUrl };
    const taskId = extractTaskId(result.body);
    return taskId
      ? { status: "processing", generationId: taskId }
      : { status: "error", message: "Hunyuan 3D did not return a task id." };
  });

export const pollHunyuan3d = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId?.trim();
    if (!id) throw new Error("Missing generation id.");
    return { generationId: id };
  })
  .handler(async ({ data }): Promise<Hunyuan3dOutput> => {
    const result = await getTaskStatus(data.generationId);
    if (!result.ok) return { status: "error", message: safeErrorMessage(result.body) ?? "Hunyuan 3D task failed." };
    const modelUrl = extractMediaUrl(result.body, ["glb", "gltf", "obj", "fbx", "model", "3d"]);
    if (modelUrl) return { status: "completed", generationId: data.generationId, modelUrl };
    const state = extractTaskStatus(result.body);
    if (state && ["failed", "error", "canceled", "cancelled"].includes(state)) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Hunyuan 3D task failed." };
    }
    return { status: "processing", generationId: data.generationId };
  });

export const generateMeshy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string }) => {
    const prompt = input?.prompt?.trim();
    if (!prompt) throw new Error("Please provide a 3D model prompt.");
    return { prompt };
  })
  .handler(async ({ data }): Promise<MeshyOutput> => {
    const result = await submitGeneration("meshy-6-text-to-3d", { prompt: data.prompt });
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Meshy generation failed." };
    }
    const modelUrl = extractMediaUrl(result.body, ["glb", "gltf", "obj", "fbx", "model", "3d"]);
    if (modelUrl) return { status: "completed", generationId: "meshy-6-text-to-3d", modelUrl };
    const taskId = extractTaskId(result.body);
    return taskId
      ? { status: "processing", generationId: taskId }
      : { status: "error", message: "Meshy did not return a task id." };
  });

export const pollMeshy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { generationId: string }) => {
    const id = input?.generationId?.trim();
    if (!id) throw new Error("Missing generation id.");
    return { generationId: id };
  })
  .handler(async ({ data }): Promise<MeshyOutput> => {
    const result = await getTaskStatus(data.generationId);
    if (!result.ok) {
      return { status: "error", message: safeErrorMessage(result.body) ?? "Meshy task failed." };
    }
    const modelUrl = extractMediaUrl(result.body, ["glb", "gltf", "obj", "fbx", "model", "3d"]);
    return modelUrl
      ? { status: "completed", generationId: data.generationId, modelUrl }
      : { status: "processing", generationId: data.generationId };
  });
