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
    <div className="booking-form-wrapper">
      <h2>Admin Reservation Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="lot-details">
          <div><strong>Lot ID:</strong> {lotDetails.id}</div>
          <div><strong>Status:</strong> {lotDetails.status || 'Available'}</div>
          <div><strong>Square Meters:</strong> {lotDetails.sqm || 'N/A'}</div>
          <div><strong>Location:</strong> {lotDetails.location || 'N/A'}</div>
          <div><strong>Total Price:</strong> ₱{Number(lotDetails.price || '50000').toLocaleString()}</div>
          <div><strong>Reservation Fee (10%):</strong> ₱{Number(form.paymentAmount).toLocaleString()}</div>
        </div>

        <div>
          <label>
            Client Name:
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              required
              placeholder="Enter client name"
            />
          </label>
        </div>
        <div>
          <label>
            Client Email/Contact:
            <input
              type="text"
              name="clientContact"
              value={form.clientContact}
              onChange={handleChange}
              required
              placeholder="Enter email or contact number"
            />
          </label>
        </div>

        <div>
          <label>
            Mode of Payment:
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              required
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Payment Amount:
            <input
              type="text"
              value={`₱${Number(form.paymentAmount).toLocaleString()}`}
              readOnly
              className="readonly-input"
            />
          </label>
        </div>

        <div>
          <label>
            Attach Proof of Payment (Optional):
            <input
              type="file"
              accept="image/*"
              onChange={e => setProof(e.target.files[0])}
            />
          </label>
        </div>

        <div>
          <label>
            Admin Notes:
            <textarea
              name="staffNotes"
              value={form.staffNotes}
              onChange={handleChange}
              placeholder="Add any relevant notes about this reservation"
              rows="3"
            />
          </label>
        </div>

        <div className="form-buttons">
          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Create Reservation'}
          </button>
          <button 
            type="button" 
            className="btn-cancel"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}