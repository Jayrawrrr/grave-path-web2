import React from 'react';
import ReactDOM from 'react-dom';
import './VerificationModal.css';

export default function VerificationModal({
  show,
  onClose,
  code,
  onCodeChange,
  onVerify,
  onResend,
  secondsLeft,
  verifying,
  verified,
  error
}) {
  if (!show) return null;

  // Render the overlay/content into document.body instead of inline
  return ReactDOM.createPortal(
    <div className="vm-overlay" onClick={onClose}>
      <div className="vm-content" onClick={e => e.stopPropagation()}>
        <button className="vm-close" onClick={onClose}>×</button>
        <h3>Enter Verification Code</h3>
        <input
          type="text"
          placeholder="Code"
          value={code}
          onChange={e => onCodeChange(e.target.value)}
        />
        {error && <small className="vm-error">{error}</small>}
        <div className="vm-actions">
          <button
            onClick={onResend}
            disabled={secondsLeft > 0}
          >
            {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
          </button>
          <button
            onClick={onVerify}
            disabled={verifying || verified}
          >
            {verifying ? 'Verifying…' : verified ? 'Verified' : 'Verify'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
