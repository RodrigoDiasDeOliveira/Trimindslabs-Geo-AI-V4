import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'operator' | 'operador';

export interface UserSession {
  username: string;
  role: UserRole;
  name: string;
  loginTime: string;
  token?: string;
  expiresAt?: string;
}

interface AuthContextType {
  user: UserSession | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.authenticated) {
        return {
          success: false,
          error: data.error || 'Invalid username or password.'
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
    } catch {
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please try again.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const isAdmin = user?.role === 'admin';
  const isOperador = user?.role === 'operator' || user?.role === 'operador';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isOperador }}>
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
