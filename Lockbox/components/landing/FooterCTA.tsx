import Link from 'next/link'
import { Key } from 'lucide-react'

export function FooterCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background massive glowing aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/20 via-cyan-500/20 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Grid overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      
      <div className="container max-w-4xl mx-auto px-4 relative z-10 text-center">
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 drop-shadow-lg">
          Ready to secure your APIs?
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the next generation of top-tier SaaS products routing their traffic through brilliant, AI-defended edge gateways.
        </p>
        
        <Link
          href="/dashboard"
          className="group relative inline-flex items-center justify-center gap-3 h-16 px-10 rounded-xl bg-foreground text-background font-bold text-lg hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] overflow-hidden ring-1 ring-white/10 hover:ring-white/50"
        >
          {/* Button inner highlight swoosh effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <Key className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12" />
          Deploy Your Gateway
        </Link>
      </div>
    </section>
  )
}
