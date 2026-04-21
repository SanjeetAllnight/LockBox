'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'error'
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
      content: "Hello! I'm LockBox AI — your context-aware security analyst. I can see your live API keys, recent request logs, and active policies. Ask me anything.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const logs     = useStore(s => s.logs)
  const keys     = useStore(s => s.apiKeys)
  const policies = useStore(s => s.policies)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: `u-${Date.now()}`, type: 'user', content: trimmed }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
          context: {
            // Last 10 logs — full objects so Gemini can see the exact reason field
            logs: logs.slice(0, 10).map(l => ({
              id:              l.id,
              keyId:           l.keyId,
              action:          l.action,
              ip:              l.ip,
              reason:          l.reason,
              policyTriggered: l.policyTriggered,
              timestamp:       l.timestamp,
            })),
            // Full key summary
            keys: keys.map(k => ({
              id:         k.id,
              name:       k.name,
              service:    k.service,
              status:     k.status,
              rateLimit:  k.rateLimit,
              allowedIps: k.allowedIps,
              riskScore:  k.riskScore,
              ttl:        k.ttl,
              lastUsed:   k.lastUsed,
            })),
            // Full policy configuration
            policies: {
              mode:          policies.enforcementMode,
              ipRestrictions: policies.ipRestrictions,
              timeWindows:   policies.timeWindows,
              rateLimit:     policies.rateLimit,
            },
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || data.fallback || !data.text) {
        throw new Error('ai_unavailable')
      }

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        type: 'assistant',
        content: data.text,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        type: 'error',
        content: 'AI unavailable — check that your Gemini API key is configured in `.env.local` (`GEMINI_API_KEY=...`) and restart the dev server.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    'Why was my last request blocked?',
    'Which key has the highest risk score?',
    'Summarise my current policies',
    'Are there any suspicious IPs?',
  ]

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full z-50 flex flex-col
          bg-card border-l border-border shadow-2xl
          transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0 w-[400px]' : 'translate-x-full w-[400px]'}
        `}
        aria-label="AI Assistant Panel"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">LockBox AI</p>
              <p className="text-xs text-muted-foreground">Gemini · Live context</p>
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'error' ? (
                <div className="flex items-start gap-2 max-w-[90%] px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{msg.content}</span>
                </div>
              ) : msg.type === 'user' ? (
                <div className="max-w-[85%] px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm leading-relaxed rounded-br-sm">
                  {msg.content}
                </div>
              ) : (
                /* Assistant — render Markdown */
                <div className="max-w-[92%] px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm leading-relaxed rounded-bl-sm prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                      ul:     ({ children }) => <ul className="list-disc pl-4 space-y-0.5 mb-1.5">{children}</ul>,
                      ol:     ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1.5">{children}</ol>,
                      li:     ({ children }) => <li className="text-foreground">{children}</li>,
                      code:   ({ children }) => <code className="bg-background px-1 py-0.5 rounded text-primary font-mono text-xs">{children}</code>,
                      h3:     ({ children }) => <h3 className="font-bold text-foreground mt-2 mb-1">{children}</h3>,
                      h4:     ({ children }) => <h4 className="font-semibold text-foreground mt-1.5 mb-0.5">{children}</h4>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-input border border-border px-3 py-2 rounded-xl rounded-bl-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick question chips */}
        <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => setInput(q)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full bg-input border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-border shrink-0">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your security data..."
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
