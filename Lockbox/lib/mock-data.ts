// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
  id: string;
  name: string;
  service: string;
  /** Human-readable status string kept for backward-compat with UI */
  status: "active" | "revoked";
  /** Engine-friendly boolean derived from status */
  active: boolean;
  /** Human-readable TTL string shown in the UI (e.g. "90 days") */
  ttl: string;
  /** Unix timestamp (ms) — used by the engine for expiry checks */
  ttlMs: number;
  allowedIps: string[];
  /** Requests allowed per minute */
  rateLimit: number;
  usageCount: number;
  // Dashboard UI fields
  riskScore: number;
  riskTrend: number;
  createdAt: string;
  lastUsed: string;
}

export interface LogEntry {
  id: string;
  keyId: string;
  /** Canonical field name used by the engine */
  ip: string;
  /** Alias kept for backward-compat with logs UI page */
  ipAddress: string;
  timestamp: string;
  action: "ALLOW" | "BLOCK";
  reason: string;
  /** Canonical field name used by the engine */
  policyTriggered: string;
  /** Alias kept for backward-compat with logs UI page */
  policy: string;
}

export interface Policy {
  ipWhitelist: string[];
  timeWindow: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
}

// ─── Helper: build a log entry with aliased fields ────────────────────────────

function makeLog(
  entry: Omit<LogEntry, "ipAddress" | "policy"> & { id?: string }
): LogEntry {
  return {
    ...entry,
    ipAddress: entry.ip,
    policy: entry.policyTriggered,
  } as LogEntry;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

const _apiKeys: ApiKeyRecord[] = [
  {
    id: "key-001",
    name: "Production API Key",
    service: "Main API",
    status: "active",
    active: true,
    ttl: "90 days",
    ttlMs: new Date("2026-07-20T00:00:00Z").getTime(),
    allowedIps: ["192.168.1.42", "192.168.1.50", "10.0.0.15"],
    rateLimit: 100,
    usageCount: 4821,
    riskScore: 45,
    riskTrend: -5,
    createdAt: "2024-01-15",
    lastUsed: "2 minutes ago",
  },
  {
    id: "key-002",
    name: "Staging Environment",
    service: "Staging API",
    status: "active",
    active: true,
    ttl: "30 days",
    ttlMs: new Date("2026-05-21T00:00:00Z").getTime(),
    allowedIps: ["10.0.0.15", "10.0.0.20"],
    rateLimit: 50,
    usageCount: 1234,
    riskScore: 32,
    riskTrend: 0,
    createdAt: "2024-02-01",
    lastUsed: "1 hour ago",
  },
  {
    id: "key-003",
    name: "Analytics Integration",
    service: "Analytics",
    status: "active",
    active: true,
    ttl: "180 days",
    ttlMs: new Date("2026-10-17T00:00:00Z").getTime(),
    allowedIps: ["172.16.0.8", "172.16.0.9", "192.168.1.42"],
    rateLimit: 200,
    usageCount: 9932,
    riskScore: 67,
    riskTrend: 12,
    createdAt: "2023-12-10",
    lastUsed: "3 hours ago",
  },
  {
    id: "key-004",
    name: "Legacy Service",
    service: "Old API",
    status: "revoked",
    active: false,
    ttl: "Revoked",
    ttlMs: new Date("2024-06-20T00:00:00Z").getTime(),
    allowedIps: ["203.0.113.42"],
    rateLimit: 20,
    usageCount: 302,
    riskScore: 95,
    riskTrend: 20,
    createdAt: "2023-06-20",
    lastUsed: "2 weeks ago",
  },
  {
    id: "key-005",
    name: "Development Key",
    service: "Dev API",
    status: "active",
    active: true,
    ttl: "7 days",
    ttlMs: new Date("2026-04-28T00:00:00Z").getTime(),
    allowedIps: ["127.0.0.1", "::1"],
    rateLimit: 30,
    usageCount: 88,
    riskScore: 28,
    riskTrend: -3,
    createdAt: "2024-04-10",
    lastUsed: "Just now",
  },
];

// ─── Logs ─────────────────────────────────────────────────────────────────────

const _logs: LogEntry[] = [
  makeLog({ id: "log-001", keyId: "key-001", ip: "192.168.1.42", timestamp: "2024-04-21 14:32:15", action: "ALLOW", reason: "Request within rate limit", policyTriggered: "Rate Limit Policy" }),
  makeLog({ id: "log-002", keyId: "key-002", ip: "10.0.0.15",  timestamp: "2024-04-21 14:31:48", action: "ALLOW", reason: "Valid request signature",  policyTriggered: "Key Validation" }),
  makeLog({ id: "log-003", keyId: "key-003", ip: "172.16.0.8", timestamp: "2024-04-21 14:31:22", action: "ALLOW", reason: "IP whitelisted",            policyTriggered: "IP Restriction" }),
  makeLog({ id: "log-004", keyId: "key-004", ip: "203.0.113.42", timestamp: "2024-04-21 14:30:51", action: "BLOCK", reason: "Key revoked",            policyTriggered: "Key Validation" }),
  makeLog({ id: "log-005", keyId: "key-001", ip: "198.51.100.5", timestamp: "2024-04-21 14:30:15", action: "BLOCK", reason: "IP not whitelisted",     policyTriggered: "IP Restriction" }),
  makeLog({ id: "log-006", keyId: "key-002", ip: "10.0.0.15",  timestamp: "2024-04-21 14:29:42", action: "ALLOW", reason: "Request within rate limit", policyTriggered: "Rate Limit Policy" }),
  makeLog({ id: "log-007", keyId: "key-005", ip: "127.0.0.1",  timestamp: "2024-04-21 14:29:08", action: "ALLOW", reason: "Valid request signature",  policyTriggered: "Key Validation" }),
  makeLog({ id: "log-008", keyId: "key-001", ip: "192.168.1.42", timestamp: "2024-04-21 14:28:33", action: "BLOCK", reason: "Rate limit exceeded",   policyTriggered: "Rate Limit Policy" }),
];

// ─── Policy ───────────────────────────────────────────────────────────────────

const _policy: Policy = {
  ipWhitelist: [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "127.0.0.1",
    "::1",
  ],
  timeWindow: {
    enabled: true,
    startTime: "09:00",
    endTime: "18:00",
    timezone: "UTC",
  },
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    burstLimit: 50,
  },
};

