// staff-dashboard/src/pages/Landing.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="left-section">
        <img
          src="/gravepath1.png"
          alt="Grave Path"
          className="background-img"
        />
        {/* Unified login button */}
        <button
          className="login-btn"
          onClick={() => navigate('/login')}
        >
          Login →
        </button>
      </div>
      <div className="right-section">
        <div className="logo-area">
          <img
            src="/gravepath2.png"
            alt="Logo"
            className="logo-img"
          />
        </div>
      </div>
    </div>
  );
};

export default Landing;
