// src/pages/ActivityLogs.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { FaListAlt, FaPrint, FaFilter } from 'react-icons/fa';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ client: {}, staff: {}, admin: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ user: '', role: '', action: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Activity Logs Report',
    removeAfterPrint: true,
    onAfterPrint: () => console.log('Print dialog closed'),
  });

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Fix URL construction to avoid double /api
        const baseURL = process.env.REACT_APP_API_URL || '/api';
        const cleanURL = baseURL.replace(/\/+$/, ''); // Remove trailing slashes
        const logsEndpoint = cleanURL.endsWith('/api') ? '/admin/logs' : '/api/admin/logs';
        const summaryEndpoint = cleanURL.endsWith('/api') ? '/admin/logs/summary' : '/api/admin/logs/summary';
        
        const [logsRes, summaryRes] = await Promise.all([
          axios.get(`${cleanURL}${logsEndpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${cleanURL}${summaryEndpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setLogs(logsRes.data);
        setSummary(summaryRes.data);
        setError(null);
      } catch (err) {
        console.error('Activity logs fetch error:', err);
        setError('Failed to load activity logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userName))).filter(Boolean);
  const uniqueRoles = Array.from(new Set(logs.map(log => log.userRole))).filter(Boolean);
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const filteredLogs = logs.filter(log => {
    return (
      (!filters.user || log.userName === filters.user) &&
      (!filters.role || log.userRole === filters.role) &&
      (!filters.action || log.action === filters.action) &&
      (!filters.search || (log.details && log.details.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  if (loading) return <div className="loading-spinner">Loading activity logs...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="activity-logs-page">
      <div className="activity-logs-header-FIXED">
        <div className="header-content">
          <div className="header-icon">
            <FaListAlt />
          </div>
          <div className="header-text">
            <h2>Activity Logs Report</h2>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handlePrint} className="btn-primary">
            <FaPrint />
            Print Report
          </button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="summary-stats">
        {['client', 'staff', 'admin'].map(role => {
          const actions = Object.entries(summary[role] || {});
          const total = actions.reduce((a, [, b]) => a + b, 0);
          return (
            <div className={`stat-box ${role}`} key={role}>
              <span className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)} Activities</span>
              <span className="stat-value">{total}</span>
              <div className="action-breakdown">
                {actions
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([action, count]) => (
                    <div key={action} className="action-item">
                      {action}: {count}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Section */}
      <div className="filter-actions">
        <button 
          className="btn btn-outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>User:</label>
              <select 
                value={filters.user} 
                onChange={e => handleFilterChange('user', e.target.value)}
              >
                <option value="">All Users</option>
                {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Role:</label>
              <select 
                value={filters.role} 
                onChange={e => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Action:</label>
              <select 
                value={filters.action} 
                onChange={e => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search details..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label>Show:</label>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="table-section">
        <h3>Activity Details ({filteredLogs.length} logs)</h3>
        {filteredLogs.length === 0 ? (
          <div className="no-records">
            <p>No activity logs found for the selected filters.</p>
          </div>
        ) : (
          <>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(log => (
                <tr key={log._id}>
                  <td className="user-cell">{log.userName}</td>
                  <td>
                    <span className={`role-badge ${log.userRole}`}>
                      {log.userRole.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`action-badge ${log.action}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="timestamp-cell">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="details-cell">{log.details || '—'}</td>
                </tr>
              ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages} ({filteredLogs.length} logs)
                </span>
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Print Section - Hidden on screen, visible in print */}
      <div className="print-only" ref={printRef}>
        <div className="print-header">
          <div className="logo-row">
            <img src="/gravepath1.png" alt="Grave Path Logo" className="logo" />
          </div>
          <h1>Garden of Memories Memorial Park</h1>
          <p>Prepared By: <strong>BLDY GROUP</strong></p>
          <p>
            Date: {new Date().toLocaleDateString()} &nbsp;|&nbsp;
            Time: {new Date().toLocaleTimeString()}
          </p>
        </div>

        <h2>Activity Logs Report</h2>
        <div className="summary-stats print-summary">
          {['client', 'staff', 'admin'].map(role => {
            const actions = Object.entries(summary[role] || {});
            const total = actions.reduce((a, [, b]) => a + b, 0);
            return (
              <div className="stat-box" key={role}>
                <span className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)} Logs</span>
                <span className="stat-value">{total}</span>
                <ul className="action-list">
                  {actions
                    .sort((a, b) => b[1] - a[1])
                    .map(([action, count]) => (
                      <li key={action}>{action}: {count}</li>
                    ))}
                  <li className="total-item">Total: {total}</li>
                </ul>
              </div>
            );
          })}
        </div>

        <table className="logs-table print-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log._id}>
                <td>{log.userName}</td>
                <td>{log.userRole}</td>
                <td>{log.action}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Actions */}
      <div className="report-actions">
        <button className="btn-export" onClick={handlePrint}>
          Print Report
        </button>
      </div>
    </div>
  );
}
