import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { request } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth session on app startup
  const checkAuth = useCallback(async () => {
    try {
      const data = await request('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async ({ email, password }) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setUser(data);
    return data;
  };

  const signup = async ({ name, email, password }) => {
    // Signup first
    await request('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    });
    // Automatically log in with same credentials as requested
    return await login({ email, password });
  };

  const logout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
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
