// src/pages/BurialRecordsReport.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { FaFileAlt, FaPrint, FaFilter } from 'react-icons/fa';
import './BurialRecordsReport.css';

export default function BurialRecordsReport() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ plotId: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
        // Fix URL construction to avoid double /api
        const baseURL = process.env.REACT_APP_API_URL || '/api';
        const cleanURL = baseURL.replace(/\/+$/, ''); // Remove trailing slashes
        const endpoint = cleanURL.endsWith('/api') ? '/admin/burials' : '/api/admin/burials';
        
        const res = await axios.get(
          `${cleanURL}${endpoint}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(res.data);
        const now = new Date();
        const upcoming = res.data.filter(b => new Date(b.burialDate) >= now);
        const past = res.data.filter(b => new Date(b.burialDate) < now);
        setSummary({ total: res.data.length, upcoming: upcoming.length, past: past.length });
        setError(null);
      } catch (err) {
        console.error('Burial records fetch error:', err);
        setError('Failed to load burial records report. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  const uniquePlotIds = Array.from(new Set(records.map(r => r.plotId))).filter(Boolean);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const filteredRecords = records.filter(item => {
    return (
      (!filters.plotId || item.plotId === filters.plotId) &&
      (!filters.search ||
        (item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.plotId && item.plotId.toLowerCase().includes(filters.search.toLowerCase()))
      )
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  if (loading) return <div className="loading-spinner">Loading burial records report...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="burial-records-report-page">
      <div className="burial-records-report-header-FIXED">
        <div className="header-content">
          <div className="header-icon">
            <FaFileAlt />
          </div>
          <div className="header-text">
            <h2>Burial Records Report</h2>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handlePrint} className="btn-primary">
            <FaPrint />
            Print Report
          </button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stat-box total">
          <span className="stat-label">Total Records</span>
          <span className="stat-value">{summary.total}</span>
        </div>
        <div className="stat-box upcoming">
          <span className="stat-label">Upcoming</span>
          <span className="stat-value">{summary.upcoming}</span>
        </div>
        <div className="stat-box past">
          <span className="stat-label">Past</span>
          <span className="stat-value">{summary.past}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-actions">
        <button 
          className="btn btn-outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Plot ID:</label>
              <select
                value={filters.plotId}
                onChange={e => handleFilterChange('plotId', e.target.value)}
              >
                <option value="">All Plot IDs</option>
                {uniquePlotIds.map(pid => (
                  <option key={pid} value={pid}>{pid}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search by name or plot ID..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label>Show:</label>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="table-section">
        <h3>Burial Details ({filteredRecords.length} records)</h3>
        {filteredRecords.length === 0 ? (
          <div className="no-records">
            <p>No burial records found for the selected filters.</p>
          </div>
        ) : (
          <>
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
                {paginatedRecords.map(item => (
                <tr key={item._id}>
                  <td className="name-cell">{item.name}</td>
                  <td className="plot-id">{item.plotId}</td>
                  <td>{new Date(item.burialDate).toLocaleDateString()}</td>
                  <td className="certificate-cell">
                    {item.deathCertificateUrl ? (
                      <a href={item.deathCertificateUrl} target="_blank" rel="noopener noreferrer" className="certificate-link">
                        View Certificate
                      </a>
                    ) : (
                      <span className="no-certificate">No Certificate</span>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages} ({filteredRecords.length} records)
                </span>
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Print Section - Hidden on screen, visible in print */}
      <div className="print-only" ref={printRef}>
        <div className="report-header">
          <img src="/gravepath1.png" alt="Grave Path Logo" className="logo" />
          <h1>Garden of Memories Memorial Park</h1>
          <div className="report-meta">
            Prepared By: <strong>BLDY GROUP</strong><br />
            Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}
          </div>
          <hr />
        </div>

        <h2>Burial Records Report</h2>
        <div className="summary-stats print-summary">
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

        <table className="report-table print-table">
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
                  {item.deathCertificateUrl ? 'Available' : 'Not Available'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Actions */}
      <div className="report-actions">
        <button className="btn-export" onClick={handlePrint}>
          Print Report
        </button>
      </div>
    </div>
  );
}
