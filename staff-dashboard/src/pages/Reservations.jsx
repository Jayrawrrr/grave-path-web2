// staff-dashboard/src/pages/Reservations.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PlotAvailability from '../components/PlotAvailability';
import BookingForm from '../components/BookingForm';
import ReservationList from '../components/ReservationList';
import './Reservations.css';

export default function Reservations() {
  const { token } = useContext(AuthContext);
  const [tab, setTab] = useState('availability');

  // Here we will fetch data when needed inside subcomponents

  return (
    <div className="reservations-page">
      <h2>Reservation Module</h2>
      <div className="tabs">
        <button
          className={tab==='availability' ? 'active' : ''}
          onClick={() => setTab('availability')}
        >Plot Availability</button>
        <button
          className={tab==='booking' ? 'active' : ''}
          onClick={() => setTab('booking')}
        >Reserve</button>
        <button
          className={tab==='management' ? 'active' : ''}
          onClick={() => setTab('management')}
        >Manage</button>
      </div>
      <div className="tab-content">
        {tab === 'availability' && <PlotAvailability token={token} />}
        {tab === 'booking'      && <BookingForm token={token} />}
        {tab === 'management'   && <ReservationList token={token} />}
      </div>
    </div>
  );
}
