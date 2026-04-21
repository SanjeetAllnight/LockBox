'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Zap, RefreshCw, Loader2 } from 'lucide-react'
import { useStore, type ApiKeyRecord } from '@/lib/store'
import { evaluateRequest, type TraceStep } from '@/lib/engine'
import { emitNewLog } from '@/lib/log-store'

// ── helpers ───────────────────────────────────────────────────────────────────

function randomIp() {
  return `${Math.floor(Math.random() * 223 + 1)}.${Math.floor(Math.random() * 254 + 1)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254 + 1)}`
}

interface DisplayStep {
  check:  string
  result: 'passed' | 'failed'
  detail: string
}

const DETAIL_MAP: Record<string, { pass: string; fail: string }> = {
  'Key validation': { pass: 'Key is valid and active',        fail: 'Key has been revoked' },
  'TTL check':      { pass: 'Key expiry is valid',            fail: 'Key has expired' },
  'IP check':       { pass: 'Source IP is whitelisted',       fail: 'Source IP is not whitelisted' },
  'Rate limit':     { pass: 'Below rate limit threshold',     fail: 'Rate limit exceeded for this key' },
}

function toDisplayStep(t: TraceStep): DisplayStep {
  const d = DETAIL_MAP[t.step]
  return {
    check:  t.step,
    result: t.status === 'pass' ? 'passed' : 'failed',
    detail: t.status === 'pass' ? (d?.pass ?? '') : (d?.fail ?? ''),
  }
}

// Delay between each step reveal (ms)
const STEP_DELAY = 280
const PRE_DELAY  = 600        // "thinking" time before first step

// ─────────────────────────────────────────────────────────────────────────────

interface Result {
  decision: 'ALLOW' | 'BLOCK'
  reason:   string
  allSteps: DisplayStep[]
}

interface PipelineState {
  visibleSteps:  DisplayStep[]
  finalDecision: 'ALLOW' | 'BLOCK' | null
}

