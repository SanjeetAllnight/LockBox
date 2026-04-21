// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  active: boolean;
  /** Unix timestamp (ms) after which the key is expired */
  ttl: number;
  allowedIps: string[];
  /** Maximum requests allowed per minute */
  rateLimit: number;
}

export interface RequestContext {
  ip: string;
  /** Unix timestamp (ms) of the incoming request */
  timestamp: number;
}

export type Decision = "ALLOW" | "BLOCK";

export interface TraceStep {
  step: "Key validation" | "TTL check" | "IP check" | "Rate limit";
  status: "pass" | "fail";
}

export interface EngineResult {
  decision: Decision;
  reason: string;
  decisionTrace: TraceStep[];
}

// ─── In-memory rate-limit counter ────────────────────────────────────────────
// Tracks { count, windowStart } per key id.  The window is 60 seconds.

const RATE_WINDOW_MS = 60_000;

interface RateEntry {
  count: number;
  windowStart: number;
}

const rateStore = new Map<string, RateEntry>();

/**
 * Increment the request counter for a key and return the current count inside
 * the active 1-minute window.
 */
export function incrementRequestCount(keyId: string, now: number): number {
  const entry = rateStore.get(keyId);

  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    // Start a fresh window
    rateStore.set(keyId, { count: 1, windowStart: now });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

/** Read the current count without incrementing (useful for testing). */
export function getRequestCount(keyId: string, now: number): number {
  const entry = rateStore.get(keyId);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) return 0;
  return entry.count;
}

/** Reset all counters (useful in tests or after key revocation). */
export function resetCounters(): void {
  rateStore.clear();
}

// ─── Engine ──────────────────────────────────────────────────────────────────

/**
 * Evaluate an incoming request against an API key's security policy and return
 * a structured decision with a full audit trace.
 *
 * The four checks run **in order**; the first failure short-circuits no
 * further checks are evaluated and their trace entries are omitted so the
 * caller can distinguish "not reached" from "passed".
 *
 * Rate-limit counter is incremented **only** when all previous checks pass.
 */
export function evaluateRequest(
  apiKey: ApiKey,
  request: RequestContext
): EngineResult {
  const trace: TraceStep[] = [];

  // ── Step 1: Key active check ─────────────────────────────────────────────
  if (!apiKey.active) {
    trace.push({ step: "Key validation", status: "fail" });
    return {
      decision: "BLOCK",
      reason: "Key revoked",
      decisionTrace: trace,
    };
  }
  trace.push({ step: "Key validation", status: "pass" });

  // ── Step 2: TTL check ─────────────────────────────────────────────────────
  if (request.timestamp > apiKey.ttl) {
    trace.push({ step: "TTL check", status: "fail" });
    return {
      decision: "BLOCK",
      reason: "Key expired",
      decisionTrace: trace,
    };
  }
  trace.push({ step: "TTL check", status: "pass" });

  // ── Step 3: IP whitelist check ────────────────────────────────────────────
  if (!apiKey.allowedIps.includes(request.ip)) {
    trace.push({ step: "IP check", status: "fail" });
    return {
      decision: "BLOCK",
      reason: "IP not whitelisted",
      decisionTrace: trace,
    };
  }
  trace.push({ step: "IP check", status: "pass" });

  // ── Step 4: Rate limit check ──────────────────────────────────────────────
  const count = incrementRequestCount(apiKey.id, request.timestamp);
  if (count > apiKey.rateLimit) {
    trace.push({ step: "Rate limit", status: "fail" });
    return {
      decision: "BLOCK",
      reason: "Rate limit exceeded",
      decisionTrace: trace,
    };
  }
  trace.push({ step: "Rate limit", status: "pass" });

  // ── All checks passed ─────────────────────────────────────────────────────
  return {
    decision: "ALLOW",
    reason: "All security checks passed",
    decisionTrace: trace,
  };
}
