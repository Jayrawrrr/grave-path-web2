// staff-dashboard/src/components/VisitorInfo.jsx
import React from 'react';
import './VisitorInfo.css';

export default function VisitorInfo() {
  return (
    <div className="visitor-info">
      <h3>Visiting Hours & Rules</h3>
      <p>Open daily from 8:00 AM to 6:00 PM. Please respect quiet zones and follow staff directions.</p>
      <h3>Amenities</h3>
      <ul>
        <li>Restrooms at main entrance</li>
        <li>Water fountains every 200 meters</li>
        <li>Wheelchair-accessible paths</li>
      </ul>
    </div>
  );
}