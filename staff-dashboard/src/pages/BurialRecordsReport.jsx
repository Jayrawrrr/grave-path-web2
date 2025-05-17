// src/pages/BurialRecordsReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './BurialRecordsReport.css';

export default function BurialRecordsReport() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/reports/burial-records`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load burial records report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) return <div>Loading burial records report…</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="burial-records-report-page">
      <h2>Burial Records Report</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Plot ID</th>
            <th>Total Burials</th>
            <th>Last Burial Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.plotId}>
              <td>{item.plotId}</td>
              <td>{item.count}</td>
              <td>{new Date(item.lastBurialDate).toLocaleDateString()}</td>
              <td>
                {/* Placeholder for export or details */}
                <button>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
