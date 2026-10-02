import { createServer } from "node:http";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { fal } from "@fal-ai/client";
import * as z from "zod";
import { WORKSPACE_TOOLS, type WorkspaceTool } from "./workspace-tools";

const port = Number(process.env.PORT || 8787);
const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

function getFalKey() {
  const key = process.env.FAL_KEY?.trim();
  if (!key) throw new Error("FAL_KEY is not configured on the MCP server.");
  return key;
}

function buildInput(item: WorkspaceTool, input: {
  prompt?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  aspect_ratio?: string;
}) {
  const prompt = input.prompt?.trim() || "Create a high quality result.";
  switch (item.id) {
    case "image-generator": return { prompt, aspect_ratio: input.aspect_ratio || "1:1" };
    case "image-upscaler": return { image_url: input.image_url, scale: 2 };
    case "background-remover": return { image_url: input.image_url };
    case "image-editor": return { image_url: input.image_url, background_prompt: prompt };
    case "image-to-image": return { prompt, image_url: input.image_url };
    case "inpainting": return { prompt, image_url: input.image_url };
    case "product-photography": return { image_url: input.image_url, background_prompt: prompt };
    case "text-to-video": return { prompt, duration: "5" };
    case "image-to-video": return { prompt, image_url: input.image_url };
    case "video-upscaler": return { video_url: input.video_url, scale: 2 };
    case "video-to-video": return { prompt, image_url: input.image_url };
    case "ai-video-editor": return { video_urls: input.video_url ? [input.video_url] : [], prompt, model: "google/gemini-2.5-flash" };
    case "lip-sync":
    case "ai-avatar": return { image_url: input.image_url, audio_url: input.audio_url };
    case "video-background-remover": return { video_url: input.video_url, output_container: "webm_vp9" };
    case "speech-to-text": return { audio_url: input.audio_url };
    case "voice-changer": return { audio_url: input.audio_url, prompt, model: "google/gemini-2.5-flash" };
    case "voice-cloning": return { audio_url: input.audio_url, voice_name: "AI Studio Voice" };
    case "ai-music": return { prompt, duration: 15 };
    case "sound-effects": return { prompt, duration: 8 };
    case "audio-enhancer": return { audio_url: input.audio_url, prompt, model: "google/gemini-2.5-flash" };
    case "text-to-3d":
    case "3d-character":
    case "3d-upscaler":
    case "ai-rigging": return { prompt };
    case "image-to-3d": return { image_url: input.image_url, prompt };
    case "3d-texture": return { image_url: input.image_url, prompt };
    case "texture-generator": return { prompt };
    case "pdf-chat": return { prompt, model: "google/gemini-2.5-flash", pdf_urls: input.video_url ? [input.video_url] : [] };
    case "ai-chat":
    case "code-assistant":
    case "ai-research":
    case "ai-writer":
    case "ai-translator":
    case "ai-summarizer": return { prompt, model: "google/gemini-2.5-flash", enable_web_search: item.id === "ai-research" };
    default: return { prompt };
  }
}

function findUrls(node: unknown) {
  const urls: string[] = [];
  const seen = new Set<unknown>();
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value) && !urls.includes(value)) urls.push(value);
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    for (const child of Object.values(value as Record<string, unknown>)) walk(child);
  };
  walk(node);
  return urls;
}

async function runWorkspaceTool(item: WorkspaceTool, input: {
  prompt?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  aspect_ratio?: string;
}) {
  const missing: string[] = [];
  if (["image-upscaler", "background-remover", "image-editor", "image-to-image", "inpainting", "product-photography", "image-to-3d", "3d-texture", "lip-sync", "ai-avatar"].includes(item.id) && !input.image_url) missing.push("image_url");
  if (["speech-to-text", "voice-changer", "voice-cloning", "audio-enhancer", "lip-sync", "ai-avatar"].includes(item.id) && !input.audio_url) missing.push("audio_url");
  if (["video-upscaler", "video-to-video", "ai-video-editor", "video-background-remover"].includes(item.id) && !input.video_url) missing.push("video_url");
  if (missing.length) throw new Error(`${item.label} requires: ${missing.join(", ")}.`);

  fal.config({ credentials: getFalKey() });
  const result = await fal.subscribe(item.model, {
    input: buildInput(item, input),
  });
  const urls = findUrls(result.data);
  const summary = urls.length
    ? `${item.label} completed. Result URL(s):\n${urls.join("\n")}`
    : `${item.label} completed. Structured result:\n${JSON.stringify(result.data, null, 2)}`;
  return { data: result.data, urls, summary };
}

