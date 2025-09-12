// src/pages/Login.jsx
import React, { useState, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeVerified, setCodeVerified] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [isConfirmValid, setIsConfirmValid] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef(null)
  const navigate = useNavigate()
  
  // Floating validation states
  const [showValidation, setShowValidation] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [validationType, setValidationType] = useState('error')
  const validationTimeoutRef = useRef(null)

  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [active])

  // Password validation
  useEffect(() => {
    const hasMinLength = newPassword.length >= 8
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    
    const valid = hasMinLength && hasUppercase && hasLowercase && hasNumbers && hasSymbols
    setIsPasswordValid(valid)
    
    if (touched.newPassword) {
      if (!newPassword) {
        setErrors(e => ({ ...e, newPassword: 'Password is required' }))
      } else if (!valid) {
        const missing = []
        if (!hasMinLength) missing.push('8+ characters')
        if (!hasUppercase) missing.push('uppercase letter')
        if (!hasLowercase) missing.push('lowercase letter')
        if (!hasNumbers) missing.push('number')
        if (!hasSymbols) missing.push('special character')
        
        setErrors(e => ({ 
          ...e, 
          newPassword: `Strong password needs: ${missing.join(', ')}` 
        }))
      } else {
        setErrors(e => ({ ...e, newPassword: null }))
      }
    }
  }, [newPassword, touched.newPassword])

  // Confirm password validation
  useEffect(() => {
    const valid = confirmPassword === newPassword
    setIsConfirmValid(valid)
    if (touched.confirmPassword) {
      setErrors(e => ({
        ...e,
        confirmPassword: valid ? null : 'Passwords do not match'
      }))
    }
  }, [confirmPassword, newPassword, touched.confirmPassword])

  // Countdown timer
  useEffect(() => {
    if (secondsLeft > 0) {
      timerRef.current = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    } else {
      clearTimeout(timerRef.current)
    }
    return () => clearTimeout(timerRef.current)
  }, [secondsLeft])

  // Floating validation function
  const showFloatingValidation = (message, type = 'error') => {
    setValidationMessage(message)
    setValidationType(type)
    setShowValidation(true)
    
    // Clear any existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    // Auto-hide after 3 seconds
    validationTimeoutRef.current = setTimeout(() => {
      setShowValidation(false)
    }, 3000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    
    // Client-side validation
    if (!email.trim()) {
      showFloatingValidation('Please enter your email address', 'error')
      return
    }
    
    if (!password.trim()) {
      showFloatingValidation('Please enter your password', 'error')
      return
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showFloatingValidation('Please enter a valid email address', 'error')
      return
    }
    
    // Password length validation
    if (password.length < 6) {
      showFloatingValidation('Password must be at least 6 characters long', 'error')
      return
    }
    
    try {
      const res = await axios.post(
        `https://api.grave-path.com/api/auth/login`,
        { email, password }
      )

      // persist token + role
      login({ token: res.data.token, role: res.data.role })

      // Show success message
      showFloatingValidation('Login successful! Redirecting...', 'success')

      // redirect based on role
      setTimeout(() => {
        if (res.data.role === 'staff') {
          navigate('/staff/map', { replace: true })
        } else if (res.data.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else if (res.data.role === 'client') {
          navigate('/client/home', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      }, 1000)
      
    } catch (err) {
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Login failed'
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        if (errorMessage.toLowerCase().includes('invalid credentials') || 
            errorMessage.toLowerCase().includes('incorrect password')) {
          showFloatingValidation('Incorrect email or password. Please try again.', 'error')
        } else if (errorMessage.toLowerCase().includes('user not found') || 
                   errorMessage.toLowerCase().includes('email not found')) {
          showFloatingValidation('No account found with this email address.', 'error')
        } else {
          showFloatingValidation('Invalid email or password. Please check your credentials.', 'error')
        }
      } else if (err.response?.status === 403) {
        showFloatingValidation('Account is disabled. Please contact support.', 'error')
      } else if (err.response?.status === 429) {
        showFloatingValidation('Too many login attempts. Please try again later.', 'error')
      } else if (err.response?.status === 500) {
        showFloatingValidation('Server error. Please try again later.', 'error')
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        showFloatingValidation('Network error. Please check your connection.', 'error')
      } else {
        showFloatingValidation(errorMessage, 'error')
      }
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    
    if (!resetEmail.trim()) {
      showFloatingValidation('Please enter your email address', 'error')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetEmail)) {
      showFloatingValidation('Please enter a valid email address', 'error')
      return
    }
    
    try {
      await axios.post(
        `https://api.grave-path.com/api/auth/forgot-password`,
        { email: resetEmail }
      )
      setResetStatus('success')
      setSecondsLeft(60)
      showFloatingValidation('Reset code sent to your email!', 'success')
    } catch (err) {
      setResetStatus('error')
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to send reset code'
      
      if (err.response?.status === 404) {
        showFloatingValidation('No account found with this email address.', 'error')
      } else if (err.response?.status === 429) {
        showFloatingValidation('Too many requests. Please try again later.', 'error')
      } else {
        showFloatingValidation(errorMessage, 'error')
      }
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      showFloatingValidation('Please enter the verification code', 'error')
      return
    }
    
    if (verificationCode.length < 4) {
      showFloatingValidation('Verification code must be at least 4 digits', 'error')
      return
    }
    
    try {
      const { data } = await axios.post(
        `https://api.grave-path.com/api/auth/verify-reset-code`,
        { email: resetEmail, code: verificationCode }
      )
      if (data.verified) {
        setCodeVerified(true)
        setShowChangePassword(true)
        showFloatingValidation('Code verified successfully!', 'success')
      } else {
        setErrors(e => ({ ...e, verificationCode: 'Invalid code' }))
        showFloatingValidation('Invalid verification code. Please try again.', 'error')
      }
    } catch (err) {
      setErrors(e => ({
        ...e,
        verificationCode: err.response?.data?.message || 'Verification failed'
      }))
      
      const errorMessage = err.response?.data?.message || 'Verification failed'
      if (err.response?.status === 400) {
        showFloatingValidation('Invalid or expired verification code.', 'error')
      } else if (err.response?.status === 429) {
        showFloatingValidation('Too many attempts. Please try again later.', 'error')
      } else {
        showFloatingValidation(errorMessage, 'error')
      }
    }
  }

  const handleResendCode = async () => {
    if (secondsLeft > 0) {
      showFloatingValidation(`Please wait ${secondsLeft} seconds before resending`, 'error')
      return
    }
    
    try {
      await axios.post(
        `https://api.grave-path.com/api/auth/resend-reset-code`,
        { email: resetEmail }
      )
      setSecondsLeft(60)
      setResetStatus('success')
      showFloatingValidation('Reset code resent to your email!', 'success')
    } catch (err) {
      setResetStatus('error')
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to resend code'
      
      if (err.response?.status === 429) {
        showFloatingValidation('Too many requests. Please try again later.', 'error')
      } else {
        showFloatingValidation(errorMessage, 'error')
      }
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      showFloatingValidation('Please enter a valid password', 'error')
      return
    }
    
    if (!isConfirmValid) {
      showFloatingValidation('Passwords do not match', 'error')
      return
    }

    try {
      await axios.post(
        `https://api.grave-path.com/api/auth/reset-password`,
        {
          email: resetEmail,
          code: verificationCode,
          newPassword
        }
      )
      
      showFloatingValidation('Password changed successfully! You can now login.', 'success')
      
      // Reset all states after showing success message
      setTimeout(() => {
        setShowForgotPassword(false)
        setShowChangePassword(false)
        setResetEmail('')
        setVerificationCode('')
        setNewPassword('')
        setConfirmPassword('')
        setCodeVerified(false)
        setResetStatus('')
        setErrors({})
        setTouched({})
      }, 2000)
      
    } catch (err) {
      setErrors(e => ({
        ...e,
        changePassword: err.response?.data?.message || 'Failed to reset password'
      }))
      
      const errorMessage = err.response?.data?.message || 'Failed to reset password'
      if (err.response?.status === 400) {
        showFloatingValidation('Invalid or expired reset code.', 'error')
      } else if (err.response?.status === 429) {
        showFloatingValidation('Too many attempts. Please try again later.', 'error')
      } else {
        showFloatingValidation(errorMessage, 'error')
      }
    }
  }

  const handleBlur = field => () => {
    setTouched(t => ({ ...t, [field]: true }))
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
      {/* Use the original SliderBoxes component with forms integrated */}
      <SliderBoxes active={active} onChange={setActive} />

      {/* LOGIN FORM - Inside transparent box */}
      <div className={`form-container ${active === 0 ? 'active' : 'inactive'}`} style={{ left: '15%' }}>
        <div className="form-content">
          <h1 className="form-title">Login</h1>

          <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="forgot-password-container">
              <span className="forgot-password-link" onClick={() => setShowForgotPassword(true)}>
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="auth-button">Login</button>
          </form>

          <p className="switch-text">
            Don't have an account?{' '}
            <span className="switch-link" onClick={() => setActive(1)}>
              Register
            </span>
          </p>

          <div className="guest-access-section">
            <span className="guest-access-link" onClick={() => navigate('/guest/home')}>
              Continue as Guest
            </span>
          </div>
        </div>
      </div>

      {/* REGISTER FORM - Inside transparent box */}
      <div className={`form-container ${active === 1 ? 'active' : 'inactive'}`} style={{ left: '50%' }}>
        <div className="form-content">
          <ClientRegister key={active} onBack={() => setActive(0)} />
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && !showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reset Password</h2>
            {!codeVerified ? (
              <form onSubmit={handleForgotPassword}>
                <div className="field-group">
                  <input
                    type="email"
                    placeholder=" "
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <label>Email</label>
                </div>
                {resetStatus === 'success' && (
                  <div className="verification-section">
                    <div className="field-group">
                      <input
                        type="text"
                        placeholder=" "
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                      />
                      <label>Verification Code</label>
                    </div>
                    <button type="button" onClick={handleVerifyCode}>
                      Verify Code
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={secondsLeft > 0}
                      className="resend-button"
                    >
                      {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend Code'}
                    </button>
                  </div>
                )}
                {resetStatus === 'success' ? null : (
                  <button type="submit">Send Reset Link</button>
                )}
                <button type="button" onClick={() => setShowForgotPassword(false)}>
                  Cancel
                </button>
              </form>
            ) : null}
            {errors.verificationCode && (
              <p className="error-message">{errors.verificationCode}</p>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="field-group">
                <input
                  type="password"
                  placeholder=" "
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={handleBlur('newPassword')}
                  required
                  className={errors.newPassword ? 'input-error' : ''}
                />
                <label>New Password</label>
                <small className="error">{errors.newPassword || ' '}</small>
              </div>

              <div className="field-group">
                <input
                  type="password"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={handleBlur('confirmPassword')}
                  required
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                <label>Confirm Password</label>
                <small className="error">{errors.confirmPassword || ' '}</small>
              </div>

              <div className="modal-buttons">
                <button type="submit" disabled={!isPasswordValid || !isConfirmValid}>
                  Change Password
                </button>
                <button type="button" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </button>
              </div>
            </form>
            {errors.changePassword && (
              <p className="error-message">{errors.changePassword}</p>
            )}
          </div>
        </div>
      )}

      {/* Floating validation message using React Portal */}
      {showValidation && createPortal(
        <div 
          className={
            validationType === 'success' 
              ? 'portal-floating-success' 
              : 'portal-floating-validation'
          }
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: validationType === 'success' ? '#28a745' : 'white',
            padding: '14px 28px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            fontSize: '0.9rem',
            fontWeight: '500',
            maxWidth: '420px',
            minWidth: '340px',
            textAlign: 'center',
            pointerEvents: 'none',
            animation: 'slideInFromLeft 0.3s ease-out',
            whiteSpace: 'nowrap'
          }}
        >
          {validationMessage}
        </div>,
        document.body
      )}
    </div>
  )
}
