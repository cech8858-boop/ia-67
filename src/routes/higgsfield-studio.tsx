import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, Sparkles, Video, Image as ImageIcon, UserRound, WandSparkles } from "lucide-react";
import { createSoulId, getHiggsfieldConfig, getMarketingPresets, listSoulIds, pollHiggsfield, runHiggsfield } from "@/lib/higgsfield.functions";

export const Route = createFileRoute("/higgsfield-studio")({ component: HiggsfieldStudio });

function HiggsfieldStudio() {
  const config = useQuery({ queryKey: ["higgsfield-config"], queryFn: () => useServerFn(getHiggsfieldConfig)({}) });
  const presets = useQuery({ queryKey: ["higgsfield-presets"], queryFn: () => useServerFn(getMarketingPresets)({}), enabled: Boolean(config.data?.configured) });
  const soulIds = useQuery({ queryKey: ["higgsfield-soul-ids"], queryFn: () => useServerFn(listSoulIds)({}), enabled: Boolean(config.data?.configured) });
  const run = useServerFn(runHiggsfield);
  const poll = useServerFn(pollHiggsfield);
  const createSoul = useServerFn(createSoulId);
  const [modelId, setModelId] = useState("higgsfield/cinema-studio/4.0");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [presetId, setPresetId] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soulName, setSoulName] = useState("");
  const [soulImages, setSoulImages] = useState("");

  const models = config.data?.models ?? [];
  const selected = models.find((m) => m.id === modelId);
  const imageUrls = useMemo(() => imageUrlsText.split("\n").map((x) => x.trim()).filter(Boolean), [imageUrlsText]);

  const mutation = useMutation({
    mutationFn: () => run({ data: { modelId, prompt, imageUrl: imageUrl || undefined, videoUrl: videoUrl || undefined, imageUrls, presetId: presetId || undefined } }),
    onSuccess: (result) => { setError(null); if (result.status === "processing") setRequestId(result.requestId); else setResultUrl(result.url ?? null); },
    onError: (e) => setError(e instanceof Error ? e.message : "Erreur Higgsfield."),
  });

  const soulMutation = useMutation({
    mutationFn: () => createSoul({ data: { name: soulName, imageUrls: soulImages.split("\n").map((x) => x.trim()).filter(Boolean), modelVersion: "v2" } }),
    onSuccess: () => { setSoulName(""); setSoulImages(""); soulIds.refetch(); },
    onError: (e) => setError(e instanceof Error ? e.message : "Erreur Soul ID."),
  });

  const polling = useQuery({ queryKey: ["higgsfield-generation", requestId], queryFn: () => poll({ data: { requestId: requestId! } }), enabled: Boolean(requestId), refetchInterval: 4000 });
  useEffect(() => { if (!polling.data) return; if (polling.data.status === "completed") { setResultUrl(polling.data.url ?? null); setRequestId(null); } if (polling.data.status === "error") { setError(polling.data.message); setRequestId(null); } }, [polling.data]);

  const needsVideo = selected?.input === "video";
  const needsImages = selected?.input === "image" || selected?.id.includes("genjutsu");
  const needsProduct = selected?.input === "product";
  const needsPreset = selected?.id === "marketing-studio/product-shots";

  return (
    <main className="min-h-screen bg-[#070a10] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2 text-cyan-300"><Sparkles className="h-5 w-5" /><span className="text-sm font-medium">IA-67 × Higgsfield</span></div><h1 className="mt-2 text-3xl font-semibold">Higgsfield Studio</h1><p className="mt-1 text-sm text-white/50">Nouveaux modèles Higgsfield connectés côté serveur avec HF_CREDENTIALS.</p></div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${config.data?.configured ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}`}><ShieldCheck className="h-4 w-4" />{config.isLoading ? "Vérification…" : config.data?.configured ? "HF_CREDENTIALS configurée" : "HF_CREDENTIALS manquante"}</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{models.slice(-5).map((m) => <button key={m.id} onClick={() => { setModelId(m.id); setError(null); setResultUrl(null); }} className={`rounded-2xl border p-3 text-left transition ${modelId === m.id ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><div className="flex items-center gap-2 text-sm font-medium">{m.kind === "image" ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}{m.label}</div><p className="mt-1 text-xs text-white/40">{m.description}</p></button>)}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <section className="rounded-3xl border border-white/10 bg-[#0d121b] p-5">
            <label className="mb-2 block text-sm text-white/60">Modèle Higgsfield</label>
            <select value={modelId} onChange={(e) => { setModelId(e.target.value); setError(null); }} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none"><option className="bg-[#0d121b]" value="">Choisir…</option>{models.map((m) => <option className="bg-[#0d121b]" key={m.id} value={m.id}>{m.label} — {m.kind}</option>)}</select>
            <p className="mt-2 text-xs text-white/40">{selected?.description}</p>
            <label className="mt-5 mb-2 block text-sm text-white/60">Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Décris ta scène ou ton résultat publicitaire…" className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />

            {needsVideo && <><label className="mt-4 mb-2 block text-sm text-white/60">URL vidéo source</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/source.mp4" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none" /></>}
            {(needsImages || modelId === "higgsfield/cinema-studio/4.0") && <><label className="mt-4 mb-2 block text-sm text-white/60">URL image(s) de référence</label><textarea value={imageUrlsText} onChange={(e) => setImageUrlsText(e.target.value)} placeholder="Une URL par ligne" className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" /></>}
            {needsProduct && <><label className="mt-4 mb-2 block text-sm text-white/60">Photo produit</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/produit.png" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none" /></>}
            {needsPreset && <><label className="mt-4 mb-2 block text-sm text-white/60">Preset Marketing Studio</label><select value={presetId} onChange={(e) => setPresetId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none"><option value="">Choisir un preset…</option>{(presets.data?.items ?? []).map((p) => <option className="bg-[#0d121b]" key={p.id} value={p.id}>{p.name}</option>)}</select><p className="mt-2 text-xs text-white/40">Les presets sont chargés depuis Higgsfield, pas codés en dur.</p></>}

            <button disabled={mutation.isPending || Boolean(requestId) || !config.data?.configured || !prompt.trim()} onClick={() => { setError(null); setResultUrl(null); mutation.mutate(); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">{mutation.isPending || requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}Générer avec Higgsfield</button>
            {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0d121b] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium"><span className="rounded-lg bg-white/10 p-2">{selected?.kind === "video" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</span>Résultat</div>
            {resultUrl ? <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"><a href={resultUrl} target="_blank" rel="noreferrer" className="block p-4 text-sm text-cyan-200 hover:underline">Ouvrir le résultat Higgsfield ↗</a>{/\.(mp4|webm|mov)(\?|$)/i.test(resultUrl) ? <video controls src={resultUrl} className="w-full" /> : <img src={resultUrl} alt="Résultat Higgsfield" className="w-full object-contain" />}</div> : <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/30">{requestId ? "Génération en cours…" : "Ton résultat apparaîtra ici."}</div>}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d121b] p-5">
          <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-cyan-300" /><h2 className="text-lg font-semibold">Soul ID</h2><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/50">références persistantes</span></div>
          <p className="mt-1 text-sm text-white/45">Crée une identité réutilisable à partir de 1 à 100 images. Higgsfield traite ensuite cette référence côté serveur.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><input value={soulName} onChange={(e) => setSoulName(e.target.value)} placeholder="Nom du personnage" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none" /><textarea value={soulImages} onChange={(e) => setSoulImages(e.target.value)} placeholder="URL image 1\nURL image 2\n…" className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" /><button disabled={soulMutation.isPending || !soulName.trim() || !soulImages.trim() || !config.data?.configured} onClick={() => soulMutation.mutate()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">{soulMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}Créer un Soul ID</button></div><div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="mb-3 text-sm font-medium">Mes Soul IDs</div>{Array.isArray((soulIds.data as { items?: unknown[] } | undefined)?.items) && (soulIds.data as { items: Array<{ id?: string; name?: string; status?: string }> }).items.length ? <div className="space-y-2">{(soulIds.data as { items: Array<{ id?: string; name?: string; status?: string }> }).items.map((soul) => <div key={soul.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs"><span>{soul.name ?? soul.id}</span><span className="text-white/40">{soul.status}</span></div>)}</div> : <div className="text-sm text-white/30">Aucun Soul ID trouvé.</div>}</div></div>
        </section>
      </div>
    </main>
  );
}
