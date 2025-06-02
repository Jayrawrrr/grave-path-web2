// src/pages/IntermentRecordsReport.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import './IntermentRecordsReport.css';

export default function IntermentRecordsReport() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ plotId: '', status: '', search: '' });
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Interment Records Report',
    removeAfterPrint: true,
    onAfterPrint: () => console.log('Print dialog closed'),
  });

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/interments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(res.data);
        const now = new Date();
        const upcoming = res.data.filter(i => new Date(i.intermentDate) >= now);
        const past = res.data.filter(i => new Date(i.intermentDate) < now);
        setSummary({ total: res.data.length, upcoming: upcoming.length, past: past.length });
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load interment records report');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  const uniquePlotIds = Array.from(new Set(records.map(r => r.plotId))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(records.map(r => r.status))).filter(Boolean);

  const filteredRecords = records.filter(item => {
    return (
      (!filters.plotId || item.plotId === filters.plotId) &&
      (!filters.status || item.status === filters.status) &&
      (!filters.search ||
        (item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.plotId && item.plotId.toLowerCase().includes(filters.search.toLowerCase()))
      )
    );
  });

  if (loading) return <div>Loading interment records report…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="interment-records-report-page">
      {/* Printable section */}
      <div className="print-area" ref={printRef}>
        <div className="print-header">
          <div className="logo-row">
            <img src="/gravepath1.png" alt="Grave Path Logo" className="logo" />
          </div>
          <h1>Garden of Memories Memorial Park</h1>
          <p>Prepared By: <strong>BLDY GROUP</strong></p>
          <p>
            Date: {new Date().toLocaleDateString()} &nbsp;|&nbsp;
            Time: {new Date().toLocaleTimeString()}
          </p>
        </div>

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
            {filteredRecords.map(item => (
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

      {/* Filters and Print button (not included in print) */}
      <div className="filters" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filters.plotId} onChange={e => setFilters(f => ({ ...f, plotId: e.target.value }))}>
          <option value="">All Plot IDs</option>
          {uniquePlotIds.map(pid => <option key={pid} value={pid}>{pid}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search by name or plot ID..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
      </div>

      <button className="print-button" onClick={handlePrint}>Print PDF</button>
    </div>
  );
}
