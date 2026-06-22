import type { FastifyRequest } from 'fastify';
import { getSessionUser } from './db.js';

/**
 * Extract the `session` value from a raw Cookie header, or null if absent.
 * Done by hand (no cookie plugin) to mirror the manual Set-Cookie on login and
 * keep the minimal-auth surface dependency-free.
 */
export function parseSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'session') return rest.join('=') || null;
  }
  return null;
}

/**
 * Get the authenticated user's ID from the request cookie, or null if not authenticated.
 */
export function getAuthenticatedUserId(request: FastifyRequest): number | null {
  const sessionId = parseSessionCookie(request.headers.cookie);
  if (!sessionId) return null;
  return getSessionUser(sessionId);
}