// ─── Exported functions ───────────────────────────────────────────────────────

/** Return a shallow copy of all API keys. */
export function getKeys(): ApiKeyRecord[] {
  return [..._apiKeys];
}

/** Return a shallow copy of all log entries, newest first. */
export function getLogs(): LogEntry[] {
  return [..._logs].reverse();
}

/**
 * Append a new log entry (ipAddress / policy aliases are set automatically).
 * Auto-generates an id if none is provided.
 */
export function addLog(
  entry: Omit<LogEntry, "id" | "ipAddress" | "policy"> & { id?: string }
): LogEntry {
  const newEntry = makeLog({
    id: entry.id ?? `log-${String(_logs.length + 1).padStart(3, "0")}`,
    ...entry,
  });
  _logs.push(newEntry);
  return newEntry;
}

/**
 * Apply partial updates to an existing key.
 * Returns the updated key, or `null` if no key with the given id exists.
 * Keeps `status`/`active` in sync when either is updated.
 */
export function updateKey(
  keyId: string,
  updates: Partial<Omit<ApiKeyRecord, "id">>
): ApiKeyRecord | null {
  const idx = _apiKeys.findIndex((k) => k.id === keyId);
  if (idx === -1) return null;

  const merged = { ..._apiKeys[idx], ...updates };
  // Keep status ↔ active in sync
  if (updates.active !== undefined) {
    merged.status = updates.active ? "active" : "revoked";
  } else if (updates.status !== undefined) {
    merged.active = updates.status === "active";
  }
  _apiKeys[idx] = merged;
  return _apiKeys[idx];
}

/**
 * Create and append a new API key.
 * Auto-generates an id (key-NNN) if none is supplied.
 * Returns the newly created record.
 */
export function addKey(
  entry: Omit<ApiKeyRecord, "id"> & { id?: string }
): ApiKeyRecord {
  const newKey: ApiKeyRecord = {
    id: entry.id ?? `key-${String(_apiKeys.length + 1).padStart(3, "0")}`,
    ...entry,
  };
  _apiKeys.push(newKey);
  return newKey;
}

