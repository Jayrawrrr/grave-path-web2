// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import SliderBoxes from '../components/SliderBoxes'
import ClientRegister from './ClientRegister'
import './Login.css'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const { login }               = useContext(AuthContext)
  const [active, setActive]     = useState(0)    // 0=login, 1=register
  const navigate                = useNavigate()

  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [active])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        { email, password }
      )

      // persist token + role
      login({ token: res.data.token, role: res.data.role })

      // redirect based on role
      if (res.data.role === 'staff') {
        navigate('/staff/map', { replace: true })
      } else if (res.data.role === 'admin') {
        navigate('/admin/map', { replace: true })
      } else if (res.data.role === 'client') {
        navigate('/client/map', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Login failed')
    }
  }

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/Login1.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <SliderBoxes active={active} onChange={setActive} />

      {/* LOGIN FORM */}
      <div className="form-wrapper login-wrapper">
        <h1 className="login-text">Login</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <input
              id="login-email"
              type="email"
              placeholder=" "
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label htmlFor="login-email">Email</label>
            <small className="error"> </small>
          </div>

          <div className="field-group">
            <input
              id="login-password"
              type="password"
              placeholder=" "
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <label htmlFor="login-password">Password</label>
            <small className="error"> </small>
          </div>

          <button type="submit">Login</button>
        </form>

        <p className="register-text">
          Don't have an account?{' '}
          <span className="register-link" onClick={() => setActive(1)}>
            Register
          </span>
        </p>
      </div>

      {/* REGISTER FORM */}
      <div className="form-wrapper register-wrapper">
        <ClientRegister key={active} onBack={() => setActive(0)} />
      </div>
    </div>
  )
}