const handler = createMcpHandler(() => {
  const server = new McpServer(
    { name: "IA-67 Creative AI", version: "2.0.0" },
    {
      instructions:
        "IA-67 exposes all 35 AI Workspace tools. Choose the most specific tool for the user's requested workflow. Ask for missing media URLs when required. Never expose API keys. Use the result URLs returned by generation tools.",
    },
  );

  server.registerTool(
    "list_models",
    {
      title: "List all IA-67 Workspace models",
      description: "List all 35 tools currently available in the IA-67 AI Workspace, with category, model route and capability.",
      inputSchema: z.object({ category: z.string().optional() }),
      annotations: { readOnlyHint: true },
    },
    async ({ category }) => {
      const models = WORKSPACE_TOOLS.filter((m) => !category || m.category.toLowerCase() === category.toLowerCase())
        .map(({ id, name, label, category: group, kind, model, description }) => ({ id, tool: name, name: label, category: group, kind, model, description }));
      return { content: [{ type: "text", text: JSON.stringify({ count: models.length, models }, null, 2) }] };
    },
  );

  server.registerTool(
    "enhance_prompt",
    {
      title: "Enhance a prompt",
      description: "Turn a short creative idea into a structured prompt for image, video, audio or 3D generation.",
      inputSchema: z.object({
        prompt: z.string().min(1),
        medium: z.enum(["image", "video", "audio", "3d"]).default("image"),
        style: z.string().optional(),
      }),
    },
    async ({ prompt, medium, style }) => {
      const enhanced = `${prompt}. Medium: ${medium}. ${style ? `Style: ${style}. ` : ""}Professional composition, coherent lighting, detailed subject, cinematic quality, clean visual hierarchy, consistent details.`;
      return { content: [{ type: "text", text: enhanced }] };
    },
  );

  // Backward-compatible convenience alias kept for the original ChatGPT connector.
  server.registerTool(
    "generate_image",
    {
      title: "Generate an image (IA-67)",
      description: "Backward-compatible alias for the IA-67 AI Image Generator.",
      inputSchema: z.object({
        prompt: z.string().min(1),
        aspect_ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
      }),
    },
    async ({ prompt, aspect_ratio }) => {
      const item = WORKSPACE_TOOLS.find((tool) => tool.id === "image-generator")!;
      const result = await runWorkspaceTool(item, { prompt, aspect_ratio });
      const content: any[] = [{ type: "text", text: result.summary }];
      for (const url of result.urls.slice(0, 8)) content.push({ type: "resource_link", uri: url, name: item.label, mimeType: "image/*" });
      return { content };
    },
  );

  for (const item of WORKSPACE_TOOLS) {
    server.registerTool(
      item.name,
      {
        title: item.label,
        description: `${item.description}. IA-67 Workspace category: ${item.category}. Back-end model route: ${item.model}.`,
        inputSchema: z.object({
          prompt: z.string().optional(),
          image_url: z.string().url().optional(),
          audio_url: z.string().url().optional(),
          video_url: z.string().url().optional(),
          aspect_ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
        }),
      },
      async (input) => {
        const result = await runWorkspaceTool(item, input);
        const content: any[] = [{ type: "text", text: result.summary }];
        for (const url of result.urls.slice(0, 8)) content.push({ type: "resource_link", uri: url, name: item.label, mimeType: "application/octet-stream" });
        return { content };
      },
    );
  }

  server.registerTool(
    "open_workspace",
    {
      title: "Open IA-67 Workspace",
      description: "Open the IA-67 workspace for interactive editing and generation.",
      inputSchema: z.object({ section: z.string().optional() }),
      annotations: { readOnlyHint: true },
    },
    async ({ section }) => ({
      content: [{ type: "text", text: `${publicAppUrl}/ai-workspace${section ? `?section=${encodeURIComponent(section)}` : ""}` }],
    }),
  );

  return server;
});

const nodeHandler = toNodeHandler(handler);

createServer((req, res) => {
  if (req.url?.startsWith("/health")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "ia-67-mcp", workspaceTools: WORKSPACE_TOOLS.length }));
    return;
  }
  if (req.url?.startsWith("/mcp")) return nodeHandler(req, res);
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", mcp: "/mcp" }));
}).listen(port, () => {
  console.log(`IA-67 MCP server listening on http://localhost:${port}/mcp (${WORKSPACE_TOOLS.length} Workspace tools)`);
});
