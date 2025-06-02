// src/components/Sidebar.jsx
import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { role, logout } = useContext(AuthContext);
  const [publicOpen, setPublicOpen]       = useState(false);
  const [reservationOpen, setReservation] = useState(false);
  const [userOpen, setUserOpen]           = useState(false);
  const [recordOpen, setRecordOpen]       = useState(false);
  const [reportsOpen, setReportsOpen]     = useState(false);

  const renderLogout = () => (
    <button className="sidebar-logout" onClick={logout}>
      Log Out
    </button>
  );

  if (role === 'staff') {
    return (
      <aside className="sidebar">
        <nav>
          <NavLink to="/staff/map" className={({isActive}) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            🗺️ Map
          </NavLink>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setPublicOpen(o => !o)}>
              🔍 Public Access {publicOpen ? '▾' : '▸'}
            </div>
            {publicOpen && (
              <div className="collapsible-content">
                <NavLink to="/staff/public-access/info"          className="sidebar-subitem">🛈 Visitor Info</NavLink>
                <NavLink to="/staff/public-access/announcements" className="sidebar-subitem">📢 Announcements</NavLink>
              </div>
            )}
          </div>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setReservation(o => !o)}>
              📅 Reservations {reservationOpen ? '▾' : '▸'}
            </div>
            {reservationOpen && (
              <div className="collapsible-content">
                <NavLink to="/staff/reservations/availability" className="sidebar-subitem">📈 Plot Availability</NavLink>
                <NavLink to="/staff/reservations/booking"      className="sidebar-subitem">✍️ Reserve</NavLink>
                <NavLink to="/staff/reservations/management"   className="sidebar-subitem">⚙️ Manage</NavLink>
              </div>
            )}
          </div>
        </nav>
        {renderLogout()}
      </aside>
    );
  }

  if (role === 'admin') {
    return (
      <aside className="sidebar">
        <nav>
          <NavLink to="/admin/map" className={({isActive}) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            📍 Map
          </NavLink>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setPublicOpen(o => !o)}>
              🔍 Public Access {publicOpen ? '▾' : '▸'}
            </div>
            {publicOpen && (
              <div className="collapsible-content">
                <NavLink to="/admin/public-access/info"          className="sidebar-subitem">🛈 Visitor Info</NavLink>
                <NavLink to="/admin/public-access/announcements" className="sidebar-subitem">📢 Announcements</NavLink>
              </div>
            )}
          </div>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setReservation(o => !o)}>
              📅 Reservations {reservationOpen ? '▾' : '▸'}
            </div>
            {reservationOpen && (
              <div className="collapsible-content">
                <NavLink to="/admin/reservations/availability" className="sidebar-subitem">📈 Plot Availability</NavLink>
                <NavLink to="/admin/reservations/booking"      className="sidebar-subitem">✍️ Reserve</NavLink>
                <NavLink to="/admin/reservations/management"   className="sidebar-subitem">⚙️ Manage</NavLink>
              </div>
            )}
          </div>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setUserOpen(o => !o)}>
              👥 User & Access {userOpen ? '▾' : '▸'}
            </div>
            {userOpen && (
              <div className="collapsible-content">
                <NavLink to="/admin/users" className="sidebar-subitem">👥 Manage Staff</NavLink>
              </div>
            )}
          </div>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setRecordOpen(o => !o)}>
              📑 Record Management {recordOpen ? '▾' : '▸'}
            </div>
            {recordOpen && (
              <div className="collapsible-content">
                <NavLink to="/admin/record-management/burial-records"    className="sidebar-subitem">⚰️ Burial Records</NavLink>
                <NavLink to="/admin/record-management/interment-records" className="sidebar-subitem">📋 Interment Records</NavLink>
              </div>
            )}
          </div>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setReportsOpen(o => !o)}>
              📊 Reporting {reportsOpen ? '▾' : '▸'}
            </div>
            {reportsOpen && (
              <div className="collapsible-content">
                <NavLink to="/admin/reports/activity-logs"       className="sidebar-subitem">📝 Activity Logs</NavLink>
                <NavLink to="/admin/reports/burial-records"      className="sidebar-subitem">📈 Burial Records Report</NavLink>
                <NavLink to="/admin/reports/interment-records"   className="sidebar-subitem">📊 Interment Records Report</NavLink>
                <NavLink to="/admin/reports/financial"           className="sidebar-subitem">💰 Financial Report</NavLink>
                <NavLink to="/admin/reports/statistics"          className="sidebar-subitem">📈 Statistics Dashboard</NavLink>
                <NavLink to="/admin/reports/reservations"        className="sidebar-subitem">📅 Reservation Reports</NavLink>
              </div>
            )}
          </div>
        </nav>
        {renderLogout()}
      </aside>
    );
  }

  if (role === 'client') {
    return (
      <aside className="sidebar">
        <nav>
          <NavLink to="/client/map" className={({isActive}) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            🗺️ Map
          </NavLink>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setPublicOpen(o => !o)}>
              🔍 Public Access {publicOpen ? '▾' : '▸'}
            </div>
            {publicOpen && (
              <div className="collapsible-content">
                <NavLink to="/client/visitor-info"   className="sidebar-subitem">🛈 Visitor Info</NavLink>
              </div>
            )}
          </div>

          <div className="sidebar-item collapsible">
            <div className="collapsible-header" onClick={() => setReservation(o => !o)}>
              📅 Reservations {reservationOpen ? '▾' : '▸'}
            </div>
            {reservationOpen && (
              <div className="collapsible-content">
                <NavLink to="/client/reservations/availability" className="sidebar-subitem">📈 Plot Availability</NavLink>
                <NavLink to="/client/reservations/booking"      className="sidebar-subitem">✍️ Reserve</NavLink>
                <NavLink to="/client/reservations/management"   className="sidebar-subitem">⚙️ My Reservations</NavLink>
              </div>
            )}
          </div>
        </nav>
        {renderLogout()}
      </aside>
    );
  }

  return null;
}
