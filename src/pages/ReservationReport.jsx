// src/pages/ReservationReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ReservationReport.css';

export default function ReservationReport() {
  const { token } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/staff/reservations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReservations(res.data);
        // Summarize
        const now = new Date();
        const upcoming = res.data.filter(r => new Date(r.date) >= now);
        const past = res.data.filter(r => new Date(r.date) < now);
        setSummary({ total: res.data.length, upcoming: upcoming.length, past: past.length });
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load reservation reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [token]);

  if (loading) return <div>Loading reservation reports…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="reservation-report-page">
      <h2>Reservation Reports</h2>
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-label">Total Reservations</span>
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
            <th>Reservation ID</th>
            <th>Client Name</th>
            <th>Plot ID</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(item => (
            <tr key={item._id}>
              <td>{item._id}</td>
              <td>{item.clientName}</td>
              <td>{item.plotId}</td>
              <td>{item.status}</td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
