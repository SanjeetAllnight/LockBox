'use client'

import { useState } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { FirebaseSync } from '@/components/firebase-sync'
import { AiPanel } from '@/components/ai-panel'
import { RadialFab } from '@/components/radial-fab'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  return (
    <SidebarProvider>
      <FirebaseSync />
      <div className="flex h-screen w-full overflow-hidden bg-background relative selection:bg-primary/30">
        
        {/* Background Grid Pattern */}
        <div 
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 flex w-full h-full">
          <AppSidebar />

        {/* Main content — shrinks when AI panel is open */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
          style={{ marginRight: aiPanelOpen ? 380 : 0 }}
        >
          {children}
        </main>

        {/* Right-side AI Panel */}
        <AiPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
        </div>
      </div>

      {/* Floating Radial FAB */}
      <RadialFab onOpenAi={() => setAiPanelOpen(prev => !prev)} />

      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  )
}
