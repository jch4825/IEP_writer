const OLLAMA_URL = import.meta.env.PROD ? 'http://127.0.0.1:11434' : '/ollama'

export async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return { ok: false, models: [], error: `HTTP ${res.status}` }
    const data = await res.json()
    const models = (data.models || []).map(m => m.name)
    return { ok: true, models }
  } catch (e) {
    return { ok: false, models: [], error: e?.message || 'Ollama connection failed' }
  }
}

export async function streamChat({ model, systemPrompt, messages, onToken, format, signal }) {
  const body = {
    model,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    options: { num_ctx: 4096 },
  }
  if (format) body.format = format

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) throw new Error(`Ollama 오류: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        const token = json?.message?.content ?? ''
        if (token) {
          full += token
          onToken(token, full)
        }
      } catch { /* 불완전한 JSON 라인 무시 */ }
    }
  }

  return full
}
