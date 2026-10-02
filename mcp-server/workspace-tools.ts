export type WorkspaceTool = {
  id: string;
  name: string;
  label: string;
  category: "Image" | "Video" | "Audio" | "3D" | "Assistants";
  kind: "image" | "video" | "audio" | "3d" | "chat" | "vision";
  model: string;
  description: string;
};

/** The 35 tools currently exposed by IA-67 AI Workspace. */
export const WORKSPACE_TOOLS: WorkspaceTool[] = [
  { id: "image-generator", name: "ai_image_generator", label: "AI Image Generator", category: "Image", kind: "image", model: "fal-ai/playground-v25", description: "Text → image" },
  { id: "image-upscaler", name: "image_upscaler", label: "Image Upscaler", category: "Image", kind: "image", model: "fal-ai/creative-upscaler", description: "Upscale images" },
  { id: "background-remover", name: "background_remover", label: "AI Background Remover", category: "Image", kind: "image", model: "fal-ai/bria/background/remove", description: "Remove the background" },
  { id: "image-editor", name: "image_editor", label: "Image Editor IA", category: "Image", kind: "image", model: "fal-ai/image-editing/background-change", description: "Edit with an instruction" },
  { id: "image-to-image", name: "image_to_image", label: "Image to Image", category: "Image", kind: "image", model: "fal-ai/playground-v25/image-to-image", description: "Transform a reference" },
  { id: "inpainting", name: "image_inpainting", label: "AI Inpainting", category: "Image", kind: "image", model: "fal-ai/flux-lora-fill", description: "Replace a selected area" },
  { id: "product-photography", name: "product_photography", label: "AI Product Photography", category: "Image", kind: "image", model: "fal-ai/image-editing/background-change", description: "Turn products into ad visuals" },

  { id: "text-to-video", name: "text_to_video", label: "Text → Video", category: "Video", kind: "video", model: "fal-ai/wan/v2.2-a14b/text-to-video", description: "Generate video from text" },
  { id: "image-to-video", name: "image_to_video", label: "Image → Video", category: "Video", kind: "video", model: "fal-ai/wan/v2.2-a14b/image-to-video", description: "Animate an image" },
  { id: "video-upscaler", name: "video_upscaler", label: "Video Upscaler", category: "Video", kind: "video", model: "fal-ai/video-upscaler", description: "Upscale video" },
  { id: "video-to-video", name: "video_to_video", label: "Video → Video", category: "Video", kind: "video", model: "fal-ai/ltx-2.3-22b/distilled/image-to-video", description: "Restyle or transform video" },
  { id: "ai-video-editor", name: "ai_video_editor", label: "AI Video Editor", category: "Video", kind: "video", model: "openrouter/router/video", description: "Analyze and create an edit plan" },
  { id: "lip-sync", name: "lip_sync", label: "Lip Sync", category: "Video", kind: "video", model: "fal-ai/sync-lipsync/v3/image-to-video", description: "Synchronize a face to audio" },
  { id: "ai-avatar", name: "ai_avatar", label: "AI Avatar", category: "Video", kind: "video", model: "fal-ai/sync-lipsync/v3/image-to-video", description: "Talking avatar from image + voice" },
  { id: "video-background-remover", name: "video_background_remover", label: "Video Background Remover", category: "Video", kind: "video", model: "bria/video/background-removal", description: "Remove video background" },

  { id: "speech-to-text", name: "speech_to_text", label: "Speech → Text", category: "Audio", kind: "audio", model: "fal-ai/speech-to-text", description: "Transcribe audio" },
  { id: "voice-changer", name: "voice_changer", label: "Voice Changer", category: "Audio", kind: "audio", model: "openrouter/router/audio", description: "Transform or analyze voice" },
  { id: "voice-cloning", name: "voice_cloning", label: "Voice Cloning", category: "Audio", kind: "audio", model: "fal-ai/elevenlabs/voice-cloning", description: "Clone a reference voice" },
  { id: "ai-music", name: "ai_music_generator", label: "AI Music Generator", category: "Audio", kind: "audio", model: "fal-ai/stable-audio", description: "Generate music" },
  { id: "sound-effects", name: "sound_effects", label: "AI Sound Effects", category: "Audio", kind: "audio", model: "fal-ai/stable-audio", description: "Generate sound effects" },
  { id: "audio-enhancer", name: "audio_enhancer", label: "Audio Enhancer", category: "Audio", kind: "audio", model: "openrouter/router/audio", description: "Clean and analyze audio" },

  { id: "text-to-3d", name: "text_to_3d", label: "Text → 3D", category: "3D", kind: "3d", model: "fal-ai/hunyuan3d-v3/text-to-3d", description: "Generate a 3D model" },
  { id: "image-to-3d", name: "image_to_3d", label: "Image → 3D", category: "3D", kind: "3d", model: "fal-ai/hunyuan3d-v3/image-to-3d", description: "Create a 3D model from an image" },
  { id: "3d-texture", name: "three_d_texture", label: "3D → Texture", category: "3D", kind: "3d", model: "fal-ai/hunyuan3d-v3/texture-generation", description: "Generate 3D textures" },
  { id: "texture-generator", name: "texture_generator", label: "AI Texture Generator", category: "3D", kind: "3d", model: "fal-ai/playground-v25", description: "Create texture references" },
  { id: "3d-character", name: "three_d_character", label: "AI 3D Character", category: "3D", kind: "3d", model: "tripo3d/h3.1/text-to-3d", description: "Create a character mesh" },
  { id: "3d-upscaler", name: "three_d_upscaler", label: "3D Model Upscaler", category: "3D", kind: "3d", model: "tripo3d/h3.1/text-to-3d", description: "Regenerate a higher-detail mesh" },
  { id: "ai-rigging", name: "ai_rigging", label: "AI Rigging", category: "3D", kind: "3d", model: "tripo3d/h3.1/text-to-3d", description: "Prepare a character workflow" },

  { id: "ai-chat", name: "ai_chat", label: "AI Chat", category: "Assistants", kind: "chat", model: "openrouter/router", description: "General AI assistant" },
  { id: "code-assistant", name: "code_assistant", label: "Code Assistant", category: "Assistants", kind: "chat", model: "openrouter/router", description: "Generate and debug code" },
  { id: "ai-research", name: "ai_research", label: "AI Research", category: "Assistants", kind: "chat", model: "openrouter/router", description: "Research and summarize" },
  { id: "pdf-chat", name: "pdf_chat", label: "PDF Chat", category: "Assistants", kind: "vision", model: "openrouter/router/vision", description: "Chat with documents" },
  { id: "ai-writer", name: "ai_writer", label: "AI Writer", category: "Assistants", kind: "chat", model: "openrouter/router", description: "Write content" },
  { id: "ai-translator", name: "ai_translator", label: "AI Translator", category: "Assistants", kind: "chat", model: "openrouter/router", description: "Translate text" },
  { id: "ai-summarizer", name: "ai_summarizer", label: "AI Summarizer", category: "Assistants", kind: "chat", model: "openrouter/router", description: "Summarize content" },
];
