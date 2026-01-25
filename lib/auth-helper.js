// Helper for API routes to handle client-side sessions
import { NextResponse } from 'next/server';
import { deserializeSession, isSessionValid } from './session-crypto';

// Extract and validate session from request body
export function getSessionFromRequest(body) {
  const { authSession, ...rest } = body;

  if (!authSession || !isSessionValid(authSession)) {
    return { session: null, body: rest, error: 'Invalid or expired session' };
  }

  const session = deserializeSession(authSession);
  if (!session) {
    return { session: null, body: rest, error: 'Failed to deserialize session' };
  }

  return { session, body: rest, error: null };
}

// Create a 401 response
export function unauthorizedResponse(message = 'Invalid or expired session') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}
