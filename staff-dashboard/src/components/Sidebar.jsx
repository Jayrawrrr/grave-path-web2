// src/components/Sidebar.jsx
import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';
import { 
  FaMap, 
  FaEye, 
  FaInfoCircle, 
  FaBullhorn, 
  FaCalendarAlt, 
  FaChartLine, 
  FaEdit, 
  FaCog, 
  FaUsers, 
  FaFileAlt, 
  FaClipboardList, 
  FaChartBar, 
  FaListAlt, 
  FaDollarSign, 
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaHome,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaCross,
  FaTachometerAlt,
  FaRobot,
  FaBuilding
} from 'react-icons/fa';

export default function Sidebar() {
  const { role, logout, user } = useContext(AuthContext);
  const [publicOpen, setPublicOpen]       = useState(false);
  const [reservationOpen, setReservation] = useState(false);
  const [userOpen, setUserOpen]           = useState(false);
  const [recordOpen, setRecordOpen]       = useState(false);
  const [reportsOpen, setReportsOpen]     = useState(false);
  const [columbariumOpen, setColumbariumOpen] = useState(false);

  const getRoleIcon = () => {
    switch (role) {
      case 'admin': return <FaUserShield className="sidebar-role-icon" />;
      case 'staff': return <FaUserTie className="sidebar-role-icon" />;
      case 'client': return <FaUser className="sidebar-role-icon" />;
      default: return <FaUser className="sidebar-role-icon" />;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin': return 'admin';
      case 'staff': return 'staff';
      case 'client': return 'client';
      default: return 'client';
    }
  };

  const renderHeader = () => (
    <div className="sidebar-header">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <FaHome />
        </div>
        <div className="sidebar-brand-text">
          <h3>Grave Path</h3>
          <span>Memorial Park</span>
        </div>
      </div>
      
      <div className={`sidebar-user ${getRoleColor()}`}>
        {getRoleIcon()}
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name || 'User'}</span>
          <span className="sidebar-user-role">{role?.charAt(0).toUpperCase() + role?.slice(1)}</span>
        </div>
      </div>
    </div>
  );

  const renderCollapsibleItem = (icon, title, isOpen, setOpen, children) => (
    <div className="sidebar-item collapsible">
      <div 
        className={`sidebar-collapsible-header ${isOpen ? 'open' : ''}`} 
        onClick={() => setOpen(o => !o)}
      >
        <div className="sidebar-item-content">
          <span className="sidebar-item-icon">{icon}</span>
          <span className="sidebar-item-text">{title}</span>
        </div>
        <span className="sidebar-chevron">
          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
        </span>
      </div>
      {isOpen && (
        <div className="sidebar-collapsible-content">
          {children}
        </div>
      )}
    </div>
  );

  const renderNavLink = (to, icon, text, className = "sidebar-subitem") => (
    <NavLink 
      to={to} 
      className={({isActive}) => `${className} ${isActive ? 'active' : ''}`}
    >
      <span className="sidebar-item-icon">{icon}</span>
      <span className="sidebar-item-text">{text}</span>
    </NavLink>
  );

  const renderLogout = () => (
    <div className="sidebar-footer">
      <button className="sidebar-logout" onClick={logout}>
        <FaSignOutAlt className="sidebar-logout-icon" />
        <span>Log Out</span>
      </button>
    </div>
  );

  if (role === 'staff') {
    return (
      <aside className="sidebar">
        {renderHeader()}
        
        <nav className="sidebar-nav">
          {renderNavLink("/staff/map", <FaMap />, "Map", "sidebar-item")}
          {renderNavLink("/staff/profile", <FaUser />, "Profile", "sidebar-item")}

          {renderCollapsibleItem(
            <FaEye />, 
            "Public Access", 
            publicOpen, 
            setPublicOpen,
            <>
              {renderNavLink("/staff/public-access/info", <FaInfoCircle />, "Visitor Info")}
              {renderNavLink("/admin/visitor-info/management", <FaEdit />, "Visitor Info Management")}
              {renderNavLink("/staff/public-access/announcements", <FaBullhorn />, "Announcements")}
            </>
          )}

          {renderCollapsibleItem(
            <FaCalendarAlt />, 
            "Reservations", 
            reservationOpen, 
            setReservation,
            <>
              {renderNavLink("/staff/columbarium/management", <FaBuilding />, "Columbarium")}
              {renderNavLink("/staff/reservations/availability", <FaChartLine />, "Plot Availability")}
              {renderNavLink("/staff/reservations/booking", <FaEdit />, "Reserve")}
              {renderNavLink("/staff/reservations/management", <FaCog />, "Manage")}
            </>
          )}

        </nav>
        
        {renderLogout()}
      </aside>
    );
  }

  if (role === 'admin') {
    return (
      <aside className="sidebar">
        {renderHeader()}
        
        <nav className="sidebar-nav">
          {renderNavLink("/admin/dashboard", <FaTachometerAlt />, "Dashboard", "sidebar-item")}
          {renderNavLink("/admin/chatbot/management", <FaRobot />, "Chatbot", "sidebar-item")}
          {renderNavLink("/admin/map", <FaMap />, "Map", "sidebar-item")}
          {renderNavLink("/admin/profile", <FaUserShield />, "Profile", "sidebar-item")}

          {renderCollapsibleItem(
            <FaEye />, 
            "Public Access", 
            publicOpen, 
            setPublicOpen,
            <>
              {renderNavLink("/admin/public-access/info", <FaInfoCircle />, "Visitor Info")}
              {renderNavLink("/admin/visitor-info/management", <FaEdit />, "Visitor Info Management")}
              {renderNavLink("/admin/public-access/announcements", <FaBullhorn />, "Announcements")}
            </>
          )}

          {renderCollapsibleItem(
            <FaCalendarAlt />, 
            "Reservations", 
            reservationOpen, 
            setReservation,
            <>
              {renderNavLink("/admin/columbarium/management", <FaBuilding />, "Columbarium")}
              {renderNavLink("/admin/reservations/availability", <FaChartLine />, "Plot Availability")}
              {renderNavLink("/admin/reservations/booking", <FaEdit />, "Reserve")}
              {renderNavLink("/admin/reservations/management", <FaCog />, "Manage")}
            </>
          )}

          {renderCollapsibleItem(
            <FaUsers />, 
            "User & Access", 
            userOpen, 
            setUserOpen,
            <>
              {renderNavLink("/admin/users", <FaUsers />, "Manage Staff")}
            </>
          )}

          {renderCollapsibleItem(
            <FaFileAlt />, 
            "Record Management", 
            recordOpen, 
            setRecordOpen,
            <>
              {renderNavLink("/admin/record-management/burial-records", <FaCross />, "Burial Records")}
              {renderNavLink("/admin/record-management/interment-records", <FaClipboardList />, "Interment Records")}
            </>
          )}

          {renderCollapsibleItem(
            <FaChartBar />, 
            "Reporting", 
            reportsOpen, 
            setReportsOpen,
            <>
              {renderNavLink("/admin/reports/activity-logs", <FaListAlt />, "Activity Logs")}
              {renderNavLink("/admin/reports/burial-records", <FaChartLine />, "Burial Records Report")}
              {renderNavLink("/admin/reports/interment-records", <FaChartBar />, "Interment Records Report")}
              {renderNavLink("/admin/reports/financial", <FaDollarSign />, "Financial Report")}
              {renderNavLink("/admin/reports/reservations", <FaCalendarAlt />, "Reservation Reports")}
            </>
          )}
        </nav>
        
        {renderLogout()}
      </aside>
    );
  }

  if (role === 'client') {
    return (
      <aside className="sidebar">
        {renderHeader()}
        
        <nav className="sidebar-nav">
          {renderNavLink("/client/map", <FaMap />, "Map", "sidebar-item")}
          {renderNavLink("/client/profile", <FaUser />, "Profile", "sidebar-item")}

          {renderCollapsibleItem(
            <FaEye />, 
            "Public Access", 
            publicOpen, 
            setPublicOpen,
            <>
              {renderNavLink("/client/visitor-info", <FaInfoCircle />, "Visitor Info")}
            </>
          )}

          {renderCollapsibleItem(
            <FaCalendarAlt />, 
            "Reservations", 
            reservationOpen, 
            setReservation,
            <>
              {renderNavLink("/client/reservations/availability", <FaChartLine />, "Plot Availability")}
              {renderNavLink("/client/reservations/booking", <FaEdit />, "Reserve")}
              {renderNavLink("/client/reservations/management", <FaCog />, "My Reservations")}
            </>
          )}
        </nav>
        
        {renderLogout()}
      </aside>
    );
  }

  return null;
}
