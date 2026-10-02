# IA-67 ChatGPT / MCP connector

This folder is the MCP server that connects IA-67 to ChatGPT and Codex.

## Workspace coverage

The server now exposes **all 35 tools currently listed in IA-67 AI Workspace**, plus the shared `list_models`, `enhance_prompt` and `open_workspace` tools.

### Image — 7
- AI Image Generator
- Image Upscaler
- AI Background Remover
- Image Editor IA
- Image to Image
- AI Inpainting
- AI Product Photography

### Video — 8
- Text → Video
- Image → Video
- Video Upscaler
- Video → Video
- AI Video Editor
- Lip Sync
- AI Avatar
- Video Background Remover

### Audio — 6
- Speech → Text
- Voice Changer
- Voice Cloning
- AI Music Generator
- AI Sound Effects
- Audio Enhancer

### 3D — 7
- Text → 3D
- Image → 3D
- 3D → Texture
- AI Texture Generator
- AI 3D Character
- 3D Model Upscaler
- AI Rigging

### Assistants — 7
- AI Chat
- Code Assistant
- AI Research
- PDF Chat
- AI Writer
- AI Translator
- AI Summarizer

Each Workspace capability is registered as its own MCP tool so ChatGPT can select the specific workflow instead of receiving only one generic image tool.

## Environment

```bash
FAL_KEY=your_fal_key
PUBLIC_APP_URL=https://your-ia-67-domain.example
PORT=8787
```

## Run

```bash
npm install
npm run start
```

The MCP endpoint is:

```text
https://YOUR-MCP-DOMAIN/mcp
```

Use Node 20+ and a stable public HTTPS endpoint for production. Keep `FAL_KEY` only on the server; never put it in browser code or GitHub.

The MCP server uses the FAL routes already declared by the IA-67 Workspace. Media workflows require public `https://` URLs for their input files when called from ChatGPT.

For ChatGPT testing, connect the public HTTPS `/mcp` endpoint from Developer Mode / Plugins. Refresh the plugin connection after changing the tool list or metadata.
