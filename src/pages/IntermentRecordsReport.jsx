import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './IntermentRecordsReport.css';

export default function IntermentRecordsReport() {
  const { token } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL; // ends with /api

  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        // DROP '/api' here → `${API_BASE}/admin/interments`
        const res = await axios.get(
          `${API_BASE}/admin/interments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(res.data);

        // build the summary
        const now      = new Date();
        const upcoming = res.data.filter(i => new Date(i.intermentDate) >= now);
        const past     = res.data.filter(i => new Date(i.intermentDate) < now);
        setSummary({
          total:    res.data.length,
          upcoming: upcoming.length,
          past:     past.length
        });

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load interment records report');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [token, API_BASE]);

  if (loading) return <div>Loading interment records report…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="interment-records-report-page">
      <h2>Interment Records Report</h2>
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">Total Records</span>
          <span className="stat-value">{summary.total}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Upcoming</span>
          <span className="stat-value">{summary.upcoming}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Past</span>
          <span className="stat-value">{summary.past}</span>
        </div>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Plot ID</th>
            <th>Date of Interment</th>
            <th>Time</th>
            <th>Officiant</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map(item => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.plotId}</td>
              <td>{new Date(item.intermentDate).toLocaleDateString()}</td>
              <td>{item.intermentTime || '—'}</td>
              <td>{item.officiant || '—'}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
