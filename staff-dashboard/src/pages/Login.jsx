// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        { email, password }
      );
      // persist token + role
      login({ token: res.data.token, role: res.data.role });

      // redirect based on role
      if (res.data.role === 'staff') {
        navigate('/staff/map', { replace: true });
      } else if (res.data.role === 'admin') {
        navigate('/admin/map', { replace: true });
      } else if (res.data.role === 'client') {
        navigate('/client/map', { replace: true });
      } else {
        // unknown role—fallback to login
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      <p className="register-text">
        Don't have an account?{' '}
        <span
          className="register-link"
          onClick={() => navigate('/register')}
        >
          Register
        </span>
      </p>
    </div>
  );
}
