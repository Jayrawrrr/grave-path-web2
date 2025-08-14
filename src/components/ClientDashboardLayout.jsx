import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SidebarClient from './SidebarClient';

export default function ClientDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [current, setCurrent] = useState('map');
  const [showVisitorInfo, setShowVisitorInfo] = useState(false);

  // Pills
  const isVisitorInfoRoute = location.pathname === '/client/public-access/visitor-info';
  const isBookingSubpage = location.pathname.startsWith('/client/reservations/');

  const showVisitorInfoPill = current === 'public' && !showVisitorInfo && !isVisitorInfoRoute;
  const showBookingPills = current === 'booking' && !isBookingSubpage;

  // Main sidebar nav logic
  const handleNavigate = (target) => {
    setShowVisitorInfo(false);

    if (target === 'map') {
      setCurrent('map');
      navigate('/client/map');
    } else if (target === 'public') {
      setCurrent(prev => prev === 'public' ? null : 'public');
    } else if (target === 'booking') {
      setCurrent(prev => prev === 'booking' ? null : 'booking');
    }
  };

  // Visitor info
  const handleVisitorInfo = () => {
    setShowVisitorInfo(true);
    navigate('/client/public-access/visitor-info');
  };

  // Booking pills
  const handleBookingPill = (route) => {
    setCurrent('booking'); // Keep booking as current for highlighting
    navigate(`/client/reservations/${route}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex' }}>
      <SidebarClient
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        current={current}
        showVisitorInfoPill={showVisitorInfoPill}
        onVisitorInfo={handleVisitorInfo}
        showBookingPills={showBookingPills}
        onBookingPill={handleBookingPill}
      />
      <main style={{ flex: 1, marginLeft: 60, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
