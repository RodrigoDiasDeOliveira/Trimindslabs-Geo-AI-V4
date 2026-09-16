import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'operator' | 'operador';

export interface UserSession {
  username: string;
  role: UserRole;
  name: string;
  loginTime: string;
  token?: string;
  expiresAt?: string;
}

export interface AuthConfig {
  enabled: boolean;
  configured: boolean;
  loading: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  authConfig: AuthConfig;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  isAdmin: boolean;
  isOperador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'triminds_geoai_auth_user';
const TOKEN_KEY = 'triminds_geoai_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed: UserSession = JSON.parse(saved);
      // Check if session has expired
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    enabled: true,
    configured: true,
    loading: true
  });

  // Load server-side auth configuration on startup
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/config')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAuthConfig({
              enabled: data.enabled !== false,
              configured: data.configured !== false,
              loading: false
            });
          }
        } else {
          if (isMounted) {
            setAuthConfig({ enabled: true, configured: true, loading: false });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          // Default to secure by default
          setAuthConfig({ enabled: true, configured: true, loading: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    let res: Response;

    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });
    } catch {
      // True network/transport layer failure (server offline, DNS fail, CORS refused)
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please try again.'
      };
    }

    // Safely parse JSON if returned
    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    // HTTP 401: Invalid credentials
    if (res.status === 401) {
      return {
        success: false,
        error: data?.error || 'Invalid username or password.'
      };
    }

    // HTTP 503: Authentication service unavailable / unconfigured
    if (res.status === 503) {
      return {
        success: false,
        error: data?.error || 'Authentication service unavailable.'
      };
    }

    // Non-OK responses (e.g. 405 Method Not Allowed, 502 Bad Gateway, 404 Not Found)
    if (!res.ok || !data || !data.authenticated) {
      if (res.status === 405 || res.status === 502 || res.status === 504 || res.status === 404) {
        return {
          success: false,
          error: 'Unable to connect to authentication server. Please try again.'
        };
      }
      return {
        success: false,
        error: data?.error || 'Authentication failed. Please try again.'
      };
    }

    const session: UserSession = {
      username: data.user.username,
      role: data.user.role,
      name: data.user.name || (data.user.role === 'admin' ? 'Administrador' : 'Operador'),
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      token: data.token,
      expiresAt: data.expiresAt
    };

    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  // Helper to make authenticated requests automatically adding Authorization header
  const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});
    if (user?.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${user.token}`);
    }
    return fetch(url, { ...init, headers });
  };

  const token = user?.token || localStorage.getItem(TOKEN_KEY);
  const isAdmin = user?.role === 'admin';
  const isOperador = user?.role === 'operator' || user?.role === 'operador';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authConfig,
        login,
        logout,
        authFetch,
        isAdmin,
        isOperador
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
