import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'operador';

export interface UserSession {
  username: string;
  role: UserRole;
  name: string;
  loginTime: string;
}

interface AuthContextType {
  user: UserSession | null;
  login: (role: UserRole, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAdmin: boolean;
  isOperador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'triminds_geoai_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (role: UserRole, password: string): { success: boolean; error?: string } => {
    const trimmedPass = password.trim();

    if (role === 'admin') {
      if (trimmedPass === 'agentic') {
        const session: UserSession = {
          username: 'admin',
          role: 'admin',
          name: 'Administrador do Sistema',
          loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return { success: true };
      }
      return { success: false, error: 'Senha de administrador incorreta. (Dica: agentic)' };
    }

    if (role === 'operador') {
      if (trimmedPass === 'funcionario') {
        const session: UserSession = {
          username: 'operador',
          role: 'operador',
          name: 'Operador de Imagens',
          loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return { success: true };
      }
      return { success: false, error: 'Senha de operador incorreta. (Dica: funcionario)' };
    }

    return { success: false, error: 'Perfil de acesso inválido.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isAdmin = user?.role === 'admin';
  const isOperador = user?.role === 'operador';

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
