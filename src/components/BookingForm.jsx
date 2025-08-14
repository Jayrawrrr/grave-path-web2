// src/components/BookingForm.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './BookingForm.css';

const startY = 0.73;
const startX = 0.34;
const size   = 0.025;
const gap    = 0.020;

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
  // Row 2
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
    bounds: [[startY + 2 * gap, startX + gap], [startY + 2 * gap + size, startX + gap + size]]
  }
];

export default function BookingForm() {
  const { token }   = useContext(AuthContext);
  const API_BASE    = process.env.REACT_APP_API_URL; // e.g. "http://localhost:5000/api"
  const navigate    = useNavigate();
  const location    = useLocation();

  const [lots,    setLots]    = useState([]);
  const [form,    setForm]    = useState({
    lotId: '', date: '', clientName: '',
    clientContact: '', paymentMethod: '',
    paymentAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1) Fetch plot availability
  useEffect(() => {
    axios.get(`${API_BASE}/staff/lots/availability`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setLots([...res.data, ...moreLots]))
    .catch(() => {
      setMessage({ type: 'error', text: 'Failed to load plots.' });
    });
  }, [API_BASE, token]);

  // 2) Handle PayMongo redirect back with ?payment=success
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      const pending = localStorage.getItem('pendingReservation');
      if (!pending) return;
      const saved = JSON.parse(pending);

      (async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
          await axios.post(`${API_BASE}/staff/reservations`, {
            lotId:        saved.lotId,
            date:         new Date(saved.date).toISOString(),
            clientName:   saved.clientName,
            clientContact:saved.clientContact,
            payment: {
              method: saved.paymentMethod,
              amount: Number(saved.paymentAmount)
            }
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessage({ type: 'success', text: 'Reservation confirmed after payment!' });
          localStorage.removeItem('pendingReservation');
          setTimeout(() => navigate('/staff/reservations/management'), 2000);
        } catch (err) {
          const api = err.response?.data || {};
          setMessage({ type: 'error', text: api.msg || api.message || err.message });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [API_BASE, location.search, navigate, token]);

  // Handle form inputs
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // 3) Online payment flow (GCash or Card)
  const handleOnlinePayment = async () => {
    localStorage.setItem('pendingReservation', JSON.stringify(form));
    try {
      const { data: { intentId } } = await axios.post(
        `${API_BASE}/payment/intent`,
        {
          amount:      Number(form.paymentAmount),
          method:      form.paymentMethod,
          description: 'Grave Path Reservation'
        }
      );
      const { data: { redirectUrl } } = await axios.post(
        `${API_BASE}/payment/attach`,
        { intentId, method: form.paymentMethod }
      );
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Payment error:', err.response?.data || err.message);
      alert('Payment failed: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  // 4) Direct reservation submission
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/staff/reservations`, {
        lotId:        form.lotId,
        date:         new Date(form.date).toISOString(),
        clientName:   form.clientName,
        clientContact:form.clientContact,
        payment: {
          method: form.paymentMethod,
          amount: Number(form.paymentAmount)
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Reservation confirmed!' });
      setForm({
        lotId: '', date: '', clientName: '',
        clientContact: '', paymentMethod: '',
        paymentAmount: ''
      });
      setTimeout(() => navigate('/staff/reservations/management'), 2000);
    } catch (err) {
      console.error('Booking error:', err.response?.data || err.message);
      const api = err.response?.data || {};
      setMessage({ type: 'error', text: api.msg || api.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear notifications after 5s
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div className="booking-form-container">
      <form className="booking-form" onSubmit={handleSubmit}>
        <h3>New Reservation</h3>
        {message.text && <div className={`notification ${message.type}`}>{message.text}</div>}

        <label>
          Plot:
          <select name="lotId" value={form.lotId} onChange={handleChange} required>
            <option value="">Select a plot</option>
            {lots.map(lot => (
              <option key={lot._id} value={lot._id} disabled={lot.status !== 'available'}>
                {lot.id}{lot.name && ` – ${lot.name}`}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date:
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>

        <label>
          Name:
          <input type="text" name="clientName" placeholder="Customer Name"
                 value={form.clientName} onChange={handleChange} required />
        </label>

        <label>
          Contact Info:
          <input type="text" name="clientContact" placeholder="Email or Phone"
                 value={form.clientContact} onChange={handleChange} required />
        </label>

        <label>
          Payment Method:
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} required>
            <option value="">Select payment method</option>
            <option value="gcash">GCash</option>
            <option value="card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer (offline)</option>
          </select>
        </label>

        <label>
          Amount:
          <input type="number" name="paymentAmount" placeholder="0.00"
                 min="0" step="0.01"
                 value={form.paymentAmount} onChange={handleChange} required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing…' : 'Confirm Reservation'}
        </button>

        {(form.paymentMethod === 'gcash' || form.paymentMethod === 'card') && (
          <button type="button" onClick={handleOnlinePayment}
                  disabled={
                    loading ||
                    !form.paymentAmount ||
                    !form.lotId ||
                    !form.date ||
                    !form.clientName ||
                    !form.clientContact
                  }
                  className="online-pay-btn"
          >
            Pay Online
          </button>
        )}
      </form>
    </div>
  );
}