/** Return the global policy object. */
export function getPolicy(): Policy {
  return _policy;
}

// ─── Named exports (backward-compat with existing UI components) ──────────────

export const apiKeys = _apiKeys;
export const logs = _logs;

export const events = [
  { timestamp: "2024-04-21 14:32:15", type: "Request", description: "Key key-001 used from 192.168.1.42" },
  { timestamp: "2024-04-21 14:31:48", type: "Request", description: "Key key-002 used from 10.0.0.15" },
  { timestamp: "2024-04-21 14:30:51", type: "Blocked", description: "Request blocked due to revoked key" },
  { timestamp: "2024-04-21 14:30:15", type: "Blocked", description: "Request blocked due to IP restriction" },
  { timestamp: "2024-04-21 14:29:42", type: "Request", description: "Key key-002 used from 10.0.0.15" },
  { timestamp: "2024-04-21 14:28:33", type: "Alert",   description: "Rate limit exceeded for key-001" },
];

export const activityData = [
  { day: "Mon", requests: 2400, anomaly: false },
  { day: "Tue", requests: 1398, anomaly: false },
  { day: "Wed", requests: 9800, anomaly: true  },
  { day: "Thu", requests: 3908, anomaly: false },
  { day: "Fri", requests: 4800, anomaly: false },
  { day: "Sat", requests: 3800, anomaly: false },
  { day: "Sun", requests: 4300, anomaly: false },
];

export const lastDecision = {
  status: "BLOCKED" as const,
  keyId: "key-001",
  timestamp: "14:32:10",
  trace: [
    { check: "Key validation", result: "passed" as const, detail: "Key is valid and active" },
    { check: "TTL check",      result: "passed" as const, detail: "Key expiry is valid" },
    { check: "IP check",       result: "failed" as const, detail: "Source IP 198.51.100.5 not whitelisted" },
    { check: "Rate limit",     result: "passed" as const, detail: "Below rate limit threshold" },
  ],
  finalDecision: "BLOCK" as const,
  reason: "IP not whitelisted",
};

export const liveActivity: Array<{
  timestamp: string;
  keyId: string;
  ip: string;
  action: "ALLOW" | "BLOCK" | "ALERT";
  reason: string;
}> = [
  { timestamp: "14:32:15", keyId: "key-001", ip: "192.168.1.42",  action: "ALLOW", reason: "Valid request" },
  { timestamp: "14:31:48", keyId: "key-002", ip: "10.0.0.15",     action: "ALLOW", reason: "Whitelisted IP" },
  { timestamp: "14:31:22", keyId: "key-003", ip: "172.16.0.8",    action: "ALLOW", reason: "Within rate limit" },
  { timestamp: "14:30:51", keyId: "key-004", ip: "203.0.113.42",  action: "BLOCK", reason: "Key revoked" },
  { timestamp: "14:30:15", keyId: "key-001", ip: "198.51.100.5",  action: "BLOCK", reason: "IP not whitelisted" },
  { timestamp: "14:29:42", keyId: "key-002", ip: "10.0.0.15",     action: "ALLOW", reason: "Valid request" },
  { timestamp: "14:29:08", keyId: "key-005", ip: "127.0.0.1",     action: "ALERT", reason: "Spike detected" },
  { timestamp: "14:28:33", keyId: "key-001", ip: "192.168.1.42",  action: "BLOCK", reason: "Rate limit exceeded" },
];

export const policies = {
  enforcementMode: "active",
  ipRestrictions: [
    { ip: "192.168.1.0/24", description: "Office network" },
    { ip: "10.0.0.0/8",     description: "Internal VPN" },
    { ip: "172.16.0.0/12",  description: "Container cluster" },
  ],
  ipRestrictionInfo: "Requests from unknown IP addresses will be blocked.",
  timeWindows: {
    enabled: true,
    description: "API access restricted to business hours",
    startTime: "09:00",
    endTime: "18:00",
    timezone: "UTC",
  },
  timeWindowInfo: "Requests outside business hours will be denied.",
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    burstLimit: 50,
  },
  rateLimitInfo:
    "Requests exceeding the limit will be rejected until the time window resets.",
};
