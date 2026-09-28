import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Headphones,
  Mic,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";

import { generateElevenLabs, pollAiMedia } from "@/lib/ai-media.functions";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Text to Speech — ElevenLabs" },
      { name: "description", content: "Create natural AI voiceovers with ElevenLabs." },
    ],
  }),
  component: VoicePage,
});

const voices = [
  { name: "James", tone: "Healthy & Engaging", color: "#c98558" },
  { name: "Sarah", tone: "Clear & Professional", color: "#8b9b87" },
  { name: "Maria", tone: "Deep & Warm", color: "#8c7e9d" },
  { name: "Roger", tone: "Calm & Confident", color: "#6f8fa5" },
];

const sampleText =
  "From an early age, we were taught to believe that life must be constantly controlled, that everything has to be carefully managed, thoroughly thought through, strategically planned, and correctly decided. We were taught that if we fail to monitor our daily decisions, things will easily fall apart. But what if we discovered that this idea of control itself is nothing more than a large illusion, rooted in evolutionary remnants of the human mind?";

export function VoicePage() {
  const [text, setText] = useState(sampleText);
  const [model, setModel] = useState<"elevenlabs-v3-tts" | "elevenlabs-tts-turbo-2-5">("elevenlabs-v3-tts");
  const [voice, setVoice] = useState("James");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const run = useServerFn(generateElevenLabs);
  const poll = useServerFn(pollAiMedia);

  const mutation = useMutation({
    mutationFn: (data: any) => run({ data }),
  });

  const taskId = mutation.data?.status === "queued" ? mutation.data.taskId : null;

  const polling = useQuery({
    queryKey: ["elevenlabs", taskId],
    queryFn: () => poll({ data: { taskId: taskId! } }),
    enabled: Boolean(taskId),
    refetchInterval: 2500,
  });

  const audioUrl =
    mutation.data?.status === "completed"
      ? mutation.data.url
      : polling.data?.status === "completed"
        ? polling.data.url
        : null;

  const selectedVoice = voices.find((item) => item.name === voice) ?? voices[0];
  const characterCount = text.length;
  const bars = useMemo(
    () => Array.from({ length: 54 }, (_, index) => 16 + ((index * 17) % 42)),
    [],
  );

  const generate = () => {
    if (!text.trim() || mutation.isPending) return;
    mutation.mutate({ text, model, voice, languageCode: "fr" });
  };

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-4 pb-28 pt-4 text-[#272521] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex h-14 items-center justify-between rounded-[22px] border border-white/80 bg-[#f8f7f2]/90 px-3 shadow-[0_10px_30px_rgba(70,65,54,0.07)] backdrop-blur-xl sm:px-5">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ddd9cf] bg-white/70 text-[#6f6b62] transition hover:bg-white"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#2e2d29] text-white">
              <Volume2 className="size-3.5" />
            </span>
            Text to Speech
          </div>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ddd9cf] bg-white/70 text-[#6f6b62] transition hover:bg-white"
            aria-label="New project"
            onClick={() => setText("")}
          >
            <Plus className="size-4" />
          </button>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <section className="overflow-hidden rounded-[28px] border border-white/90 bg-[#faf9f5] shadow-[0_20px_50px_rgba(74,69,57,0.09)]">
            <div className="border-b border-[#e7e3da] px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-9 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ backgroundColor: selectedVoice.color }}
                  >
                    <Headphones className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{selectedVoice.name}</p>
                    <p className="text-[10px] text-[#8b877d]">{selectedVoice.tone}</p>
                  </div>
                  <button type="button" className="ml-1 rounded-full p-1 text-[#969187] hover:bg-[#efede7]" aria-label="Remove voice">
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#858076]">
                  <span>Creativity 75%</span>
                  <span>·</span>
                  <span>Stability 60%</span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-6 sm:px-7 sm:pb-7">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={5000}
                rows={11}
                spellCheck
                className="min-h-[290px] w-full resize-none border-0 bg-transparent text-[15px] leading-[1.62] text-[#34312b] outline-none placeholder:text-[#aaa69d]"
                placeholder="Type or paste your text here..."
              />

              <div className="mt-4 rounded-[20px] border border-[#e4e0d7] bg-white/75 p-3.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((value) => !value)}
                    className="flex size-9 items-center justify-center rounded-full bg-[#30302c] text-white shadow-sm transition hover:scale-105"
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                  >
                    {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
                  </button>
                  <span className="text-[10px] text-[#aaa59a]">{characterCount.toLocaleString()} / 5,000</span>
                </div>
                <div className="mt-3 flex h-9 items-center gap-[2px] overflow-hidden px-1 opacity-75">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className="w-[2px] shrink-0 rounded-full bg-[#c7a184] transition-all"
                      style={{ height: `${isPlaying ? height + ((index % 3) * 4) : height}px` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-[#ded9cf] bg-[#faf9f5] px-3 py-1.5 text-[10px] font-semibold text-[#625e56]">
                    <WandSparkles className="size-3" /> Enhance
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-[#ded9cf] bg-[#faf9f5] px-3 py-1.5 text-[10px] font-semibold text-[#625e56]">
                    <RefreshCw className="size-3" /> Regenerate
                  </button>
                  {audioUrl && (
                    <a href={audioUrl} download className="inline-flex items-center gap-1.5 rounded-full border border-[#ded9cf] bg-[#faf9f5] px-3 py-1.5 text-[10px] font-semibold text-[#625e56]">
                      <Download className="size-3" /> Download
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={model}
                    onChange={(event) => setModel(event.target.value as typeof model)}
                    className="appearance-none rounded-full border border-[#ded9cf] bg-white px-4 py-2 text-[10px] font-semibold text-[#625e56] outline-none"
                  >
                    <option value="elevenlabs-v3-tts">ElevenLabs V3</option>
                    <option value="elevenlabs-tts-turbo-2-5">Turbo 2.5</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowSettings((value) => !value)}
                    className="flex size-9 items-center justify-center rounded-full border border-[#ded9cf] bg-white text-[#777168] hover:bg-[#f1efe9]"
                    aria-label="Voice settings"
                  >
                    <SlidersHorizontal className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!text.trim() || mutation.isPending}
                  onClick={generate}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#30302c] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(48,48,44,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Mic className="size-3.5" />
                  {mutation.isPending || polling.isFetching ? "Generating…" : "Generate voice"}
                </button>
              </div>

              {showSettings && (
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-[#e2ded5] bg-[#f5f3ed] p-3">
                  <div className="rounded-xl bg-white px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#aaa59b]">Creativity</p>
                    <p className="mt-1 text-xs font-semibold">75%</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#aaa59b]">Stability</p>
                    <p className="mt-1 text-xs font-semibold">60%</p>
                  </div>
                </div>
              )}

              {(mutation.isError || polling.isError) && (
                <p className="mt-3 text-xs text-red-600">Unable to generate the voice. Please try again.</p>
              )}
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/90 bg-[#faf9f5] p-4 shadow-[0_20px_50px_rgba(74,69,57,0.09)] sm:p-5">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#aaa59b]">Featured Voices</p>
                <h2 className="mt-1 text-base font-semibold">Choose a voice</h2>
              </div>
              <Sparkles className="size-4 text-[#b68763]" />
            </div>

            <div className="mt-4 rounded-[20px] border border-[#e5e0d6] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#d39a72] text-white">
                    <Mic className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">James (Sample)</p>
                    <p className="mt-0.5 text-[9px] text-[#969187]">A natural, conversational voice</p>
                  </div>
                </div>
                <button type="button" className="flex size-8 items-center justify-center rounded-full bg-[#f1eee8] text-[#625e56]">
                  <Play className="ml-0.5 size-3 fill-current" />
                </button>
              </div>
              <div className="mt-3 flex h-7 items-center gap-[2px] overflow-hidden opacity-65">
                {bars.slice(0, 46).map((height, index) => (
                  <span key={index} className="w-[2px] shrink-0 rounded-full bg-[#c99b7b]" style={{ height: `${Math.max(8, height - 18)}px` }} />
                ))}
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-[#878279]">“Hello, this is a preview of my voice. I’m James, and I sound husky & engaging.”</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {voices.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setVoice(item.name)}
                  className={`rounded-[16px] border p-3 text-left transition ${voice === item.name ? "border-[#c99876] bg-[#f4ebe3] shadow-sm" : "border-[#e4dfd6] bg-white hover:bg-[#f6f4ef]"}`}
                >
                  <span className="flex size-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: item.color }}>
                    <Volume2 className="size-3" />
                  </span>
                  <p className="mt-2 text-[10px] font-semibold">{item.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[8px] leading-tight text-[#9a958b]">{item.tone}</p>
                </button>
              ))}
            </div>

            <button type="button" className="mt-4 flex w-full items-center justify-between rounded-[16px] border border-[#e4dfd6] bg-white px-4 py-3 text-left text-[10px] font-semibold text-[#625e56]">
              Browse all voices
              <ChevronDown className="size-3.5 text-[#aaa59b]" />
            </button>

            {audioUrl && (
              <div className="mt-4 rounded-[18px] bg-[#30302c] p-3 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold">Voice generated</p>
                    <p className="mt-0.5 text-[8px] text-white/55">Ready to preview or download</p>
                  </div>
                  <a href={audioUrl} download className="flex size-8 items-center justify-center rounded-full bg-white text-[#30302c]">
                    <Download className="size-3.5" />
                  </a>
                </div>
                <audio src={audioUrl} controls className="mt-3 h-8 w-full" />
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
