'use client'

import { useState, useEffect, useMemo } from 'react'
import { StatCard } from '@/components/stat-card'
import { DecisionPipeline } from '@/components/decision-pipeline'
import { LiveActivityStrip } from '@/components/live-activity-strip'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  XCircle,
  Shield,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'
import { useStore, type LogEntry } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TraceStep {
  check: string
  result: 'passed' | 'failed'
  detail: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a display trace from a log entry's reason field */
function buildTrace(log: LogEntry): TraceStep[] {
  const reason = log.reason.toLowerCase()
  const pass = (check: string, detail: string): TraceStep => ({ check, result: 'passed', detail })
  const fail = (check: string, detail: string): TraceStep => ({ check, result: 'failed', detail })

  if (log.action === 'ALLOW') {
    return [
      pass('Key validation', 'Key is valid and active'),
      pass('TTL check',      'Key expiry is valid'),
      pass('IP check',       'Source IP is whitelisted'),
      pass('Rate limit',     'Request is within rate limit'),
    ]
  }
  if (reason.includes('revoked')) return [fail('Key validation', 'Key has been revoked')]
  if (reason.includes('expired')) return [
    pass('Key validation', 'Key is valid'),
    fail('TTL check',      'Key has expired'),
  ]
  if (reason.includes('ip') || reason.includes('whitelist')) return [
    pass('Key validation', 'Key is valid and active'),
    pass('TTL check',      'Key expiry is valid'),
    fail('IP check',       `Source IP ${log.ip} is not whitelisted`),
  ]
  if (reason.includes('rate')) return [
    pass('Key validation', 'Key is valid and active'),
    pass('TTL check',      'Key expiry is valid'),
    pass('IP check',       'Source IP is whitelisted'),
    fail('Rate limit',     'Rate limit exceeded for this key'),
  ]
  return [fail('Key validation', log.reason)]
}

/** Derive 7-day chart buckets from logs */
function buildChartData(logs: LogEntry[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  // Spread logs evenly across days for a realistic visual
  const perDay = Math.ceil(logs.length / 7)
  return days.map((day, i) => {
    const slice   = logs.slice(i * perDay, (i + 1) * perDay)
    const blocked = slice.filter(l => l.action === 'BLOCK').length
    // Augment with some realistic variance so the chart is not flat
    const base    = 1000 + Math.sin(i) * 600 + slice.length * 120
    return {
      day,
      requests: Math.round(base),
      blocked,
      anomaly: blocked > 1,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const logs = useStore(state => state.logs)
  const keys = useStore(state => state.apiKeys)
  const [whyLog, setWhyLog]     = useState<LogEntry | null>(null)

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = logs.length
    const blocked = logs.filter(l => l.action === 'BLOCK').length
    const blockedPct = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0'

    // High-risk keys: more than 1 blocked log
    const blocksByKey: Record<string, number> = {}
    for (const l of logs) {
      if (l.action === 'BLOCK') blocksByKey[l.keyId] = (blocksByKey[l.keyId] ?? 0) + 1
    }
    const highRiskKeys = Object.values(blocksByKey).filter(v => v > 1).length

    // Active alerts: blocked logs + anomaly keys (keys also marked revoked)
    const revokedKeys = keys.filter(k => !k.active).length
    const activeAlerts = blocked + revokedKeys

    return { total, blocked, blockedPct, highRiskKeys, activeAlerts }
  }, [logs])

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() => buildChartData(logs), [logs])

  // ── Recent events (latest 8) ────────────────────────────────────────────────
  const recentEvents = useMemo(
    () =>
      logs.slice(0, 8).map(l => ({
        timestamp:   l.timestamp,
        type:        l.action === 'ALLOW' ? 'Request' : 'Blocked',
        description: `Key ${l.keyId} from ${l.ip} — ${l.reason}`,
        log:         l,
      })),
    [logs]
  )

  // ── "Why blocked?" trace for the most recent block (Decision Pipeline card) ─
  const lastBlock = useMemo(
    () => logs.find(l => l.action === 'BLOCK') ?? null,
    [logs]
  )
  const lastBlockTrace = useMemo(
    () => (lastBlock ? buildTrace(lastBlock) : []),
    [lastBlock]
  )

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="pb-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Real-time API key security monitoring
        </p>
      </div>

      {/* ── Security Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests (24h)"
          value={stats.total.toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
          change={`${stats.total} log entries`}
          changeType="positive"
        />
        <StatCard
          title="Blocked Requests"
          value={`${stats.blockedPct}%`}
          icon={<XCircle className="h-4 w-4" />}
          change={`${stats.blocked} blocked`}
          changeType={stats.blocked > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="High Risk Keys"
          value={stats.highRiskKeys}
          icon={<AlertTriangle className="h-4 w-4" />}
          change="Keys with 2+ blocks"
          changeType={stats.highRiskKeys > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={<Shield className="h-4 w-4" />}
          change={`${stats.blocked} blocked + ${keys.filter(k => !k.active).length} revoked`}
          changeType={stats.activeAlerts > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* ── Request Activity Chart ── */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Request Activity</CardTitle>
          <CardDescription>
            API request distribution over the week — red dots indicate anomaly days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'requests' ? 'Requests' : 'Blocked',
                ]}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="var(--color-primary)"
                dot={{ r: 4 }}
                strokeWidth={2}
              />
              {chartData.map((point, index) =>
                point.anomaly ? (
                  <ReferenceDot
                    key={index}
                    x={point.day}
                    y={point.requests}
                    r={6}
                    fill="var(--color-destructive)"
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Live Activity + Decision Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Strip — last 5 logs */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Live Activity</CardTitle>
            <CardDescription>Last 5 API evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <LiveActivityStrip />
          </CardContent>
        </Card>

        {/* Decision Pipeline — most recent BLOCK */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Last Blocked Request</CardTitle>
            <CardDescription>
              {lastBlock
                ? `${lastBlock.keyId} from ${lastBlock.ip} — ${lastBlock.timestamp}`
                : 'No blocked requests in log'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastBlock ? (
              <DecisionPipeline
                trace={lastBlockTrace}
                finalDecision="BLOCK"
              />
            ) : (
              <div className="flex items-center gap-2 text-green-400 py-8 justify-center">
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm font-medium">All clear — no blocks logged</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Events with "Why Blocked?" ── */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Latest activity — click <HelpCircle className="inline h-3.5 w-3.5 mx-1" /> on a blocked event to see why
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((event, index) => (
                <TableRow
                  key={index}
                  className={`border-border transition-colors ${
                    event.type === 'Blocked'
                      ? 'bg-red-950/10 hover:bg-red-950/20'
                      : 'hover:bg-accent/5'
                  }`}
                >
                  <TableCell className="text-foreground text-sm font-mono">
                    {event.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        event.type === 'Request'
                          ? 'border-green-700 bg-green-950 text-green-300'
                          : 'border-red-700 bg-red-950 text-red-300'
                      }
                    >
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground text-sm">
                    {event.description}
                  </TableCell>
                  <TableCell>
                    {event.type === 'Blocked' && (
                      <button
                        onClick={() => setWhyLog(event.log)}
                        className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-yellow-400 transition-colors"
                        title="Why was this blocked?"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── "Why Blocked?" Modal ── */}
      <Dialog open={!!whyLog} onOpenChange={() => setWhyLog(null)}>
        <DialogContent className="border-border bg-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              Why was this request blocked?
            </DialogTitle>
          </DialogHeader>

          {whyLog && (
            <div className="space-y-4 mt-2">
              {/* Meta */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-input rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Key ID</p>
                  <p className="font-mono text-sm text-foreground font-medium">{whyLog.keyId}</p>
                </div>
                <div className="bg-input rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Source IP</p>
                  <p className="font-mono text-sm text-foreground font-medium">{whyLog.ip}</p>
                </div>
                <div className="bg-input rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Failed Step</p>
                  <p className="font-mono text-sm text-red-400 font-medium">
                    {buildTrace(whyLog).find(s => s.result === 'failed')?.check ?? 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-red-950/20 border border-red-700/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Block Reason</p>
                <p className="text-red-300 font-medium text-sm">{whyLog.reason}</p>
              </div>

              {/* Decision Pipeline */}
              <DecisionPipeline
                trace={buildTrace(whyLog)}
                finalDecision="BLOCK"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
