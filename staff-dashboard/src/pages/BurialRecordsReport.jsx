// src/pages/BurialRecordsReport.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import './BurialRecordsReport.css';

export default function BurialRecordsReport() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ plotId: '', search: '' });

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Burial Records Report',
    removeAfterPrint: true,
  });

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin/burials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecords(res.data);
        const now = new Date();
        const upcoming = res.data.filter(b => new Date(b.burialDate) >= now);
        const past = res.data.filter(b => new Date(b.burialDate) < now);
        setSummary({ total: res.data.length, upcoming: upcoming.length, past: past.length });
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load burial records report');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  const uniquePlotIds = Array.from(new Set(records.map(r => r.plotId))).filter(Boolean);

  const filteredRecords = records.filter(item => {
    return (
      (!filters.plotId || item.plotId === filters.plotId) &&
      (!filters.search ||
        (item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.plotId && item.plotId.toLowerCase().includes(filters.search.toLowerCase()))
      )
    );
  });

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  if (loading) return <div>Loading burial records report…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="burial-records-report-page">
      {/* Printable Section */}
      <div ref={printRef} className="burial-records-report-page">
        <div className="report-header" style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/gravepath1.png" alt="Grave Path Logo" style={{ height: 50, marginBottom: 8 }} />
          <h2 style={{ margin: 0 }}>Garden of Memories Memorial Park</h2>
          <div style={{ fontSize: 14 }}>
            Prepared By: <strong>BLDY GROUP</strong><br />
            Date: {currentDate} | Time: {currentTime}
          </div>
          <hr style={{ marginTop: 12 }} />
        </div>

        {/* Summary */}
        <div className="summary-stats">
          <div className="stat-box"><span className="stat-label">Total Records</span><span className="stat-value">{summary.total}</span></div>
          <div className="stat-box"><span className="stat-label">Upcoming</span><span className="stat-value">{summary.upcoming}</span></div>
          <div className="stat-box"><span className="stat-label">Past</span><span className="stat-value">{summary.past}</span></div>
        </div>

        {/* Table */}
        <table className="report-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Plot ID</th>
              <th>Date of Burial</th>
              <th>Death Certificate</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(item => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.plotId}</td>
                <td>{new Date(item.burialDate).toLocaleDateString()}</td>
                <td>
                  {item.deathCertificateUrl ? (
                    <a href={item.deathCertificateUrl} target="_blank" rel="noopener noreferrer">View</a>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Filters & Print Button (Not printed) */}
      <div className="filters" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <select
          value={filters.plotId}
          onChange={e => setFilters(f => ({ ...f, plotId: e.target.value }))}
        >
          <option value="">All Plot IDs</option>
          {uniquePlotIds.map(pid => (
            <option key={pid} value={pid}>{pid}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name or plot ID..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <button onClick={handlePrint}>Print PDF</button>
      </div>
    </div>
  );
}
