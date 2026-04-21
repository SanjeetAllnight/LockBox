import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from './firebase'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
  id: string
  name: string
  service: string
  status: 'active' | 'revoked'
  active: boolean
  ttl: string
  ttlMs: number
  allowedIps: string[]
  rateLimit: number
  usageCount: number
  riskScore: number
  riskTrend: number
  createdAt: string
  lastUsed: string
  userId?: string
}

export interface LogEntry {
  id: string
  keyId: string
  ip: string
  ipAddress: string
  timestamp: string
  action: 'ALLOW' | 'BLOCK'
  reason: string
  policyTriggered: string
  policy: string
  userId?: string
}

export interface PolicyState {
  enforcementMode: 'active' | 'shadow' | 'disabled'
  ipRestrictions: { id: string; ip: string; description: string }[]
  timeWindows: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
    burstLimit: number
  }
}

export interface GlobalState {
  userId: string | null
  
  apiKeys: ApiKeyRecord[]
  logs: LogEntry[]
  policies: PolicyState

  // Setters (used by Firebase Sync to hydrate state)
  setUserId: (id: string | null) => void
  setKeysSync: (keys: ApiKeyRecord[]) => void
  setLogsSync: (logs: LogEntry[]) => void
  setPoliciesSync: (policies: PolicyState) => void

  // Actions - Keys
  addKey: (key: Omit<ApiKeyRecord, 'id'> & { id?: string }) => void
  revokeKey: (id: string) => void
  updateKey: (id: string, updates: Partial<ApiKeyRecord>) => void

  // Actions - Logs
  addLog: (log: Omit<LogEntry, 'id' | 'ipAddress' | 'policy'> & { id?: string }) => void
  clearLogs: () => void

  // Actions - Policies
  updatePolicies: (updates: Partial<PolicyState>) => void
}

// ─── Initial State (Fallback Defaults) ────────────────────────────────────────

const INITIAL_KEYS: ApiKeyRecord[] = []

const INITIAL_LOGS: LogEntry[] = []

const INITIAL_POLICIES: PolicyState = {
  enforcementMode: 'active',
  ipRestrictions: [],
  timeWindows: {
    enabled: false,
    startTime: '00:00',
    endTime: '23:59',
    timezone: 'UTC',
  },
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    burstLimit: 50,
  },
}

// ─── Store Definition ─────────────────────────────────────────────────────────

export const useStore = create<GlobalState>((set, get) => ({
  userId: null,
  apiKeys: INITIAL_KEYS,
  logs: INITIAL_LOGS,
  policies: INITIAL_POLICIES,

  setUserId: (id) => set({ userId: id }),

  // Data Hydration from Firebase
  setKeysSync: (keys) => {
    // Only hydrate if we actually got keys, else keep our default local demo state if starting completely fresh
    if (keys.length > 0) set({ apiKeys: keys })
  },
  setLogsSync: (logs) => {
    if (logs.length > 0) set({ logs })
  },
  setPoliciesSync: (policies) => set({ policies }),

  // ── Actions ──
  addKey: (key) => {
    const { userId, apiKeys } = get()
    const newKey = { id: key.id || uuidv4(), ...key, userId: userId || undefined }
    if (userId) setDoc(doc(db, 'users', userId, 'apiKeys', newKey.id), newKey).catch(console.error)
    set({ apiKeys: [...apiKeys, newKey] })
  },

  revokeKey: (id) => {
    const { userId, apiKeys } = get()
    const current = apiKeys.find(k => k.id === id)
    if (current) {
      const merged = { ...current, status: 'revoked' as const, active: false }
      if (userId) setDoc(doc(db, 'users', userId, 'apiKeys', id), merged).catch(console.error)
      set({ apiKeys: apiKeys.map(k => k.id === id ? merged : k) })
    }
  },

  updateKey: (id, updates) => {
    const { userId, apiKeys } = get()
    const current = apiKeys.find(k => k.id === id)
    if (current) {
      const merged = { ...current, ...updates }
      if (updates.active !== undefined) {
        merged.status = updates.active ? 'active' : 'revoked'
      } else if (updates.status !== undefined) {
        merged.active = updates.status === 'active'
      }
      if (userId) setDoc(doc(db, 'users', userId, 'apiKeys', id), merged).catch(console.error)
      set({ apiKeys: apiKeys.map(k => k.id === id ? merged : k) })
    }
  },

  addLog: (logInput) => {
    const { userId, logs } = get()
    const log = { ...logInput, id: logInput.id || uuidv4(), ipAddress: logInput.ip, policy: logInput.policyTriggered } as LogEntry
    if (userId) setDoc(doc(db, 'users', userId, 'logs', log.id), { ...log, userId }).catch(console.error)
    set({ logs: [log, ...logs] })
  },

  clearLogs: () => {
    // Only clears locally for simplicity, could clear remote DB if needed
    set({ logs: [] })
  },

  updatePolicies: (updates) => {
    const { userId, policies } = get()
    const merged = { ...policies, ...updates }
    if (userId) setDoc(doc(db, 'users', userId, 'policies', 'config'), merged).catch(console.error)
    set({ policies: merged })
  },
}))
