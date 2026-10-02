import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, AudioLines, Bell, Box, Check, Compass, Download, FolderPlus, GalleryHorizontal, Heart, History, Image as ImageIcon, LoaderCircle, MessageSquare, Play, Save, Search, Sparkles, Star, SlidersHorizontal, Upload, UserCircle, Video, WandSparkles, X, Zap } from "lucide-react";
import { FAL_TOOLS, pollFalTool, runFalTool } from "@/lib/fal.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai-workspace")({
  head: () => ({ meta: [{ title: "AI Workspace — Creative AI" }, { name: "description", content: "AI creation workspace powered by FAL." }] }),
  component: AiWorkspacePage,
});

const categories = ["All", "Image", "Video", "Audio", "3D", "Assistants"] as const;
type Category = typeof categories[number];
type Creation = { id: string; toolId: string; tool: string; category: string; prompt: string; url?: string | null; createdAt: number; favorite?: boolean; public?: boolean; folder?: string };
type Template = { id: string; name: string; prompt: string; toolId: string };

const iconFor = (category: string) => category === "Image" ? ImageIcon : category === "Video" ? Video : category === "Audio" ? AudioLines : category === "3D" ? Box : category === "Assistants" ? MessageSquare : Sparkles;
const read = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

function AiWorkspacePage() {
  const [category, setCategory] = useState<Category>("All");
  const [active, setActive] = useState(FAL_TOOLS[0].id);
  const [prompt, setPrompt] = useState("");
  const [fileUrl, setFileUrl] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [results, setResults] = useState<{ url?: string | null; id: string }[]>([]);
  const [view, setView] = useState<"create" | "explore" | "history" | "creations" | "favorites" | "gallery" | "templates">("create");
  const [history, setHistory] = useState<Creation[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [selectorNote, setSelectorNote] = useState("");
  const [beforeUrl, setBeforeUrl] = useState<string>();
  const [afterUrl, setAfterUrl] = useState<string>();
  const [folderName, setFolderName] = useState("");
  const [modelSearchOpen, setModelSearchOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelSearchTab, setModelSearchTab] = useState<"All" | "Models" | "Products" | "Characters" | "Community" | "Apps" | "Originals">("Models");
  const [modelSearchCategory, setModelSearchCategory] = useState<Category>("Image");
  const fileRef = useRef<HTMLInputElement>(null);
  const run = useServerFn(runFalTool);
  const poll = useServerFn(pollFalTool);
  const selected = FAL_TOOLS.find((x) => x.id === active)!;
  const filtered = useMemo(() => category === "All" ? FAL_TOOLS : FAL_TOOLS.filter((x) => x.category === category), [category]);

  useEffect(() => { setHistory(read<Creation[]>("ai-history", [])); setFolders(read<string[]>("ai-folders", ["General", "Projects"])); setTemplates(read<Template[]>("ai-templates", [])); }, []);
  useEffect(() => {
    const image = category === "Image" || selected.category === "Image";
    const p = prompt.toLowerCase();
    const recommended = image ? (p.includes("photo") || p.includes("realistic") ? "Image Generator · photoreal" : "Nano Banana / Image Generator") : selected.category === "Video" ? "WAN 2.2 / Image-to-Video" : selected.category === "Audio" ? "ElevenLabs / Audio" : selected.category === "3D" ? "Hunyuan 3D / Tripo" : "AI Assistant";
    setSelectorNote(`AI Model Selector · ${recommended}`);
  }, [prompt, category, selected.category]);

  const upload = async (file?: File) => {
    if (!file) return;
    setError(null);
    const path = `uploads/workspace-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("character-swap").upload(path, file, { contentType: file.type, upsert: true });
    if (up.error) { setError("Impossible d'envoyer le fichier."); return; }
    const signed = await supabase.storage.from("character-swap").createSignedUrl(path, 3600);
    if (signed.error || !signed.data?.signedUrl) { setError("Impossible de préparer le fichier."); return; }
    setFileUrl(signed.data.signedUrl); setFileName(file.name);
  };

  const enhancePrompt = () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    setTimeout(() => {
      const suffix = selected.category === "Image" ? ", cinematic composition, detailed textures, realistic lighting, high quality, professional photography" : selected.category === "Video" ? ", cinematic camera movement, coherent motion, detailed lighting, smooth transitions" : selected.category === "3D" ? ", clean topology, detailed materials, studio lighting, production-ready 3D asset" : ", clear structure, precise details, professional quality";
      setPrompt(prompt.trim().replace(/[.!?]+$/, "") + suffix);
      setEnhancing(false);
    }, 450);
  };

  const savePrompt = () => {
    if (!prompt.trim()) return;
    const next = [...read<Template[]>("ai-templates", []), { id: crypto.randomUUID(), name: `${selected.label} prompt`, prompt, toolId: selected.id }];
    setTemplates(next); write("ai-templates", next); setView("templates");
  };

  const pollOne = async (requestId: string, model: string) => {
    for (let i = 0; i < 120; i++) {
      const r = await poll({ data: { requestId, model } });
      if (r.status === "completed") return r.url;
      if (r.status === "error") throw new Error(r.message || "La génération a échoué.");
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    throw new Error("La génération prend trop de temps.");
  };

  const generate = async () => {
    setError(null);
    if (!prompt.trim() && !fileUrl) { setError("Ajoute un prompt ou un fichier de référence."); return; }
    setBusy(true); setResults([]);
    try {
      const payload = { toolId: selected.id, prompt, imageUrl: selected.category === "Image" || selected.category === "3D" || selected.category === "Video" ? fileUrl : undefined, audioUrl: selected.category === "Audio" || selected.id === "lip-sync" || selected.id === "ai-avatar" ? fileUrl : undefined, videoUrl: selected.category === "Video" ? fileUrl : undefined };
      const jobs = await Promise.all(Array.from({ length: variants }, () => run({ data: payload })));
      const completed = await Promise.all(jobs.map(async (job) => job.status === "completed" ? job.url : job.status === "queued" ? pollOne(job.requestId, job.model) : Promise.reject(new Error(job.message))));
      const created = completed.map((url) => ({ id: crypto.randomUUID(), url }));
      setResults(created);
      const now = Date.now();
      const entries: Creation[] = created.map((r) => ({ id: r.id, toolId: selected.id, tool: selected.label, category: selected.category, prompt, url: r.url, createdAt: now }));
      const next = [...entries, ...read<Creation[]>("ai-history", [])].slice(0, 200);
      setHistory(next); write("ai-history", next);
      if (selected.category === "Image" && created[0]?.url) { setAfterUrl(created[0].url || undefined); if (fileUrl) setBeforeUrl(fileUrl); }
    } catch (e) { setError(e instanceof Error ? e.message : "La génération a échoué."); }
    finally { setBusy(false); }
  };

  const toggleFavorite = (id: string) => { const next = history.map((x) => x.id === id ? { ...x, favorite: !x.favorite } : x); setHistory(next); write("ai-history", next); };
  const togglePublic = (id: string) => { const next = history.map((x) => x.id === id ? { ...x, public: !x.public } : x); setHistory(next); write("ai-history", next); };
  const addFolder = () => { if (!folderName.trim()) return; const next = [...new Set([...folders, folderName.trim()])]; setFolders(next); write("ai-folders", next); setFolderName(""); };

  const nav = [
    ["create", "Create", Sparkles], ["history", "History", History], ["creations", "My Creations", GalleryHorizontal], ["favorites", "Favorites", Heart], ["gallery", "Public Gallery", Star], ["templates", "Templates", WandSparkles],
  ] as const;
  const visibleItems = view === "favorites" ? history.filter((x) => x.favorite) : view === "gallery" ? history.filter((x) => x.public) : view === "creations" ? history : history;

  const popular = filtered.slice(0, 4);
  const CurrentIcon = iconFor(selected.category);
  const searchCategories = [
    { label: "Image", icon: ImageIcon, count: FAL_TOOLS.filter((x) => x.category === "Image").length },
    { label: "Video", icon: Video, count: FAL_TOOLS.filter((x) => x.category === "Video").length },
    { label: "Edit", icon: SlidersHorizontal, count: FAL_TOOLS.filter((x) => ["Image", "Video"].includes(x.category)).length },
    { label: "Audio", icon: AudioLines, count: FAL_TOOLS.filter((x) => x.category === "Audio").length },
  ];
  const modelSearchResults = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    const pool = modelSearchCategory === "All" ? FAL_TOOLS : FAL_TOOLS.filter((x) => x.category === modelSearchCategory);
    return pool.filter((x) => !q || `${x.label} ${x.description} ${x.model}`.toLowerCase().includes(q));
  }, [modelSearch, modelSearchCategory]);
  const chooseModelFromSearch = (id: string) => {
    const item = FAL_TOOLS.find((x) => x.id === id);
    if (!item) return;
    setActive(id);
    setCategory(item.category as Category);
    setModelSearchOpen(false);
    setModelSearch("");
  };

  return <main className="min-h-screen overflow-x-hidden bg-[#05060a] text-white">
    <div className="mx-auto min-h-screen max-w-[1500px] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <a href="/" className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.04] hover:bg-white/[.08]"><ArrowLeft className="size-4" /></a>
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-950/30"><Sparkles className="size-6" /></div>
          <div className="min-w-0"><h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">AI Workspace</h1><p className="truncate text-xs text-white/45 sm:text-sm">Créez · Générez · Éditez · Innovez</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModelSearchOpen(true)} aria-label="Rechercher un modèle" className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[.03] sm:hidden"><Search className="size-5 text-white/75" /></button>
          <button className="relative hidden size-10 place-items-center rounded-full border border-white/10 bg-white/[.03] sm:grid"><Bell className="size-5 text-white/70" /><span className="absolute right-2 top-2 size-2 rounded-full bg-pink-500" /></button>
          <a href="/chatgpt-plugin" className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200 sm:block">ChatGPT App</a><a href="/ai-hub" className="hidden rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-semibold text-violet-200 sm:block">AI Creative Hub</a>
          <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] text-emerald-200 md:block">FAL server-side</div>
          <div className="grid size-10 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-white/20 to-white/5"><UserCircle className="size-5 text-white/75" /></div>
        </div>
      </header>

      {view === "create" ? <>
        <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-violet-400/40 bg-gradient-to-br from-[#151044] via-[#10185b] to-[#0637a8] p-5 shadow-2xl shadow-blue-950/30 sm:p-7 lg:p-9">
          <div className="absolute -right-20 -top-20 size-56 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-20 size-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/30 bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-100"><Sparkles className="size-3.5" /> Nouveau</span>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Bienvenue sur votre<br className="hidden sm:block" /> AI Workspace !</h2>
            <p className="mt-2 text-sm text-white/65 sm:text-base">Tous les modèles IA au même endroit.</p>
            <button onClick={() => document.getElementById("workspace-models")?.scrollIntoView({ behavior: "smooth" })} className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold shadow-lg shadow-violet-950/40">Explorer maintenant <span>→</span></button>
          </div>
          <div className="pointer-events-none absolute bottom-0 right-4 hidden h-44 w-72 lg:block">
            <div className="absolute right-12 top-6 grid size-32 place-items-center rounded-[2rem] border border-white/30 bg-white/15 shadow-2xl backdrop-blur-xl"><div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-white to-blue-200 text-slate-900"><Sparkles className="size-10" /></div></div>
            {[['ImageIcon','left-3 top-8'],['Video','right-0 top-1'],['AudioLines','left-14 bottom-2'],['Box','right-4 bottom-5']].map(([kind,pos]) => <div key={kind} className={`absolute ${pos} grid size-12 place-items-center rounded-2xl border border-white/20 bg-blue-500/30 shadow-xl backdrop-blur-xl`}>{kind === 'ImageIcon' ? <ImageIcon className="size-5" /> : kind === 'Video' ? <Video className="size-5" /> : kind === 'AudioLines' ? <AudioLines className="size-5" /> : <Box className="size-5" />}</div>)}
          </div>
        </section>

        <div id="workspace-models" className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {categories.map((item) => { const Icon = iconFor(item === "All" ? "" : item); return <button key={item} onClick={() => setCategory(item)} className={`flex min-w-[78px] shrink-0 flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-[11px] font-semibold transition ${category === item ? "border-violet-400/60 bg-gradient-to-b from-violet-500/30 to-blue-500/10 text-white shadow-lg shadow-violet-950/20" : "border-white/10 bg-[#0d101a] text-white/55 hover:bg-white/[.06]"}`}><span className={`grid size-9 place-items-center rounded-xl ${category === item ? "bg-violet-500/30" : "bg-white/[.05]"}`}>{item === "All" ? <Sparkles className="size-5" /> : <Icon className="size-5" />}</span>{item}</button>; })}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => setModelSearchOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1018] px-4 py-3 text-left hover:border-white/20 hover:bg-[#11151e]"><Search className="size-5 shrink-0 text-white/35" /><span className="min-w-0 flex-1 truncate text-sm text-white/35">Rechercher un modèle…</span><kbd className="hidden rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] text-white/25 sm:block">⌘ K</kbd></button>
          <button onClick={() => setSelectorNote(`${selected.label} · ${selected.model}`)} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#0d1018] text-white/60"><SlidersHorizontal className="size-5" /></button>
        </div>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500"><Zap className="size-4 fill-current" /></span><h3 className="text-xl font-bold">Modèles populaires</h3></div><button onClick={() => setCategory("All")} className="text-xs font-semibold text-violet-300">Voir tout →</button></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {popular.map((item, index) => { const Icon=iconFor(item.category); return <button key={item.id} onClick={() => { setActive(item.id); setError(null); }} className={`group overflow-hidden rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-400/30 ${active === item.id ? "border-violet-400/50 bg-violet-500/[.08]" : "border-white/10 bg-[#0c0f18]"}`}><div className={`relative grid aspect-[1.55] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${index % 4 === 0 ? "from-fuchsia-600/70 via-violet-600/30 to-cyan-500/30" : index % 4 === 1 ? "from-blue-700/70 via-indigo-600/30 to-fuchsia-500/20" : index % 4 === 2 ? "from-orange-500/60 via-pink-600/30 to-violet-600/40" : "from-slate-500/50 via-blue-600/40 to-violet-600/40"}`}><Icon className="size-14 text-white/80" /><span className="absolute right-2 top-2 rounded-full bg-emerald-400/20 px-2 py-1 text-[9px] font-bold text-emerald-200">FAL</span></div><div className="p-2"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold">{item.label}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/40">{item.description}</p></div><span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/50 group-hover:bg-violet-500/30 group-hover:text-white">›</span></div><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-white/[.06] px-2 py-1 text-[9px] text-white/55">{item.category}</span><span className="rounded-full bg-violet-500/15 px-2 py-1 text-[9px] text-violet-200">{item.model.split('/').pop()}</span></div></div></button> })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden rounded-3xl border border-white/10 bg-[#0b0e16] p-3 lg:block">
            <div className="mb-3 flex items-center justify-between px-2"><span className="text-xs font-bold">Tous les modèles</span><span className="text-[10px] text-white/30">{filtered.length}</span></div>
            <div className="max-h-[600px] space-y-1 overflow-y-auto">{filtered.map((item) => { const Icon=iconFor(item.category); return <button key={item.id} onClick={() => { setActive(item.id); setError(null); }} className={`w-full rounded-2xl p-3 text-left transition ${active === item.id ? "bg-white text-black" : "hover:bg-white/[.05]"}`}><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl ${active === item.id ? "bg-black/10" : "bg-white/[.06]"}`}><Icon className="size-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{item.label}</span><span className={`block truncate text-[10px] ${active === item.id ? "text-black/50" : "text-white/30"}`}>{item.description}</span></span></div></button> })}</div>
          </aside>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0c11] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[.06] bg-[#11141b] px-4 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500"><CurrentIcon className="size-5" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{selected.label}</p><p className="truncate text-[10px] text-white/35">{selected.description}</p></div></div><button onClick={() => setSelectorNote(`${selected.label} · ${selected.model}`)} className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-[10px] font-bold">AI Model</button></div>
            <div className="p-4 sm:p-6">
              <button onClick={() => setCategory(selected.category as Category)} className="mb-5 flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft className="size-4" /> Modèles</button>
              <div className="min-h-[230px] rounded-[1.7rem] border border-white/[.04] bg-[#050609] p-4 sm:min-h-[300px]">
                {busy ? <div className="flex h-[230px] flex-col items-center justify-center sm:h-[300px]"><LoaderCircle className="size-12 animate-spin text-violet-400" /><p className="mt-5 text-sm text-white/70">Génération en cours…</p><p className="mt-1 text-xs text-white/30">{selected.label}</p></div> : results.length ? <div className="grid gap-3 sm:grid-cols-2">{results.map(r => <div key={r.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#10131b]">{r.url && selected.category === "Image" ? <img src={r.url} className="aspect-video w-full object-cover" /> : r.url && selected.category === "Video" ? <video src={r.url} controls className="aspect-video w-full object-cover" /> : r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="flex aspect-video items-center justify-center text-xs text-white/50">Ouvrir le résultat</a> : <div className="grid aspect-video place-items-center text-xs text-white/40">Résultat prêt</div>}<div className="flex items-center justify-between gap-2 p-3"><span className="text-[10px] text-white/40">{selected.label}</span>{r.url && <a href={r.url} download className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-semibold text-black">Télécharger</a>}</div></div>)}</div> : <div className="flex min-h-[230px] flex-col items-center justify-center sm:min-h-[300px]"><div className="grid size-16 place-items-center rounded-3xl bg-white/[.04]"><Play className="size-7 text-white/20" /></div><p className="mt-5 text-sm text-white/35">Aucun résultat, commence à générer !</p><p className="mt-1 text-[10px] text-white/20">{selected.description}</p></div>}
              </div>

              <div className="mt-4 rounded-[1.8rem] border border-white/10 bg-[#171a21] p-4 shadow-xl sm:p-5">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder={`Décrivez la création que vous souhaitez avec ${selected.label}…`} className="w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-white/25" />
                <div className="mt-3 flex flex-wrap gap-2"><button onClick={enhancePrompt} disabled={enhancing} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] text-white/60"><WandSparkles className="mr-1 inline size-3" />{enhancing ? "Optimisation…" : "Prompt Enhancer"}</button><button onClick={savePrompt} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] text-white/60"><Save className="mr-1 inline size-3" />Sauvegarder</button></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-full bg-[#232730] px-4 py-2.5"><WandSparkles className="size-4 shrink-0 text-violet-300" /><select value={selected.id} onChange={e => { setActive(e.target.value); setError(null); }} className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"><option className="bg-[#181b22]" value={selected.id}>{selected.label}</option>{filtered.filter(x=>x.id!==selected.id).map(x=><option className="bg-[#181b22]" key={x.id} value={x.id}>{x.label}</option>)}</select></label>
                  <div className="flex items-center rounded-full bg-[#232730] p-1"><button onClick={() => setAspectRatio("16:9")} className={`flex-1 rounded-full px-3 py-2 text-[10px] ${aspectRatio === "16:9" ? "bg-[#454a55] text-white" : "text-white/40"}`}>▭ 16:9</button><button onClick={() => setAspectRatio("9:16")} className={`flex-1 rounded-full px-3 py-2 text-[10px] ${aspectRatio === "9:16" ? "bg-[#454a55] text-white" : "text-white/40"}`}>▯ 9:16</button></div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-full bg-[#232730] p-1"><span className="px-3 text-[9px] text-white/30">Variantes</span>{[1,4,8].map(n=><button key={n} onClick={()=>setVariants(n)} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${variants===n?"bg-white text-black":"text-white/45"}`}>{n}</button>)}</div>
                <button onClick={() => fileRef.current?.click()} className="mt-3 flex min-h-[110px] w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/20 bg-[#10131a] text-center hover:border-violet-400/40"><Upload className="size-7 text-white/35" /><span className="mt-2 text-xs font-bold uppercase tracking-wide text-white/75">{selected.category === "Video" ? "Télécharger une vidéo ou image" : selected.category === "Audio" ? "Télécharger un audio" : selected.category === "3D" ? "Télécharger une image de référence" : "Télécharger une image"}</span><span className="mt-1 text-[10px] text-white/30">Optionnel · fichier de référence</span>{fileName && <span className="mt-2 rounded-full bg-white/10 px-3 py-1 text-[9px] text-white/60">{fileName.slice(0, 38)} <X className="ml-1 inline size-3" /></span>}</button>
                <input ref={fileRef} type="file" className="hidden" onChange={e => upload(e.target.files?.[0])} />
                <div className="mt-4 flex items-center gap-3"><div className="min-w-[60px]"><p className="text-2xl font-black leading-none">25</p><p className="text-xs text-white/35">crédits</p></div><button disabled={busy} onClick={generate} className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 px-5 text-base font-bold shadow-xl shadow-violet-950/30 disabled:opacity-50 sm:text-lg">{busy ? <LoaderCircle className="size-5 animate-spin" /> : <Zap className="size-5 fill-current" />}{busy ? "Génération…" : `Générer${variants > 1 ? ` ×${variants}` : ""}`}</button></div>
              </div>
              {error && <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-white/25"><span>{selectorNote}</span><span>•</span><span>{selected.model}</span><span>•</span><span>Format {aspectRatio}</span></div>
              {beforeUrl && afterUrl && <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4"><div className="mb-3 flex items-center gap-2"><GalleryHorizontal className="size-4" /><span className="text-xs font-semibold">Comparaison avant / après</span></div><div className="grid gap-3 md:grid-cols-2"><div><p className="mb-2 text-[10px] text-white/40">AVANT</p><img src={beforeUrl} className="max-h-72 w-full rounded-2xl object-contain" /></div><div><p className="mb-2 text-[10px] text-white/40">APRÈS</p><img src={afterUrl} className="max-h-72 w-full rounded-2xl object-contain" /></div></div></div>}
            </div>
          </div>
        </section>
      </> : view === "explore" ? <section className="mt-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div><span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-semibold text-violet-200">36 fonctionnalités</span><h2 className="mt-3 text-2xl font-black sm:text-3xl">Explorez tous les modèles IA</h2><p className="mt-1 text-xs text-white/40 sm:text-sm">Image, vidéo, audio, 3D et assistants — chaque fonctionnalité dans son propre espace.</p></div>
          <button onClick={() => setModelSearchOpen(true)} className="hidden shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[.08] sm:flex"><Search className="size-4" />Rechercher</button>
        </div>
        <button onClick={() => setModelSearchOpen(true)} className="group block w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f18] p-2 shadow-2xl shadow-violet-950/20 transition hover:border-violet-400/30 sm:p-3">
          <img src="/workspace-36-models.png" alt="IA-67 — 36 fonctionnalités et modèles IA" className="w-full rounded-[1.5rem] object-cover transition duration-500 group-hover:scale-[1.005]" />
          <div className="flex items-center justify-between gap-3 px-2 py-3 sm:px-4"><span className="text-left text-xs text-white/45">Cliquez pour rechercher et ouvrir un modèle dans le Workspace.</span><span className="shrink-0 rounded-full bg-white px-4 py-2 text-[10px] font-bold text-black">Explorer les modèles →</span></div>
        </button>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.filter((x) => x !== "All").map((item) => { const Icon = iconFor(item); const count = FAL_TOOLS.filter((x) => x.category === item).length; return <button key={item} onClick={() => { setCategory(item); setView("create"); }} className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left hover:border-violet-400/30 hover:bg-white/[.06]"><span className="grid size-9 place-items-center rounded-xl bg-violet-500/15 text-violet-200"><Icon className="size-4" /></span><p className="mt-3 text-xs font-bold">{item}</p><p className="mt-1 text-[10px] text-white/35">{count} modèles</p></button>; })}
        </div>
      </section> : <section className="mt-6">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{view === "history" ? "History" : view === "creations" ? "My Creations" : view === "favorites" ? "Favorites" : view === "gallery" ? "Public Gallery" : "Templates"}</h2><p className="mt-1 text-xs text-white/35">{view === "gallery" ? "Les créations marquées publiques dans ce navigateur." : "Tes créations et ressources enregistrées."}</p></div><button onClick={() => setView("create")} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">Create</button></div>
        {view === "templates" ? <div className="grid gap-3 md:grid-cols-2">{templates.map(t => <button key={t.id} onClick={() => { setActive(t.toolId); setPrompt(t.prompt); setView("create"); }} className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left hover:bg-white/[.06]"><div className="flex items-center justify-between"><span className="text-xs font-semibold">{t.name}</span><WandSparkles className="size-4 text-violet-300" /></div><p className="mt-2 line-clamp-3 text-[11px] text-white/45">{t.prompt}</p></button>)}{!templates.length && <Empty label="Aucun template sauvegardé." />}</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visibleItems.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">{item.url && item.category === "Image" ? <img src={item.url} className="aspect-square w-full object-cover" /> : item.url && item.category === "Video" ? <video src={item.url} controls className="aspect-video w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-black/20 text-xs text-white/35">{item.tool}</div>}<div className="p-3"><p className="text-xs font-semibold">{item.tool}</p><p className="mt-1 line-clamp-2 text-[10px] text-white/35">{item.prompt}</p><div className="mt-3 flex items-center gap-1"><button onClick={() => toggleFavorite(item.id)} className={`grid size-8 place-items-center rounded-lg ${item.favorite ? "bg-pink-500/20 text-pink-300" : "bg-white/[.05] text-white/45"}`}><Heart className="size-3.5" /></button><button onClick={() => togglePublic(item.id)} className={`grid size-8 place-items-center rounded-lg ${item.public ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[.05] text-white/45"}`}><GalleryHorizontal className="size-3.5" /></button>{item.url && <a href={item.url} download className="ml-auto grid size-8 place-items-center rounded-lg bg-white text-black"><Download className="size-3.5" /></a>}</div></div></article>)}{!visibleItems.length && <Empty label={view === "gallery" ? "Aucune création publiée." : "Aucune création pour le moment."} />}</div>}
      </section>}

      {modelSearchOpen && <div className="fixed inset-0 z-[100] bg-black/70 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="Recherche de modèles" onMouseDown={(e) => { if (e.target === e.currentTarget) setModelSearchOpen(false); }}>
        <div className="mx-auto flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#1b1f20]/95 shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-3 border-b border-white/[.06] px-4 py-3 sm:px-5 sm:py-4">
            <Search className="size-6 shrink-0 text-white/45" />
            <input autoFocus value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setModelSearchOpen(false); }} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-xl text-white outline-none placeholder:text-white/30 sm:text-2xl" />
            <button onClick={() => setModelSearchOpen(false)} aria-label="Fermer" className="grid size-12 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/80 hover:bg-white/[.1]"><X className="size-6" /></button>
          </div>
          <div className="flex gap-2 overflow-x-auto border-b border-white/[.06] px-4 py-3 [scrollbar-width:none] sm:px-6">
            {["All", "Models", "Products", "Characters", "Community", "Apps", "Originals"].map((tab) => <button key={tab} onClick={() => setModelSearchTab(tab as typeof modelSearchTab)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${modelSearchTab === tab ? "border-white/5 bg-white/15 text-white" : "border-white/10 bg-transparent text-white/65 hover:bg-white/[.05]"}`}>{tab}{["Apps", "Originals"].includes(tab) && <span className="text-xs">↗</span>}</button>)}
          </div>
          <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden border-r border-white/[.06] p-5 lg:block">
              <p className="mb-4 text-sm font-semibold text-white/45">Categories</p>
              <div className="space-y-2">
                {searchCategories.map((item) => { const Icon = item.icon; const activeCat = modelSearchCategory === item.label; return <button key={item.label} onClick={() => setModelSearchCategory(item.label as Category)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${activeCat ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/[.05]"}`}><span className={`grid size-10 place-items-center rounded-xl ${activeCat ? "bg-white/10" : "bg-white/[.05]"}`}><Icon className="size-5" /></span><span className="flex-1 text-base font-semibold">{item.label}</span><span className={`rounded-lg px-2 py-1 text-xs font-bold ${activeCat ? "bg-white/10 text-white/80" : "bg-white/[.05] text-white/35"}`}>{item.count}</span></button>; })}
              </div>
              <button onClick={() => setModelSearchCategory("All")} className={`mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-white/60 hover:bg-white/[.05] ${modelSearchCategory === "All" ? "bg-white/10 text-white" : ""}`}><span className="grid size-10 place-items-center rounded-xl bg-white/[.05]"><Sparkles className="size-5" /></span><span className="text-base font-semibold">All</span></button>
            </aside>
            <section className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold sm:text-xl">{modelSearchCategory === "All" ? "All models" : `${modelSearchCategory} models`}</h3><p className="mt-1 text-xs text-white/35">Choisissez un modèle pour l'ouvrir dans votre workspace.</p></div><span className="rounded-full bg-white/[.06] px-3 py-1.5 text-xs text-white/45">{modelSearchResults.length}</span></div>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none]">
                {[{label:"Image", icon:ImageIcon},{label:"Video",icon:Video},{label:"Edit",icon:SlidersHorizontal},{label:"Audio",icon:AudioLines}].map(({label,icon:Icon}) => <button key={label} onClick={() => setModelSearchCategory(label === "Edit" ? "All" : label as Category)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${modelSearchCategory === label ? "border-white/10 bg-white/15" : "border-white/10 bg-transparent text-white/55"}`}><Icon className="size-4" />{label}</button>)}
              </div>
              {modelSearchTab === "Models" || modelSearchTab === "All" ? <div className="space-y-1">
                {modelSearchResults.map((item) => { const Icon = iconFor(item.category); return <button key={item.id} onClick={() => chooseModelFromSearch(item.id)} className={`group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition sm:p-4 ${active === item.id ? "bg-white/[.09]" : "hover:bg-white/[.05]"}`}><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#2b2f30] text-white/90 sm:size-14"><Icon className="size-6" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-base font-bold sm:text-lg">{item.label}</span>{item.id === "image-generator" && <span className="rounded-md bg-lime-400 px-2 py-0.5 text-[10px] font-black italic text-black">NEW</span>}</span><span className="mt-1 block truncate text-sm text-white/45">{item.description}</span></span><span className="hidden rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] font-semibold text-white/35 sm:block">{item.category}</span></button>; })}
                {!modelSearchResults.length && <div className="grid min-h-56 place-items-center rounded-3xl border border-dashed border-white/10 text-sm text-white/30">Aucun modèle trouvé.</div>}
              </div> : <div className="grid min-h-56 place-items-center rounded-3xl border border-dashed border-white/10 text-sm text-white/30">Cette section est visuelle pour le moment. Les modèles IA-67 sont disponibles dans Models.</div>}
            </section>
          </div>
        </div>
      </div>}

      <nav className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[2rem] border border-violet-400/30 bg-[#12102c]/95 px-4 py-2 shadow-2xl shadow-violet-950/50 backdrop-blur-xl sm:hidden">
        <button onClick={() => setView("create")} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[9px] ${view === "create" ? "text-violet-300" : "text-white/50"}`}><Sparkles className="size-5" />Accueil</button>
        <button onClick={() => setView("explore")} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[9px] ${view === "explore" ? "text-violet-300" : "text-white/50"}`}><Compass className="size-5" />Explorer</button>
        <button onClick={() => setView("create")} className="-mt-7 grid size-14 shrink-0 place-items-center rounded-full border border-white/30 bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-xl shadow-violet-900/60"><Sparkles className="size-7" /></button>
        <button onClick={() => setView("creations")} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[9px] ${view === "creations" ? "text-violet-300" : "text-white/50"}`}><GalleryHorizontal className="size-5" />Créations</button>
        <button onClick={() => setView("favorites")} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[9px] ${view === "favorites" ? "text-violet-300" : "text-white/50"}`}><UserCircle className="size-5" />Profil</button>
      </nav>
    </div>
  </main>;
}

function Empty({ label }: { label: string }) { return <div className="col-span-full flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-white/10 text-xs text-white/30">{label}</div>; }
