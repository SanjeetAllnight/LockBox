/**
 * Lightweight client-side event bus for cross-page log synchronization.
 *
 * When the Test Console adds a log it dispatches `lockbox:new-log` on the
 * window. The Logs page (and Dashboard) listen for this event to refresh
 * their state immediately — no polling, no backend needed.
 */

export const LOG_EVENT = 'lockbox:new-log' as const

/** Dispatch the event from the console after addLog() is called. */
export function emitNewLog(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOG_EVENT))
  }
}

/** Subscribe to new-log events; returns an unsubscribe function. */
export function onNewLog(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(LOG_EVENT, handler)
  return () => window.removeEventListener(LOG_EVENT, handler)
}
