import { NextResponse } from 'next/server'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'gemma3:4b'

const SYSTEM_PROMPT = `You are LockBox AI, a professional API security monitoring system.

Pattern rules (check data before answering):
- Same IP blocked 2+ times → prepend "⚠ Suspicious activity detected"
- Same key blocked 2+ times → prepend "🔐 Key at risk"
- Multiple different failures → summarize the pattern, do not list each one individually.

Response rules:
- ONE root cause only. ONE fix only. ONE impact only.
- Never repeat the same information in Finding and Fix.
- Total response: 4-5 lines maximum. No filler phrases.

Format (strictly):
[label if pattern detected]
Finding: [root cause — cite key ID or trigger reason, not every IP]
Fix: [single most impactful action]
Impact: [one short consequence]`

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