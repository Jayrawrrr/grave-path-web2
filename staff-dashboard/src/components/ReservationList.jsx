// src/components/ReservationList.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaCog, FaFilter } from 'react-icons/fa';
import './ReservationList.css';

// Create axios instance with your exact env variable
const api = axios.create({
  baseURL: 'https://api.grave-path.com/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default function ReservationList() {
  const { token, role } = useContext(AuthContext);
  
  // States
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadReservations = async () => {
      if (!token || !role) {
        setReservations([]);
        return;
      }
      
      setLoading(true);
      try {
        // Use the same endpoint for all roles - the backend handles the filtering
        const response = await api.get('/reservations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (mounted) {
          let reservationsData = response.data;
          
          // For staff, show reservations they created OR chatbot reservations (no staffId)
          if (role === 'staff') {
            const decodedToken = decodeToken(token);
            const userId = decodedToken?.id;
            
            if (userId) {
              // Show staff's own reservations OR chatbot reservations (source: 'chatbot')
              reservationsData = reservationsData.filter(r => 
                r.staffId === userId || r.source === 'chatbot'
              );
            } else {
              reservationsData = [];
            }
          }
          
          // For clients, show their own reservations (match by email/contact) OR client-created chatbot reservations
          if (role === 'client') {
            const decodedToken = decodeToken(token);
            const userEmail = decodedToken?.email;
            const userContact = decodedToken?.contact;
            const userId = decodedToken?.id;
            
            if (userId) {
              // Show reservations that match client's info in various fields
              reservationsData = reservationsData.filter(r => {
                // Primary match: clientId equals userId (for chatbot reservations)
                // Try both string and ObjectId comparisons
                if (r.clientId === userId || String(r.clientId) === String(userId)) {
                  return true;
                }
                
                // Secondary match: email if available
                if (userEmail && (r.clientEmail === userEmail || r.clientContact === userEmail)) {
                  return true;
                }
                
                // Tertiary match: contact if available  
                if (userContact && (r.clientEmail === userContact || r.clientContact === userContact)) {
                  return true;
                }
                
                return false;
              });
            } else {
              reservationsData = [];
            }
          }
          
          setReservations(reservationsData);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load reservations');
          setReservations([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      mounted = false;
    };
  }, [token, role]);

  // View proof of payment
  const handleViewProof = (reservation) => {
    if (reservation.proofImage) {
      try {
        // Remove any trailing slashes from the base URL and any existing /api
        const baseUrl = process.env.REACT_APP_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
        
        // Extract just the filename from the full path
        const filename = reservation.proofImage.split('proofs/').pop();
        if (!filename) {
          throw new Error('Invalid proof image path');
        }

        // Construct the URL without duplicate /api
        const proofUrl = `${baseUrl}/uploads/proofs/${filename}`;
        window.open(proofUrl, '_blank');
      } catch (err) {
        alert('Error viewing proof of payment. Please try again.');
      }
    } else {
      alert('No proof of payment uploaded');
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    return filter === 'all' || r.status === filter;
  });
  


  const handleUpdateStatus = async (reservationId, newStatus) => {
    try {
      const response = await api.patch(`/reservations/${reservationId}/status`, 
        { 
          status: newStatus,
          sendEmail: true,
          notifyAdmin: true
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );

      if (response.data.success) {
        // Reload reservations after update
        const updatedResponse = await api.get('/reservations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setReservations(updatedResponse.data);
        alert(`Reservation status updated to ${newStatus}. Email notification sent.`);
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to update reservation status. Please try again.');
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      const response = await api.patch(`/reservations/${reservationId}/status`, 
        { 
          status: 'approved',
          sendEmail: true,
          notifyAdmin: true,
          notifyClient: true
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        // Reload reservations after confirmation
        const updatedResponse = await api.get('/reservations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setReservations(updatedResponse.data);
        alert('Reservation confirmed successfully! Email notifications sent.');
      } else {
        throw new Error(response.data.message || 'Failed to confirm reservation');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      alert('Failed to confirm reservation. Please try again.');
    }
  };

  // Calculate statistics
  const totalReservations = reservations.length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const approvedCount = reservations.filter(r => r.status === 'approved').length;
  const rejectedCount = reservations.filter(r => r.status === 'rejected').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  if (loading) return <div className="loading-spinner">Loading reservations...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="reservation-list-container">
      <div className="reservation-list-header-FIXED">
        <div className="header-content">
          <div className="header-icon">
            <FaCog />
          </div>
          <div className="header-text">
            <h2 className="reservation-title">
              {role === 'admin' ? 'All Reservations Management' : 
               role === 'staff' ? 'My Staff Reservations' : 
               'My Reservations'}
            </h2>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stat-box total">
          <span className="stat-label">Total Reservations</span>
          <span className="stat-value">{totalReservations}</span>
        </div>
        <div className="stat-box pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{pendingCount}</span>
        </div>
        <div className="stat-box approved">
          <span className="stat-label">Approved</span>
          <span className="stat-value">{approvedCount}</span>
        </div>
        <div className="stat-box rejected">
          <span className="stat-label">Rejected</span>
          <span className="stat-value">{rejectedCount}</span>
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
        <h3>Reservation Details ({filteredReservations.length} records)</h3>
        {filteredReservations.length === 0 ? (
          <div className="no-records">
            <p>No reservations found for the selected filter.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="reservation-table">
              <thead>
                <tr>
                  <th>Lot ID</th>
                  <th>Location</th>
                  <th>Square Meters</th>
                  <th>Total Price</th>
                  <th>Client Name</th>
                  <th>Email/Contact</th>
                  <th>Payment Method</th>
                  <th>Reservation Fee</th>
                  <th>Proof</th>
                  <th>Date Reserved</th>
                  <th>Status</th>
                  {role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map(reservation => {
                  return (
                    <tr key={reservation._id}>
                      <td className="lot-id">{reservation.lotId}</td>
                      <td className="location-cell">{reservation.location || 'N/A'}</td>
                      <td className="sqm-cell">{reservation.sqm || 'N/A'}</td>
                      <td className="price-cell">₱{Number(reservation.totalPrice || 0).toLocaleString()}</td>
                      <td className="name-cell">{reservation.clientName}</td>
                      <td className="contact-cell">{reservation.clientContact}</td>
                      <td className="payment-method">{reservation.paymentMethod}</td>
                      <td className="payment-amount">₱{Number(reservation.paymentAmount || 0).toLocaleString()}</td>
                      <td className="proof-cell">
                        {reservation.proofImage ? (
                          <button 
                            className="btn-view-proof"
                            onClick={() => handleViewProof(reservation)}
                          >
                            View
                          </button>
                        ) : (
                          <span className="no-proof">None</span>
                        )}
                      </td>
                      <td className="date-cell">{new Date(reservation.createdAt || reservation.date).toLocaleDateString()}</td>
                      <td className="status-cell">
                        <span className={`status-badge ${reservation.status}`}>
                          {reservation.status.toUpperCase()}
                        </span>
                      </td>
                      {role === 'admin' && (
                        <td className="action-column">
                          {reservation.status === 'pending' ? (
                            <div className="action-buttons">
                              <button
                                className="btn-confirm"
                                onClick={() => handleConfirmReservation(reservation._id)}
                              >
                                Confirm
                              </button>
                              <select
                                value={reservation.status}
                                onChange={(e) => handleUpdateStatus(reservation._id, e.target.value)}
                                className="status-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="rejected">Reject</option>
                                <option value="cancelled">Cancel</option>
                              </select>
                            </div>
                          ) : (
                            <select
                              value={reservation.status}
                              onChange={(e) => handleUpdateStatus(reservation._id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
