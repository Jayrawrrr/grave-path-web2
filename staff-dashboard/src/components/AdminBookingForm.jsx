import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import eventBus, { EVENTS } from '../utils/eventBus';
import './BookingForm.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default function AdminBookingForm() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    lotId: '',
    clientName: '',
    clientContact: '',
    paymentMethod: 'cash',
    paymentAmount: '',
    staffNotes: '',
    status: 'reserved'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [proof, setProof] = useState(null);
  const lotDetails = location.state?.lotDetails || {};

  useEffect(() => {
    if (lotDetails && (lotDetails.id || lotDetails._id)) {
      const totalPrice = Number(lotDetails.price || '50000');
      const reservationFee = totalPrice * 0.10;
      setForm(prevForm => ({
        ...prevForm,
        lotId: lotDetails.id || lotDetails._id,
        paymentMethod: 'cash',
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
      formData.append('status', 'reserved');
      formData.append('clientName', form.clientName);
      formData.append('clientContact', form.clientContact);
      formData.append('clientId', form.clientContact); // Use contact as clientId
      formData.append('paymentMethod', form.paymentMethod);
      formData.append('paymentAmount', form.paymentAmount);
      formData.append('totalPrice', totalPrice);
      formData.append('isAdminBooking', 'true');

      // Staff specific data
      if (form.staffNotes) {
        formData.append('staffNotes', form.staffNotes);
      }
      if (user && user._id) {
        formData.append('staffId', user._id);
      }
      
      // Handle proof of payment
      if (proof) {
        formData.append('proofImage', proof);
      } else {
        // Create a dummy file for required proofImage
        const dummyFile = new File(['dummy-content'], 'dummy-proof.txt', { type: 'text/plain' });
        formData.append('proofImage', dummyFile);
      }

      // Log the form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await api.post(
        '/staff/reservations',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      eventBus.emit(EVENTS.RESERVATION_CHANGED, response.data);
      eventBus.emit(EVENTS.LOT_UPDATED, { 
        id: lotId,
        status: 'reserved' 
      });

      setMessage({ 
        type: 'success', 
        text: 'Reservation created successfully!'
      });
      
      setTimeout(() => {
        setForm({
          lotId: '',
          clientName: '',
          clientContact: '',
          paymentMethod: 'cash',
          paymentAmount: '',
          staffNotes: '',
          status: 'reserved'
        });
        setProof(null);
        navigate('/admin/reservations/management');
      }, 2000);
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
        <h2 className="booking-form-title">Administrator Reservation Form</h2>
        <p className="booking-form-subtitle">
          Create a new reservation on behalf of a client with full administrative privileges
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

        {/* Admin Notice */}
        <div className="booking-reservation-notice">
          <div className="booking-notice-icon">👨‍💼</div>
          <div className="booking-notice-text">
            <p><strong>Admin Privilege:</strong> You are creating a reservation with administrative rights.</p>
            <p>This reservation will be automatically marked as 'Reserved' and will bypass standard approval processes.</p>
          </div>
        </div>

        {/* Reservation Form */}
        <form onSubmit={handleSubmit} className="booking-reservation-form">
          <h3>Client & Reservation Information</h3>
          
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
                placeholder="Enter client full name"
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
                <option value="cash">Cash</option>
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

            {/* Admin Notes */}
            <div className="booking-form-group full-width">
              <label htmlFor="staffNotes">
                Administrator Notes
              </label>
              <textarea
                id="staffNotes"
                name="staffNotes"
                value={form.staffNotes}
                onChange={handleChange}
                placeholder="Add any relevant administrative notes about this reservation"
                rows="3"
              />
            </div>
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
                'Create Reservation'
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
    </div>
  );
}