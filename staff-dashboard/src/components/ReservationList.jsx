// src/components/ReservationList.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ReservationList.css';

// Create a configured axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default function ReservationList() {
  const { token, role } = useContext(AuthContext);
  
  // States
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

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
        const response = await api.get('/api/reservations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (mounted) {
          console.log('Fetched reservations:', response.data);
          setReservations(response.data);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
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
        console.log('Opening proof at URL:', proofUrl);
        window.open(proofUrl, '_blank');
      } catch (err) {
        console.error('Error viewing proof:', err);
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
      await api.patch(`/api/reservations/${reservationId}/status`, 
        { 
          status: newStatus,
          sendEmail: true // Always send email on status updates
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      // Reload reservations after update
      const response = await api.get('/api/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReservations(response.data);
      alert(`Reservation status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update reservation status');
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      await api.patch(`/api/reservations/${reservationId}/status`, 
        { 
          status: 'approved',
          sendEmail: true
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      // Reload reservations after confirmation
      const response = await api.get('/api/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReservations(response.data);
      alert('Reservation confirmed successfully!');
    } catch (err) {
      console.error('Error confirming reservation:', err);
      alert('Failed to confirm reservation');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="reservation-list-container">
      <h2 className="reservation-title">
        {role === 'admin' ? 'All Reservations' : 
         role === 'staff' ? 'Staff Reservations' : 
         'My Reservations'}
      </h2>
      
      <div className="filters">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

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
              {(role === 'admin' || role === 'staff') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={(role === 'admin' || role === 'staff') ? "12" : "11"} style={{ textAlign: 'center', padding: '20px' }}>
                  No reservations found
                </td>
              </tr>
            ) : (
              filteredReservations.map(reservation => (
                <tr key={reservation._id}>
                  <td>{reservation.lotId}</td>
                  <td>{reservation.location || 'N/A'}</td>
                  <td>{reservation.sqm || 'N/A'}</td>
                  <td>₱{Number(reservation.totalPrice || 0).toLocaleString()}</td>
                  <td>{reservation.clientName}</td>
                  <td>{reservation.clientContact}</td>
                  <td>{reservation.paymentMethod}</td>
                  <td>₱{Number(reservation.paymentAmount || 0).toLocaleString()}</td>
                  <td>
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
                  <td>{new Date(reservation.createdAt || reservation.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${reservation.status}`}>
                      {reservation.status?.toUpperCase()}
                    </span>
                  </td>
                  {(role === 'admin' || role === 'staff') && (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .action-column {
          min-width: 200px;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn-confirm {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-confirm:hover {
          background-color: #45a049;
        }
        .status-select {
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
          font-weight: 500;
        }
        .status-badge.pending {
          background-color: #ffd700;
          color: #000;
        }
        .status-badge.approved {
          background-color: #4CAF50;
          color: white;
        }
        .status-badge.rejected {
          background-color: #f44336;
          color: white;
        }
        .status-badge.cancelled {
          background-color: #9e9e9e;
          color: white;
        }
      `}</style>
    </div>
  );
}
