// Fetch available model ids from an OpenAI-compatible `/v1/models` endpoint, used
// to populate the model picker in Settings once an API key is present. Kept as a
// plain browser `fetch` (no SDK dependency) so it works against OpenAI or any
// OpenAI-compatible gateway that exposes `/v1/models`.

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'

/** Normalizes an OpenAI-compatible API base URL for requests and cache keys. */
export function normalizeOpenAiBaseUrl(baseUrl?: string): string {
  return (baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, '')
}

// `/v1/models` also lists embeddings, audio, image and moderation models that
// can't drive a chat completion. Keep the ids that look like chat models; if the
// heuristic matches nothing (a gateway with unusual ids), the caller falls back
// to the full list rather than showing an empty picker.
function isChatModel(id: string): boolean {
  if (/embedding|whisper|tts|audio|image|dall-?e|moderation|realtime|transcrib|search|similarity|babbage|davinci/i.test(id))
    return false
  return /^(?:gpt-|o\d|chatgpt)/i.test(id)
}

export async function listOpenAiModels(apiKey: string, baseUrl?: string): Promise<string[]> {
  const base = normalizeOpenAiBaseUrl(baseUrl)
  const res = await fetch(`${base}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}`.trim())

  const json = (await res.json()) as { data?: Array<{ id?: unknown }> }
  const ids = (json.data ?? [])
    .map(m => m.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  const chat = ids.filter(isChatModel)
  return (chat.length ? chat : ids).sort((a, b) => a.localeCompare(b))
}
