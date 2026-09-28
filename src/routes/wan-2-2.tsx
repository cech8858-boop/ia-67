import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clapperboard, Film, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  ASPECT_RATIOS,
  DURATIONS,
  MULTI_SCENE_DURATIONS,
  RESOLUTIONS,
  estimateMultiScenePriceUsd,
  estimatePriceUsd,
  formatUsd,
  type AspectRatio,
  type Duration,
  type MultiSceneDuration,
  type Resolution,
} from "@/lib/eightscale";
import {
  generateTextToVideo,
  generateMultiScene,
  pollTextToVideo,
  pollMultiScene,
} from "@/lib/video.functions";

export const Route = createFileRoute("/wan-2-2")({
  head: () => ({
    meta: [
      { title: "WAN 2.2 — Video Studio" },
      { name: "description", content: "Studio dédié à WAN 2.2 pour créer des vidéos avec du texte, une image ou plusieurs scènes." },
    ],
  }),
  component: Wan22Studio,
});

type Mode = "text" | "image" | "multi";

function Wan22Studio() {
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [resolution, setResolution] = useState<Resolution>("480p");
  const [seconds, setSeconds] = useState<Duration>(3);
  const [multiSeconds, setMultiSeconds] = useState<MultiSceneDuration>(60);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [scenes, setScenes] = useState(["", ""]);

  const runText = useServerFn(generateTextToVideo);
  const pollText = useServerFn(pollTextToVideo);
  const runMulti = useServerFn(generateMultiScene);
  const pollMulti = useServerFn(pollMultiScene);

  const textMutation = useMutation({
    mutationFn: () => runText({ data: { prompt, resolution, seconds, aspect_ratio: aspectRatio } }),
  });
  const textRequestId = textMutation.data?.status === "queued" ? textMutation.data.requestId : null;
  const textPolling = useQuery({
    queryKey: ["wan-text", textRequestId],
    queryFn: () => pollText({ data: { requestId: textRequestId! } }),
    enabled: Boolean(textRequestId),
    refetchInterval: (q) => (q.state.data?.status === "completed" || q.state.data?.status === "error" ? false : 3000),
  });

  const multiMutation = useMutation({
    mutationFn: () => runMulti({ data: { prompts: scenes, resolution, seconds: multiSeconds, aspect_ratio: aspectRatio } }),
  });
  const multiRequestId = multiMutation.data?.status === "queued" ? multiMutation.data.requestId : null;
  const multiPolling = useQuery({
    queryKey: ["wan-multi", multiRequestId],
    queryFn: () => pollMulti({ data: { requestId: multiRequestId! } }),
    enabled: Boolean(multiRequestId),
    refetchInterval: (q) => (q.state.data?.status === "completed" || q.state.data?.status === "error" ? false : 4000),
  });

  const textVideo = textMutation.data?.status === "completed" ? textMutation.data.videoUrl : textPolling.data?.status === "completed" ? textPolling.data.videoUrl : null;
  const multiVideo = multiMutation.data?.status === "completed" ? multiMutation.data.videoUrl : multiPolling.data?.status === "completed" ? multiPolling.data.videoUrl : null;
  const videoUrl = textVideo ?? multiVideo;
  const busy = textMutation.isPending || Boolean(textRequestId) || multiMutation.isPending || Boolean(multiRequestId);
  const error = textMutation.error instanceof Error ? textMutation.error.message : multiMutation.error instanceof Error ? multiMutation.error.message : textPolling.data?.status === "error" ? textPolling.data.message : multiPolling.data?.status === "error" ? multiPolling.data.message : null;

  function reset() {
    textMutation.reset();
    multiMutation.reset();
  }

  function submit() {
    reset();
    if (mode === "text") {
      if (prompt.trim()) textMutation.mutate();
    } else if (mode === "multi") {
      if (scenes.every((scene) => scene.trim())) multiMutation.mutate();
    }
  }

  return (
    <main className="min-h-screen bg-[#101010] text-white">
      <div className="mx-auto min-h-screen w-full max-w-[1050px] px-4 pb-16 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 py-4">
          <Link to="/blank" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="size-4" /> Modèles
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold">
            <span className="flex size-5 items-center justify-center rounded-full bg-white text-black">W</span>
            WAN 2.2
          </div>
          <span className="rounded-full bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-200">14B</span>
        </header>

        <section className="pt-10">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Dedicated video studio</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Create with WAN 2.2</h1>
            <p className="mt-4 text-sm leading-6 text-white/55 sm:text-base">
              Un espace dédié à WAN 2.2 14B. Choisissez votre workflow et gardez tous les réglages vidéo au même endroit.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <ModeCard active={mode === "text"} onClick={() => setMode("text")} icon={<Sparkles />} title="Text to Video" description="Transformez une idée en vidéo." />
            <ModeCard active={mode === "image"} onClick={() => setMode("image")} icon={<ImageIcon />} title="Image to Video" description="Animez une image existante." />
            <ModeCard active={mode === "multi"} onClick={() => setMode("multi")} icon={<Film />} title="Multi-Scene" description="Créez une narration jusqu'à 60s." />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
            <section className="rounded-[1.75rem] border border-white/10 bg-[#181818] p-5 sm:p-7">
              {mode === "text" && (
                <>
                  <label className="text-sm font-semibold">Describe your video</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} placeholder="A cinematic shot of a futuristic city at sunset, slow camera movement..." className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#242424] px-4 py-4 text-sm outline-none placeholder:text-white/25 focus:border-violet-500" />
                </>
              )}

              {mode === "image" && (
                <>
                  <label className="text-sm font-semibold">Starting image</label>
                  <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Paste an image URL (https://...)" className="mt-3 w-full rounded-2xl border border-white/10 bg-[#242424] px-4 py-4 text-sm outline-none placeholder:text-white/25 focus:border-violet-500" />
                  {image && <img src={image} alt="Preview" className="mt-4 max-h-72 w-full rounded-2xl bg-black object-contain" />}
                  <p className="mt-4 text-xs text-white/40">Pour le moment, l'espace Image to Video redirige vers le studio dédié complet.</p>
                  <Link to="/image-to-video" className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10">Ouvrir Image-to-Video</Link>
                </>
              )}

              {mode === "multi" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Scenes</label>
                    <button type="button" onClick={() => setScenes((s) => s.length < 6 ? [...s, ""] : s)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">+ Add scene</button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {scenes.map((scene, index) => (
                      <textarea key={index} value={scene} onChange={(e) => setScenes((s) => s.map((v, i) => i === index ? e.target.value : v))} rows={3} placeholder={`Scene ${index + 1}...`} className="w-full resize-none rounded-2xl border border-white/10 bg-[#242424] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-violet-500" />
                    ))}
                  </div>
                </>
              )}

              {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</p>}
              {videoUrl && <video src={videoUrl} controls playsInline className="mt-5 w-full rounded-2xl bg-black" />}

              <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/40">{mode === "multi" ? "WAN 2.2 14B Multi-Scene" : "WAN 2.2 14B"}</p>
                <button type="button" disabled={busy || (mode === "text" && !prompt.trim()) || (mode === "multi" && !scenes.every((s) => s.trim()))} onClick={submit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40">
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {busy ? "Generating..." : "Generate video"}
                </button>
              </div>
            </section>

            <aside className="rounded-[1.75rem] border border-white/10 bg-[#181818] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold"><Clapperboard className="size-4 text-violet-300" /> Generation settings</div>
              <Setting label="Resolution">
                <SelectRow options={RESOLUTIONS} value={resolution} onChange={setResolution} />
              </Setting>
              {mode !== "multi" ? (
                <Setting label="Duration"><SelectRow options={DURATIONS.map(String)} value={String(seconds)} onChange={(v) => setSeconds(Number(v) as Duration)} suffix="s" /></Setting>
              ) : (
                <Setting label="Duration"><SelectRow options={MULTI_SCENE_DURATIONS.map(String)} value={String(multiSeconds)} onChange={(v) => setMultiSeconds(Number(v) as MultiSceneDuration)} suffix="s" /></Setting>
              )}
              <Setting label="Aspect ratio"><SelectRow options={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} /></Setting>
              <div className="mt-6 rounded-2xl bg-black/25 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Estimated cost</p>
                <p className="mt-1 text-2xl font-semibold">{mode === "multi" ? formatUsd(estimateMultiScenePriceUsd()) : formatUsd(estimatePriceUsd(resolution, seconds))}</p>
                <p className="mt-1 text-[11px] text-white/35">Based on current 8Scale pricing table</p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function ModeCard({ active, onClick, icon, title, description }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? "border-violet-400/60 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}><span className="text-violet-300">{icon}</span><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-white/40">{description}</p></button>;
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mt-6"><p className="mb-2 text-xs font-medium text-white/45">{label}</p>{children}</div>;
}

function SelectRow<T extends string>({ options, value, onChange, suffix }: { options: readonly T[]; value: T; onChange: (v: T) => void; suffix?: string }) {
  return <div className="grid grid-cols-2 gap-2">{options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${value === option ? "border-violet-400/50 bg-violet-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white"}`}>{option}{suffix}</button>)}</div>;
}
