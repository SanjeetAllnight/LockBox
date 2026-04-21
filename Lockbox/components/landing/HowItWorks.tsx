export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Generate API Keys',
      description: 'Create keys for your clients with tailored rate limits, IP whitelists, and TTL expirations.'
    },
    {
      step: '02',
      title: 'Monitor Live Traffic',
      description: 'Watch all requests stream into the dashboard. LockBox automatically drops threats at edge.'
    },
    {
      step: '03',
      title: 'Fix with AI Insights',
      description: 'When a block occurs, the embedded AI analyst gives you the exact reason and a concrete fix.'
    }
  ]

  return (
    <section id="how-it-works" className="py-24 bg-card/30 border-y border-border/50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">How it works</h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            From zero to secure in three powerful steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Global connector line behind cards on desktop */}
          <div className="hidden md:block absolute top-[4.5rem] left-[15%] right-[15%] h-1 bg-gradient-to-r from-primary/10 via-cyan-500/40 to-emerald-500/10 z-0" />

          {steps.map((s, i) => (
            <div key={i} className="group relative flex flex-col items-center text-center p-8 bg-background/80 backdrop-blur rounded-[2rem] border border-border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.15)] z-10 overflow-hidden">
              
              {/* Inner 3D inset shadow effect */}
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
              
              {/* Hover dynamic background shift */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-primary/5 via-transparent to-transparent transition-opacity duration-500 pointer-events-none" />

              <div className="w-16 h-16 rounded-full bg-card border-[3px] border-border group-hover:border-primary text-primary font-black text-2xl flex items-center justify-center mb-8 z-10 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] group-hover:scale-110">
                {s.step}
              </div>
              
              <h3 className="text-xl font-bold mb-4">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
