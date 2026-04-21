'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, RefreshCw, Wifi } from 'lucide-react'
import { useStore, type LogEntry } from '@/lib/store'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTrace(log: LogEntry): { check: string; result: 'passed' | 'failed'; detail: string }[] {
  const reason = log.reason.toLowerCase()
  const pass = (label: string, detail: string) => ({ check: label, result: 'passed' as const, detail })
  const fail = (label: string, detail: string) => ({ check: label, result: 'failed' as const, detail })

  if (log.action === 'ALLOW') {
    return [
      pass('Key validation', 'Key is valid and active'),
      pass('TTL check',      'Key expiry is valid'),
      pass('IP check',       'Source IP is whitelisted'),
      pass('Rate limit',     'Request is within rate limit'),
    ]
  }
  if (reason.includes('revoked'))                        return [fail('Key validation', 'Key has been revoked')]
  if (reason.includes('expired'))                        return [pass('Key validation', 'Key is valid'), fail('TTL check', 'Key has expired')]
  if (reason.includes('ip') || reason.includes('white')) return [
    pass('Key validation', 'Key is valid and active'),
    pass('TTL check',      'Key expiry is valid'),
    fail('IP check',       `Source IP ${log.ip} is not whitelisted`),
  ]
  if (reason.includes('rate'))                           return [
    pass('Key validation', 'Key is valid and active'),
    pass('TTL check',      'Key expiry is valid'),
    pass('IP check',       'Source IP is whitelisted'),
    fail('Rate limit',     'Rate limit exceeded for this key'),
  ]
  return [fail('Key validation', log.reason)]
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const allLogs = useStore(state => state.logs)
  const [filterAction,  setFilterAction]  = useState<string>('all')
  const [filterKeyId,   setFilterKeyId]   = useState<string>('all')
  const [searchIp,      setSearchIp]      = useState('')
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [newIds,        setNewIds]        = useState<Set<string>>(new Set())  // IDs arrived this session
  const [liveIndicator, setLiveIndicator] = useState(false)  // pulse when new logs arrive

  // Track the IDs we knew about on mount so only truly new ones get highlighted
  const knownIdsRef = useRef<Set<string>>(new Set(allLogs.map(l => l.id)))

  useEffect(() => {
    const freshNewIds = allLogs.map(l => l.id).filter(id => !knownIdsRef.current.has(id))
    
    if (freshNewIds.length > 0) {
      // Add to known set
      freshNewIds.forEach(id => knownIdsRef.current.add(id))

      // Mark new for highlight animation
      setNewIds(prev => {
        const next = new Set(prev)
        freshNewIds.forEach(id => next.add(id))
        return next
      })

      // Show live pulse indicator briefly
      setLiveIndicator(true)
      setTimeout(() => setLiveIndicator(false), 2000)

      // Clear highlight class after animation finishes (2.4s)
      setTimeout(() => {
        setNewIds(prev => {
          const next = new Set(prev)
          freshNewIds.forEach(id => next.delete(id))
          return next
        })
      }, 2500)
    }
  }, [allLogs])

  const uniqueKeyIds = useMemo(
    () => Array.from(new Set(allLogs.map(l => l.keyId))).sort(),
    [allLogs]
  )

  const filteredLogs = useMemo(
    () => allLogs.filter(log => {
      const actionMatch = filterAction === 'all' || log.action === filterAction
      const keyMatch    = filterKeyId  === 'all' || log.keyId  === filterKeyId
      const ipMatch     = searchIp === ''         || log.ip.includes(searchIp)
      return actionMatch && keyMatch && ipMatch
    }),
    [allLogs, filterAction, filterKeyId, searchIp]
  )

  const blockedCount = useMemo(() => allLogs.filter(l => l.action === 'BLOCK').length, [allLogs])
  const allowedCount = useMemo(() => allLogs.filter(l => l.action === 'ALLOW').length, [allLogs])

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Logs</h1>
          <p className="text-muted-foreground mt-2 text-sm">API request logs and access records</p>
        </div>
        {/* Live indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          liveIndicator
            ? 'border-green-700 bg-green-950/40 text-green-300'
            : 'border-border bg-card text-muted-foreground'
        }`}>
          <Wifi className={`h-3.5 w-3.5 ${liveIndicator ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{allLogs.length}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border border-green-800/50">
          <p className="text-xs text-green-400/70 uppercase tracking-wide">Allowed</p>
          <p className="text-2xl font-bold text-green-300 mt-1">{allowedCount}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border border-red-800/50">
          <p className="text-xs text-red-400/70 uppercase tracking-wide">Blocked</p>
          <p className="text-2xl font-bold text-red-300 mt-1">{blockedCount}</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Request Logs</CardTitle>
          <CardDescription>
            Live view — new entries from Test Console appear instantly. Click a row to expand its decision trace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wide">
                  Search IP
                </label>
                <Input
                  placeholder="e.g., 192.168.1.42"
                  value={searchIp}
                  onChange={e => setSearchIp(e.target.value)}
                />
              </div>
              <div className="w-full md:w-40">
                <label className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wide">
                  Key ID
                </label>
                <Select value={filterKeyId} onValueChange={setFilterKeyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Keys</SelectItem>
                    {uniqueKeyIds.map(id => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-40">
                <label className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wide">
                  Action
                </label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="ALLOW">Allowed</SelectItem>
                    <SelectItem value="BLOCK">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            <p className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-medium">{filteredLogs.length}</span> of{' '}
              <span className="text-foreground font-medium">{allLogs.length}</span> logs
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-6" />
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Key ID</TableHead>
                  <TableHead className="text-muted-foreground">IP Address</TableHead>
                  <TableHead className="text-muted-foreground">Action</TableHead>
                  <TableHead className="text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-muted-foreground">Policy Triggered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No logs found matching the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id
                  const isNew      = newIds.has(log.id)
                  const trace      = buildTrace(log)

                  // Highlight class: new entries get a colour flash animation
                  const highlightClass = isNew
                    ? log.action === 'ALLOW' ? 'log-row-new-allow' : 'log-row-new-block'
                    : log.action === 'BLOCK'
                      ? 'bg-red-950/10 hover:bg-red-950/20'
                      : 'hover:bg-accent/5'

                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className={`border-border cursor-pointer transition-colors ${highlightClass}`}
                      >
                        <TableCell className="pr-0">
                          {isExpanded
                            ? <ChevronDown  className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground">{log.timestamp}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{log.keyId}</TableCell>
                        <TableCell className="font-mono text-sm text-foreground">{log.ip}</TableCell>
                        <TableCell>
                          <Badge className={
                            log.action === 'ALLOW'
                              ? 'bg-green-950/40 text-green-300 border-green-700/50'
                              : 'bg-red-950/40 text-red-300 border-red-700/50'
                          }>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground text-sm max-w-[200px] truncate">{log.reason}</TableCell>
                        <TableCell className="text-foreground text-sm font-mono text-xs">{log.policyTriggered}</TableCell>
                      </TableRow>

                      {/* Inline expanded decision trace */}
                      {isExpanded && (
                        <TableRow
                          key={`${log.id}-expand`}
                          className={log.action === 'BLOCK' ? 'bg-red-950/5' : 'bg-accent/5'}
                        >
                          <TableCell colSpan={7} className="pb-5 pt-2 px-8">
                            <div className="space-y-2">
                              {/* Meta row */}
                              <div className="flex flex-wrap gap-4 mb-3">
                                <span className="text-xs text-muted-foreground">
                                  Key: <span className="font-mono text-foreground">{log.keyId}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  IP: <span className="font-mono text-foreground">{log.ip}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Policy: <span className="font-mono text-foreground">{log.policyTriggered}</span>
                                </span>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                                Decision Trace
                              </p>
                              {trace.map((step, i) => (
                                <div
                                  key={i}
                                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
                                    step.result === 'passed'
                                      ? 'border-green-900/40 bg-green-950/15'
                                      : 'border-red-900/40 bg-red-950/15'
                                  }`}
                                >
                                  <span className="mt-0.5">
                                    {step.result === 'passed'
                                      ? <CheckCircle className="h-4 w-4 text-green-400" />
                                      : <XCircle    className="h-4 w-4 text-red-400" />
                                    }
                                  </span>
                                  <div>
                                    <p className="text-sm text-foreground font-medium">{step.check}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>

            {filteredLogs.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No logs match the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
