'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { Copy, Trash2, Info, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useStore, type ApiKeyRecord } from '@/lib/store'

// ── Helpers ────────────────────────────────────────────────────────────────────



const RISK_MAX = 10 // cap for the progress bar (10 blocked logs = 100%)

function ttlLabel(days: number) {
  if (days <= 0) return 'Revoked'
  if (days === 1) return '1 day'
  return `${days} days`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function KeysPage() {
  const keys = useStore(state => state.apiKeys)
  const logs = useStore(state => state.logs)
  const updateKey = useStore(state => state.updateKey)
  const addKey = useStore(state => state.addKey)

  const risks = useMemo(() => {
    const scores: Record<string, number> = {}
    for (const log of logs) {
      if (log.action === 'BLOCK') scores[log.keyId] = (scores[log.keyId] ?? 0) + 1
    }
    return scores
  }, [logs])
  const [open,  setOpen]  = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKeyRecord | null>(null)

  // ── Copy Key ────────────────────────────────────────────────────────────────
  const handleCopy = useCallback((id: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => toast.success('API key copied to clipboard'))
    } else {
      // Fallback for unsupported browsers
      const el = document.createElement('textarea')
      el.value = id
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      toast.success('API key copied to clipboard')
    }
  }, [])

  const [formData, setFormData] = useState({
    name:        '',
    service:     '',
    allowedIps:  '',
    rateLimit:   '100',
    ttlDays:     '30',
  })

  // ── Revoke ──────────────────────────────────────────────────────────────────
  const handleRevoke = useCallback((keyId: string) => {
    updateKey(keyId, { active: false, status: 'revoked', ttl: 'Revoked' })
  }, [updateKey])

  // ── Revoke All ──────────────────────────────────────────────────────────────
  const handleRevokeAll = useCallback(() => {
    keys.forEach(k => updateKey(k.id, { active: false, status: 'revoked', ttl: 'Revoked' }))
  }, [keys, updateKey])

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    const ttlDays    = parseInt(formData.ttlDays, 10) || 30
    const allowedIps = formData.allowedIps
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const now = Date.now()

    addKey({
      name:       formData.name || 'New API Key',
      service:    formData.service || 'Custom Service',
      status:     'active',
      active:     true,
      ttl:        ttlLabel(ttlDays),
      ttlMs:      now + ttlDays * 86_400_000,
      allowedIps: allowedIps.length ? allowedIps : ['127.0.0.1'],
      rateLimit:  parseInt(formData.rateLimit, 10) || 100,
      usageCount: 0,
      riskScore:  0,
      riskTrend:  0,
      createdAt:  new Date().toISOString().slice(0, 10),
      lastUsed:   'Never',
    })

    setOpen(false)
    setFormData({ name: '', service: '', allowedIps: '', rateLimit: '100', ttlDays: '30' })
  }, [formData, addKey])

  const activeCount = keys.filter(k => k.active).length

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-2 text-sm">Manage and monitor your API keys</p>
        </div>
        <div className="flex gap-2">
          {/* Revoke All */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4" />
                Revoke All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke All Keys?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will immediately disable all {activeCount} active key{activeCount !== 1 ? 's' : ''} across all services.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 px-4 bg-input rounded-lg border border-border">
                <p className="text-sm text-foreground font-mono">
                  {activeCount} active key{activeCount !== 1 ? 's' : ''} will be revoked instantly.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleRevokeAll}
                >
                  Confirm Revoke
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* Create Key */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>Generate a new API key for your service</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kname" className="text-foreground">Key Name</Label>
                  <Input
                    id="kname"
                    placeholder="e.g., Production API Key"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kservice" className="text-foreground">Service</Label>
                  <Input
                    id="kservice"
                    placeholder="e.g., Main API"
                    value={formData.service}
                    onChange={e => setFormData({ ...formData, service: e.target.value })}
                    className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kips" className="text-foreground">Allowed IPs <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                  <Input
                    id="kips"
                    placeholder="192.168.1.1, 10.0.0.1"
                    value={formData.allowedIps}
                    onChange={e => setFormData({ ...formData, allowedIps: e.target.value })}
                    className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="krate" className="text-foreground">Rate Limit <span className="text-muted-foreground text-xs">(req/min)</span></Label>
                    <Input
                      id="krate"
                      type="number"
                      min={1}
                      value={formData.rateLimit}
                      onChange={e => setFormData({ ...formData, rateLimit: e.target.value })}
                      className="border-border bg-input text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="kttl" className="text-foreground">TTL (Days)</Label>
                    <Input
                      id="kttl"
                      type="number"
                      min={1}
                      value={formData.ttlDays}
                      onChange={e => setFormData({ ...formData, ttlDays: e.target.value })}
                      className="border-border bg-input text-foreground"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Key
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage all your API keys and access tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Service</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">TTL</TableHead>
                  <TableHead className="text-muted-foreground">Rate Limit</TableHead>
                  <TableHead className="text-muted-foreground">Risk</TableHead>
                  <TableHead className="text-muted-foreground">Last Used</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No API keys exist in your workspace. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
                {keys.map(key => {
                  const riskCount = risks[key.id] ?? 0
                  const riskPct   = Math.min(riskCount / RISK_MAX, 1) * 100
                  const riskColor =
                    riskCount === 0 ? 'bg-green-500'
                    : riskCount < 3  ? 'bg-yellow-500'
                    :                  'bg-red-500'
                  const riskTextColor =
                    riskCount === 0 ? 'text-green-300'
                    : riskCount < 3  ? 'text-yellow-300'
                    :                  'text-red-300'

                  return (
                    <TableRow key={key.id} className="border-border hover:bg-accent/5">
                      <TableCell className="font-medium text-foreground">{key.name}</TableCell>
                      <TableCell className="text-foreground text-sm">{key.service}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={key.status === 'active' ? 'active' : 'revoked'}
                          label={key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                        />
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{key.ttl}</TableCell>
                      <TableCell className="text-foreground text-sm">{key.rateLimit}/min</TableCell>
                      <TableCell>
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${riskTextColor}`}>{riskCount}</span>
                            <span className="text-xs text-muted-foreground">blocked</span>
                          </div>
                          <div className="h-1.5 bg-input rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${riskColor}`}
                              style={{ width: `${riskPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{key.lastUsed}</TableCell>
                      <TableCell>
                        <TooltipProvider delayDuration={300}>
                          <div className="flex items-center gap-1.5">
                            {/* Copy */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  aria-label="Copy API key"
                                  className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                                  onClick={() => handleCopy(key.id)}
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Copy API key</TooltipContent>
                            </Tooltip>

                            {/* Info */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  aria-label="View key details"
                                  className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                                  onClick={() => setSelectedKey(key)}
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">View details</TooltipContent>
                            </Tooltip>

                            {/* Revoke */}
                            {key.status === 'active' && (
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        aria-label="Revoke key"
                                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus:ring-1 focus:ring-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Revoke key</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="border-border bg-card">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke "{key.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                      This will immediately block all requests made with this key.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex gap-3 justify-end mt-2">
                                    <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleRevoke(key.id)}
                                    >
                                      Revoke Key
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Key Details Modal ── */}
      <Dialog open={!!selectedKey} onOpenChange={(o) => !o && setSelectedKey(null)}>
        <DialogContent className="border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Key Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Full metadata for {selectedKey?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedKey && (() => {
            const riskCount = risks[selectedKey.id] ?? 0
            const riskColor = riskCount === 0 ? 'text-green-400' : riskCount < 3 ? 'text-yellow-400' : 'text-red-400'
            return (
              <div className="mt-1 space-y-3">
                {[
                  { label: 'Key ID',       value: <span className="font-mono text-xs break-all">{selectedKey.id}</span> },
                  { label: 'Name',         value: selectedKey.name },
                  { label: 'Service',      value: selectedKey.service },
                  { label: 'Status',       value: <StatusBadge status={selectedKey.status === 'active' ? 'active' : 'revoked'} label={selectedKey.status.charAt(0).toUpperCase() + selectedKey.status.slice(1)} /> },
                  { label: 'TTL',          value: selectedKey.ttl },
                  { label: 'Rate Limit',   value: `${selectedKey.rateLimit} req/min` },
                  { label: 'Risk Score',   value: <span className={`font-semibold ${riskColor}`}>{riskCount} blocked requests</span> },
                  { label: 'Created',      value: selectedKey.createdAt ?? 'Unknown' },
                  { label: 'Last Used',    value: selectedKey.lastUsed },
                  { label: 'Allowed IPs',  value: selectedKey.allowedIps?.join(', ') || 'All' },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground shrink-0 w-24">{row.label}</span>
                    <span className="text-sm text-foreground text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            )
          })()}
          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedKey && handleCopy(selectedKey.id)}
              className="border-border"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Key ID
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedKey(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
