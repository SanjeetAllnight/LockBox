import { NextResponse } from 'next/server'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'gemma3:4b'

const SYSTEM_PROMPT = `You are LockBox AI, a security analyst for API key management.

Given logs, keys, and policies:
- Identify why a request was blocked or allowed (cite key ID, IP, reason).
- If the same IP appears in multiple blocks, mark it as suspicious.
- If the same key is blocked repeatedly, flag it as high risk.
- Always suggest a concrete, specific fix.

Respond in this format only:
Finding: [what happened - use exact IDs, IPs, reasons from the data]
Fix: [exact action to take - e.g. whitelist IP x.x.x.x, increase rate limit to N]
Impact: [what happens if not fixed]`

export async function POST(req: Request) {
  const { message, context } = await req.json().catch(() => ({ message: '', context: {} }))

  // Compact context — essential fields only, no pretty-printing
  const ctx = {
    keys: (context.keys ?? []).slice(0, 3).map((k: Record<string, unknown>) => ({
      id: k.id, name: k.name, status: k.status, rateLimit: k.rateLimit, allowedIps: k.allowedIps,
    })),
    logs: (context.logs ?? []).slice(0, 5).map((l: Record<string, unknown>) => ({
      keyId: l.keyId, action: l.action, ip: l.ip, reason: l.reason, policyTriggered: l.policyTriggered,
    })),
    policies: {
      mode: context.policies?.mode,
      ipRestrictions: context.policies?.ipRestrictions,
      rateLimit: context.policies?.rateLimit,
    },
  }

  // Structured prompt — clear sections for local model, no conversation history
  const prompt = `### SYSTEM
${SYSTEM_PROMPT}

### DATA
${JSON.stringify(ctx)}

### QUESTION
${message}

### ANSWER
`

  try {
    let res: Response
    try {
      res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, prompt, stream: false }),
      })
    } catch {
      // Ollama server is unreachable
      console.error('[/api/chat] Ollama server is down or not running')
      return NextResponse.json(
        { error: 'Ollama not running. Start it with: ollama serve', fallback: true },
        { status: 500 }
      )
    }

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText)
      console.error('[/api/chat] Ollama error:', res.status, body)
      return NextResponse.json(
        { error: `Ollama request failed (${res.status}): ${body}`, fallback: true },
        { status: 500 }
      )
    }

    const data = await res.json().catch(() => null)
    const text: string = data?.response?.trim() ?? ''

    if (!text) {
      console.error('[/api/chat] Ollama returned empty response')
      return NextResponse.json(
        { error: 'Empty AI response. The model may still be loading.', fallback: true },
        { status: 500 }
      )
    }

    return NextResponse.json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/chat] Unexpected error:', msg)
    return NextResponse.json({ error: msg, fallback: true }, { status: 500 })
  }
}