import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background multi-stop glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-tr from-primary/10 via-emerald-500/10 to-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />
      
      <div className="container max-w-7xl mx-auto px-4 relative z-10 text-center">
        <Badge variant="outline" className="mb-8 border-primary/40 text-primary bg-primary/10 px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary),0.2)]">
          <ShieldCheck className="w-4 h-4 mr-2" />
          <span className="font-semibold tracking-wide uppercase text-[10px]">Production-Ready Security</span>
        </Badge>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground mb-6 max-w-5xl mx-auto drop-shadow-2xl">
          Intelligent APIs demand <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-primary to-emerald-400">
            Intelligent Defense
          </span>
        </h1>
        
        <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
          LockBox halts malicious traffic at the edge with dynamic rate limits. <br className="hidden md:block" /> 
          Discover exactly <span className="text-foreground font-medium">why</span> requests were blocked with our embedded AI.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/dashboard"
            className="group relative flex items-center justify-center gap-2 h-14 px-8 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(var(--primary),0.4)] overflow-hidden"
          >
            {/* Button inner glow and hover swoosh */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            Start Monitoring <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#demo"
            className="flex items-center justify-center gap-2 h-14 px-8 rounded-lg bg-card/50 backdrop-blur border border-border/50 text-foreground font-semibold hover:bg-accent/50 hover:border-border transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
          >
            <Zap className="w-5 h-5 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] rounded-full" /> Watch Live Demo
          </Link>
        </div>
      </div>
      
      {/* Horizontal glowing divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  )
}
