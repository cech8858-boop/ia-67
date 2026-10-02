import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AudioLines,
  Box,
  ChevronRight,
  Image as ImageIcon,
  Search,
  Sparkles,
  Video,
  WandSparkles,
} from "lucide-react";

export const Route = createFileRoute("/blank")({
  component: ToolsPage,
});

type Tool = {
  title: string;
  description: string;
  category: "Image" | "Vidéo" | "Audio" | "3D" | "Assistant";
};

const tools: Tool[] = [
  { title: "Image Generator", description: "Génère des images à partir de texte", category: "Image" },
  { title: "Nano Banana", description: "Édition d’images ultra intelligente", category: "Image" },
  { title: "Flux", description: "Génération d’images haute qualité", category: "Image" },
  { title: "Image-to-Image", description: "Transforme une image avec un nouveau style", category: "Image" },
  { title: "Inpainting", description: "Corrige et complète les parties manquantes", category: "Image" },
  { title: "Upscaler", description: "Améliore la résolution de vos images", category: "Image" },
  { title: "Background Remover", description: "Supprime l’arrière-plan en un clic", category: "Image" },
  { title: "Product Photography", description: "Photos produits professionnelles", category: "Image" },
  { title: "Text to Video", description: "Génère des vidéos à partir de texte", category: "Vidéo" },
  { title: "Image to Video", description: "Anime une image en vidéo", category: "Vidéo" },
  { title: "Video Upscaler", description: "Améliore la qualité de vos vidéos", category: "Vidéo" },
  { title: "Video-to-Video", description: "Transforme une vidéo avec un nouveau style", category: "Vidéo" },
  { title: "AI Video Editor", description: "Édite vos vidéos avec l’IA", category: "Vidéo" },
  { title: "Lip Sync", description: "Synchronise les lèvres avec l’audio", category: "Vidéo" },
  { title: "AI Avatar", description: "Crée un avatar réaliste à partir d’une photo", category: "Vidéo" },
  { title: "Background Remover (Video)", description: "Supprime l’arrière-plan des vidéos", category: "Vidéo" },
  { title: "Speech to Text", description: "Convertit la parole en texte", category: "Audio" },
  { title: "Voice Changer", description: "Modifie la voix avec l’IA", category: "Audio" },
  { title: "Voice Cloning", description: "Clone une voix depuis un audio", category: "Audio" },
  { title: "Text to Speech", description: "Génère une voix à partir de texte", category: "Audio" },
  { title: "Music Generator", description: "Crée de la musique avec l’IA", category: "Audio" },
  { title: "Sound Effects", description: "Génère des effets sonores réalistes", category: "Audio" },
  { title: "Audio Enhancer", description: "Améliore la qualité de vos audios", category: "Audio" },
  { title: "Text to 3D", description: "Crée des modèles 3D à partir de texte", category: "3D" },
  { title: "Image to 3D", description: "Transforme une image en modèle 3D", category: "3D" },
  { title: "Texture Generator", description: "Génère des textures réalistes", category: "3D" },
  { title: "Character Creator", description: "Crée des personnages 3D réalistes", category: "3D" },
  { title: "Rigging", description: "Ajoute un squelette aux modèles 3D", category: "3D" },
  { title: "3D Upscaler", description: "Améliore la qualité des modèles 3D", category: "3D" },
  { title: "3D Animation", description: "Anime tes modèles 3D", category: "3D" },
  { title: "AI Chat", description: "Assistant conversationnel intelligent", category: "Assistant" },
  { title: "Code Assistant", description: "Écrit et corrige du code", category: "Assistant" },
  { title: "Research Assistant", description: "Effectue des recherches approfondies", category: "Assistant" },
  { title: "PDF Chat", description: "Analyse et discute tes documents PDF", category: "Assistant" },
  { title: "Writer Assistant", description: "Rédige des textes professionnels", category: "Assistant" },
  { title: "Translator", description: "Traduit dans plusieurs langues", category: "Assistant" },
];

const categoryIcon = {
  Image: ImageIcon,
  Vidéo: Video,
  Audio: AudioLines,
  "3D": Box,
  Assistant: Sparkles,
};

function ToolsPage() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#080b12] px-3 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1450px]">
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0d121c]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <WandSparkles className="h-5 w-5 text-cyan-300" />
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">IA-67 Explorer</h1>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200">36 outils</span>
              </div>
              <p className="mt-1 text-sm text-white/50">Tous les modèles IA dans une seule page.</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/higgsfield-studio" className="shrink-0 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-300/15">Higgsfield Studio</a>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/45">
                <Search className="h-4 w-4" />
                <span>Rechercher un modèle…</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["Tous", "Image", "Vidéo", "Audio", "3D", "Assistant"] as const).map((label, index) => {
              const Icon = index === 0 ? Sparkles : categoryIcon[label as keyof typeof categoryIcon];
              return (
                <span
                  key={label}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${index === 0 ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-white/55"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              );
            })}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6" aria-label="36 fonctionnalités IA">
          {tools.map((tool, index) => {
            const Icon = categoryIcon[tool.category];
            const row = Math.floor(index / 6);
            const col = index % 6;
            const x = col * 20;
            const y = row * 20;
            return (
              <Link
                key={tool.title}
                to="/ai-workspace"
                search={{ tool: tool.title }}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-white/15 bg-[#111722] shadow-[0_12px_30px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 scale-105 bg-cover bg-no-repeat opacity-85 transition duration-500 group-hover:scale-110 group-hover:opacity-100"
                  style={{
                    backgroundImage: "url('/workspace-36-models.png')",
                    backgroundPosition: `${x}% ${y}%`,
                    backgroundSize: "600% 600%",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/35 to-transparent" />
                <div className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/50 text-xs font-semibold backdrop-blur-md">
                  {index + 1}
                </div>
                <div className="absolute right-2.5 top-2.5 rounded-full border border-white/15 bg-black/40 p-1.5 backdrop-blur-md">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/75">{tool.category}</span>
                  </div>
                  <h2 className="line-clamp-2 text-sm font-semibold leading-tight sm:text-[15px]">{tool.title}</h2>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/60">{tool.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
                    <span>Ouvrir l’outil</span>
                    <span className="rounded-full border border-white/15 bg-white/5 p-1 transition group-hover:border-cyan-300/30 group-hover:text-cyan-200">
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
