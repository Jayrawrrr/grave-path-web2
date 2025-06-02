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

  // Add state for floating validation
  const [showValidation, setShowValidation] = useState(false);
  const validationTimeoutRef = useRef(null);

  // Add new state for validation message type
  const [validationType, setValidationType] = useState('error');

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

  const checkEmailExists = async () => {
    try {
      const response = await axios.post(`${API_BASE}/auth/send-verification`, { email });
      return false; // Email doesn't exist
    } catch (err) {
      // Check if the error is due to existing email
      if (err.response?.data?.message?.toLowerCase().includes('email') || 
          err.response?.data?.message?.toLowerCase().includes('exist')) {
        return true; // Email exists
      }
      throw err; // Rethrow other errors
    }
  };

  const sendCode = async () => {
    setSendingCode(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/send-verification`, { email });
      setCodeSent(true);
      setLastSentEmail(email);
      setShowModal(true);
      setSecondsLeft(60);
    } catch (err) {
      if (err.response?.data?.message?.toLowerCase().includes('exist')) {
        // Show floating validation for existing email
        setValidationType('error');
        setShowValidation(true);
        setShowModal(false); // Ensure modal is hidden
        setCodeSent(false); // Reset code sent state
        
        // Clear any existing timeout
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        
        // Set new timeout to hide validation
        validationTimeoutRef.current = setTimeout(() => {
          setShowValidation(false);
        }, 3000);
        
        return; // Exit early
      }
      
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
        // Show verification success message
        setValidationType('error'); // Using error type for white text
        setShowValidation(true);
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        validationTimeoutRef.current = setTimeout(() => {
          setShowValidation(false);
        }, 3000);
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

    if (!termsChecked) {
      setValidationType('error');
      setShowValidation(true);
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      validationTimeoutRef.current = setTimeout(() => {
        setShowValidation(false);
      }, 3000);
      return;
    }

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

    try {
      await axios.post(`${API_BASE}/auth/register`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: 'client'
      });

      setValidationType('success');
      setShowValidation(true);
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      validationTimeoutRef.current = setTimeout(() => {
        setShowValidation(false);
      }, 3000);

      setRegistrationSuccess(true);
      // Reset all form fields
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

      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (err) {
      if (err.response?.data?.message?.toLowerCase().includes('exist')) {
        setValidationType('error');
        setShowValidation(true);
        setShowModal(false);
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        validationTimeoutRef.current = setTimeout(() => {
          setShowValidation(false);
        }, 3000);
      } else {
        setErrors(e => ({
          ...e,
          register: err.response?.data?.message || 'Registration failed'
        }));
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

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
            Register
          </button>
          {errors.register && <p className="error">{errors.register}</p>}

          <p className="back-to-login">
            Already have an account?{' '}
            <span className="login-link" onClick={onBack}>
              Login
            </span>
          </p>
        </form>

        {showValidation && (
          <div className={
            validationType === 'success' 
              ? 'floating-success-message' 
              : 'floating-validation error'
          }>
            {validationType === 'success' 
              ? 'Registration successful!'
              : codeVerified && !registrationSuccess
              ? 'Verified'
              : !termsChecked && touched.terms
              ? 'Please accept the Terms and Conditions'
              : 'Email already exists!'}
          </div>
        )}
      </div>

      {/* Only show modal if email doesn't exist and code needs verification */}
      {!showValidation && showModal && (
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
      )}
    </>
  );
}
