import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type User = {
  id: number;
  email: string;
  first_name?: string;
  username?: string;
} | null;

type AuthCtx = {
  user: User;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
