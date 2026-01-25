'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useConfig } from './ConfigContext';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'ikko_session';

export function AuthProvider({ children }) {
  const { config, isLoaded: configLoaded } = useConfig();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use ref to track ongoing auth to prevent duplicate calls
  const authPromiseRef = useRef(null);

  // Check if session is valid (not expired)
  const isSessionValid = (sessionData) => {
    if (!sessionData || !sessionData.keyPair || !sessionData.accessToken) {
      return false;
    }
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      return false;
    }
    return true;
  };

  // Load session from localStorage
  const loadSession = () => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const sessionData = JSON.parse(stored);
        if (isSessionValid(sessionData)) {
          return sessionData;
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
    return null;
  };

  // Save session to localStorage
  const saveSession = (sessionData) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // Clear session from localStorage
  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  // Authenticate - returns a promise that resolves to the new session or null
  const authenticate = useCallback(async () => {
    // If already authenticating, return the existing promise
    if (authPromiseRef.current) {
      return authPromiseRef.current;
    }

    setIsAuthenticating(true);
    setStatus('Authenticating...');

    authPromiseRef.current = (async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceImei: config.deviceImei,
            deviceSn: config.deviceSn,
            userEmail: config.userEmail,
            userPassword: config.userPassword,
          }),
        });

        const data = await response.json();

        if (data.success && data.session) {
          setSession(data.session);
          saveSession(data.session);
          setStatus('Connected');
          setIsConnected(true);
          return data.session;
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        setStatus('Disconnected');
        setIsConnected(false);
        return null;
      } finally {
        setIsAuthenticating(false);
        authPromiseRef.current = null;
      }
    })();

    return authPromiseRef.current;
  }, [config]);

  // API fetch wrapper that handles session and automatic retry
  const authFetch = useCallback(async (url, options = {}, retryCount = 0, overrideSession = null) => {
    // Ensure we have a session
    let currentSession = overrideSession || session;

    if (!currentSession || !isSessionValid(currentSession)) {
      // Try to get from localStorage
      currentSession = loadSession();
      if (currentSession) {
        setSession(currentSession);
        setStatus('Connected');
        setIsConnected(true);
      }
    }

    // If still no session, authenticate first
    if (!currentSession || !isSessionValid(currentSession)) {
      currentSession = await authenticate();
      if (!currentSession) {
        throw new Error('Failed to authenticate');
      }
    }

    // Inject session into the request body if it's a POST with JSON body
    let modifiedOptions = { ...options };
    if (options.method === 'POST' && options.body) {
      if (options.body instanceof FormData) {
        // Clone FormData and add session
        const newFormData = new FormData();
        for (const [key, value] of options.body.entries()) {
          newFormData.append(key, value);
        }
        newFormData.set('authSession', JSON.stringify(currentSession));
        modifiedOptions.body = newFormData;
      } else {
        try {
          const body = JSON.parse(options.body);
          body.authSession = currentSession;
          modifiedOptions.body = JSON.stringify(body);
        } catch (e) {
          // If body is not JSON, leave as is
        }
      }
    }

    // Make the request
    const response = await fetch(url, modifiedOptions);

    // Handle 401 - session expired
    if (response.status === 401 && retryCount < 1) {
      console.log('🔄 Session expired, re-authenticating...');

      // Clear old session
      clearSession();

      // Re-authenticate
      const newSession = await authenticate();

      if (newSession) {
        // Retry the request with new session (pass it directly to avoid stale state)
        console.log('🔄 Retrying with new session...');
        return authFetch(url, options, retryCount + 1, newSession);
      } else {
        throw new Error('Re-authentication failed');
      }
    }

    return response;
  }, [session, authenticate]);

  // Initialize on mount
  useEffect(() => {
    if (!configLoaded) return;

    const init = async () => {
      // Check cached session
      const cachedSession = loadSession();
      if (cachedSession && isSessionValid(cachedSession)) {
        setSession(cachedSession);
        setStatus('Connected');
        setIsConnected(true);
        setIsInitialized(true);
        return;
      }

      // Authenticate
      await authenticate();
      setIsInitialized(true);
    };

    init();
  }, [configLoaded, authenticate]);

  // Re-authenticate when config changes (but not on initial load)
  useEffect(() => {
    if (!isInitialized || !configLoaded) return;

    // Clear session and re-authenticate
    clearSession();
    authenticate();
  }, [config.deviceImei, config.deviceSn, config.userEmail, config.userPassword]);

  return (
    <AuthContext.Provider value={{
      session,
      sessionId: session ? 'active' : null, // For backward compatibility
      status,
      isConnected,
      isAuthenticating,
      isInitialized,
      authenticate,
      authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
