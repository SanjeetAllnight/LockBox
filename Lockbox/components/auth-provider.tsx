'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// AuthContext definition
interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      const isProtected = pathname?.startsWith('/dashboard')
      if (!currentUser && isProtected) {
        router.push('/login')
      } else if (currentUser && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
        router.push('/dashboard')
      }
    })

    return () => unsubscribe()
  }, [pathname, router])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center text-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Checking authentication...</p>
        </div>
      )}
      <div style={{ display: loading ? 'none' : 'block' }}>
        {children}
      </div>
    </AuthContext.Provider>
  )
}
