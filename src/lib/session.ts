import crypto from 'crypto';

// Server-side in-memory session store
// Credentials are NEVER sent to client — verified only in API route (server code)
const sessions = new Map<string, { createdAt: number }>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const ADMIN_COOKIE = 'ydsg_session';

export function createSession(): string {
  const token = crypto.randomUUID() + '-' + crypto.randomBytes(16).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

export function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}
