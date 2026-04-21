import { Key } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 opacity-50">
          <Key className="w-4 h-4" />
          <span className="font-semibold text-sm">LockBox Security</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Built for the future of API management.
        </p>
      </div>
    </footer>
  )
}
