// src/pages/FinancialReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './FinancialReport.css';

export default function FinancialReport() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/reports/financial`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load financial report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) return <div>Loading financial report…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="financial-report-page">
      <h2>Financial Report</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {records.map(item => (
            <tr key={item._id}>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>{item.description}</td>
              <td>{item.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
