import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  FaBookmark,
  FaTrash,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendarAlt,
  FaInfoCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import './BookmarkManager.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function BookmarkManager() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/client/lots/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load bookmarks');
      console.error('Load bookmarks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (lotId) => {
    try {
      await axios.delete(`${API_BASE}/client/lots/${lotId}/bookmark`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBookmarks(prev => prev.filter(lot => lot._id !== lotId));
      setSuccess('Bookmark removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove bookmark');
      console.error('Remove bookmark error:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const viewOnMap = (lot) => {
    // Navigate to map with lot data to be selected
    navigate('/client/map', { 
      state: { 
        selectedLotId: lot._id,
        lotData: lot 
      } 
    });
  };

  if (loading) {
    return (
      <div className="bookmark-manager">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your bookmarked lots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmark-manager">
      <div className="bookmark-header">
        <h1>
          <FaBookmark className="header-icon" />
          My Bookmarked Lots
        </h1>
        <p className="header-subtitle">
          Manage your saved cemetery lots. You can bookmark occupied graves to easily visit or remember loved ones.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <FaInfoCircle />
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      {/* Bookmarks Grid */}
      {bookmarks.length === 0 ? (
        <div className="empty-bookmarks">
          <FaBookmark className="empty-icon" />
          <h3>No Bookmarked Lots</h3>
          <p>You haven't bookmarked any lots yet. Visit the map to bookmark occupied graves of loved ones or graves you want to remember.</p>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map(lot => (
            <div key={lot._id} className="bookmark-card">
              <div className="bookmark-card-header">
                <div className="lot-info">
                  <h3 className="lot-section">Lot {lot.id}</h3>
                  <p className="lot-number">{lot.name || 'Unknown'}</p>
                </div>
                <button
                  onClick={() => removeBookmark(lot._id)}
                  className="remove-bookmark-btn"
                  title="Remove bookmark"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="bookmark-card-body">
                <div className="lot-details">
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <span>{lot.location || 'Location not specified'}</span>
                  </div>
                  
                  {lot.birth && (
                    <div className="detail-item">
                      <FaCalendarAlt className="detail-icon" />
                      <span>Born: {lot.birth}</span>
                    </div>
                  )}
                  
                  {lot.death && (
                    <div className="detail-item">
                      <FaCalendarAlt className="detail-icon" />
                      <span>Died: {lot.death}</span>
                    </div>
                  )}
                </div>

                <div className={`lot-status status-${lot.status}`}>
                  {lot.status === 'unavailable' ? 'Occupied' : 
                   lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                </div>

                {lot.description && (
                  <div className="lot-description">
                    <p>{lot.description}</p>
                  </div>
                )}
              </div>

              <div className="bookmark-card-footer">
                <button 
                  className="btn-primary"
                  onClick={() => viewOnMap(lot)}
                >
                  View on Map
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bookmark-summary">
        <p>
          <strong>{bookmarks.length}</strong> lot{bookmarks.length !== 1 ? 's' : ''} bookmarked
        </p>
      </div>
    </div>
  );
} 