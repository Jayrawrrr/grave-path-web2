// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [role, setRole]   = useState(() => localStorage.getItem('role')  || '');

  // Persist to localStorage
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else      localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else      localStorage.removeItem('role');
  }, [role]);

  const login = ({ token, role }) => {
    setToken(token);
    setRole(role);
  };

  const logout = () => {
    setToken('');
    setRole('');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
