// src/pages/ActivityLogs.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ client: {}, staff: {}, admin: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ user: '', role: '', action: '', search: '' });

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
        const [logsRes, summaryRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/admin/logs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/admin/logs/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setLogs(logsRes.data);
        setSummary(summaryRes.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userName))).filter(Boolean);
  const uniqueRoles = Array.from(new Set(logs.map(log => log.userRole))).filter(Boolean);
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);

  const filteredLogs = logs.filter(log => {
    return (
      (!filters.user || log.userName === filters.user) &&
      (!filters.role || log.userRole === filters.role) &&
      (!filters.action || log.action === filters.action) &&
      (!filters.search || (log.details && log.details.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  if (loading) return <div>Loading activity logs…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="activity-logs-page">
      {/* Printable section */}
      <div ref={printRef}>
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

        <h2>Activity Logs</h2>
        <div className="summary-stats">
          {['client', 'staff', 'admin'].map(role => {
            const actions = Object.entries(summary[role] || {});
            const total = actions.reduce((a, [, b]) => a + b, 0);
            return (
              <div className="stat-box" key={role}>
                <span className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)} Logs</span>
                <span className="stat-value">{total}</span>
                <ul style={{ fontSize: '0.9em', margin: 0, padding: 0, listStyle: 'none' }}>
                  {actions
                    .sort((a, b) => b[1] - a[1])
                    .map(([action, count]) => (
                      <li key={action}>{action}: {count}</li>
                    ))}
                  <li style={{ fontWeight: 'bold', marginTop: '0.5em' }}>Total: {total}</li>
                </ul>
              </div>
            );
          })}
        </div>

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

      {/* Filters and Print button (not included in print) */}
      <div className="filters" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filters.user} onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}>
          <option value="">All Users</option>
          {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
        </select>
        <select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
          <option value="">All Roles</option>
          {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
          <option value="">All Actions</option>
          {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search details..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
      </div>

      <button className="print-button" onClick={handlePrint}>Print PDF</button>
    </div>
  );
}
