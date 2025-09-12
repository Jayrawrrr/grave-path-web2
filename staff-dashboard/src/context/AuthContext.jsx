// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [role, setRole]   = useState(() => localStorage.getItem('role')  || '');
  const [user, setUser]   = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Persist to localStorage
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else      localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else      localStorage.removeItem('role');
  }, [role]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else      localStorage.removeItem('user');
  }, [user]);

  const login = ({ token, role, user }) => {
    setToken(token);
    setRole(role);
    setUser(user);
  };

  const logout = () => {
    setToken('');
    setRole('');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
