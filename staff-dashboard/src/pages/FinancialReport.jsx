// src/pages/FinancialReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaDollarSign } from 'react-icons/fa';
import './FinancialReport.css';

export default function FinancialReport() {
  const { token } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL || '/api';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [total,   setTotal]   = useState(0);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalReservations: 0,
    averageReservationValue: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Fetch approved reservations for financial report
        const res = await axios.get(
          `${API_BASE}/admin/reports/financial`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = res.data; // [{ _id, date, description, amount }, …]
        setRecords(data);

        // Calculate financial summary
        const totalRevenue = data.reduce((acc, rec) => acc + (parseFloat(rec.amount) || 0), 0);
        const totalReservations = data.length;
        const averageReservationValue = totalReservations > 0 ? totalRevenue / totalReservations : 0;

        setTotal(totalRevenue);
        setSummary({
          totalRevenue,
          totalReservations,
          averageReservationValue
        });

        setError(null);
      } catch (err) {
        console.error('Financial report fetch error:', err);
        setError('Failed to load financial report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [API_BASE, token]);

  // Pagination logic
  const totalPages = Math.ceil(records.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = records.slice(startIndex, endIndex);

  if (loading) return <div className="loading-spinner">Loading financial report...</div>;
  if (error)   return <div className="error-message">{error}</div>;

  return (
    <div className="financial-report-page">
      <div className="financial-report-header-FIXED">
        <div className="header-content">
          <div className="header-icon">
            <FaDollarSign />
          </div>
          <div className="header-text">
            <h2>Financial Report</h2>
            <p>Approved Reservations</p>
          </div>
        </div>
      </div>
      
      {/* Financial Summary Cards */}
      <div className="summary-stats">
        <div className="stat-box total">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">
            ₱{summary.totalRevenue?.toLocaleString() || '0'}
          </span>
        </div>
        <div className="stat-box approved">
          <span className="stat-label">Total Reservations</span>
          <span className="stat-value">{summary.totalReservations || 0}</span>
        </div>
        <div className="stat-box average">
          <span className="stat-label">Average Reservation Value</span>
          <span className="stat-value">
            ₱{summary.averageReservationValue?.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}
          </span>
        </div>
      </div>

      {/* Detailed Records Table */}
      <div className="table-section">
        <div className="section-header">
          <h3>Approved Reservation Details ({records.length} records)</h3>
          <div className="section-actions">
            <div className="page-size-control">
              <label>Show:</label>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="page-size-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>
          </div>
        </div>
        {records.length === 0 ? (
          <div className="no-records">
            <p>No approved reservations found.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map(({ _id, date, description, amount }) => (
                  <tr key={_id}>
                    <td>{new Date(date).toLocaleDateString()}</td>
                    <td>{description}</td>
                    <td className="amount-cell">
                      ₱{amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                Page {currentPage} of {totalPages} ({records.length} records)
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

      {/* Export/Print Button */}
      <div className="report-actions">
        <button 
          className="btn-export"
          onClick={() => window.print()}
        >
          Print Report
        </button>
      </div>
    </div>
  );
}
