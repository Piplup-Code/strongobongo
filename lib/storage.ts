/**
 * Session ID management for anonymous users
 * Generates UUID on first visit, stores in localStorage
 */

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  let sessionId = localStorage.getItem('session_id')
  
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('session_id', sessionId)
  }
  
  return sessionId
}
