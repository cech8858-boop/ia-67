import { createFileRoute } from "@tanstack/react-router";
import { Box, Image as ImageIcon, Mic2, Sparkles } from "lucide-react";
import { useState } from "react";

import { VoicePage } from "./voice";
import { NanoBananaPage } from "./ai-image";
import { ThreeDGenerationPage } from "./3d-generation";

export const Route = createFileRoute("/ai-studio")({
  head: () => ({
    meta: [
      { title: "AI Creative Studio — Voice, Image & 3D" },
      { name: "description", content: "One creative workspace for ElevenLabs, Nano Banana and 3D generation." },
    ],
  }),
  component: AiStudioPage,
});

type Tool = "voice" | "image" | "3d";

const tools: { id: Tool; label: string; subtitle: string; icon: typeof Mic2 }[] = [
  { id: "voice", label: "ElevenLabs", subtitle: "Text to Speech", icon: Mic2 },
  { id: "image", label: "Nano Banana", subtitle: "Text & Image to Image", icon: ImageIcon },
  { id: "3d", label: "3D Studio", subtitle: "Text & Image to 3D", icon: Box },
];

function AiStudioPage() {
  const [active, setActive] = useState<Tool>("voice");

  return (
    <div className="min-h-screen bg-[#11100f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11100f]/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-8 items-center justify-center rounded-xl bg-white text-black"><Sparkles className="size-4" /></span>
                AI Creative Studio
              </div>
              <p className="mt-1 text-[11px] text-white/40">ElevenLabs · Nano Banana · 3D — réunis dans une seule page</p>
            </div>
            <div className="flex w-full gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-1 sm:w-auto">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const selected = active === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActive(tool.id)}
                    className={`flex min-w-[140px] items-center gap-2 rounded-xl px-3 py-2 text-left transition ${selected ? "bg-white text-black shadow-lg" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold">{tool.label}</span>
                      <span className={`block text-[9px] ${selected ? "text-black/50" : "text-white/30"}`}>{tool.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="[&>main]:!min-h-[calc(100vh-82px)]">
        {active === "voice" && <VoicePage />}
        {active === "image" && <NanoBananaPage />}
        {active === "3d" && <ThreeDGenerationPage />}
      </div>
    </div>
  );
}
