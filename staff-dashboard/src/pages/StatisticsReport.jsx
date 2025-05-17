// src/pages/StatisticsReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './StatisticsReport.css';

export default function StatisticsReport() {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/reports/statistics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div>Loading statistics…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="statistics-report-page">
      <h2>Statistics Dashboard</h2>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(item => (
            <tr key={item.metric}>
              <td>{item.metric}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
