import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fittrack_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('fittrack_token'));
  const [loading, setLoading] = useState(true);

  // Check current session on initial page load
  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('fittrack_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('fittrack_user', JSON.stringify(res.user));
          }
        } catch (error) {
          console.warn('Session verification failed, clearing credentials:', error.message);
          localStorage.removeItem('fittrack_token');
          localStorage.removeItem('fittrack_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data.success) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('fittrack_token', data.token);
      localStorage.setItem('fittrack_user', JSON.stringify(data.user));
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.success) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('fittrack_token', data.token);
      localStorage.setItem('fittrack_user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout error', e);
    } finally {
      localStorage.removeItem('fittrack_token');
      localStorage.removeItem('fittrack_user');
      setUser(null);
      setToken(null);
    }
  };

  const updateUserData = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('fittrack_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
