// src/pages/ActivityLogs.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/logs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLogs(res.data);
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

  if (loading) return <div>Loading activity logs…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="activity-logs-page">
      <h2>Activity Logs</h2>
      <table className="logs-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Timestamp</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{log.userName}</td>
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
