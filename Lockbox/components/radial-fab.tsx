'use client'

import { useState } from 'react'
import { Sparkles, MessageSquare, HelpCircle, X, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface RadialFabProps {
  onOpenAi: () => void
}

// All angles point upward-left so nothing clips off the right/bottom edge.
// Standard math: 0° = right, 90° = up, 180° = left
// -90° = straight up, -120° = upper-left, -150° = more left
const ACTIONS = [
  { id: 'ai',       icon: Sparkles,     label: 'AI Assistant', color: 'bg-primary text-primary-foreground',          angleDeg: -90  },
  { id: 'feedback', icon: MessageSquare, label: 'Feedback',     color: 'bg-emerald-600 text-white',                  angleDeg: -130 },
  { id: 'help',     icon: HelpCircle,   label: 'Help',          color: 'bg-slate-600 text-white',                    angleDeg: -170 },
] as const

const RADIUS = 90   // px from FAB centre to sub-button centre

export function RadialFab({ onOpenAi }: RadialFabProps) {
  const [expanded, setExpanded] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleAction = (id: string) => {
    setExpanded(false)
    if (id === 'ai')       onOpenAi()
    if (id === 'feedback') setFeedbackOpen(true)
    if (id === 'help')     setHelpOpen(true)
  }

  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) return
    toast.success('Feedback submitted — thank you!')
    setFeedback('')
    setFeedbackOpen(false)
  }

  return (
    <>
      {/* ── FAB root — fixed bottom-right ───────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[60]" style={{ width: 56, height: 56 }}>

        {/* ── Radial sub-buttons ───────────────────────────────────────────── */}
        {ACTIONS.map((action, i) => {
          const rad = (action.angleDeg * Math.PI) / 180
          // x = positive → right, negative → left (safe, we're at the right edge)
          // y = positive → down, negative → up  (safe, we're at the bottom edge)
          const x = Math.cos(rad) * RADIUS   // will be ≤ 0 for angles -90…-180
          const y = Math.sin(rad) * RADIUS   // will be < 0 (upward) for all our angles

          // Label sits to the left of the button so it never clips off the right
          const labelOnLeft = x >= -10 // straight-up items get label below

          return (
            <div
              key={action.id}
              className="absolute"
              style={{
                // Position sub-button so its CENTRE sits at (x, y) from FAB centre
                left: 28 + x - 22,   // 28 = half of 56px FAB; 22 = half of 44px button
                top:  28 + y - 22,
                transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1), opacity 250ms ease',
                transitionDelay: expanded ? `${i * 50}ms` : '0ms',
                transform: expanded ? 'scale(1) translateZ(0)' : 'scale(0) translateZ(0)',
                opacity: expanded ? 1 : 0,
                pointerEvents: expanded ? 'auto' : 'none',
              }}
            >
              {/* Label */}
              <span
                className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium text-foreground whitespace-nowrap
                           bg-card/95 backdrop-blur-sm border border-border/60 shadow-md px-2 py-0.5 rounded-md"
                style={
                  labelOnLeft
                    ? { right: 50, left: 'auto' }   // straight-up: label to left
                    : { right: 50, left: 'auto' }   // all others: label to left
                }
              >
                {action.label}
              </span>

              {/* Icon button */}
              <button
                onClick={() => handleAction(action.id)}
                aria-label={action.label}
                className={`
                  w-11 h-11 rounded-full shadow-lg flex items-center justify-center
                  transition-transform duration-150 hover:scale-110 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-white/30
                  ${action.color}
                `}
              >
                <action.icon className="w-5 h-5" />
              </button>
            </div>
          )
        })}

        {/* ── Main FAB ─────────────────────────────────────────────────────── */}
        <button
          onClick={() => setExpanded(prev => !prev)}
          aria-label={expanded ? 'Close menu' : 'Open quick actions'}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center shadow-xl
            bg-primary text-primary-foreground hover:bg-primary/90
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
            ${expanded ? 'rotate-[135deg]' : 'rotate-0'}
          `}
          style={{ animation: expanded ? 'none' : 'fab-glow 2.5s ease-in-out infinite' }}
        >
          {expanded
            ? <X className="w-6 h-6" />
            : <Sparkles className="w-6 h-6" />
          }
        </button>
      </div>

      {/* ── Glow animation ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fab-glow {
          0%, 100% { box-shadow: 0 4px 24px -4px hsl(var(--primary) / 0.5), 0 0 0 0 hsl(var(--primary) / 0.3); }
          50%       { box-shadow: 0 4px 32px -4px hsl(var(--primary) / 0.7), 0 0 0 8px hsl(var(--primary) / 0);  }
        }
      `}</style>

      {/* ── Feedback Modal ──────────────────────────────────────────────────── */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="border-border bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Send Feedback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Share your thoughts, report a bug, or suggest a feature..."
              rows={4}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
              <Button
                onClick={handleFeedbackSubmit}
                disabled={!feedback.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Send className="w-4 h-4 mr-1" />Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Help Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="border-border bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              LockBox Help
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground pt-1">
            <p><strong className="text-foreground">API Keys</strong> — Create, monitor, and revoke access keys. Each key has an independent rate limit and IP allowlist.</p>
            <p><strong className="text-foreground">Logs</strong> — Every request is evaluated in real-time. Filter by ALLOW / BLOCK or search by key ID.</p>
            <p><strong className="text-foreground">Policies</strong> — Set global IP restrictions, rate limits, and time-window constraints.</p>
            <p><strong className="text-foreground">Test Console</strong> — Simulate requests against your current policy configuration without touching production.</p>
            <p><strong className="text-foreground">AI Assistant</strong> — Ask natural-language questions about your security posture, blocked requests, or key health.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
