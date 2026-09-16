import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'operador';

export interface UserSession {
  username: string;
  role: UserRole;
  name: string;
  loginTime: string;
  token?: string;
  mode?: string;
}

export interface AuthConfig {
  mode: 'AUTH_DISABLED' | 'AUTH_ENABLED';
  adminPasswordConfigured: boolean;
  operatorPasswordConfigured: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  authConfig: AuthConfig;
  login: (role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isOperador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'triminds_geoai_auth_user';
const TOKEN_KEY = 'triminds_geoai_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    mode: 'AUTH_DISABLED',
    adminPasswordConfigured: false,
    operatorPasswordConfigured: false
  });

  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch backend authentication mode configuration
  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => {
        if (data?.mode) {
          setAuthConfig(data);
        }
      })
      .catch(() => {
        // Fallback default
        setAuthConfig({
          mode: 'AUTH_DISABLED',
          adminPasswordConfigured: false,
          operatorPasswordConfigured: false
        });
      });
  }, []);

  const login = async (role: UserRole, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Falha na autenticação.' };
      }

      const session: UserSession = {
        username: data.user.username,
        role: data.user.role,
        name: data.user.name,
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        token: data.token,
        mode: data.mode
      };

      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Erro de conexão com o servidor de autenticação: ${err.message}` };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const isAdmin = user?.role === 'admin';
  const isOperador = user?.role === 'operador';

  return (
    <AuthContext.Provider value={{ user, authConfig, login, logout, isAdmin, isOperador }}>
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
