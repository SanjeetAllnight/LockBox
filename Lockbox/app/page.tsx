import { Header } from '@/components/landing/Header'
import { HeroSection } from '@/components/landing/HeroSection'
import { LiveDemo } from '@/components/landing/LiveDemo'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FooterCTA } from '@/components/landing/FooterCTA'
import { Footer } from '@/components/landing/Footer'
import { IntroAnimation } from '@/components/landing/IntroAnimation'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <IntroAnimation />
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      <Header />
      
      <main className="relative z-10">
        <HeroSection />
        <LiveDemo />
        <FeaturesSection />
        <HowItWorks />
        <FooterCTA />
      </main>

      <Footer />
    </div>
  )
}
