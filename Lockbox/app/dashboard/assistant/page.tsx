'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { useStore } from '@/lib/store'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I&apos;m the LockBox AI Assistant. I have context on your current API keys, real-time logs, and security policies. How can I assist you?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Grab global context
  const logs = useStore(state => state.logs)
  const keys = useStore(state => state.apiKeys)
  const policies = useStore(state => state.policies)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
    }

    // append optimistically
    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInput('')
    setLoading(true)

    // Ensure React renders loading state before blocking
    await new Promise((resolve) => setTimeout(resolve, 800))

    const lowerInput = input.toLowerCase()
    let response = ''

    // ─── Attempt Real API Call First ─────────────────────────────────────────

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
            policies: { mode: policies.enforcementMode, rateLimit: policies.rateLimit }
          }
        })
      })

      if (!res.ok) throw new Error('API failed or missing keys')
      
      const data = await res.json()
      response = data.text

    } catch (err) {
      // ─── Rule-Based Heuristic AI Engine (Fallback) ─────────────────────────

      // 1. Contextual memory (if they ask a generic follow up)
      const prevMsg = currentMessages.length >= 3 ? currentMessages[currentMessages.length - 3] : null
      const prevAsstMsg = currentMessages.length >= 2 ? currentMessages[currentMessages.length - 2] : null

      if (lowerInput.includes('mean by that') || lowerInput.includes('explain more') || lowerInput === 'why?') {
        if (prevAsstMsg) {
          response = `Previously I mentioned: "${prevAsstMsg.content.slice(0, 40)}...". Let me elaborate. Our security system enforces policies across IP whitelists and Rate limits in real-time. Do you want to see your specific rule configurations?`
        } else {
          response = 'I am not sure what you are referring to. Could you clarify your question?'
        }
      } 
      // 2. Specific questions against real-time global state
      else if (lowerInput.includes('why') && lowerInput.includes('blocked')) {
        const lastBlock = logs.find(l => l.action === 'BLOCK')
        if (lastBlock) {
          response = `Looking at your recent logs, the last blocked request was for Key ID \`${lastBlock.keyId}\` from IP \`${lastBlock.ip}\`. The reason was: **${lastBlock.reason}** (Triggered by ${lastBlock.policyTriggered}).`
          
          if (lastBlock.reason.includes('IP')) {
             response += ` To fix this, you can whitelist the IP [${lastBlock.ip}] in the Policies page.`
          } else if (lastBlock.reason.includes('rate')) {
             response += ` Your current rate limit is ${policies.rateLimit.requestsPerMinute} req/min. You may want to increase this if it's a legitimate spike.`
          }
        } else {
          response = 'I checked your logs, and there are currently no blocked requests recorded! Your system is running smoothly.'
        }
      }
      else if (lowerInput.includes('risk score') || lowerInput.includes('risk')) {
        const highRisk = keys.filter(k => k.riskScore > 50).length
        response = `Risk Score indicates security threats based on blocked requests. Currently, you have **${keys.length} total API keys**. I noticed you have ${highRisk} keys with a high risk score (>50) in your system right now.`
      }
      else if (lowerInput.includes('create') && lowerInput.includes('key')) {
        response = 'You can create a new key in the API Keys page. When you do, it will immediately inherit the global settings currently tracking: ' + policies.ipRestrictions.length + ' whitelisted IPs.'
      }
      else if (lowerInput.includes('policy') || lowerInput.includes('policies')) {
        response = `Your system is in **${policies.enforcementMode.toUpperCase()}** mode. You have ${policies.ipRestrictions.length} whitelisted IPs, a rate limit of ${policies.rateLimit.requestsPerMinute} req/min, and time window restrictions are currently ${policies.timeWindows.enabled ? 'ON' : 'OFF'}.`
      }
      else if (lowerInput.includes('log') || lowerInput.includes('recent')) {
        const allowed = logs.filter(l => l.action === 'ALLOW').length
        const blocked = logs.filter(l => l.action === 'BLOCK').length
        response = `You have ${logs.length} total logs right now (${allowed} Allowed, ${blocked} Blocked). The most recent action was ${logs[0]?.action ?? 'NONE'} from ${logs[0]?.ip ?? 'N/A'}.`
      }
      // Fallback
      else {
        response = '*(Running in heuristic fallback mode)* I can query your live telemetry data to answer questions about blocked logs, API keys, or security policies. Can you be more specific? (Add a Gemini API key to unlock natural language understanding).'
      }
    }

    const assistantMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: response,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="pb-2">
        <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-muted-foreground mt-2 text-sm">Get real-time insights powered by your dashboard telemetry.</p>
      </div>

      <Card className="border-border bg-card flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle>LockBox Assistant</CardTitle>
          <CardDescription>Ask me about your API keys, recent logs, and active security policies.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-input text-foreground border border-border'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-input text-foreground border border-border px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="border-border bg-input text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
          <CardDescription>Quick access to context-aware queries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Why is my key blocked?',
              'What do my recent logs look like?',
              'What are my current security policies?',
              'What does risk score mean?',
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="p-3 text-left bg-input border border-border rounded-lg hover:bg-accent/10 transition-colors text-foreground text-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
