import { Activity, BrainCircuit, GlobeLock, Lock } from 'lucide-react'

const features = [
  {
    name: 'Real-time Edge Monitoring',
    description: 'Every request is evaluated in under 5ms. View live traffic flowing through your keys without hitting refresh.',
    icon: Activity,
  },
  {
    name: 'Smart Policy Enforcement',
    description: 'Define IP whitelists, strict rate limits, and time windows. Bad traffic is dropped before it ever touches your origin server.',
    icon: GlobeLock,
  },
  {
    name: 'AI Contextual Explanations',
    description: 'Stop guessing why a request failed. LockBox AI analyzes your exact policies and logs to give you a concrete fix.',
    icon: BrainCircuit,
  },
  {
    name: 'Automated Risk Scoring',
    description: 'Every API key is continuously evaluated for suspicious patterns, allowing you to proactively revoke compromised keys.',
    icon: Lock,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-20 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 drop-shadow-md">Enterprise-Grade Control</h2>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
            Everything you need to secure your SaaS APIs, wrapped in an impossibly fast, beautiful command center.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto relative z-10">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative rounded-[2rem] border border-border/50 bg-card/80 backdrop-blur-sm p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.2)] overflow-hidden"
            >
              {/* Inner 3D inset shadow effect */}
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
              
              {/* Hover dynamic background shift */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 shadow-[0_0_15px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.3)] transition-shadow duration-500">
                <feature.icon className="w-7 h-7 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 relative z-10 text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 transition-all duration-500">{feature.name}</h3>
              
              <p className="text-muted-foreground text-lg leading-relaxed relative z-10">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Horizontal glowing divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  )
}
