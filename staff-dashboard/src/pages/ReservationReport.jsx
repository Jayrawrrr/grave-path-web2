// src/pages/ReservationReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ReservationReport.css';

export default function ReservationReport() {
  const { token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/reports/reservations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReports(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load reservation reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) return <div>Loading reservation reports…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="reservation-report-page">
      <h2>Reservation Reports</h2>
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
          {reports.map(item => (
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
