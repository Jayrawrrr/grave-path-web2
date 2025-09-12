// src/components/BookingForm.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import eventBus, { EVENTS } from '../utils/eventBus';
import './BookingForm.css';

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

const startY = 0.73;
const startX = 0.34;
const size = 0.025;
const gap = 0.020;

// Create a configured axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

const moreLots = [
  // Row 1
  {
    _id: 'custom-21',
    id: 'C21',
    name: 'Custom Lot 21',
    status: 'available',
    bounds: [[startY, startX], [startY + size, startX + size]]
  },
  {
    _id: 'custom-22',
    id: 'C22',
    name: 'Custom Lot 22',
    status: 'available',
    bounds: [[startY, startX + gap], [startY + size, startX + gap + size]]
  },
  // Row 
  {
    _id: 'custom-23',
    id: 'C23',
    name: 'Custom Lot 23',
    status: 'available',
    bounds: [[startY + gap, startX], [startY + gap + size, startX + size]]
  },
  {
    _id: 'custom-24',
    id: 'C24',
    name: 'Custom Lot 24',
    status: 'available',
    bounds: [[startY + gap, startX + gap], [startY + gap + size, startX + gap + size]]
  },
  // Row 3
  {
    _id: 'custom-25',
    id: 'C25',
    name: 'Custom Lot 25',
    status: 'available',
    bounds: [[startY + 2 * gap, startX], [startY + 2 * gap + size, startX + size]]
  },
  {
    _id: 'custom-26',
    id: 'C26',
    name: 'Custom Lot 26',
    status: 'available',
    bounds: [[startY + 2 * gap, startX + gap], [startY + 2 * gap + size, startY + gap + size]]
  }
];

