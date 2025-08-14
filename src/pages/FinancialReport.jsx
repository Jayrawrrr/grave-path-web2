// src/pages/FinancialReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './FinancialReport.css';

export default function FinancialReport() {
  const { token } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Fetch from your financial report endpoint
        const res = await axios.get(
          `${API_BASE}/admin/reports/financial`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = res.data; // [{ _id, date, description, amount }, …]
        setRecords(data);

        // Sum all amounts
        const sum = data.reduce((acc, rec) => acc + (rec.amount || 0), 0);
        setTotal(sum);

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load financial report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [API_BASE, token]);

  if (loading) return <div>Loading financial report…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="financial-report-page">
      <h2>Financial Report</h2>
      <div className="total-income">
        Total Income:{' '}
        {total.toLocaleString(undefined, {
          style:    'currency',
          currency: 'PHP'
        })}
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {records.map(({ _id, date, description, amount }) => (
            <tr key={_id}>
              <td>{new Date(date).toLocaleDateString()}</td>
              <td>{description}</td>
              <td>
                {amount.toLocaleString(undefined, {
                  style:    'currency',
                  currency: 'PHP'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
