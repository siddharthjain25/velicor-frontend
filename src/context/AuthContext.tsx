import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('velicor_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('velicor_token');
    setToken(null);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('velicor_token', newToken);
    setToken(newToken);
  };

  // On mount, validate the stored token against the backend.
  // If the token is missing, expired, or rejected (401/403), silently log out.
  useEffect(() => {
    const validate = async () => {
      const storedToken = localStorage.getItem('velicor_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        await getMe(storedToken);
        // Token is valid — keep it
      } catch {
        // Token is invalid or expired — clear it
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    validate();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
