// src/pages/ClientRegister.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ClientRegister.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ClientRegister() {
  const navigate = useNavigate();

  // ─── Form state
  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsChecked, setTermsChecked]       = useState(false);

  // ─── Validation flags
  const [isEmailValid, setIsEmailValid]       = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmValid, setIsConfirmValid]   = useState(false);

  // ─── Verification state
  const [codeSent, setCodeSent]                 = useState(false);
  const [lastSentEmail, setLastSentEmail]       = useState('');
  const [showModal, setShowModal]               = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeVerified, setCodeVerified]         = useState(false);
  const [sendingCode, setSendingCode]           = useState(false);
  const [verifyingCode, setVerifyingCode]       = useState(false);
  const [secondsLeft, setSecondsLeft]           = useState(0);
  const timerRef = useRef(null);

  // ─── Field errors & touch tracking
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  // ─── Field‐level validations
  useEffect(() => {
    if (touched.firstName) {
      setErrors(e => ({ ...e, firstName: firstName.trim() ? null : 'First name is required' }));
    }
  }, [firstName, touched.firstName]);

  useEffect(() => {
    if (touched.lastName) {
      setErrors(e => ({ ...e, lastName: lastName.trim() ? null : 'Last name is required' }));
    }
  }, [lastName, touched.lastName]);

  useEffect(() => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsEmailValid(valid);
    if (touched.email) {
      setErrors(e => ({ ...e, email: valid ? null : 'Invalid email address' }));
    }
  }, [email, touched.email]);

  useEffect(() => {
    const valid = password.length >= 8;
    setIsPasswordValid(valid);
    if (touched.password) {
      setErrors(e => ({ ...e, password: valid ? null : 'Password must be at least 8 characters' }));
    }
  }, [password, touched.password]);

  useEffect(() => {
    const valid = confirmPassword === password;
    setIsConfirmValid(valid);
    if (touched.confirmPassword) {
      setErrors(e => ({ ...e, confirmPassword: valid ? null : 'Passwords do not match' }));
    }
  }, [confirmPassword, password, touched.confirmPassword]);

  // ─── Countdown timer for resend
  useEffect(() => {
    if (secondsLeft > 0) {
      timerRef.current = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [secondsLeft]);

  // ─── Handlers
  const handleBlur = field => () => {
    setTouched(t => ({ ...t, [field]: true }));
  };
  const handleEmailBlur = () => {
    setTouched(t => ({ ...t, email: true }));
    if (lastSentEmail && email !== lastSentEmail) {
      setCodeSent(false);
      setCodeVerified(false);
      setVerificationCode('');
      setSecondsLeft(0);
      setLastSentEmail('');
    }
  };

  const sendCode = async () => {
    setSendingCode(true);
    try {
      await axios.post(`${API_BASE}/auth/send-verification`, { email });
      setCodeSent(true);
      setLastSentEmail(email);
      setShowModal(true);
      setSecondsLeft(60);
    } catch (err) {
      setErrors(e => ({ ...e, sendCode: err.response?.data?.message || 'Failed to send code' }));
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    setVerifyingCode(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/verify-code`, {
        email, code: verificationCode
      });
      if (data.verified) {
        setCodeVerified(true);
        setShowModal(false);
      } else {
        setErrors(e => ({ ...e, verificationCode: 'Invalid code' }));
      }
    } catch (err) {
      setErrors(e => ({ ...e, verificationCode: err.response?.data?.message || 'Verification failed' }));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    // stop if any field invalid or T&C unchecked
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !isEmailValid ||
      !isPasswordValid ||
      !isConfirmValid ||
      !termsChecked
    ) {
      return;
    }

    // first click: request code
    if (!codeSent) {
      await sendCode();
      return;
    }
    // require verification
    if (!codeVerified) {
      setShowModal(true);
      return;
    }
    // final registration
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        firstName, lastName, email, password, role: 'client'
      });
      navigate('/login');
    } catch {
      // handle registration error if needed
    }
  };

  return (
    <>
      <div className="register-container">
        <form className="register-form" onSubmit={handleRegister} noValidate>
          <div className="field-group">
            <input
              id="firstName"
              type="text"
              placeholder=" "
              value={firstName}
              onBlur={handleBlur('firstName')}
              onChange={e => setFirstName(e.target.value)}
              className={errors.firstName ? 'input-error' : ''}
            />
            <label htmlFor="firstName">First Name</label>
            <small className="error">{errors.firstName || ' '}</small>
          </div>

          <div className="field-group">
            <input
              id="lastName"
              type="text"
              placeholder=" "
              value={lastName}
              onBlur={handleBlur('lastName')}
              onChange={e => setLastName(e.target.value)}
              className={errors.lastName ? 'input-error' : ''}
            />
            <label htmlFor="lastName">Last Name</label>
            <small className="error">{errors.lastName || ' '}</small>
          </div>

          <div className="field-group">
            <input
              id="email"
              type="email"
              placeholder=" "
              value={email}
              onBlur={handleEmailBlur}
              onChange={e => setEmail(e.target.value)}
              className={errors.email ? 'input-error' : ''}
            />
            <label htmlFor="email">Email</label>
            <small className="error">{errors.email || ' '}</small>
          </div>

          <div className="field-group">
            <input
              id="password"
              type="password"
              placeholder=" "
              value={password}
              onBlur={handleBlur('password')}
              onChange={e => setPassword(e.target.value)}
              className={errors.password ? 'input-error' : ''}
            />
            <label htmlFor="password">Password</label>
            <small className="error">{errors.password || ' '}</small>
          </div>

          <div className="field-group">
            <input
              id="confirmPassword"
              type="password"
              placeholder=" "
              value={confirmPassword}
              onBlur={handleBlur('confirmPassword')}
              onChange={e => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            <label htmlFor="confirmPassword">Confirm Password</label>
            <small className="error">{errors.confirmPassword || ' '}</small>
          </div>

          {/* Terms & Conditions */}
          <div className="field-group terms">
            <input
              id="terms"
              type="checkbox"
              checked={termsChecked}
              onChange={e => setTermsChecked(e.target.checked)}
            />
            <label htmlFor="terms">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
            </label>
          </div>

          <button type="submit" disabled={sendingCode || !termsChecked}>
            {codeSent ? 'Verify & Register' : 'Register'}
          </button>
        </form>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <h3>Enter Verification Code</h3>
            <input
              type="text"
              placeholder="Code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
            />
            {errors.verificationCode && (
              <small className="error">{errors.verificationCode}</small>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="resend-link"
                onClick={sendCode}
                disabled={secondsLeft > 0}
              >
                {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={verifyCode}
                disabled={verifyingCode || codeVerified}
              >
                {verifyingCode ? 'Verifying…' : codeVerified ? 'Verified' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
