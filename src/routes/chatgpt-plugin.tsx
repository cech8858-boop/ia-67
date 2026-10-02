import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Code2, Copy, ExternalLink, Globe2, KeyRound, PlugZap, Rocket, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/chatgpt-plugin")({
  head: () => ({
    meta: [
      { title: "IA-67 · ChatGPT App & Plugin" },
      { name: "description", content: "Connect IA-67 to ChatGPT with an MCP server and creative AI tools." },
    ],
  }),
  component: ChatGptPluginPage,
});

const tools = [
  ["35 workspace tools", "Tous les modèles Workspace", "7 Image · 8 Video · 6 Audio · 7 3D · 7 Assistants"],
  ["list_models", "Lister les modèles", "ChatGPT découvre les 35 capacités IA-67"],
  ["enhance_prompt", "Améliorer un prompt", "Transforme une idée en prompt professionnel"],
  ["open_workspace", "Ouvrir Workspace", "Retourne vers l'interface IA-67"],
] as const;

function ChatGptPluginPage() {
  const [copied, setCopied] = useState(false);
  const [mcpUrl, setMcpUrl] = useState("https://YOUR-MCP-DOMAIN.example/mcp");
  const example = useMemo(() => ({
    prompt: "Crée une publicité vidéo pour un restaurant marocain moderne",
    tools: ["enhance_prompt", "generate_image", "open_workspace"],
  }), []);

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  return <main className="min-h-screen bg-[#07070a] text-white">
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/ai-hub" className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[.04]">←</a>
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500"><PlugZap className="size-5" /></div>
          <div><h1 className="text-xl font-semibold">IA-67 × ChatGPT</h1><p className="text-xs text-white/40">App ChatGPT · MCP · génération IA</p></div>
        </div>
        <a href="/ai-workspace" className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black">Ouvrir Workspace</a>
      </header>

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-cyan-500/10 p-6 sm:p-9">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-200"><Check className="size-3"/> PRÊT POUR MCP</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Fais utiliser IA-67 directement dans ChatGPT.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Ton application peut exposer ses fonctions comme des outils MCP : génération d'images, vidéo, audio, 3D, assistants, amélioration de prompts, sélection de modèles et ouverture du Workspace.</p>
          <div className="mt-6 flex flex-wrap gap-3"><a href="#connect" className="rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black">Configurer la connexion <ChevronRight className="ml-1 inline size-4"/></a><a href="#tools" className="rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold">Voir les outils</a></div>
        </div>
      </section>

      <section id="tools" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map(([id, title, desc]) => <div key={id} className="rounded-3xl border border-white/10 bg-white/[.03] p-5"><div className="grid size-10 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><Wrench className="size-4"/></div><p className="mt-4 text-sm font-semibold">{title}</p><p className="mt-1 text-[11px] leading-5 text-white/40">{desc}</p><code className="mt-4 block rounded-xl bg-black/30 p-2 text-[9px] text-white/35">{id}</code></div>)}
      </section>

      <section id="connect" className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-7">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-blue-400/10 text-blue-200"><Globe2 className="size-5"/></div><div><h3 className="font-semibold">Connexion MCP</h3><p className="text-[11px] text-white/35">Ton serveur doit être public en HTTPS.</p></div></div>
          <label className="mt-6 block text-[10px] uppercase tracking-widest text-white/35">URL du serveur MCP</label>
          <div className="mt-2 flex gap-2"><input value={mcpUrl} onChange={e=>setMcpUrl(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"/><button onClick={()=>copy(mcpUrl)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-black">{copied?<Check className="size-4"/>:<Copy className="size-4"/>}</button></div>
          <div className="mt-5 space-y-3 text-xs text-white/55"><Step n="1" text="Déploie le dossier mcp-server sur un serveur Node 20+ avec HTTPS."/><Step n="2" text="Ajoute FAL_KEY uniquement comme variable d'environnement serveur."/><Step n="3" text="Dans ChatGPT Developer Mode / Plugins, ajoute l'URL HTTPS qui finit par /mcp."/><Step n="4" text="Teste les outils puis prépare la soumission publique si tu veux le partager."/></div>
          <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-[11px] leading-5 text-amber-100/60"><ShieldCheck className="mr-2 inline size-4"/> Ne mets jamais ta FAL_KEY dans le navigateur, dans cette page ou dans GitHub.</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-7">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200"><Rocket className="size-5"/></div><div><h3 className="font-semibold">Exemple d'utilisation</h3><p className="text-[11px] text-white/35">Ce que l'utilisateur peut demander à ChatGPT.</p></div></div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs leading-6 text-white/70">« {example.prompt} »</p></div>
          <div className="mt-4 space-y-2">{example.tools.map((x,i)=><div key={x} className="flex items-center gap-3 rounded-xl border border-white/10 p-3"><span className="grid size-6 place-items-center rounded-full bg-violet-400/10 text-[10px] text-violet-200">{i+1}</span><code className="text-[10px] text-white/55">{x}</code></div>)}</div>
          <a href="https://developers.openai.com/plugins/quickstart" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-violet-200">Documentation OpenAI <ExternalLink className="size-3"/></a>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-7"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200"><Code2 className="size-5"/></div><div><h3 className="font-semibold">Structure ajoutée au projet</h3><p className="text-[11px] text-white/35">Le code MCP est dans <code>mcp-server/</code>.</p></div></div><pre className="mt-5 overflow-x-auto rounded-2xl bg-black/40 p-4 text-[10px] leading-5 text-white/45">{`mcp-server/\n  server.ts\n  workspace-tools.ts\n  package.json\n  README.md\n\n/mcp → 35 outils AI Workspace\n     → list_models\n     → enhance_prompt\n     → open_workspace`}</pre></section>
    </div>
  </main>;
}

function Step({ n, text }: { n: string; text: string }) { return <div className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[.06] text-[10px]">{n}</span><span>{text}</span></div>; }