export default function BookingForm() {
  const { token, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({
    lotId: '',
    clientName: '',
    clientContact: '',
    paymentMethod: 'gcash',
    paymentAmount: '',
    staffNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [proof, setProof] = useState(null);
  const lotDetails = location.state?.lotDetails || {};
  const isStaffBooking = location.state?.isStaffBooking || false;
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  // ─── Fetch all plots ───────────────────────────────────────────────
  useEffect(() => {
    api.get('/staff/lots/availability', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setLots([...res.data, ...moreLots]))
    .catch(() => {
      setMessage({ type: 'error', text: 'Failed to load plots.' });
    });
  }, [token]);

  // On mount, check for payment success and auto-submit reservation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      // Retrieve stored form data
      const storedForm = localStorage.getItem('pendingReservation');
      if (storedForm) {
        const formData = JSON.parse(storedForm);
        // Submit reservation
        (async () => {
          setLoading(true);
          setMessage({ type: '', text: '' });
          try {
            const payload = {
              lotId: formData.lotId,
              date: new Date(formData.date).toISOString(),
              clientName: formData.clientName,
              clientContact: formData.clientContact,
              payment: {
                method: formData.paymentMethod,
                amount: Number(formData.paymentAmount)
              }
            };
            await api.post(
              '/reservations',
              payload,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: 'Reservation confirmed after payment!' });
            localStorage.removeItem('pendingReservation');
            setTimeout(() => navigate('/staff/reservations/management'), 2000);
          } catch (err) {
            const apiData = err.response?.data || {};
            const errMsg = apiData.msg || apiData.message || err.message || 'Booking failed. Please try again.';
            setMessage({ type: 'error', text: errMsg });
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [location.search, navigate, token, role]);

  // Set initial form data when lotDetails is available
  useEffect(() => {
    if (lotDetails && (lotDetails.id || lotDetails._id)) {
      console.log('Setting form with lot details:', lotDetails);
      const totalPrice = Number(lotDetails.price || '50000');
      const reservationFee = totalPrice * 0.10;
      setForm(prevForm => ({
        ...prevForm,
        lotId: lotDetails.id || lotDetails._id,
        paymentMethod: 'gcash',
        paymentAmount: reservationFee.toString()
      }));
    }
  }, [lotDetails]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      const lotId = lotDetails.id || lotDetails._id;
      const totalPrice = lotDetails.price || '50000';

      // Basic reservation data
      formData.append('lotId', lotId);
      formData.append('sqm', lotDetails.sqm || '');
      formData.append('location', lotDetails.location || '');
      formData.append('status', isStaffBooking ? 'reserved' : 'pending');
      formData.append('clientName', form.clientName);
      formData.append('clientContact', form.clientContact);
      formData.append('clientId', form.clientContact); // Use contact as clientId
      formData.append('paymentMethod', form.paymentMethod);
      formData.append('paymentAmount', form.paymentAmount);
      formData.append('totalPrice', totalPrice);
      formData.append('sendEmail', 'true');

      // Staff specific data
      if (isStaffBooking) {
        formData.append('isStaffBooking', 'true');
        if (form.staffNotes) {
          formData.append('staffNotes', form.staffNotes);
        }
        // Decode token to get staff ID
        const decodedToken = decodeToken(token);
        if (decodedToken && decodedToken.id) {
          formData.append('staffId', decodedToken.id);
          console.log('Setting staffId to:', decodedToken.id);
        } else {
          console.warn('Could not decode staff ID from token');
        }
      }
      
      // Handle proof of payment
      if (proof) {
        formData.append('proofImage', proof);
      } else {
        // Create a dummy file for required proofImage
        const dummyFile = new File(['dummy-content'], 'dummy-proof.txt', { type: 'text/plain' });
        formData.append('proofImage', dummyFile);
      }

      // Use the correct endpoint based on role
      const endpoint = isStaffBooking ? '/staff/reservations' : '/reservations/create';
      
      const response = await api.post(
        endpoint,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log('Reservation response:', response.data);

      eventBus.emit(EVENTS.RESERVATION_CHANGED, response.data);
      eventBus.emit(EVENTS.LOT_UPDATED, { 
        id: lotId,
        status: isStaffBooking ? 'reserved' : 'pending' 
      });

      if (!isStaffBooking) {
        setShowConfirmationDialog(true);
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Reservation created successfully!'
        });
        
        setTimeout(() => {
          setForm({
            lotId: '',
            clientName: '',
            clientContact: '',
            paymentMethod: isStaffBooking ? 'cash' : 'gcash',
            paymentAmount: '',
            staffNotes: ''
          });
          setProof(null);
          const basePath = role === 'staff' ? '/staff' : '/client';
          navigate(`${basePath}/reservations/management`);
        }, 2000);
      }
    } catch (err) {
      console.error('Booking error:', err.response || err);
      const apiData = err.response?.data || {};
      const errMsg = apiData.msg || apiData.message || err.message || 'Failed to submit reservation. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form-container">
      <div className="booking-page-header">
        <h2 className="booking-form-title">
          {isStaffBooking ? 'Staff Reservation Form' : 'Cemetery Plot Reservation'}
        </h2>
        <p className="booking-form-subtitle">
          Complete the form below to reserve your selected cemetery plot
        </p>
      </div>

      <div className="booking-form-wrapper">
        {/* Lot Details Section */}
        <div className="booking-lot-details-section">
          <h3>Selected Plot Details</h3>
          <div className="booking-lot-details-grid">
            <div className="booking-detail-item">
              <span className="booking-detail-label">Lot ID:</span>
              <span className="booking-detail-value">{lotDetails.id}</span>
            </div>
            <div className="booking-detail-item">
              <span className="booking-detail-label">Status:</span>
              <span className="booking-detail-value">{lotDetails.status || 'Available'}</span>
            </div>
            <div className="booking-detail-item">
              <span className="booking-detail-label">Square Meters:</span>
              <span className="booking-detail-value">{lotDetails.sqm || 'N/A'}</span>
            </div>
            <div className="booking-detail-item">
              <span className="booking-detail-label">Location:</span>
              <span className="booking-detail-value">{lotDetails.location || 'N/A'}</span>
            </div>
            <div className="booking-detail-item">
              <span className="booking-detail-label">Total Price:</span>
              <span className="booking-detail-value price">₱{Number(lotDetails.price || '50000').toLocaleString()}</span>
            </div>
            <div className="booking-detail-item">
              <span className="booking-detail-label">Reservation Fee (10%):</span>
              <span className="booking-detail-value reservation-fee">₱{Number(form.paymentAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Reservation Notice */}
        <div className="booking-reservation-notice">
          <div className="booking-notice-icon">💰</div>
          <div className="booking-notice-text">
            <p><strong>Important:</strong> A 10% reservation fee of the total lot price is required to proceed with the reservation.</p>
            <p>This fee secures your plot and will be deducted from the final payment.</p>
          </div>
        </div>

        {/* Reservation Form */}
        <form onSubmit={handleSubmit} className="booking-reservation-form">
          <h3>Reservation Information</h3>
          
          <div className="booking-form-grid">
            {/* Client Information */}
            <div className="booking-form-group">
              <label htmlFor="clientName">
                Client Name <span className="booking-required">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="booking-form-group">
              <label htmlFor="clientContact">
                Client Email/Contact <span className="booking-required">*</span>
              </label>
              <input
                type="text"
                id="clientContact"
                name="clientContact"
                value={form.clientContact}
                onChange={handleChange}
                required
                placeholder="Enter email or contact number"
              />
            </div>

            {/* Payment Information */}
            <div className="booking-form-group">
              <label htmlFor="paymentMethod">
                Mode of Payment <span className="booking-required">*</span>
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                required
              >
                {isStaffBooking && <option value="cash">Cash</option>}
                <option value="gcash">GCash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className="booking-form-group">
              <label htmlFor="paymentAmount">
                Payment Amount
              </label>
              <input
                type="text"
                id="paymentAmount"
                value={`₱${Number(form.paymentAmount).toLocaleString()}`}
                readOnly
                className="booking-readonly-input"
              />
            </div>

            {/* Proof of Payment */}
            <div className="booking-form-group booking-file-upload">
              <label htmlFor="proofImage">
                Attach Proof of Payment (Optional)
              </label>
              <input
                type="file"
                id="proofImage"
                accept="image/*"
                onChange={e => setProof(e.target.files[0])}
              />
              <small className="booking-file-hint">Accepted formats: JPG, PNG, GIF</small>
            </div>

            {/* Staff Notes (Only for staff bookings) */}
            {isStaffBooking && (
              <div className="booking-form-group full-width">
                <label htmlFor="staffNotes">
                  Staff Notes
                </label>
                <textarea
                  id="staffNotes"
                  name="staffNotes"
                  value={form.staffNotes}
                  onChange={handleChange}
                  placeholder="Add any relevant notes about this reservation"
                  rows="3"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="booking-form-actions">
            <button 
              type="submit" 
              className="booking-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="booking-spinner"></span>
                  Processing...
                </>
              ) : (
                'Submit Reservation'
              )}
            </button>
            <button 
              type="button" 
              className="booking-btn-cancel"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`booking-form-message ${message.type}`}>
              <div className="booking-message-icon">
                {message.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="booking-message-text">{message.text}</div>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationDialog && (
        <div className="booking-modal-overlay">
          <div className="booking-modal-content">
            <div className="booking-modal-icon">🎉</div>
            <h3>Reservation Submitted Successfully!</h3>
            <p>Thank you for your reservation. Please check your email for confirmation and further instructions.</p>
            <div className="booking-modal-actions">
              <button
                onClick={() => {
                  setShowConfirmationDialog(false);
                  navigate('/client/reservations/management');
                }}
                className="booking-btn-modal"
              >
                View My Reservations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}