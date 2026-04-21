'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useStore, type ApiKeyRecord, type LogEntry, type PolicyState } from '@/lib/store'

export function FirebaseSync() {
  const setUserId = useStore(state => state.setUserId)
  const setKeysSync = useStore(state => state.setKeysSync)
  const setLogsSync = useStore(state => state.setLogsSync)
  const setPoliciesSync = useStore(state => state.setPoliciesSync)

  useEffect(() => {
    // When authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null)
      
      if (!user) return // Don't setup listeners if not logged in
      
      const unsubs: (() => void)[] = []
      
      // 1. Sync API Keys realtime
      const keysQ = collection(db, 'users', user.uid, 'apiKeys')
      unsubs.push(onSnapshot(keysQ, snap => {
         const keys = snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiKeyRecord))
         setKeysSync(keys)
      }))

      // 2. Sync Logs realtime
      const logsQ = collection(db, 'users', user.uid, 'logs')
      unsubs.push(onSnapshot(logsQ, snap => {
         const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry))
           .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
         setLogsSync(logs)
      }))

      // 3. Sync Policies realtime
      unsubs.push(onSnapshot(doc(db, 'users', user.uid, 'policies', 'config'), snap => {
         if (snap.exists()) {
             setPoliciesSync(snap.data() as PolicyState)
         }
      }))

      // Cleanup listeners when auth state changes
      return () => unsubs.forEach(unsub => unsub())
    })

    return () => unsubscribeAuth()
  }, [setUserId, setKeysSync, setLogsSync, setPoliciesSync])

  // This component doesn't render anything, it just bridges Firebase Realtime updates -> Zustand Store
  return null
}
