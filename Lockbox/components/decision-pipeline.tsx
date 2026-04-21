import { CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface TraceStep {
  check: string
  result: 'passed' | 'failed'
  detail: string
}

interface DecisionPipelineProps {
  trace: TraceStep[]
  finalDecision: 'ALLOW' | 'BLOCK'
}

export function DecisionPipeline({ trace, finalDecision }: DecisionPipelineProps) {
  return (
    <div className="space-y-4">
      {/* Pipeline Flow */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {trace.map((step, index) => (
          <div key={index} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-12 h-12 rounded-full border-2 flex items-center justify-center" 
                   style={{
                     borderColor: step.result === 'passed' ? '#4ade80' : '#ef4444',
                     backgroundColor: step.result === 'passed' ? '#064e3b33' : '#7f1d1d33',
                   }}>
                {step.result === 'passed' ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
              </div>
              <span className="text-xs font-medium text-center max-w-[80px] text-foreground">
                {step.check}
              </span>
            </div>
            {index < trace.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mt-8 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Final Decision */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Final Decision</p>
            <p className="text-2xl font-bold mt-2" style={{ color: finalDecision === 'ALLOW' ? '#4ade80' : '#ef4444' }}>
              {finalDecision}
            </p>
          </div>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `3px solid ${finalDecision === 'ALLOW' ? '#4ade80' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: finalDecision === 'ALLOW' ? '#064e3b33' : '#7f1d1d33',
          }}>
            {finalDecision === 'ALLOW' ? (
              <CheckCircle className="h-12 w-12 text-green-400" />
            ) : (
              <XCircle className="h-12 w-12 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Detailed Steps */}
      <div className="space-y-3 pt-4">
        {trace.map((step, index) => (
          <div key={index} className="p-3 bg-input rounded-lg border border-border">
            <div className="flex items-start gap-3">
              {step.result === 'passed' ? (
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{step.check}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
