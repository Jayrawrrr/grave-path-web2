// src/components/BookingForm.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './BookingForm.css';

export default function BookingForm({ token }) {
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({ lotId: '', date: '', clientName: '', clientContact: '' });

  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/client/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setLots(res.data.filter(l => l.status === 'available')))
    .catch(err => console.error(err));
  }, [token]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/client/reservations`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Reservation submitted!');
      setForm({ lotId: '', date: '', clientName: '', clientContact: '' });
    } catch (err) {
      console.error(err);
      alert('Booking failed');
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h3>New Reservation</h3>
      <label>
        Plot:
        <select name="lotId" value={form.lotId} onChange={handleChange} required>
          <option value="">Select a plot</option>
          {lots.map(l => (
            <option key={l._id} value={l.id}>{l.id} - {l.name || 'Unnamed'}</option>
          ))}
        </select>
      </label>
      <label>
        Date:
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
      </label>
      <label>
        Name:
        <input type="text" name="clientName" value={form.clientName} onChange={handleChange} required />
      </label>
      <label>
        Contact Info:
        <input type="text" name="clientContact" value={form.clientContact} onChange={handleChange} required />
      </label>
      <button type="submit">Book Plot</button>
    </form>
  );
}