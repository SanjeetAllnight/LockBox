import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { FirebaseSync } from '@/components/firebase-sync'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <FirebaseSync />
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  )
}
