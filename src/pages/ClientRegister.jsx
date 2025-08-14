// src/pages/ClientRegister.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ClientRegister.css';
import VerificationModal from '../components/VerificationModal';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ClientRegister({ onBack }) {
  const navigate = useNavigate();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);

  // Validation flags
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmValid, setIsConfirmValid] = useState(false);

  // Verification state
  const [codeSent, setCodeSent] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  // Registration success state
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Errors & touched
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Countdown timer for resend
  useEffect(() => {
    if (secondsLeft > 0) {
      timerRef.current = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [secondsLeft]);

  // Field‐level validations
  useEffect(() => {
    if (touched.firstName) {
      setErrors(e => ({
        ...e,
        firstName: firstName.trim() ? null : 'First name is required'
      }));
    }
  }, [firstName, touched.firstName]);

  useEffect(() => {
    if (touched.lastName) {
      setErrors(e => ({
        ...e,
        lastName: lastName.trim() ? null : 'Last name is required'
      }));
    }
  }, [lastName, touched.lastName]);

  useEffect(() => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsEmailValid(valid);
    if (touched.email) {
      setErrors(e => ({
        ...e,
        email: valid ? null : 'Invalid email address'
      }));
    }
  }, [email, touched.email]);

  useEffect(() => {
    const valid = password.length >= 8;
    setIsPasswordValid(valid);
    if (touched.password) {
      setErrors(e => ({
        ...e,
        password: valid ? null : 'Password must be at least 8 characters'
      }));
    }
  }, [password, touched.password]);

  useEffect(() => {
    const valid = confirmPassword === password;
    setIsConfirmValid(valid);
    if (touched.confirmPassword) {
      setErrors(e => ({
        ...e,
        confirmPassword: valid ? null : 'Passwords do not match'
      }));
    }
  }, [confirmPassword, password, touched.confirmPassword]);

  // Handlers
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
      setErrors(e => ({
        ...e,
        sendCode: err.response?.data?.message || 'Failed to send code'
      }));
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    setVerifyingCode(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/verify-code`, {
        email,
        code: verificationCode
      });
      if (data.verified) {
        setCodeVerified(true);
        setShowModal(false);
      } else {
        setErrors(e => ({ ...e, verificationCode: 'Invalid code' }));
      }
    } catch (err) {
      setErrors(e => ({
        ...e,
        verificationCode: err.response?.data?.message || 'Verification failed'
      }));
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
      confirmPassword: true,
      terms: true
    });

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

    if (!codeSent) {
      await sendCode();
      return;
    }
    if (!codeVerified) {
      setShowModal(true);
      return;
    }

    // Final register
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        firstName,
        lastName,
        email,
        password,
        role: 'client'
      });

      // Show success, reset form
      setRegistrationSuccess(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTermsChecked(false);
      setErrors({});
      setTouched({});
      setCodeSent(false);
      setCodeVerified(false);
      setVerificationCode('');
      setLastSentEmail('');
      setSecondsLeft(0);
      setShowModal(false);

      // Revert button text after 3s
      setTimeout(() => setRegistrationSuccess(false), 3000);
    } catch (err) {
      setErrors(e => ({
        ...e,
        register: err.response?.data?.message || 'Registration failed'
      }));
    }
  };

  return (
    <>
      <div className="register-container">
        <h1 className="register-heading">Register</h1>
        <form className="register-form" onSubmit={handleRegister} noValidate>
          {/* First Name */}
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

          {/* Last Name */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms and Conditions
              </a>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={sendingCode}
            className={!termsChecked && touched.terms ? 'error-on-button' : ''}
          >
            {registrationSuccess
              ? 'Success!'
              : codeSent
              ? 'Verify & Register'
              : 'Register'}
          </button>
          {errors.register && <p className="error">{errors.register}</p>}

          <p className="back-to-login">
            Already have an account?{' '}
            <span className="login-link" onClick={onBack}>
              Login
            </span>
          </p>
        </form>
      </div>

      {/* Verification modal */}
      <VerificationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        code={verificationCode}
        onCodeChange={setVerificationCode}
        onVerify={verifyCode}
        onResend={sendCode}
        secondsLeft={secondsLeft}
        verifying={verifyingCode}
        verified={codeVerified}
        error={errors.verificationCode || errors.sendCode}
      />
    </>
  );
}
