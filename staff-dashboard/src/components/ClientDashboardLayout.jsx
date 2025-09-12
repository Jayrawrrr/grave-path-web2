import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SidebarClient from './SidebarClient';

export default function ClientDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [current, setCurrent] = useState('home');
  const [showVisitorInfo, setShowVisitorInfo] = useState(false);

  // Update current state based on route changes
  useEffect(() => {
    const path = location.pathname;
    if (path === '/client/home') {
      setCurrent('home');
    } else if (path === '/client/map') {
      setCurrent('map');
    } else if (path === '/client/profile') {
      setCurrent('profile');
    } else if (path.startsWith('/client/public-access/')) {
      setCurrent('public');
    } else if (path.startsWith('/client/reservations/') || path === '/client/columbarium') {
      setCurrent('booking');
    }
  }, [location.pathname]);

  // Pills
  const isVisitorInfoRoute = location.pathname === '/client/public-access/visitor-info';
  const isBookingSubpage = location.pathname.startsWith('/client/reservations/') || location.pathname === '/client/columbarium';

  const showVisitorInfoPill = current === 'public' && !showVisitorInfo && !isVisitorInfoRoute;
  const showBookingPills = current === 'booking' && !isBookingSubpage;

  // Main sidebar nav logic
  const handleNavigate = (target) => {
    setShowVisitorInfo(false);

    if (target === 'home') {
      setCurrent('home');
      navigate('/client/home');
    } else if (target === 'map') {
      setCurrent('map');
      navigate('/client/map');
    } else if (target === 'profile') {
      setCurrent('profile');
      navigate('/client/profile');
    } else if (target === 'public') {
      setCurrent(prev => prev === 'public' ? null : 'public');
    } else if (target === 'booking') {
      setCurrent(prev => prev === 'booking' ? null : 'booking');
    }
  };

  // Visitor info
  const handleVisitorInfo = () => {
    setShowVisitorInfo(true);
    setCurrent('public');
    navigate('/client/public-access/visitor-info');
  };

  // Booking pills
  const handleBookingPill = (route) => {
    setCurrent('booking'); // Keep booking as current for highlighting
    navigate(`/client/reservations/${route}`);
  };

  // Bookmark pill
  const handleBookmarkPill = (action) => {
    if (action === 'bookmark') {
      setCurrent('map'); // Keep map as current for highlighting
      navigate('/client/bookmarks');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="client-layout" style={{ display: 'flex' }}>
      <SidebarClient
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        current={current}
        showVisitorInfoPill={showVisitorInfoPill}
        onVisitorInfo={handleVisitorInfo}
        showBookingPills={showBookingPills}
        onBookingPill={handleBookingPill}
        onBookmarkPill={handleBookmarkPill}
      />
      <main style={{ flex: 1, padding: '1rem', paddingTop: '80px' }}>
        <Outlet context={{ handleNavigate, handleVisitorInfo, handleBookingPill, handleBookmarkPill }} />
      </main>
    </div>
  );
}
