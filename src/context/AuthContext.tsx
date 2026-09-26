import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthRole } from '../types';
import { playLoginChime } from '../services/loginChime';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: AuthRole
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickLoginAs: (role: AuthRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fleetpulse_jwt_token';
const USER_KEY = 'fleetpulse_user_profile';

function getStoredValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persistSession(token: string, user: User): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Keep the authenticated session usable in memory if browser storage is unavailable.
  }
}

function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Clearing in-memory auth still signs the current tab out.
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredValue(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = getStoredValue(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = getStoredValue(TOKEN_KEY);
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(savedToken);
            try {
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            } catch {
              // The verified user remains available for this tab.
            }
          } else {
            // Token invalid
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Could not verify existing token with backend, keeping session if present:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        persistSession(data.token, data.user);
        playLoginChime();
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network connection failed' };
    }
  };

  const register = async (name: string, email: string, password: string, role: AuthRole) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        persistSession(data.token, data.user);
        playLoginChime();
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network connection failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredSession();
  };

  const quickLoginAs = async (role: AuthRole) => {
    const creds =
      role === 'OPERATIONS_MANAGER'
        ? { email: 'ops@fleetpulse.io', password: 'password123' }
        : { email: 'mechanic@fleetpulse.io', password: 'password123' };

    const result = await login(creds.email, creds.password);
    if (!result.success) throw new Error(result.message || 'Quick login failed.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
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
