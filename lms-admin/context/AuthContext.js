'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('admin_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => {
        if (['admin', 'instructor'].includes(res.data.user.role)) {
          setUser(res.data.user);
        } else {
          Cookies.remove('admin_token');
        }
      })
      .catch(() => Cookies.remove('admin_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (!['admin', 'instructor'].includes(res.data.user.role)) {
      throw new Error('Not authorized for admin panel');
    }
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    Cookies.set('admin_token', res.data.token, {
      expires: 7,
      sameSite: 'strict',
      secure: isSecure,
      path: '/',
    });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    Cookies.remove('admin_token');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
