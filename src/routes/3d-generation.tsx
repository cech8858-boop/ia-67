import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Box,
  ChevronDown,
  Download,
  Grid2X2,
  ImagePlus,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Minus,
  MoreHorizontal,
  Palette,
  Plus,
  Rotate3D,
  Search,
  Sparkles,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateHunyuan3d, pollHunyuan3d } from "@/lib/apidot-media.functions";

export const Route = createFileRoute("/3d-generation")({
  head: () => ({
    meta: [
      { title: "3D Generation — Text & Image to 3D" },
      { name: "description", content: "Generate high-detail 3D assets from text or a single image." },
    ],
  }),
  component: ThreeDGenerationPage,
});

type Mode = "text" | "image";
type Lighting = "studio" | "soft" | "natural";
type Topology = "standard" | "high";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function ThreeDGenerationPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [model, setModel] = useState("Hunyuan 3D 3.1 Pro");
  const [assetType, setAssetType] = useState<"object" | "character">("character");
  const [variations, setVariations] = useState(4);
  const [topology, setTopology] = useState<Topology>("high");
  const [style, setStyle] = useState("Realistic");
  const [lighting, setLighting] = useState<Lighting>("studio");
  const [creativity, setCreativity] = useState(70);
  const [texture, setTexture] = useState("4K");
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useServerFn(generateHunyuan3d);
  const poll = useServerFn(pollHunyuan3d);

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setModelUrl(null);
      setTaskId(null);

      let imagePath: string | undefined;
      if (mode === "image") {
        if (!imageFile) throw new Error("Ajoute une image de référence.");
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        imagePath = `uploads/3d-${stamp}-${imageFile.name.replace(/[^\w.-]/g, "_")}`;
        const upload = await supabase.storage.from("character-swap").upload(imagePath, imageFile, {
          contentType: imageFile.type,
          upsert: true,
        });
        if (upload.error) throw new Error("Impossible d'envoyer l'image. Vérifie le stockage Supabase.");
      }

      return run({
        data: {
          mode,
          prompt,
          imagePath,
          model: "hunyuan-3d/v3.1/pro",
          generateType: "Normal",
          enablePbr: true,
          faceCount: topology === "high" ? 800000 : 300000,
        },
      });
    },
    onSuccess: (result) => {
      if (result.status === "completed") setModelUrl(result.modelUrl);
      if (result.status === "processing") setTaskId(result.generationId);
      if (result.status === "error") setError(result.message);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "La génération 3D a échoué."),
  });

  const polling = useQuery({
    queryKey: ["hunyuan-3d", taskId],
    queryFn: () => poll({ data: { generationId: taskId! } }),
    enabled: Boolean(taskId) && !modelUrl,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "error" ? false : 4000;
    },
  });

  useEffect(() => {
    if (polling.data?.status === "completed") setModelUrl(polling.data.modelUrl);
    if (polling.data?.status === "error") setError(polling.data.message);
  }, [polling.data]);

  const isGenerating = mutation.isPending || Boolean(taskId && !modelUrl && polling.data?.status !== "error");
  const canGenerate = !isGenerating && (mode === "text" ? prompt.trim().length > 0 : Boolean(imageFile));

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

  return (
    <main className="min-h-screen bg-[#0b0d10] text-white">
      <div className="mx-auto min-h-screen max-w-[1180px] px-3 pb-28 pt-3 sm:px-6 sm:pt-5">
        <header className="flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => history.back()} className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-[#171b21] hover:bg-white/10">
              <ArrowLeft className="size-4" />
            </button>
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black">
              <Box className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">3D Generation</h1>
              <p className="text-xs text-white/45">Text to 3D · Image to 3D</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button type="button" className="rounded-xl border border-white/10 bg-[#15181d] px-3 py-2 text-xs text-white/70">Orthographic</button>
            <button type="button" className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/50">Perspective</button>
            <button type="button" className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#15181d]"><MoreHorizontal className="size-4" /></button>
          </div>
        </header>

        <div className="mt-3 grid gap-3 lg:grid-cols-[72px_minmax(0,1fr)_360px]">
          <aside className="hidden rounded-[26px] border border-white/10 bg-[#12151a] p-2 lg:flex lg:flex-col lg:items-center lg:gap-2">
            {[Search, Plus, Sparkles, LockKeyhole, Grid2X2, Rotate3D, ImagePlus, MoreHorizontal].map((Icon, index) => (
              <button key={index} type="button" className={`grid size-12 place-items-center rounded-2xl ${index === 2 ? "bg-[#f5df00] text-black" : "bg-[#191d23] text-white/55 hover:text-white"}`}>
                <Icon className="size-5" />
              </button>
            ))}
          </aside>

          <section className="relative min-h-[470px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_55%_38%,#34363b_0%,#181a1e_30%,#0d0f12_70%)] shadow-2xl">
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-xl bg-black/35 px-3 py-2 text-xs text-white/60 backdrop-blur">
              <span className="size-2 rounded-full bg-[#f5df00]" /> Live 3D workspace
            </div>
            <div className="absolute right-5 top-5 grid size-11 place-items-center rounded-xl border border-white/10 bg-black/30 text-white/60 backdrop-blur"><SlidersHorizontal className="size-4" /></div>

            {modelUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-5 grid size-24 place-items-center rounded-3xl border border-[#f5df00]/40 bg-[#f5df00]/10 text-[#f5df00] shadow-[0_0_80px_rgba(245,223,0,0.12)]">
                  <Box className="size-10" />
                </div>
                <h2 className="text-xl font-semibold">3D model ready</h2>
                <p className="mt-2 max-w-md text-sm text-white/45">Ton asset est prêt. Télécharge le fichier 3D pour l'ouvrir dans Blender, Unity, Unreal ou un viewer WebGL.</p>
                <a href={modelUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f5df00] px-5 py-3 text-sm font-semibold text-black hover:brightness-105">
                  <Download className="size-4" /> Download 3D model
                </a>
              </div>
            ) : imagePreview ? (
              <div className="absolute inset-10 flex items-center justify-center">
                <img src={imagePreview} alt="3D reference" className="max-h-full max-w-full rounded-3xl object-contain opacity-90" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <div className="relative mb-8 grid size-44 place-items-center rounded-[44px] border border-white/10 bg-black/20 shadow-[inset_0_0_60px_rgba(255,255,255,0.03)]">
                  <div className="absolute inset-7 rounded-full border border-white/10" />
                  <Box className="size-20 text-white/20" />
                </div>
                <h2 className="text-xl font-semibold">Create your 3D asset</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">Décris un objet ou importe une image. Le moteur génère une géométrie 3D détaillée à partir de ton entrée.</p>
              </div>
            )}

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-black/45 p-2 backdrop-blur">
              <button type="button" className="grid size-10 place-items-center rounded-xl bg-white/10 text-white/70"><Grid2X2 className="size-4" /></button>
              <button type="button" className="grid size-10 place-items-center rounded-xl bg-[#f5df00] text-black"><Box className="size-4" /></button>
              <button type="button" className="grid size-10 place-items-center rounded-xl bg-white/10 text-white/70"><SlidersHorizontal className="size-4" /></button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#12151a] p-4 shadow-2xl sm:p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-[#f5df00]" /> AI Model</div>
            <button type="button" className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#1a1e24] px-4 py-3 text-left">
              <span><span className="block text-sm font-medium">{model}</span><span className="mt-0.5 block text-[11px] text-white/40">High-fidelity 3D generation</span></span>
              <ChevronDown className="size-4 text-white/40" />
            </button>

            <div className="mt-5 flex items-center gap-2 text-sm font-medium"><Box className="size-4 text-white/60" /> Mode</div>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-[#1a1e24] p-1">
              <button type="button" onClick={() => setAssetType("object")} className={`rounded-xl px-3 py-2 text-xs ${assetType === "object" ? "bg-white/10 text-white" : "text-white/40"}`}>Object</button>
              <button type="button" onClick={() => setAssetType("character")} className={`rounded-xl px-3 py-2 text-xs ${assetType === "character" ? "bg-white/10 text-white" : "text-white/40"}`}>Character</button>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm font-medium"><Layers3 className="size-4 text-white/60" /> Total variations <span className="flex items-center gap-3 rounded-full bg-[#1a1e24] px-2 py-1 text-xs"><button type="button" onClick={() => setVariations(Math.max(1, variations - 1))}><Minus className="size-3" /></button>{variations}<button type="button" onClick={() => setVariations(Math.min(8, variations + 1))}><Plus className="size-3" /></button></span></div>

            <div className="mt-5 text-sm font-medium"><span className="inline-flex items-center gap-2"><Grid2X2 className="size-4 text-white/60" /> Topology</span></div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["standard", "high"] as const).map((value) => <button key={value} type="button" onClick={() => setTopology(value)} className={`rounded-2xl border px-3 py-3 text-xs ${topology === value ? "border-[#f5df00] bg-[#f5df00]/5 text-white" : "border-white/10 bg-[#191d23] text-white/45"}`}>{value === "standard" ? "Standard" : "High detail"}</button>)}
            </div>

            <div className="mt-5 text-sm font-medium"><span className="inline-flex items-center gap-2"><Palette className="size-4 text-white/60" /> Style</span></div>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-2 w-full appearance-none rounded-2xl border border-white/10 bg-[#1a1e24] px-4 py-3 text-xs text-white outline-none"><option>Realistic</option><option>Stylized</option><option>Low Poly</option><option>Anime</option></select>

            <div className="mt-5 text-sm font-medium"><span className="inline-flex items-center gap-2"><Lightbulb className="size-4 text-white/60" /> Lighting Mood</span></div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["studio", "soft", "natural"] as const).map((value) => <button key={value} type="button" onClick={() => setLighting(value)} className={`rounded-2xl border px-2 py-3 text-[11px] ${lighting === value ? "border-[#f5df00] bg-[#f5df00]/5 text-white" : "border-white/10 bg-[#191d23] text-white/45"}`}>{value === "studio" ? "Studio" : value === "soft" ? "Soft" : "Natural"}</button>)}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm font-medium"><span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4 text-white/60" /> Creativity level</span><span className="text-xs text-white/50">{creativity}%</span></div>
            <input type="range" min="0" max="100" value={creativity} onChange={(e) => setCreativity(Number(e.target.value))} className="mt-3 w-full accent-[#f5df00]" />
            <div className="flex justify-between text-[10px] text-white/30"><span>Conservative</span><span>Experimental</span></div>

            <div className="mt-4 flex items-center justify-between text-sm font-medium"><span className="inline-flex items-center gap-2"><ImagePlus className="size-4 text-white/60" /> Texture</span><select value={texture} onChange={(e) => setTexture(e.target.value)} className="rounded-xl bg-[#1a1e24] px-3 py-2 text-xs text-white outline-none"><option>2K</option><option>4K</option><option>8K</option></select></div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0d1014] p-2">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#171a20] p-1">
                <button type="button" onClick={() => setMode("text")} className={`rounded-lg px-3 py-2 text-xs font-medium ${mode === "text" ? "bg-[#f5df00] text-black" : "text-white/45"}`}>Text to 3D</button>
                <button type="button" onClick={() => setMode("image")} className={`rounded-lg px-3 py-2 text-xs font-medium ${mode === "image" ? "bg-[#f5df00] text-black" : "text-white/45"}`}>Image to 3D</button>
              </div>

              {mode === "text" ? (
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder={`Décris ton ${assetType === "character" ? "personnage" : "objet"}…`} className="mt-2 w-full resize-none rounded-xl bg-transparent px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/25" />
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 flex min-h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-white/45 hover:bg-white/[0.03]">
                  {imagePreview ? <><img src={imagePreview} alt="Reference" className="mb-2 h-16 w-16 rounded-lg object-cover" /><span>Changer l'image</span></> : <><Upload className="mb-2 size-5" /><span>Upload 1 image de référence</span><span className="mt-1 text-[10px] text-white/25">JPG, PNG ou WEBP · 10 MB max</span></>}
                </button>
              )}
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => chooseImage(e.target.files?.[0])} />
            </div>

            {error && <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">{error}</div>}

            <button type="button" disabled={!canGenerate} onClick={() => mutation.mutate()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f5df00] px-4 py-3.5 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(245,223,0,0.12)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40">
              <Sparkles className="size-4" /> {isGenerating ? "Generating…" : "Generate"}
            </button>
            <p className="mt-2 text-center text-[10px] text-white/25">Text and image to 3D · {variations} variation{variations > 1 ? "s" : ""}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
