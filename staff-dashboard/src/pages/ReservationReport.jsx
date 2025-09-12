// src/pages/ReservationReport.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaClipboardList, FaFilter } from 'react-icons/fa';
import './ReservationReport.css';

export default function ReservationReport() {
  const { token, role } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [summary, setSummary] = useState({ 
    total: 0, 
    pending: 0, 
    approved: 0, 
    rejected: 0, 
    cancelled: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        // Use the main reservations endpoint which already handles role-based filtering
        // Remove the duplicate /api since REACT_APP_API_URL already includes it
        const baseURL = process.env.REACT_APP_API_URL || '/api';
        const cleanURL = baseURL.replace(/\/+$/, ''); // Remove trailing slashes
        const endpoint = cleanURL.endsWith('/api') ? '/reservations' : '/api/reservations';
        
        const res = await axios.get(
          `${cleanURL}${endpoint}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const reservationsData = res.data;
        setReservations(reservationsData);
        
        // Calculate summary statistics by status
        const pending = reservationsData.filter(r => r.status === 'pending').length;
        const approved = reservationsData.filter(r => r.status === 'approved').length;
        const rejected = reservationsData.filter(r => r.status === 'rejected').length;
        const cancelled = reservationsData.filter(r => r.status === 'cancelled').length;
        
        setSummary({ 
          total: reservationsData.length, 
          pending, 
          approved, 
          rejected, 
          cancelled 
        });
        
        setError(null);
      } catch (err) {
        console.error('Reservation report fetch error:', err);
        setError('Failed to load reservation reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservations();
  }, [token]);

  // Filter reservations based on selected filter
  const filteredReservations = reservations.filter(reservation => {
    return filter === 'all' || reservation.status === filter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReservations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  if (loading) return <div className="loading-spinner">Loading reservation reports...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="reservation-report-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <FaClipboardList />
          </div>
          <div className="header-text">
            <h2>Reservation Reports</h2>
          </div>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stat-box total">
          <span className="stat-label">Total Reservations</span>
          <span className="stat-value">{summary.total}</span>
        </div>
        <div className="stat-box pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{summary.pending}</span>
        </div>
        <div className="stat-box approved">
          <span className="stat-label">Approved</span>
          <span className="stat-value">{summary.approved}</span>
        </div>
        <div className="stat-box rejected">
          <span className="stat-label">Rejected</span>
          <span className="stat-value">{summary.rejected}</span>
        </div>
        <div className="stat-box cancelled">
          <span className="stat-label">Cancelled</span>
          <span className="stat-value">{summary.cancelled}</span>
        </div>
      </div>

      {/* Filter Controls */}
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
              <label>Status:</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reservations Table */}
      <div className="table-section">
        <div className="section-header">
          <h3>Reservation Details ({filteredReservations.length} records)</h3>
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
        {filteredReservations.length === 0 ? (
          <div className="no-records">
            <p>No reservations found for the selected filter.</p>
          </div>
        ) : (
          <>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Client Name</th>
                  <th>Client Contact</th>
                  <th>Lot ID</th>
                  <th>Location</th>
                  <th>Payment Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReservations.map(reservation => (
                <tr key={reservation._id}>
                  <td className="reservation-id">{reservation._id.slice(-8)}</td>
                  <td>{reservation.clientName}</td>
                  <td>{reservation.clientContact}</td>
                  <td className="lot-id">{reservation.lotId}</td>
                  <td>{reservation.location || 'N/A'}</td>
                  <td className="amount">₱{Number(reservation.paymentAmount || 0).toLocaleString()}</td>
                  <td className="payment-method">{reservation.paymentMethod}</td>
                  <td>
                    <span className={`status-badge ${reservation.status}`}>
                      {reservation.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(reservation.createdAt || reservation.date).toLocaleDateString()}</td>
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
                  Page {currentPage} of {totalPages} ({filteredReservations.length} records)
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

      {/* Export Actions */}
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
