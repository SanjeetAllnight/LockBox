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
      <div className="flex h-screen w-full overflow-hidden">
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

      {/* Floating Radial FAB */}
      <RadialFab onOpenAi={() => setAiPanelOpen(prev => !prev)} />

      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  )
}
