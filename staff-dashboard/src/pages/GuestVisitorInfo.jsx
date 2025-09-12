// src/pages/GuestVisitorInfo.jsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import '../components/VisitorInfo.css';
// Individual icon imports
import { FaMapMarker } from 'react-icons/fa';
import { FaClock } from 'react-icons/fa';
import { FaInfoCircle } from 'react-icons/fa';
import { FaBullhorn } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';
import { FaMapPin } from 'react-icons/fa';
import { FaCalendarAlt } from 'react-icons/fa';
import { FaLeaf } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';

export default function GuestVisitorInfo() {
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
        imageUrl: '/EntranceName.jpg',
        title: 'Main Entrance',
        description: 'Welcome entrance to Garden of Memories Memorial Park'
      },
      { 
        imageUrl: '/Field1.jpg',
        title: 'Memorial Field 1',
        description: 'Peaceful burial grounds with well-maintained plots'
      },
      { 
        imageUrl: '/Field2.jpg',
        title: 'Memorial Field 2',
        description: 'Additional burial area with serene surroundings'
      },
      { 
        imageUrl: '/BoardMonument.jpg',
        title: 'Memorial Board & Monument',
        description: 'Dedicated memorial space with commemorative monuments'
      },
      { 
        imageUrl: '/Schedule&Announcement.jpg',
        title: 'Schedule & Announcement Board',
        description: 'Information center for park schedules and announcements'
      },
      { 
        imageUrl: '/Columbarium.jpg',
        title: 'Columbarium',
        description: 'Modern columbarium facility for cremated remains'
      },
      { 
        imageUrl: '/MainBuilding.jpg',
        title: 'Main Building',
        description: 'Administrative building and visitor services center'
      },
      { 
        imageUrl: '/Chapel.jpg',
        title: 'Memorial Chapel',
        description: 'Sacred space for prayer, reflection, and ceremonies'
      }
    ]
  };

  const [info, setInfo]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError]                 = useState('');
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch visitor info using public endpoint for guests
        const infoResponse = await axios.get(`${process.env.REACT_APP_API_URL}/public-access/info`);
        setInfo(infoResponse.data);
      } catch (err) {
        console.error('Error fetching visitor info:', err);
        setInfo(null);
      }

      try {
        // Fetch announcements using public endpoint for guests
        const announcementsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/public/announcements`);
        const sorted = announcementsResponse.data.sort((a, b) => (b.pinned === true) - (a.pinned === true));
        setAnnouncements(sorted);
        setError('');
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
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
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="visitor-loading-container">
        <div className="visitor-loading-spinner"></div>
        <p>Loading visitor information...</p>
      </div>
    );
  }

  return (
    <div className={`visitor-magazine-container ${selected ? 'visitor-blurred' : ''}`}>
      
      {/* Hero Section */}
      <section className="visitor-hero-section">
        <div className="visitor-hero-background">
          <div className="visitor-hero-overlay"></div>
        </div>
        <div className="visitor-hero-content">
          <div className="visitor-hero-badge">
            <FaLeaf className="visitor-badge-icon" />
            <span>Memorial Park</span>
          </div>
          <h1 className="visitor-hero-title">Grave Path Memorial Park</h1>
          <p className="visitor-hero-description">
            A serene sanctuary where memories live forever. Experience peace, reflection, 
            and connection in our beautifully maintained memorial grounds.
          </p>
          <div className="visitor-hero-stats">
            <div className="visitor-hero-stat">
              <span className="visitor-stat-number">{announcements.length}</span>
              <span className="visitor-stat-label">Active Announcements</span>
            </div>
            <div className="visitor-hero-stat">
              <span className="visitor-stat-number">{displayInfo.amenities.length}</span>
              <span className="visitor-stat-label">Park Amenities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Flow */}
      <div className="visitor-content-flow">
        
        {/* Announcements Section */}
        <section className="visitor-flow-section visitor-announcements-flow">
          <div className="visitor-section-header">
            <div className="visitor-section-meta">
              <FaBullhorn className="visitor-section-icon" />
              <span className="visitor-section-category">Updates</span>
            </div>
            <h2 className="visitor-section-title">Important Announcements</h2>
            <p className="visitor-section-subtitle">Stay informed with our latest news and updates</p>
          </div>

          {error && (
            <div className="visitor-error-banner">
              <FaInfoCircle className="visitor-error-icon" />
              <span>{error}</span>
            </div>
          )}

          <div className="visitor-announcements-magazine">
            {announcements.length === 0 ? (
              <div className="visitor-empty-announcements">
                <FaBullhorn className="visitor-empty-icon" />
                <h3>No Current Announcements</h3>
                <p>We'll post important updates here when available.</p>
              </div>
            ) : (
              <>
                {announcements.slice(0, 1).map(announcement => (
                  <article 
                    key={announcement._id}
                    className={`visitor-featured-announcement ${announcement.pinned ? 'pinned' : ''}`}
                    onClick={() => {
                      console.log('Announcement clicked:', announcement);
                      setSelected(announcement);
                    }}
                  >
                    <div className="visitor-article-header">
                      {announcement.pinned && (
                        <div className="visitor-pinned-badge">
                          <FaMapPin className="visitor-pin-icon" />
                          <span>Featured</span>
                        </div>
                      )}
                      <div className="visitor-article-meta">
                        <time className="visitor-article-date">
                          {formatDate(announcement.createdAt)}
                        </time>
                      </div>
                    </div>
                    <h3 className="visitor-article-title">{announcement.title || 'Untitled'}</h3>
                    <p className="visitor-article-excerpt">
                      {announcement.message && announcement.message.length > 180 
                        ? `${announcement.message.substring(0, 180)}...` 
                        : announcement.message || 'No message available'}
                    </p>
                    <button className="visitor-read-more-btn">
                      <span>Read Full Announcement</span>
                      <FaChevronRight className="visitor-arrow-icon" />
                    </button>
                  </article>
                ))}

                {announcements.length > 1 && (
                  <div className="visitor-more-announcements">
                    <h4>More Updates</h4>
                    <div className="visitor-announcement-list">
                      {announcements.slice(1, 4).map(announcement => (
                        <div 
                          key={announcement._id}
                          className="visitor-announcement-item"
                          onClick={() => {
                            console.log('Small announcement clicked:', announcement);
                            setSelected(announcement);
                          }}
                        >
                          <div className="visitor-item-header">
                            <h5>{announcement.title || 'Untitled'}</h5>
                            {announcement.pinned && <FaMapPin className="visitor-small-pin" />}
                          </div>
                          <time className="visitor-item-date">
                            {formatDate(announcement.createdAt)}
                          </time>
                        </div>
                      ))}
                    </div>
                    {announcements.length > 4 && (
                      <p className="visitor-more-count">
                        +{announcements.length - 4} more announcements available
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Split Section: Hours & Guidelines */}
        <section className="visitor-split-section">
          
          {/* Visiting Hours */}
          <div className="visitor-hours-block">
            <div className="visitor-block-header">
              <div className="visitor-block-icon">
                <FaClock />
              </div>
              <div className="visitor-block-text">
                <h3>Visiting Hours</h3>
                <p>Plan your visit</p>
              </div>
            </div>
            <div className="visitor-hours-schedule">
              {displayInfo.visitingHours.split('\n').map((line, i) => {
                const [day, hours] = line.split(': ');
                return (
                  <div key={i} className="visitor-schedule-item">
                    <span className="visitor-schedule-day">{day}</span>
                    <span className="visitor-schedule-hours">{hours}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guidelines */}
          <div className="visitor-guidelines-block">
            <div className="visitor-block-header">
              <div className="visitor-block-icon">
                <FaInfoCircle />
              </div>
              <div className="visitor-block-text">
                <h3>Visitor Guidelines</h3>
                <p>Please follow these guidelines</p>
              </div>
            </div>
            <div className="visitor-guidelines-content">
              {displayInfo.rules.split('\n').filter(rule => rule.trim()).map((rule, i) => (
                <div key={i} className="visitor-guideline">
                  <div className="visitor-guideline-marker"></div>
                  <span>{rule.replace('• ', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Amenities Gallery */}
        <section className="visitor-amenities-gallery">
          <div className="visitor-section-header">
            <div className="visitor-section-meta">
              <FaMapMarker className="visitor-section-icon" />
              <span className="visitor-section-category">Facilities</span>
            </div>
            <h2 className="visitor-section-title">Park Amenities</h2>
            <p className="visitor-section-subtitle">Discover our facilities designed for comfort and contemplation</p>
          </div>

          <div className="visitor-gallery-grid">
            {displayInfo.amenities.map((amenity, i) => (
              <div key={i} className={`visitor-gallery-item ${i === 0 ? 'featured' : ''}`}>
                <div className="visitor-gallery-image">
                  <img
                    src={getAmenitySrc(amenity.imageUrl)}
                    alt={amenity.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                      e.target.alt = 'Image not available';
                    }}
                  />
                  <div className="visitor-image-overlay">
                    <FaMapMarker className="visitor-overlay-icon" />
                  </div>
                </div>
                <div className="visitor-gallery-content">
                  <h4 className="visitor-gallery-title">{amenity.title}</h4>
                  <p className="visitor-gallery-description">{amenity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal for Announcements using Portal */}
      {selected && ReactDOM.createPortal(
        <div className="visitor-modal-overlay" onClick={() => setSelected(null)}>
          <div className="visitor-modal-content" onClick={e => e.stopPropagation()}>
            <div className="visitor-modal-header">
              <div className="visitor-modal-meta">
                {selected.pinned && (
                  <div className="visitor-modal-featured-badge">
                    <FaMapPin className="visitor-pin-icon" />
                    <span>Featured Announcement</span>
                  </div>
                )}
                <div className="visitor-modal-date">
                  <FaCalendarAlt className="visitor-date-icon" />
                  {formatDate(selected.createdAt)}
                </div>
              </div>
              <button 
                className="visitor-modal-close"
                onClick={() => setSelected(null)}
              >
                <FaTimes />
              </button>
            </div>
            
            <h2 className="visitor-modal-title">
              {selected.title || 'Untitled Announcement'}
            </h2>
            
            <div className="visitor-modal-body">
              {selected.imageUrl && (
                <img
                  src={getAmenitySrc(selected.imageUrl)}
                  alt={selected.title || 'Announcement image'}
                  className="visitor-modal-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                    e.target.alt = 'Image not available';
                  }}
                />
              )}
              <div className="visitor-modal-text">
                {selected.message ? 
                  selected.message.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  )) :
                  <p>No message content available.</p>
                }
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 