import Link from 'next/link'
import { FileText, Github, Key } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-md">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">LockBox</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#demo" className="hover:text-foreground transition-colors">Live Demo</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
        </nav>

        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <div className="w-[1px] h-4 bg-border hidden sm:block" />
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}
