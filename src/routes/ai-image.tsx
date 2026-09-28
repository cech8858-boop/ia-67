import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  ImagePlus,
  Images,
  LoaderCircle,
  Menu,
  Plus,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

import { generateNanoBanana, pollAiMedia } from "@/lib/ai-media.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai-image")({
  head: () => ({
    meta: [
      { title: "Nano Banana — Image Generation" },
      { name: "description", content: "Generate images with Nano Banana from text or image references." },
    ],
  }),
  component: NanoBananaPage,
});

type Mode = "text" | "image";
type Ratio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const trending = [
  "Cinematic product photo",
  "Dreamy portrait",
  "Futuristic city at night",
];

const effects = [
  "Neon glow",
  "Miniature world",
  "Editorial fashion",
  "Anime frame",
];

export function NanoBananaPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"nano-banana-2" | "nano-banana-2-lite" | "nano-banana-pro">("nano-banana-2");
  const [resolution, setResolution] = useState<"0.5K" | "1K" | "2K" | "4K">("1K");
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useServerFn(generateNanoBanana);
  const poll = useServerFn(pollAiMedia);

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null);

      let imagePath: string | undefined;
      if (mode === "image") {
        if (!imageFile) throw new Error("Ajoute une image de référence.");
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        imagePath = `uploads/nano-${stamp}-${imageFile.name.replace(/[^\w.-]/g, "_")}`;
        const upload = await supabase.storage.from("character-swap").upload(imagePath, imageFile, {
          contentType: imageFile.type,
          upsert: true,
        });
        if (upload.error) throw new Error("Impossible d'envoyer l'image. Vérifie le stockage Supabase.");
      }

      return run({
        data: {
          prompt: prompt.trim() || "Create a polished creative image based on the uploaded reference.",
          model,
          resolution,
          size: ratio,
          imagePath,
        },
      });
    },
  });

  const taskId = mutation.data?.status === "queued" ? mutation.data.taskId : null;
  const polling = useQuery({
    queryKey: ["nano-banana", taskId],
    queryFn: () => poll({ data: { taskId: taskId! } }),
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "error" ? false : 2500;
    },
  });

  const imageUrl =
    mutation.data?.status === "completed"
      ? mutation.data.url
      : polling.data?.status === "completed"
        ? polling.data.url
        : null;

  const busy = mutation.isPending || Boolean(taskId && !imageUrl);
  const activeError = error ?? (mutation.data?.status === "error" ? mutation.data.message : null) ?? (polling.data?.status === "error" ? polling.data.message : null);

  const chooseImage = (file?: File) => {
    setError(null);
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Formats acceptés : JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("L'image doit faire moins de 10 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submit = () => {
    if (!prompt.trim() && mode === "text") {
      setError("Décris l'image que tu veux créer.");
      return;
    }
    if (mode === "image" && !imageFile) {
      setError("Ajoute une image de référence.");
      return;
    }
    mutation.mutate();
  };

  return (
    <main className="min-h-screen bg-[#17110f] text-white">
      <div className="mx-auto min-h-screen max-w-[1180px] overflow-hidden px-4 pb-14 pt-4 sm:px-7">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => history.back()} className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#241a17] text-white/80 hover:bg-white/10">
              <ArrowLeft className="size-4" />
            </button>
            <div className="grid size-10 place-items-center rounded-full border border-[#ff7d2d]/50 bg-[#251813] text-[#ff8c3d] shadow-[0_0_30px_rgba(255,115,42,.15)]">
              <WandSparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">Nano Banana</h1>
              <p className="text-xs text-white/45">Image Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#ff8c3d]/25 bg-[#ff8c3d]/10 px-3 py-1.5 text-[11px] font-medium text-[#ffb277] sm:inline-flex">No payment gate</span>
            <button type="button" className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#241a17] text-white/70">
              <Menu className="size-4" />
            </button>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#201714] shadow-[0_30px_90px_rgba(0,0,0,.35)]">
            <div className="relative min-h-[460px] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(255,119,51,.14),transparent_34%),linear-gradient(145deg,#2a1b17,#120e0d)] p-4 sm:p-6">
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-white/55 backdrop-blur sm:left-6 sm:top-6">
                {imageUrl ? "Generated image" : "Creative workspace"}
              </div>
              {imageUrl ? (
                <div className="flex min-h-[430px] items-center justify-center pt-8">
                  <img src={imageUrl} alt="Image générée par Nano Banana" className="max-h-[520px] w-full rounded-[22px] object-contain shadow-2xl" />
                </div>
              ) : imagePreview ? (
                <div className="flex min-h-[430px] items-center justify-center pt-8">
                  <img src={imagePreview} alt="Référence" className="max-h-[480px] rounded-[22px] object-contain opacity-90 shadow-2xl" />
                </div>
              ) : (
                <div className="flex min-h-[430px] flex-col items-center justify-center px-6 pt-8 text-center">
                  <div className="grid size-24 place-items-center rounded-[30px] border border-[#ff8c3d]/20 bg-[#ff8c3d]/8 shadow-[0_0_80px_rgba(255,117,48,.1)]">
                    <Images className="size-10 text-[#ff8c3d]/80" />
                  </div>
                  <h2 className="mt-6 text-xl font-semibold">Create your next image</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/40">Use a prompt, an image reference, or combine both with Nano Banana.</p>
                </div>
              )}
              {busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#201714]/90 px-5 py-4 text-sm shadow-2xl">
                    <LoaderCircle className="size-5 animate-spin text-[#ff8c3d]" />
                    Génération en cours…
                  </div>
                </div>
              )}
              {imageUrl && (
                <a href={imageUrl} target="_blank" rel="noreferrer" className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black shadow-lg">
                  <Download className="size-4" /> Télécharger
                </a>
              )}
            </div>

            <div className="border-t border-white/10 bg-[#181210] p-4 sm:p-5">
              <div className="flex rounded-2xl border border-white/10 bg-[#241a17] p-1">
                <button type="button" onClick={() => setMode("text")} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${mode === "text" ? "bg-[#ff7130] text-white shadow-[0_8px_24px_rgba(255,113,48,.25)]" : "text-white/45"}`}>
                  Text to image
                </button>
                <button type="button" onClick={() => setMode("image")} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${mode === "image" ? "bg-[#ff7130] text-white shadow-[0_8px_24px_rgba(255,113,48,.25)]" : "text-white/45"}`}>
                  Image to image
                </button>
              </div>

              <div className="mt-3 rounded-[22px] border border-white/10 bg-[#241a17] p-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={mode === "text" ? "Describe what you want to create…" : "Describe how the reference image should be transformed…"}
                  rows={4}
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-relaxed text-white outline-none placeholder:text-white/25"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => inputRef.current?.click()} className="grid size-9 place-items-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" title="Ajouter une image">
                      <Plus className="size-4" />
                    </button>
                    {imageFile && (
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[10px] text-white/65">
                        <ImagePlus className="size-3.5" /> {imageFile.name.slice(0, 20)} <X className="size-3" />
                      </button>
                    )}
                    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => chooseImage(e.target.files?.[0])} />
                  </div>
                  <span className="text-[10px] text-white/25">No payment UI · provider/API usage still applies</span>
                </div>
              </div>

              {activeError && <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{activeError}</p>}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-white/10 bg-[#201714] p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">AI Model</p>
                  <p className="mt-1 text-[10px] text-white/35">Nano Banana image generation</p>
                </div>
                <Sparkles className="size-4 text-[#ff8c3d]" />
              </div>
              <div className="relative mt-3">
                <select value={model} onChange={(e) => setModel(e.target.value as typeof model)} className="w-full appearance-none rounded-xl border border-white/10 bg-[#17110f] px-3 py-3 pr-9 text-xs outline-none">
                  <option value="nano-banana-2">Nano Banana 2</option>
                  <option value="nano-banana-2-lite">Nano Banana 2 Lite</option>
                  <option value="nano-banana-pro">Nano Banana Pro</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-white/40" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {(["1:1", "16:9", "9:16", "4:3"] as Ratio[]).map((item) => (
                  <button key={item} type="button" onClick={() => setRatio(item)} className={`rounded-xl border px-3 py-2.5 text-[11px] font-medium ${ratio === item ? "border-[#ff8c3d] bg-[#ff8c3d]/10 text-[#ffb277]" : "border-white/10 bg-[#17110f] text-white/45"}`}>
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] text-white/50">Resolution</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["0.5K", "1K", "2K", "4K"] as const).map((item) => (
                    <button key={item} type="button" disabled={model === "nano-banana-2-lite" && item !== "1K"} onClick={() => setResolution(item)} className={`rounded-lg px-2 py-2 text-[10px] ${resolution === item ? "bg-white text-black" : "bg-white/5 text-white/45 disabled:opacity-20"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" disabled={busy} onClick={submit} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5f2d] to-[#ff9a42] px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(255,102,45,.2)] disabled:cursor-not-allowed disabled:opacity-50">
                <Sparkles className="size-4" />
                {busy ? "Generating…" : "Generate image"}
              </button>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-[#201714] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold">Trending</h2><span className="text-[10px] text-white/25">Try a prompt</span></div>
              <div className="space-y-2">
                {trending.map((item) => <button key={item} type="button" onClick={() => { setMode("text"); setPrompt(item); }} className="flex w-full items-center justify-between rounded-xl bg-[#17110f] px-3 py-2.5 text-left text-[11px] text-white/55 hover:bg-white/5 hover:text-white"><span>{item}</span><Sparkles className="size-3 text-[#ff8c3d]" /></button>)}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-[#201714] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold">New effects</h2><button type="button" className="text-[10px] text-[#ff9b62]">See all</button></div>
              <div className="grid grid-cols-2 gap-2">
                {effects.map((item) => <button key={item} type="button" onClick={() => setPrompt((current) => `${current}${current ? ", " : ""}${item}`)} className="rounded-xl border border-white/8 bg-[#17110f] px-2 py-3 text-[10px] text-white/55 hover:border-[#ff8c3d]/30 hover:text-white">{item}</button>)}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
