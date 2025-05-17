// src/components/ReservationList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReservationList.css';

export default function ReservationList({ token }) {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/staff/reservations`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setReservations(res.data))
    .catch(err => console.error(err));
  }, [token]);

  return (
    <table className="reservation-list">
      <thead>
        <tr>
          <th>Client Name</th>
          <th>Plot ID</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map(r => (
          <tr key={r._id}>
            <td>{r.clientName}</td>
            <td>{r.lotId}</td>
            <td>{new Date(r.date).toLocaleDateString()}</td>
            <td>{r.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}