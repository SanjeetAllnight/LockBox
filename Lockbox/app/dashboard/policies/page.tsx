'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit2, Trash2, Info, Plus, Check, Shield, Clock, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IpEntry {
  id:          string
  ip:          string
  description: string
}

interface TimeWindow {
  enabled:   boolean
  startTime: string
  endTime:   string
  timezone:  string
}

interface RateLimit {
  requestsPerMinute: number
  requestsPerHour:   number
  burstLimit:        number
}

export default function PoliciesPage() {
  const policies = useStore(state => state.policies)
  const updatePolicies = useStore(state => state.updatePolicies)

  // ── Enforcement Mode ────────────────────────────────────────────────────────
  const enforcementMode = policies.enforcementMode
  const setEnforcementMode = (val: string) => updatePolicies({ enforcementMode: val as any })

  // ── IP Restrictions ─────────────────────────────────────────────────────────
  const ips = policies.ipRestrictions
  const setIps = useCallback((val: typeof ips | ((prev: typeof ips) => typeof ips)) => {
    const nextIps = typeof val === 'function' ? val(policies.ipRestrictions) : val
    updatePolicies({ ipRestrictions: nextIps })
  }, [policies.ipRestrictions, updatePolicies])
  
  const [ipModal, setIpModal]         = useState<'add' | 'edit' | null>(null)
  const [editingIp, setEditingIp]     = useState<any>(null)
  const [ipForm, setIpForm]           = useState({ ip: '', description: '' })

  // ── Time Window ─────────────────────────────────────────────────────────────
  const timeWindow = policies.timeWindows
  const setTimeWindow = useCallback((val: typeof timeWindow | ((prev: typeof timeWindow) => typeof timeWindow)) => {
    updatePolicies({ timeWindows: typeof val === 'function' ? val(policies.timeWindows) : val })
  }, [policies.timeWindows, updatePolicies])
  const [timeModal, setTimeModal]         = useState(false)
  const [timeForm, setTimeForm]           = useState(policies.timeWindows)

  // ── Rate Limit ──────────────────────────────────────────────────────────────
  const rateLimit = policies.rateLimit
  const setRateLimit = useCallback((val: typeof rateLimit | ((prev: typeof rateLimit) => typeof rateLimit)) => {
    updatePolicies({ rateLimit: typeof val === 'function' ? val(policies.rateLimit) : val })
  }, [policies.rateLimit, updatePolicies])
  const [rateModal, setRateModal]         = useState(false)
  const [rateForm, setRateForm]           = useState(policies.rateLimit)

  // ── IP handlers ─────────────────────────────────────────────────────────────

  const openAddIp = useCallback(() => {
    setIpForm({ ip: '', description: '' })
    setEditingIp(null)
    setIpModal('add')
  }, [])

  const openEditIp = useCallback((entry: IpEntry) => {
    setIpForm({ ip: entry.ip, description: entry.description })
    setEditingIp(entry)
    setIpModal('edit')
  }, [])

  const handleSaveIp = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedIp = ipForm.ip.trim()
    if (!trimmedIp) return

    if (ipModal === 'add') {
      const newEntry: IpEntry = {
        id:          Date.now().toString(),
        ip:          trimmedIp,
        description: ipForm.description.trim() || 'Custom entry',
      }
      setIps(prev => [...prev, newEntry])
      toast.success('IP added', { description: `${trimmedIp} added to whitelist` })
    } else if (ipModal === 'edit' && editingIp) {
      setIps(prev =>
        prev.map(e =>
          e.id === editingIp.id
            ? { ...e, ip: trimmedIp, description: ipForm.description.trim() }
            : e
        )
      )
      toast.success('IP updated', { description: `${trimmedIp} updated successfully` })
    }
    setIpModal(null)
  }, [ipModal, editingIp, ipForm])

  const handleDeleteIp = useCallback((entry: IpEntry) => {
    setIps(prev => prev.filter(e => e.id !== entry.id))
    toast.error('IP removed', { description: `${entry.ip} removed from whitelist` })
  }, [])

  // ── Time Window handlers ────────────────────────────────────────────────────

  const openEditTime = useCallback(() => {
    setTimeForm({ ...timeWindow })
    setTimeModal(true)
  }, [timeWindow])

  const handleSaveTime = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setTimeWindow({ ...timeForm })
    toast.success('Time window updated')
    setTimeModal(false)
  }, [timeForm])

  // ── Rate Limit handlers ─────────────────────────────────────────────────────

  const openEditRate = useCallback(() => {
    setRateForm({ ...rateLimit })
    setRateModal(true)
  }, [rateLimit])

  const handleSaveRate = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const rpm  = Math.max(1, Number(rateForm.requestsPerMinute) || 1)
    const rph  = Math.max(1, Number(rateForm.requestsPerHour)   || 1)
    const burst = Math.max(1, Number(rateForm.burstLimit)        || 1)
    setRateLimit({ requestsPerMinute: rpm, requestsPerHour: rph, burstLimit: burst })
    toast.success('Rate limits updated')
    setRateModal(false)
  }, [rateForm])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="pb-2">
        <h1 className="text-3xl font-bold text-foreground">Policies</h1>
        <p className="text-muted-foreground mt-2 text-sm">API access control and restrictions</p>
      </div>

      {/* ── Enforcement Mode ── */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <CardTitle>Enforcement Mode</CardTitle>
          </div>
          <CardDescription>Control how policies are applied to requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'active',   label: 'Active Enforcement', desc: 'Policies actively block non-compliant requests' },
              { key: 'shadow',   label: 'Shadow Mode',        desc: 'Policies log violations but allow requests' },
              { key: 'disabled', label: 'Disabled',           desc: 'All policies are disabled' },
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => {
                  setEnforcementMode(mode.key)
                  toast.success(`Enforcement mode set to ${mode.label}`)
                }}
                className={`p-4 text-left bg-input rounded-lg border transition-all ${
                  enforcementMode === mode.key
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{mode.label}</p>
                  {enforcementMode === mode.key && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{mode.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── IP Restrictions ── */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>IP Restrictions</CardTitle>
              <CardDescription>Allowed IP addresses and CIDR ranges</CardDescription>
            </div>
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openAddIp}>
            <Plus className="h-4 w-4 mr-1" /> Add IP
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-input rounded-lg border border-border flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">Requests from unlisted IP addresses will be blocked.</p>
          </div>

          {ips.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No IPs whitelisted — all requests will be blocked.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">IP Address / Range</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ips.map(entry => (
                    <TableRow key={entry.id} className="border-border hover:bg-accent/5 transition-colors">
                      <TableCell className="font-mono text-foreground">{entry.ip}</TableCell>
                      <TableCell className="text-foreground">{entry.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditIp(entry)}
                            className="p-1 hover:bg-accent/10 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-accent" />
                          </button>
                          <button
                            onClick={() => handleDeleteIp(entry)}
                            className="p-1 hover:bg-red-950/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Time Window ── */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Time Window</CardTitle>
              <CardDescription>Restrict API access to specific hours</CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-border" onClick={openEditTime}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-input rounded-lg border border-border flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">Requests outside the allowed window will be denied.</p>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-input rounded-lg border border-border mb-4">
            <div>
              <p className="text-foreground font-medium">Time-based Restrictions</p>
              <p className="text-sm text-muted-foreground mt-1">API access restricted to business hours</p>
            </div>
            <Badge className={timeWindow.enabled
              ? 'bg-green-950 text-green-300 border-green-700 border'
              : 'bg-input text-muted-foreground border border-border'
            }>
              {timeWindow.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Start Time', value: timeWindow.startTime },
              { label: 'End Time',   value: timeWindow.endTime },
              { label: 'Timezone',   value: timeWindow.timezone },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 bg-input rounded-lg border border-border">
                <p className="text-muted-foreground text-sm">{label}</p>
                <p className="text-foreground font-mono text-lg mt-2">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Rate Limiting ── */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>Request rate limits and burst thresholds</CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-border" onClick={openEditRate}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-input rounded-lg border border-border flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">Requests exceeding the limit will be rejected until the window resets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Requests / Minute', value: rateLimit.requestsPerMinute, unit: 'rpm' },
              { label: 'Requests / Hour',   value: rateLimit.requestsPerHour,   unit: 'rph' },
              { label: 'Burst Limit',       value: rateLimit.burstLimit,        unit: 'req' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="p-4 bg-input rounded-lg border border-border">
                <p className="text-muted-foreground text-sm">{label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-foreground font-mono text-2xl font-bold">{value}</p>
                  <span className="text-muted-foreground text-sm">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Modals                                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Add / Edit IP Modal ── */}
      <Dialog open={ipModal !== null} onOpenChange={open => !open && setIpModal(null)}>
        <DialogContent className="border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>{ipModal === 'add' ? 'Add IP to Whitelist' : 'Edit IP Entry'}</DialogTitle>
            <DialogDescription>
              {ipModal === 'add'
                ? 'Enter an IP address or CIDR range to allow.'
                : 'Modify the IP entry below.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveIp} className="space-y-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ip-input">IP Address / CIDR Range</Label>
              <Input
                id="ip-input"
                placeholder="e.g. 192.168.1.0/24 or 10.0.0.1"
                value={ipForm.ip}
                onChange={e => setIpForm(f => ({ ...f, ip: e.target.value }))}
                className="font-mono border-border bg-input text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ip-desc">Description</Label>
              <Input
                id="ip-desc"
                placeholder="e.g. Office network"
                value={ipForm.description}
                onChange={e => setIpForm(f => ({ ...f, description: e.target.value }))}
                className="border-border bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIpModal(null)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {ipModal === 'add' ? 'Add IP' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Time Window Modal ── */}
      <Dialog open={timeModal} onOpenChange={setTimeModal}>
        <DialogContent className="border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Time Window</DialogTitle>
            <DialogDescription>Set the allowed access hours for API requests.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTime} className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tw-enabled" className="text-foreground">Enable time restriction</Label>
              <Switch
                id="tw-enabled"
                checked={timeForm.enabled}
                onCheckedChange={v => setTimeForm(f => ({ ...f, enabled: v }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tw-start">Start Time</Label>
                <Input
                  id="tw-start"
                  type="time"
                  value={timeForm.startTime}
                  onChange={e => setTimeForm(f => ({ ...f, startTime: e.target.value }))}
                  className="border-border bg-input text-foreground font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tw-end">End Time</Label>
                <Input
                  id="tw-end"
                  type="time"
                  value={timeForm.endTime}
                  onChange={e => setTimeForm(f => ({ ...f, endTime: e.target.value }))}
                  className="border-border bg-input text-foreground font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tw-tz">Timezone</Label>
              <Select value={timeForm.timezone} onValueChange={v => setTimeForm(f => ({ ...f, timezone: v }))}>
                <SelectTrigger id="tw-tz" className="border-border bg-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {['UTC', 'US/Eastern', 'US/Pacific', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'].map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setTimeModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Rate Limit Modal ── */}
      <Dialog open={rateModal} onOpenChange={setRateModal}>
        <DialogContent className="border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rate Limits</DialogTitle>
            <DialogDescription>Adjust request thresholds. Changes take effect immediately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRate} className="space-y-4 mt-2">
            {[
              { key: 'requestsPerMinute' as const, label: 'Requests per Minute', min: 1 },
              { key: 'requestsPerHour'   as const, label: 'Requests per Hour',   min: 1 },
              { key: 'burstLimit'        as const, label: 'Burst Limit',          min: 1 },
            ].map(({ key, label, min }) => (
              <div key={key} className="flex flex-col gap-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={min}
                  value={rateForm[key]}
                  onChange={e => setRateForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="border-border bg-input text-foreground font-mono"
                />
              </div>
            ))}
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setRateModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
