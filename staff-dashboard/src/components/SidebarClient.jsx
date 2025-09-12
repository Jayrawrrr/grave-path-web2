// src/components/SidebarClient.jsx
import React, { useState, useRef } from 'react';
import SidebarModuleItem from './SidebarModuleItem';
import {
  MapPin as MapIcon,
  Globe as PublicIcon,
  CalendarCheck as BookingIcon,
  LogOut as LogoutIcon,
  Settings2 as SettingsIcon,
  Info as VisitorInfoIcon,
  Home as HomeIcon,
  User as ProfileIcon,
  Bookmark as BookmarkIcon,
  Building as ColumbariumIcon
} from 'lucide-react';
import './SidebarClient.css';

const PILL_STYLES = {
  container: {
    position: 'absolute', 
    top: '100%', 
    marginTop: '4px',
    left: '50%', 
    transform: 'translateX(-50%)',
    zIndex: 1001,
    display: 'flex',
    gap: '8px',
  },
  pill: {
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: '4px',
  }
};

export default function SidebarClient({
  onNavigate,
  onLogout,
  current,
  onVisitorInfo,
  onBookingPill,
  onBookmarkPill
}) {
  const [hoveredModule, setHoveredModule] = useState(null);
  const mapRef = useRef(null);
  const publicRef = useRef(null);
  const bookingRef = useRef(null);
  const mapPillRef = useRef(null);
  const publicPillRef = useRef(null);
  const bookingPillRef = useRef(null);

  const handleMouseEnter = (module) => {
    setHoveredModule(module);
  };

  const handleMouseLeave = (e, module) => {
    let ref, pillRef;
    
    if (module === 'map') {
      ref = mapRef;
      pillRef = mapPillRef;
    } else if (module === 'public') {
      ref = publicRef;
      pillRef = publicPillRef;
    } else {
      ref = bookingRef;
      pillRef = bookingPillRef;
    }
    
    const navRect = ref.current.getBoundingClientRect();
    const pillRect = pillRef.current.getBoundingClientRect();
    
    const buffer = 5;
    
    const safeArea = {
      left: Math.min(navRect.left, pillRect.left) - buffer,
      right: Math.max(navRect.right, pillRect.right) + buffer,
      top: navRect.top - buffer,
      bottom: pillRect.bottom + buffer
    };

    const connectingArea = {
      left: Math.min(navRect.left, pillRect.left) - buffer,
      right: Math.max(navRect.right, pillRect.right) + buffer,
      top: navRect.bottom,
      bottom: pillRect.top
    };

    const isOutsideSafeArea = (
      e.clientX < safeArea.left ||
      e.clientX > safeArea.right ||
      e.clientY < safeArea.top ||
      e.clientY > safeArea.bottom
    );

    const isOutsideConnectingArea = (
      e.clientX < connectingArea.left ||
      e.clientX > connectingArea.right ||
      e.clientY < connectingArea.top ||
      e.clientY > connectingArea.bottom
    );

    if (isOutsideSafeArea && isOutsideConnectingArea) {
      setHoveredModule(null);
    }
  };

  return (
    <nav className="topbar">
      <div className="logo-container" style={{ 
        position: 'absolute', 
        left: '24px', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center',
        paddingRight: '24px'
      }}>
        <img 
          src="/gravepath-logo.png" 
          alt="GravePath" 
          style={{ 
            height: '45px',
            cursor: 'pointer',
            marginRight: '16px'
          }}
          onClick={() => onNavigate('home')}
        />
      </div>

      <div className="topbar-modules" style={{ 
        position: 'absolute', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        display: 'flex', 
        gap: '32px',
        marginLeft: '48px'
      }}>
        <SidebarModuleItem
          icon={<HomeIcon />}
          label="Home"
          active={current === 'home'}
          onClick={() => onNavigate('home')}
        />
        <div 
          ref={mapRef}
          style={{ position: 'relative' }}
          onMouseEnter={() => handleMouseEnter('map')}
          onMouseLeave={(e) => handleMouseLeave(e, 'map')}
        >
          <SidebarModuleItem
            icon={<MapIcon />}
            label="Map"
            active={current === 'map' || hoveredModule === 'map'}
            onClick={() => onNavigate('map')}
          />
          {hoveredModule === 'map' && (
            <div ref={mapPillRef} style={PILL_STYLES.container}>
              <button 
                className="topbar-pill" 
                onClick={() => onBookmarkPill && onBookmarkPill('bookmark')} 
                style={PILL_STYLES.pill}
              >
                <BookmarkIcon style={PILL_STYLES.icon} />
                Bookmark
              </button>
            </div>
          )}
        </div>
        <div 
          ref={publicRef}
          style={{ position: 'relative' }}
          onMouseEnter={() => handleMouseEnter('public')}
          onMouseLeave={(e) => handleMouseLeave(e, 'public')}
        >
        <SidebarModuleItem
          icon={<PublicIcon />}
          label="Public"
            active={hoveredModule === 'public'}
          />
          {hoveredModule === 'public' && (
            <div ref={publicPillRef} style={PILL_STYLES.container}>
              <button className="visitor-info-pill" onClick={onVisitorInfo} style={PILL_STYLES.pill}>
                <VisitorInfoIcon style={PILL_STYLES.icon} />
                Visitor Info
              </button>
            </div>
          )}
        </div>
        <div 
          ref={bookingRef}
          style={{ position: 'relative' }}
          onMouseEnter={() => handleMouseEnter('booking')}
          onMouseLeave={(e) => handleMouseLeave(e, 'booking')}
        >
        <SidebarModuleItem
          icon={<BookingIcon />}
          label="Reservation"
          active={hoveredModule === 'booking'}
        />
          {hoveredModule === 'booking' && (
            <div ref={bookingPillRef} style={PILL_STYLES.container}>
              <button
                className="topbar-pill"
                onClick={() => window.location.href = '/client/columbarium'}
                style={PILL_STYLES.pill}
              >
                <ColumbariumIcon style={PILL_STYLES.icon} />
                Columbarium
              </button>
              <button
                className="topbar-pill"
                onClick={() => onBookingPill('availability')}
                style={PILL_STYLES.pill}
              >
                <MapIcon style={PILL_STYLES.icon} />
                Plot Availability
              </button>
              <button
                className="topbar-pill"
                onClick={() => onBookingPill('booking')}
                style={PILL_STYLES.pill}
              >
                <BookingIcon style={PILL_STYLES.icon} />
                Reserve
              </button>
              <button
                className="topbar-pill"
                onClick={() => onBookingPill('management')}
                style={PILL_STYLES.pill}
              >
                <SettingsIcon style={PILL_STYLES.icon} />
                Manage
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right" style={{ 
        position: 'absolute', 
        right: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <SidebarModuleItem
          icon={<ProfileIcon />}
          label="Profile"
          active={current === 'profile'}
          onClick={() => onNavigate('profile')}
        />
        <SidebarModuleItem
          icon={<LogoutIcon />}
          label="Logout"
          onClick={onLogout}
          className="logout"
        />
      </div>
    </nav>
  );
}
