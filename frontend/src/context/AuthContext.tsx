import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiUrl, getProfile, isProfileError, type UserProfile } from '../lib/api';

export type AuthUser = {
  token: string;
  username: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  setCurrentProfile: (profile: UserProfile) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'ww_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const setCurrentProfile = useCallback((nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setUser((prev) => {
      if (!prev || prev.username === nextProfile.username) return prev;
      const next = { ...prev, username: nextProfile.username };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem(STORAGE_KEY)) return null;
    setProfileLoading(true);
    try {
      const nextProfile = await getProfile();
      if (isProfileError(nextProfile)) return null;
      setCurrentProfile(nextProfile);
      return nextProfile;
    } catch {
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [setCurrentProfile]);

  useEffect(() => {
    if (!user?.token) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [user?.token, refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    const authUser: AuthUser = { token: data.token, username: data.username };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await fetch(apiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    // Auto-login so the user lands directly on the dashboard
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, profile, profileLoading, refreshProfile, setCurrentProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
