// src/pages/VisitorInfo.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './VisitorInfo.css';

export default function VisitorInfo() {
  // dummy fallback info (images live in public/)
  const dummyInfo = {
    visitingHours: `Mon–Fri: 9:00 AM – 5:00 PM  
Sat–Sun: 10:00 AM – 4:00 PM  
Please check in at reception. No outside food allowed.`,
    amenities: [
      { imageUrl: '/amenity1.jpg' },
      { imageUrl: '/amenity2.jpg' },
      { imageUrl: '/amenity3.jpg' },
      { imageUrl: '/amenity4.jpg' },
      { imageUrl: '/amenity5.jpg' },
    ]
  };

  const [info, setInfo]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError]                 = useState('');
  const [selected, setSelected]           = useState(null);

  useEffect(() => {
    // fetch visitor info
    axios.get(`${process.env.REACT_APP_API_URL}/api/public-access/info`)
      .then(res => setInfo(res.data))
      .catch(() => setInfo(null));

    // fetch announcements
    axios.get(`${process.env.REACT_APP_API_URL}/client/announcements`)
      .then(res => {
        const sorted = res.data.sort(
          (a, b) => (b.pinned === true) - (a.pinned === true)
        );
        setAnnouncements(sorted);
      })
      .catch(() => setError('Failed to load announcements'));
  }, []);

  // pick API result if it has amenities, else dummy
  const displayInfo =
    info && Array.isArray(info.amenities) && info.amenities.length
      ? info
      : dummyInfo;

  // helper to turn "/amenityX.png" into "http://localhost:3000/amenityX.png"
  const getAmenitySrc = url => {
    const origin = window.location.origin;
    const full  = url.match(/^https?:/) ? url : `${origin}${url}`;
    console.log('➡️ loading amenity image:', full);
    return full;
  };

  return (
    <>
      <div className={`visitor-info ${selected ? 'blurred' : ''}`}>
        <h2 className="vi-heading">Announcements</h2>
        {error && <p className="error-text">{error}</p>}

        <div className="newspaper">
          {announcements.length === 0
            ? <p className="no-announce">No announcements yet.</p>
            : announcements.map(a => {
                const dateStr = a.createdAt
                  ? new Date(a.createdAt).toLocaleString()
                  : '';
                return (
                  <article
                    key={a._id}
                    className={`announcement-item${a.pinned ? ' pinned' : ''}`}
                    onClick={() => setSelected(a)}
                  >
                    <h3 className="ann-title">{a.title}</h3>
                    {dateStr && <span className="ann-date">{dateStr}</span>}
                    <p className="ann-message">{a.message}</p>
                  </article>
                );
              })}
        </div>

        <h2 className="vi-heading">Visiting Hours &amp; Rules</h2>
        <p className="vi-text">
          {displayInfo.visitingHours.split('\n').map((line, i) => (
            <span key={i}>{line}<br/></span>
          ))}
        </p>

        <h2 className="vi-heading">Amenities</h2>
        <ul className="vi-list">
          {displayInfo.amenities.map((amenity, i) => (
            <li key={i} className="amenity-item">
              <img
                src={getAmenitySrc(amenity.imageUrl)}
                alt={`Amenity ${i + 1}`}
                className="amenity-icon"
                onError={e => {
                  console.error(
                    `❌ failed to load amenity #${i+1}:`,
                    e.target.src
                  );
                }}
              />
            </li>
          ))}
        </ul>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            {selected.imageUrl && (
              <img
                src={getAmenitySrc(selected.imageUrl)}
                alt=""
                className="modal-image"
                onError={e => console.error('❌ modal image failed:', e.target.src)}
              />
            )}
            <h3 className="modal-title">{selected.title}</h3>
            <span className="modal-date">
              {new Date(selected.createdAt).toLocaleString()}
            </span>
            <p className="modal-message">{selected.message}</p>
          </div>
        </div>
      )}
    </>
  );
}
