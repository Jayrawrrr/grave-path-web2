// src/pages/VisitorInfo.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './VisitorInfo.css';
// Individual icon imports
import { FaMapMarker } from 'react-icons/fa';
import { FaClock } from 'react-icons/fa';
import { FaInfoCircle } from 'react-icons/fa';
import { FaBullhorn } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';

export default function VisitorInfo() {
  // dummy fallback info (images live in public/)
  const dummyInfo = {
    visitingHours: `Monday – Friday: 9:00 AM – 5:00 PM
Saturday – Sunday: 10:00 AM – 4:00 PM
Holidays: 10:00 AM – 2:00 PM`,
    rules: `• Please check in at the reception area
• Maintain silence and respect for other visitors
• No outside food and drinks allowed
• Keep the premises clean
• Follow designated pathways
• Photography requires permission`,
    amenities: [
      { 
        imageUrl: '/amenity1.jpg',
        title: 'Memorial Church',
        description: 'A peaceful sanctuary for prayer and reflection'
      },
      { 
        imageUrl: '/amenity2.jpg',
        title: 'Memorial Garden',
        description: 'Beautifully landscaped gardens for quiet contemplation'
      },
      { 
        imageUrl: '/amenity3.jpg',
        title: 'Parking Area',
        description: 'Spacious parking facility with 24/7 security'
      },
      { 
        imageUrl: '/amenity4.jpg',
        title: 'Memorial Chapel',
        description: 'Intimate space for private ceremonies'
      },
      { 
        imageUrl: '/amenity5.jpg',
        title: 'Fountain Plaza',
        description: 'Serene water feature with seating areas'
      }
    ]
  };

  const [info, setInfo]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError]                 = useState('');
  const [selected, setSelected]           = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch visitor info
        const infoResponse = await axios.get(`${process.env.REACT_APP_API_URL}/public-access/info`);
        setInfo(infoResponse.data);
      } catch (err) {
        console.error('Error fetching visitor info:', err);
        setInfo(null);
      }

      try {
        // Fetch announcements
        const announcementsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/client/announcements`);
        const sorted = announcementsResponse.data.sort((a, b) => (b.pinned === true) - (a.pinned === true));
        setAnnouncements(sorted);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
      }
    };

    fetchData();
  }, []);

  // pick API result if it has amenities, else dummy
  const displayInfo =
    info && Array.isArray(info.amenities) && info.amenities.length
      ? info
      : dummyInfo;

  // helper to turn "/amenityX.png" into "http://localhost:3000/amenityX.png"
  const getAmenitySrc = url => {
    if (!url) return '';
    const origin = window.location.origin;
    return url.match(/^https?:/) ? url : `${origin}${url}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`visitor-info-container ${selected ? 'blurred' : ''}`}>
      <div className="visitor-info-header">
        <h1>Welcome to Grave Path Memorial Park</h1>
        <p>A place of peace, remembrance, and reflection</p>
      </div>

      <div className="info-grid">
        <section className="announcements-section">
          <div className="section-header">
            <FaBullhorn className="section-icon" />
            <h2>Important Announcements</h2>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="announcements-grid">
            {announcements.length === 0 ? (
              <p className="no-announcements">No current announcements</p>
            ) : (
              announcements.map(announcement => (
                <div 
                  key={announcement._id}
                  className={`announcement-card ${announcement.pinned ? 'pinned' : ''}`}
                  onClick={() => setSelected(announcement)}
                >
                  {announcement.pinned && <span className="pin-badge">PINNED</span>}
                  <h3>{announcement.title}</h3>
                  <p className="announcement-date">
                    {formatDate(announcement.createdAt)}
                  </p>
                  <p className="announcement-preview">{announcement.message}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="visiting-section">
          <div className="section-header">
            <FaClock className="section-icon" />
            <h2>Visiting Hours</h2>
          </div>
          <div className="hours-container">
            {displayInfo.visitingHours.split('\n').map((line, i) => (
              <p key={i} className="visiting-hours-line">{line}</p>
            ))}
          </div>
        </section>

        <section className="rules-section">
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h2>Park Rules</h2>
          </div>
          <div className="rules-container">
            {displayInfo.rules.split('\n').map((rule, i) => (
              <p key={i} className="rule-item">{rule}</p>
            ))}
          </div>
        </section>

        <section className="amenities-section">
          <div className="section-header">
            <FaMapMarker className="section-icon" />
            <h2>Our Amenities</h2>
          </div>
          <div className="amenities-grid">
            {displayInfo.amenities.map((amenity, i) => (
              <div key={i} className="amenity-card">
                <div className="amenity-image-container">
                  <img
                    src={getAmenitySrc(amenity.imageUrl)}
                    alt={amenity.title}
                    className="amenity-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                      e.target.alt = 'Image not available';
                    }}
                  />
                </div>
                <div className="amenity-info">
                  <h3>{amenity.title}</h3>
                  <p>{amenity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <FaTimes />
            </button>
            {selected.imageUrl && (
              <img
                src={getAmenitySrc(selected.imageUrl)}
                alt={selected.title}
                className="modal-image"
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                  e.target.alt = 'Image not available';
                }}
              />
            )}
            <h3 className="modal-title">{selected.title}</h3>
            <span className="modal-date">
              {formatDate(selected.createdAt)}
            </span>
            <p className="modal-message">{selected.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
