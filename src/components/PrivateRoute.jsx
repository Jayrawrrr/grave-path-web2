// src/components/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * PrivateRoute wraps a route’s element.
 * @param {ReactNode} children  Component to render if allowed
 * @param {string[]}  roles     Array of roles allowed (e.g. ['staff'])
 */
export default function PrivateRoute({ children, roles = [] }) {
  const { token, role } = useContext(AuthContext);

  // Not logged in
  if (!token) return <Navigate to="/login" replace />;

  // Role not allowed
  if (roles.length && !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
