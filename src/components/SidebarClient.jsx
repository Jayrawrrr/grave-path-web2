// src/components/SidebarClient.jsx
import React from 'react';
import SidebarModuleItem from './SidebarModuleItem';
import {
  MapPin as MapIcon,
  Globe as PublicIcon,
  CalendarCheck as BookingIcon,
  LogOut as LogoutIcon,
  Settings2 as SettingsIcon,
  Info as VisitorInfoIcon
} from 'lucide-react';
import './SidebarClient.css';

export default function SidebarClient({
  onNavigate,
  onLogout,
  current,
  onVisitorInfo,
  onBookingPill
}) {
  return (
    <div className="sidebar sidebar-client">
      <div className="sidebar-modules">
        <SidebarModuleItem
          icon={<MapIcon />}
          label="Map"
          active={current === 'map'}
          onClick={() => onNavigate('map')}
        />
        <SidebarModuleItem
          icon={<PublicIcon />}
          label="Public"
          active={current === 'public'}
          onClick={() => onNavigate('public')}
        />
        <SidebarModuleItem
          icon={<BookingIcon />}
          label="Booking"
          active={current === 'booking'}
          onClick={() => onNavigate('booking')}
        />
      </div>

      <div style={{ flexGrow: 1 }} />

      <SidebarModuleItem
        icon={<LogoutIcon />}
        label="Logout"
        onClick={onLogout}
        className="logout"
      />

      {/* Visitor Info Pill: visible whenever 'public' is the current module */}
      {current === 'public' && (
        <button className="visitor-info-pill" onClick={onVisitorInfo}>
          <VisitorInfoIcon className="pill-icon" />
          <span>Visitor Info</span>
        </button>
      )}

      {/* Booking Pills: visible whenever 'booking' is the current module */}
      {current === 'booking' && (
        <div className="sidebar-pills booking">
          <button
            className="sidebar-pill"
            onClick={() => onBookingPill('availability')}
          >
            <MapIcon className="pill-icon" />
            <span>Plot Availability</span>
          </button>
          <button
            className="sidebar-pill"
            onClick={() => onBookingPill('booking')}
          >
            <BookingIcon className="pill-icon" />
            <span>Booking</span>
          </button>
          <button
            className="sidebar-pill"
            onClick={() => onBookingPill('management')}
          >
            <SettingsIcon className="pill-icon" />
            <span>Reservation</span>
          </button>
        </div>
      )}
    </div>
  );
}
