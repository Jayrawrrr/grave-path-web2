// src/pages/IntermentRecordsReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './IntermentRecordsReport.css';

export default function IntermentRecordsReport() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/reports/interment-records`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load interment records report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token]);

  if (loading) return <div>Loading interment records report…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="interment-records-report-page">
      <h2>Interment Records Report</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Plot ID</th>
            <th>Total Interments</th>
            <th>Last Interment Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.plotId}>
              <td>{item.plotId}</td>
              <td>{item.count}</td>
              <td>{new Date(item.lastIntermentDate).toLocaleDateString()}</td>
              <td>
                <button>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