export default function ConsolePage() {
  const keys = useStore(state => state.apiKeys)
  const addLog = useStore(state => state.addLog)

  const [selectedKeyId, setSelectedKeyId] = useState<string>(keys[0]?.id ?? '')
  const [ipInput,   setIpInput]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [usedIp,    setUsedIp]    = useState('')
  const [result,    setResult]    = useState<Result | null>(null)
  const [pipeline,  setPipeline]  = useState<PipelineState>({ visibleSteps: [], finalDecision: null })

  // Keep a stable ref to cancel in-flight step reveals if another request fires
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([])



  const selectedKey: ApiKeyRecord | undefined = keys.find(k => k.id === selectedKeyId)

  const handleSendRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKey) return

    // Cancel any pending step-reveal timers from the previous run
    revealTimers.current.forEach(clearTimeout)
    revealTimers.current = []

    setLoading(true)
    setResult(null)
    setPipeline({ visibleSteps: [], finalDecision: null })

    // Simulate network latency (600–900ms)
    const delay = 600 + Math.random() * 300
    await new Promise(r => setTimeout(r, delay))

    const ip        = ipInput.trim() || randomIp()
    const timestamp = Date.now()

    const engineKey = {
      id:         selectedKey.id,
      active:     selectedKey.active,
      ttl:        selectedKey.ttlMs,
      allowedIps: selectedKey.allowedIps,
      rateLimit:  selectedKey.rateLimit,
    }

    const engineResult = evaluateRequest(engineKey, { ip, timestamp })
    const allSteps     = engineResult.decisionTrace.map(toDisplayStep)

    // Persist log + notify other pages
    addLog({
      keyId:           selectedKey.id,
      ip,
      timestamp:       new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19),
      action:          engineResult.decision,
      reason:          engineResult.reason,
      policyTriggered: engineResult.decisionTrace.find(t => t.status === 'fail')?.step ?? 'All checks',
    })
    emitNewLog()

    setUsedIp(ip)
    setResult({ decision: engineResult.decision, reason: engineResult.reason, allSteps })
    setLoading(false)

    // ── Step-by-step reveal ───────────────────────────────────────────────────
    allSteps.forEach((_, idx) => {
      const t = setTimeout(
        () => {
          setPipeline(prev => {
            const next = {
              visibleSteps:  allSteps.slice(0, idx + 1),
              finalDecision: idx === allSteps.length - 1 ? engineResult.decision : null,
            }
            return next
          })

          // Fire toast on the last step
          if (idx === allSteps.length - 1) {
            if (engineResult.decision === 'ALLOW') {
              toast.success('Request Allowed', {
                description: `${ip} → ${selectedKey.name}`,
              })
            } else {
              toast.error(`Blocked: ${engineResult.reason}`, {
                description: `${ip} → ${selectedKey.name}`,
              })
            }
          }
        },
        PRE_DELAY + idx * STEP_DELAY
      )
      revealTimers.current.push(t)
    })
  }, [selectedKey, ipInput])

  // ── Status label during loading ───────────────────────────────────────────
  const loadingLabel = loading
    ? ['Connecting…', 'Identifying key…', 'Evaluating policy…'][Math.floor(Date.now() / 400) % 3]
    : 'Send Request'

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="pb-2">
        <h1 className="text-3xl font-bold text-foreground">Test Console</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Test your API keys against the live security engine
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>API Request Tester</CardTitle>
          <CardDescription>
            Select a key and simulate an incoming request through the security pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendRequest} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key selector */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="keySelect" className="text-sm font-medium">API Key</Label>
                <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                  <SelectTrigger id="keySelect">
                    <SelectValue placeholder="Select a key…" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {keys.map(k => (
                      <SelectItem key={k.id} value={k.id}>
                        <span className="font-mono text-xs">[{k.id}]</span>&nbsp;{k.name}
                        {!k.active && <span className="ml-2 text-red-400 text-xs">(revoked)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedKey && (
                  <p className="text-xs text-muted-foreground">
                    Service: <span className="text-foreground">{selectedKey.service}</span>
                    &nbsp;·&nbsp;Rate limit: <span className="text-foreground">{selectedKey.rateLimit} req/min</span>
                    &nbsp;·&nbsp;Status: <span className={selectedKey.active ? 'text-green-400' : 'text-red-400'}>
                      {selectedKey.active ? 'Active' : 'Revoked'}
                    </span>
                  </p>
                )}
              </div>

              {/* IP input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ipInput" className="text-sm font-medium">Source IP</Label>
                <div className="flex gap-2">
                  <Input
                    id="ipInput"
                    placeholder="Leave blank for random IP"
                    value={ipInput}
                    onChange={e => setIpInput(e.target.value)}
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Generate random IP"
                    onClick={() => setIpInput(randomIp())}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {selectedKey && (
                  <p className="text-xs text-muted-foreground">
                    Allowed IPs: <span className="font-mono text-foreground">{selectedKey.allowedIps.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedKey}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Evaluating…</>
                : <><Zap className="mr-2 h-4 w-4" />Send Request</>
              }
            </Button>
          </form>

          {/* ── Result Panel ── */}
          {result && (
            <div className="mt-8 pt-8 border-t border-border space-y-5">
              {/* Decision header */}
              <div className="flex items-center gap-3">
                {result.decision === 'ALLOW' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <Badge className="bg-green-950 text-green-300 border-green-700 border text-sm px-3 py-1">
                      ALLOWED
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    <Badge className="bg-red-950 text-red-300 border-red-700 border text-sm px-3 py-1">
                      BLOCKED
                    </Badge>
                  </>
                )}
                <span className="text-sm text-muted-foreground font-mono">{usedIp}</span>
              </div>

              {/* Reason */}
              <div className={`rounded-lg border p-4 ${
                result.decision === 'ALLOW'
                  ? 'bg-green-950/20 border-green-800/40'
                  : 'bg-red-950/20 border-red-800/40'
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                <p className={`font-medium ${result.decision === 'ALLOW' ? 'text-green-300' : 'text-red-300'}`}>
                  {result.reason}
                </p>
              </div>

              {/* Step-by-step Decision Trace */}
              <div className="bg-input rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-4">Decision Trace</p>

                {/* Pipeline nodes */}
                <div className="flex items-center gap-3 flex-wrap mb-6">
                  {result.allSteps.map((step, i) => {
                    const visible = i < pipeline.visibleSteps.length
                    const s = pipeline.visibleSteps[i]
                    const passed = s?.result === 'passed'

                    return (
                      <div key={step.check} className="flex items-center gap-2">
                        <div
                          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                            visible ? 'trace-step-enter opacity-100' : 'opacity-0'
                          }`}
                          style={{ animationDelay: `0ms` }}
                        >
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                            !visible
                              ? 'border-border bg-input'
                              : passed
                                ? 'border-green-500 bg-green-950/40'
                                : 'border-red-500 bg-red-950/40'
                          }`}>
                            {visible && (passed
                              ? <CheckCircle className="h-5 w-5 text-green-400" />
                              : <XCircle className="h-5 w-5 text-red-400" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground text-center leading-tight max-w-[64px]">
                            {step.check}
                          </span>
                        </div>
                        {i < result.allSteps.length - 1 && (
                          <span className="text-muted-foreground text-lg mb-4">›</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Step detail list */}
                <div className="space-y-2">
                  {pipeline.visibleSteps.map((step, i) => (
                    <div
                      key={step.check}
                      className={`trace-step-enter flex items-start gap-3 rounded-lg border p-3 ${
                        step.result === 'passed'
                          ? 'border-green-900/50 bg-green-950/20'
                          : 'border-red-900/50 bg-red-950/20'
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="mt-0.5">
                        {step.result === 'passed'
                          ? <CheckCircle className="h-4 w-4 text-green-400" />
                          : <XCircle    className="h-4 w-4 text-red-400" />
                        }
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${step.result === 'passed' ? 'text-green-300' : 'text-red-300'}`}>
                          {step.check}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final decision stamp (appears after all steps) */}
                {pipeline.finalDecision && (
                  <div className={`trace-step-enter mt-4 flex items-center justify-between rounded-lg border p-4 ${
                    pipeline.finalDecision === 'ALLOW'
                      ? 'border-green-700/50 bg-green-950/30'
                      : 'border-red-700/50 bg-red-950/30'
                  }`}>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Final Decision</p>
                      <p className={`text-lg font-bold ${pipeline.finalDecision === 'ALLOW' ? 'text-green-300' : 'text-red-300'}`}>
                        {pipeline.finalDecision}
                      </p>
                    </div>
                    {pipeline.finalDecision === 'ALLOW'
                      ? <CheckCircle className="h-10 w-10 text-green-400 opacity-80" />
                      : <XCircle    className="h-10 w-10 text-red-400 opacity-80" />
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-8 pt-8 border-t border-border space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground italic">Running security pipeline…</span>
              </div>
              <div className="space-y-2">
                {['Key validation', 'TTL check', 'IP check', 'Rate limit'].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-input/40">
                    <div
                      className="w-3 h-3 rounded-full bg-muted-foreground/30 animate-pulse"
                      style={{ animationDelay: `${i * 180}ms` }}
                    />
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Current status of all API services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Main API',          status: 'online' },
              { name: 'Staging API',       status: 'online' },
              { name: 'Analytics Service', status: 'online' },
              { name: 'Webhooks Service',  status: 'online' },
            ].map(svc => (
              <div
                key={svc.name}
                className="flex items-center justify-between p-3 bg-input rounded-lg border border-border"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block animate-pulse" />
                  <span className="text-foreground">{svc.name}</span>
                </div>
                <Badge className="bg-green-950 text-green-300 border-green-700 border">Online</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
