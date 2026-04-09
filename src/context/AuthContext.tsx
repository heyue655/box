import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  phone?: string;
  email?: string;
  username?: string;
  nickname: string;
  avatar: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('heyue_token')
  );
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem('heyue_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((newToken: string, userData: User) => {
    localStorage.setItem('heyue_token', newToken);
    localStorage.setItem('heyue_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('heyue_token');
    localStorage.removeItem('heyue_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
