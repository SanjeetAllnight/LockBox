'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useStore, type LogEntry } from '@/lib/store'

export function LiveActivityStrip() {
  // Grab the 5 most recent logs directly from Zustand
  const logs = useStore(state => state.logs)
  const recentLogs = logs.slice(0, 5)

  const getActionBgColor = (action: string) => {
    switch (action) {
      case 'ALLOW': return 'bg-green-950/40 border-green-700/50'
      case 'BLOCK': return 'bg-red-950/40 border-red-700/50'
      default:      return 'bg-input border-border'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Activity</p>
      </div>
      <div className="flex flex-col gap-2 overflow-hidden h-[340px]">
        {recentLogs.map((activity, idx) => (
          <div
            key={activity.id}
            className={`p-3 rounded-lg border transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${getActionBgColor(activity.action)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {activity.action === 'ALLOW' && <CheckCircle className="h-4 w-4 text-green-400" />}
                {activity.action === 'BLOCK' && <XCircle className="h-4 w-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{activity.timestamp.split(' ')[1]}</span>
                  <span className="font-mono text-sm font-medium text-foreground">[{activity.action}]</span>
                  <span className="text-xs text-foreground truncate">{activity.keyId} from {activity.ip}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.reason}</p>
              </div>
            </div>
          </div>
        ))}
        {recentLogs.length === 0 && (
          <p className="text-sm text-muted-foreground italic px-2 py-4">No recent activity</p>
        )}
      </div>
    </div>
  )
}
