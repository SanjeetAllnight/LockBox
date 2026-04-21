'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ShieldAlert, Sparkles, ServerCrash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const mockLogs = [
  { id: 1, ip: '192.168.1.104', location: 'New York, US', action: 'ALLOW', ms: 12 },
  { id: 2, ip: '10.0.0.52', location: 'London, UK', action: 'ALLOW', ms: 15 },
  { id: 3, ip: '172.16.2.19', location: 'Tokyo, JP', action: 'ALLOW', ms: 9 },
  { id: 4, ip: '203.0.113.45', location: 'Unknown', action: 'BLOCK', reason: 'IP not whitelisted', ms: 2 },
  { id: 5, ip: '192.168.1.109', location: 'Berlin, DE', action: 'ALLOW', ms: 11 },
]

export function LiveDemo() {
  const [activeLogs, setActiveLogs] = useState<typeof mockLogs>([])
  const [showAi, setShowAi] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    let index = 0
    
    const interval = setInterval(() => {
      if (index < mockLogs.length) {
        const log = mockLogs[index]
        setActiveLogs(prev => [log, ...prev].slice(0, 4))
        
        if (log.action === 'BLOCK') {
          setIsBlocked(true)
          clearInterval(interval)
          // AI kicks in shortly after block
          setTimeout(() => setShowAi(true), 800)
        }
        index++
      }
    }, 1200)

    return () => clearInterval(interval)
  }, [])

  return (
    <section id="demo" className="py-24 bg-card/50 border-y border-border/50 relative">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">See LockBox in Action</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch real-time requests hit the gateway. Bad actors are dropped at the edge, and the AI instantly tells you why.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center max-w-5xl mx-auto">
          
          {/* Logs Window */}
          <div className="flex-1 w-full bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-sm font-mono text-muted-foreground ml-2">live-traffic-stream</span>
            </div>
            
            <div className="p-4 flex flex-col gap-3 min-h-[320px]">
              {activeLogs.map((log) => (
                <div 
                  key={log.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    log.action === 'BLOCK' 
                      ? 'bg-destructive/10 border-destructive/30 animate-pulse' 
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {log.action === 'ALLOW' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-destructive animate-bounce" />
                    )}
                    <div>
                      <div className="font-mono text-sm">{log.ip}</div>
                      <div className="text-xs text-muted-foreground">{log.location} • {log.ms}ms</div>
                    </div>
                  </div>
                  <Badge variant={log.action === 'ALLOW' ? 'outline' : 'destructive'} 
                         className={log.action === 'ALLOW' ? 'text-emerald-500 border-emerald-500/30' : ''}>
                    {log.action}
                  </Badge>
                </div>
              ))}
              
              {activeLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2 mt-20">
                  <ServerCrash className="w-8 h-8 animate-pulse" />
                  <p className="text-sm font-mono">Listening on port 443...</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Panel Window */}
          <div className={`flex-1 w-full lg:max-w-sm transition-all duration-700 ${
            isBlocked ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'
          }`}>
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-400" />
              
              <div className="p-4 border-b border-border flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">LockBox AI</h3>
                  <p className="text-xs text-muted-foreground">Automated Analysis</p>
                </div>
              </div>

              <div className="p-5 min-h-[250px] flex flex-col justify-center">
                {!showAi && isBlocked && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Sparkles className="w-4 h-4 animate-spin" /> Analyzing blocked request...
                  </div>
                )}
                
                {showAi && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p className="text-sm leading-relaxed text-foreground bg-input/50 p-4 rounded-xl rounded-tl-none border border-border">
                      <strong className="block mb-1 text-destructive">⚠ Suspicious activity detected</strong>
                      <strong>Finding:</strong> Request from IP <code>203.0.113.45</code> was blocked because it is not on the IP Whitelist policy.<br/><br/>
                      <strong>Fix:</strong> Add <code>203.0.113.45</code> to Policies → IP Restrictions.<br/><br/>
                      <strong>Impact:</strong> Legitimate requests from this origin will be dropped.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
