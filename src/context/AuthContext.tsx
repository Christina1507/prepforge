import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile } from '../types';
import { apiFetch, getStoredToken, setStoredToken, removeStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<StudentProfile>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        // Auto-login to demo account for seamless instant showcase if token absent
        try {
          const res = await apiFetch<{ user: User; profile: StudentProfile; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'alex.chen@prepforge.edu', password: 'prepforge2026' }),
          });
          setStoredToken(res.token);
          setUser(res.user);
          setProfile(res.profile);
        } catch {
          setUser(null);
          setProfile(null);
        }
      } else {
        const res = await apiFetch<{ user: User; profile: StudentProfile }>('/api/auth/session');
        setUser(res.user);
        setProfile(res.profile);
      }
    } catch (err) {
      console.warn('Session refresh failed:', err);
      removeStoredToken();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ user: User; profile: StudentProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await apiFetch<{ user: User; profile: StudentProfile; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<StudentProfile>) => {
    const res = await apiFetch<{ profile: StudentProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setProfile(res.profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        refreshSession,
      }}
    >
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
