'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
}

interface AiPanelProps {
  open: boolean
  onClose: () => void
}

export function AiPanel({ open, onClose }: AiPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm the LockBox AI Assistant. I have context on your current API keys, real-time logs, and security policies. How can I help?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const logs = useStore(s => s.logs)
  const keys = useStore(s => s.apiKeys)
  const policies = useStore(s => s.policies)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: input }
    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInput('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 600))

    const lowerInput = input.toLowerCase()
    let response = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: currentMessages,
          context: {
            logs: logs.slice(0, 5),
            keys: keys.map(k => ({ id: k.id, status: k.status, risk: k.riskScore })),
            policies: { mode: policies.enforcementMode, rateLimit: policies.rateLimit },
          },
        }),
      })
      if (!res.ok) throw new Error('API failed')
      const data = await res.json()
      response = data.text
    } catch {
      // Rule-based fallback
      const prevAsstMsg = currentMessages.length >= 2 ? currentMessages[currentMessages.length - 2] : null
      if (lowerInput.includes('mean by that') || lowerInput.includes('explain more') || lowerInput === 'why?') {
        response = prevAsstMsg
          ? `Previously I mentioned: "${prevAsstMsg.content.slice(0, 60)}...". Let me elaborate — our security system enforces policies across IP whitelists and rate limits in real-time.`
          : "Could you clarify what you're referring to?"
      } else if (lowerInput.includes('why') && lowerInput.includes('blocked')) {
        const lastBlock = logs.find(l => l.action === 'BLOCK')
        if (lastBlock) {
          response = `The last blocked request was Key \`${lastBlock.keyId}\` from IP \`${lastBlock.ip}\`. Reason: **${lastBlock.reason}** (${lastBlock.policyTriggered}).`
          if (lastBlock.reason.toLowerCase().includes('ip')) response += ` Fix: whitelist ${lastBlock.ip} in Policies.`
          else if (lastBlock.reason.toLowerCase().includes('rate')) response += ` Current rate limit: ${policies.rateLimit.requestsPerMinute} req/min.`
        } else {
          response = 'No blocked requests found — your system is running clean!'
        }
      } else if (lowerInput.includes('risk')) {
        const highRisk = keys.filter(k => (k.riskScore ?? 0) > 50).length
        response = `Risk Score is based on blocked request frequency. You have **${keys.length} keys** total — ${highRisk} are high-risk (>50).`
      } else if (lowerInput.includes('policy') || lowerInput.includes('policies')) {
        response = `Enforcement mode: **${policies.enforcementMode.toUpperCase()}**. ${policies.ipRestrictions.length} whitelisted IPs, ${policies.rateLimit.requestsPerMinute} req/min rate limit, time windows ${policies.timeWindows.enabled ? 'ON' : 'OFF'}.`
      } else if (lowerInput.includes('log')) {
        const allowed = logs.filter(l => l.action === 'ALLOW').length
        const blocked = logs.filter(l => l.action === 'BLOCK').length
        response = `${logs.length} total logs — ${allowed} allowed, ${blocked} blocked. Latest: ${logs[0]?.action ?? 'none'} from ${logs[0]?.ip ?? 'N/A'}.`
      } else {
        response = '*(Heuristic mode)* I can answer questions about blocked requests, API keys, or policies. Try asking "Why is my key blocked?" or "What are my current policies?"'
      }
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: response }])
    setLoading(false)
  }

  const quickQuestions = [
    'Why is my key blocked?',
    'What do my recent logs look like?',
    'What are my current policies?',
  ]

  return (
    <>
      {/* Backdrop overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full z-50 flex flex-col
          bg-card border-l border-border shadow-2xl
          transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0 w-[380px]' : 'translate-x-full w-[380px]'}
        `}
        aria-label="AI Assistant Panel"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">LockBox Assistant</p>
              <p className="text-xs text-muted-foreground">Context-aware · Live data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI panel"
            className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-input text-foreground border border-border rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-input border border-border px-3 py-2 rounded-xl rounded-bl-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-input border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-border">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={loading}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </aside>
    </>
  )
}
