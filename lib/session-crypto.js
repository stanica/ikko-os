// Session serialization utilities for client-side storage
import crypto from 'crypto';

// Export a key pair to a JSON-serializable format
export function serializeKeyPair(keyPair) {
  return {
    privateKey: keyPair.privateKey.export({ format: 'jwk' }),
    publicKey: keyPair.publicKey.export({ format: 'jwk' }),
  };
}

// Import a key pair from serialized format
export function deserializeKeyPair(serialized) {
  return {
    privateKey: crypto.createPrivateKey({ key: serialized.privateKey, format: 'jwk' }),
    publicKey: crypto.createPublicKey({ key: serialized.publicKey, format: 'jwk' }),
  };
}

// Serialize full session data for client storage
export function serializeSession(keyPair, accessToken, expiresIn) {
  return {
    keyPair: serializeKeyPair(keyPair),
    accessToken,
    expiresAt: Date.now() + (expiresIn * 1000),
  };
}

// Deserialize session data from client
export function deserializeSession(sessionData) {
  if (!sessionData || !sessionData.keyPair || !sessionData.accessToken) {
    return null;
  }

  // Check if session is expired
  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    return null;
  }

  return {
    keyPair: deserializeKeyPair(sessionData.keyPair),
    accessToken: sessionData.accessToken,
    expiresAt: sessionData.expiresAt,
  };
}

// Check if session data is valid (without deserializing keys)
export function isSessionValid(sessionData) {
  if (!sessionData || !sessionData.keyPair || !sessionData.accessToken) {
    return false;
  }
  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    return false;
  }
  return true;
}
