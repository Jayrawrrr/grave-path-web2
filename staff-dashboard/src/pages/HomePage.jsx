import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  MapPin as MapIcon,
  Info as VisitorInfoIcon,
  CalendarCheck as BookingIcon,
} from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { handleNavigate, handleVisitorInfo, handleBookingPill } = useOutletContext();

  const features = [
    {
      icon: <MapIcon size={24} />,
      title: "Visit Your Loved Ones",
      description: "Easily locate and navigate to grave sites with our interactive map.",
      action: () => {
        handleNavigate('map');
        navigate('/client/map');
      },
      color: "#34c759"
    },
    {
      icon: <VisitorInfoIcon size={24} />,
      title: "Visitor Information",
      description: "Learn about visiting hours, guidelines, and cemetery policies.",
      action: () => {
        handleVisitorInfo();
      },
      color: "#5856d6"
    },
    {
      icon: <BookingIcon size={24} />,
      title: "Reserve a Plot",
      description: "Browse available plots and make reservations for your future needs.",
      action: () => {
        handleBookingPill('availability');
      },
      color: "#007aff"
    }
  ];

  return (
    <div className="home-page">
      <div className="background-container" />
      <img 
        src={process.env.PUBLIC_URL + '/background-pattern.svg'}
        alt=""
        className="background-svg"
      />
      <div className="welcome-section">
        <h1>Welcome to GravePath</h1>
        <p>Your compassionate guide to cemetery services</p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card"
            onClick={feature.action}
            style={{ '--hover-color': feature.color }}
          >
            <div className="butterfly">
              <img 
                src="/butterfly-transparent.gif" 
                alt="" 
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  objectFit: 'cover',
                  opacity: 0
                }}
              />
            </div>
            <div className="feature-icon" style={{ color: feature.color }}>
              {feature.icon}
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 