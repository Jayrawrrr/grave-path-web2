// src/components/StaffDashboard.jsx
import React, { useState } from 'react';
import SidebarStaff from './Sidebar';
import MapView from '../pages/MapView';
import VisitorInfo from './components/VisitorInfo';
import './StaffDashboard.css';

export default function StaffDashboard({ onLogout }) {
  const [section, setSection] = useState('map');

  return (
    <div className="staff-dashboard">
      <SidebarStaff
        current={section}
        onNavigate={setSection}
        onLogout={onLogout}
      />

      <div className="dashboard-content">
        {section === 'map' && <MapView />}

        {section === 'public' && (
          <div className="visitor-info-panel">
            <VisitorInfo />
          </div>
        )}

        {section === 'reservations' && (
          /* your existing reservation list or grid */
          <div className="reservations-container">
            {/* ...PlotAvailability, BookingForm, ReservationList */}
          </div>
        )}

        {/* other sections (records, reports) */}
      </div>
    </div>
  );
}
