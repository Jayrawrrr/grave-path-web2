import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const { token } = useContext(AuthContext);
  const [logs,     setLogs]    = useState([]);
  const [summary,  setSummary] = useState({ client: 0, staff: 0, admin: 0 });
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  // your .env says REACT_APP_API_URL=http://localhost:5000/api
  const API_BASE = process.env.REACT_APP_API_URL;
  console.log('→ using API_BASE:', API_BASE);
  // e.g. "http://localhost:5000/api"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // DROP the extra "/api" here:
        const logsUrl    = `${API_BASE}/admin/logs`;
        const summaryUrl = `${API_BASE}/admin/logs/summary`;

        const [ logsRes, summaryRes ] = await Promise.all([
          axios.get(logsUrl,    { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(summaryUrl, { headers: { Authorization: `Bearer ${token}` } }),
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

    fetchData();
  }, [token, API_BASE]);

  if (loading) return <div>Loading activity logs…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="activity-logs-page">
      <h2>Activity Logs</h2>

      <div className="summary-stats">
        {['client','staff','admin'].map(role => (
          <div key={role} className="stat-box">
            <span className="stat-label">
              {role.charAt(0).toUpperCase() + role.slice(1)} Logs
            </span>
            <span className="stat-value">{summary[role]}</span>
          </div>
        ))}
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
          {logs.map(log => (
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
  );
}
