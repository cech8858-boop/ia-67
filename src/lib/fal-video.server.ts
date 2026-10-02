// Server-only FAL video queue helpers. Keeps FAL_KEY off the client.

const FAL_QUEUE_BASE = "https://queue.fal.run";

function falKey(): string | null {
  const key = process.env.FAL_KEY?.trim();
  return key || null;
}

async function request(path: string, init: RequestInit = {}) {
  const key = falKey();
  if (!key) throw new Error("FAL_KEY n'est pas configurée sur le serveur.");
  return fetch(`${FAL_QUEUE_BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function submitFalVideo(model: string, input: Record<string, unknown>) {
  const res = await request(model, {
    method: "POST",
    body: JSON.stringify(input),
  });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, body };
}

export async function getFalVideoStatus(model: string, requestId: string) {
  const res = await request(`${model}/requests/${encodeURIComponent(requestId)}/status?logs=false`);
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, body };
}

export async function getFalVideoResult(model: string, requestId: string) {
  const res = await request(`${model}/requests/${encodeURIComponent(requestId)}`);
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, body };
}

export function falVideoUrl(body: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (node: unknown): string | null => {
    if (typeof node === "string") {
      return /^https?:\/\//i.test(node) && /\.(mp4|mov|webm)(\?|$)/i.test(node) ? node : null;
    }
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    const record = node as Record<string, unknown>;
    for (const key of ["video", "video_url", "videoUrl", "output_url", "result_url", "url"]) {
      const value = record[key];
      if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
      const nested = walk(value);
      if (nested) return nested;
    }
    for (const value of Object.values(record)) {
      const nested = walk(value);
      if (nested) return nested;
    }
    return null;
  };
  return walk(body);
}

export function falError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    if (typeof r[key] === "string" && String(r[key]).trim()) return String(r[key]).slice(0, 300);
  }
  return null;
}
