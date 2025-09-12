import React, { useState, useRef } from 'react';
import SidebarModuleItem from './SidebarModuleItem';
import {
  MapPin as MapIcon,
  Globe as PublicIcon,
  LogIn as LoginIcon,
  Info as VisitorInfoIcon,
  Home as HomeIcon,
  User as GuestIcon,
  Bookmark as BookmarkIcon,
  CalendarCheck as BookingIcon,
  Settings2 as SettingsIcon,
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

const TOOLTIP_STYLES = {
  container: {
    position: 'absolute',
    backgroundColor: '#333',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1002,
    pointerEvents: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  arrow: {
    position: 'absolute',
    top: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '0',
    height: '0',
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderBottom: '4px solid #333',
  }
};

export default function SidebarGuest({
  onNavigate,
  onLogin,
  current,
  onVisitorInfo,
  showVisitorInfoPill
}) {
  const [hoveredModule, setHoveredModule] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
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
    } else if (module === 'booking') {
      ref = bookingRef;
      pillRef = bookingPillRef;
    }
    
    if (!ref?.current || !pillRef?.current) {
      setHoveredModule(null);
      return;
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
                style={{ ...PILL_STYLES.pill, opacity: 0.6, cursor: 'default' }}
                onMouseEnter={() => setHoveredTooltip('bookmark')}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <BookmarkIcon style={PILL_STYLES.icon} />
                Bookmark
                {hoveredTooltip === 'bookmark' && (
                  <div style={{
                    ...TOOLTIP_STYLES.container,
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px'
                  }}>
                    <div style={TOOLTIP_STYLES.arrow}></div>
                    Need to Sign in
                  </div>
                )}
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
          active={current === 'public' || hoveredModule === 'public'}
          onClick={() => onNavigate('public')}
          />
          {(hoveredModule === 'public' || showVisitorInfoPill) && (
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
          active={false}
          onClick={null}
          style={{ cursor: 'default', opacity: 0.6 }}
        />
          {hoveredModule === 'booking' && (
            <div ref={bookingPillRef} style={PILL_STYLES.container}>
              <button
                className="topbar-pill"
                style={{ ...PILL_STYLES.pill, opacity: 0.6, cursor: 'default' }}
                onMouseEnter={() => setHoveredTooltip('columbarium')}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <ColumbariumIcon style={PILL_STYLES.icon} />
                Columbarium
                {hoveredTooltip === 'columbarium' && (
                  <div style={{
                    ...TOOLTIP_STYLES.container,
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px'
                  }}>
                    <div style={TOOLTIP_STYLES.arrow}></div>
                    Need to Sign in
                  </div>
                )}
              </button>
              <button
                className="topbar-pill"
                onClick={() => onNavigate('plot-availability')}
                style={PILL_STYLES.pill}
              >
                <MapIcon style={PILL_STYLES.icon} />
                Plot Availability
              </button>
              <button
                className="topbar-pill"
                style={{ ...PILL_STYLES.pill, opacity: 0.6, cursor: 'default' }}
                onMouseEnter={() => setHoveredTooltip('reserve')}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <BookingIcon style={PILL_STYLES.icon} />
                Reserve
                {hoveredTooltip === 'reserve' && (
                  <div style={{
                    ...TOOLTIP_STYLES.container,
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px'
                  }}>
                    <div style={TOOLTIP_STYLES.arrow}></div>
                    Need to Sign in
                  </div>
                )}
              </button>
              <button
                className="topbar-pill"
                style={{ ...PILL_STYLES.pill, opacity: 0.6, cursor: 'default' }}
                onMouseEnter={() => setHoveredTooltip('manage')}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <SettingsIcon style={PILL_STYLES.icon} />
                Manage
                {hoveredTooltip === 'manage' && (
                  <div style={{
                    ...TOOLTIP_STYLES.container,
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px'
                  }}>
                    <div style={TOOLTIP_STYLES.arrow}></div>
                    Need to Sign in
                  </div>
                )}
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
          icon={<GuestIcon />}
          label="Guest"
          active={false}
          onClick={null}
          style={{ cursor: 'default', opacity: 0.7 }}
        />
        <SidebarModuleItem
          icon={<LoginIcon />}
          label="Login"
          onClick={onLogin}
          className="login"
        />
      </div>
    </nav>
  );
} 