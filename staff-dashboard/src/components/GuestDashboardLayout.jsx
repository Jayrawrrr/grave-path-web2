import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SidebarGuest from './SidebarGuest';

export default function GuestDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [current, setCurrent] = useState('home');
  const [showVisitorInfo, setShowVisitorInfo] = useState(false);

  // Update current state based on route changes
  useEffect(() => {
    const path = location.pathname;
    if (path === '/guest/home') {
      setCurrent('home');
    } else if (path === '/guest/map') {
      setCurrent('map');
    } else if (path.startsWith('/guest/public-access/')) {
      setCurrent('public');
    }
  }, [location.pathname]);

  // Pills
  const isVisitorInfoRoute = location.pathname === '/guest/public-access/visitor-info';
  const showVisitorInfoPill = current === 'public' && !showVisitorInfo && !isVisitorInfoRoute;

  // Main sidebar nav logic
  const handleNavigate = (target, data) => {
    setShowVisitorInfo(false);

    if (target === 'home') {
      setCurrent('home');
      navigate('/guest/home');
    } else if (target === 'map') {
      setCurrent('map');
      if (data && data.lotId) {
        navigate('/guest/map', { state: { selectedLotId: data.lotId } });
      } else {
        navigate('/guest/map');
      }
    } else if (target === 'plot-availability') {
      setCurrent('public');
      navigate('/guest/plot-availability');
    } else if (target === 'public') {
      setCurrent(prev => prev === 'public' ? null : 'public');
    }
  };

  // Visitor info
  const handleVisitorInfo = () => {
    setShowVisitorInfo(true);
    setCurrent('public');
    navigate('/guest/public-access/visitor-info');
  };

  // Login redirect
  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex' }}>
      <SidebarGuest
        onNavigate={handleNavigate}
        onLogin={handleLogin}
        current={current}
        showVisitorInfoPill={showVisitorInfoPill}
        onVisitorInfo={handleVisitorInfo}
      />
      <main style={{ flex: 1, padding: '1rem', paddingTop: '80px' }}>
        <Outlet context={{ handleNavigate, handleVisitorInfo }} />
      </main>
    </div>
  );
} 