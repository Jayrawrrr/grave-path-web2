import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import eventBus, { EVENTS } from '../utils/eventBus';
import MapboxMap from '../components/MapboxMap';
import './MapboxClientMapView.css';

export default function MapboxClientMapView() {
  const { token, role } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, available, reserved, occupied

  // Add error timeout cleanup
  useEffect(() => {
    let errorTimeout;
    if (error) {
      errorTimeout = setTimeout(() => {
        setError(null);
      }, 5000);
    }
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [error]);

  // Fetch lots from backend
  const fetchLots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/client/lots`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Ensure each lot has both _id and id fields
      const processedLots = response.data.map(lot => ({
        ...lot,
        _id: lot._id || lot.id,
        id: lot.id || lot._id
      }));
      
      setLots(processedLots);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch lots:', err);
      setError('Failed to load lots from server');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();

    // Subscribe to lot events
    const handleLotUpdate = () => fetchLots();
    eventBus.on(EVENTS.LOT_UPDATED, handleLotUpdate);
    eventBus.on(EVENTS.LOT_CREATED, handleLotUpdate);
    eventBus.on(EVENTS.LOT_DELETED, handleLotUpdate);
    eventBus.on(EVENTS.RESERVATION_CHANGED, handleLotUpdate);

    return () => {
      eventBus.off(EVENTS.LOT_UPDATED, handleLotUpdate);
      eventBus.off(EVENTS.LOT_CREATED, handleLotUpdate);
      eventBus.off(EVENTS.LOT_DELETED, handleLotUpdate);
      eventBus.off(EVENTS.RESERVATION_CHANGED, handleLotUpdate);
    };
  }, [token]);

  const handleLotClick = (lot) => {
    setSelectedLot(lot);
  };

  // Filter lots based on selected filter
  const filteredLots = lots.filter(lot => {
    if (filter === 'all') return true;
    return lot.status === filter;
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSelectedLot(null); // Clear selection when changing filter
  };

  if (loading) {
    return (
      <div className="mapbox-client-map-view loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading cemetery map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mapbox-client-map-view">
      {/* Header */}
      <div className="map-header">
        <div className="map-title">
          <h2>Cemetery Map</h2>
          <p>Explore available lots and cemetery features</p>
        </div>
        
        <div className="map-controls">
          <button
            className="control-btn refresh"
            onClick={fetchLots}
            title="Refresh lots"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Filter controls */}
      <div className="filter-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Lots
          </button>
          <button
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => handleFilterChange('available')}
          >
            Available
          </button>
          <button
            className={`filter-btn ${filter === 'reserved' ? 'active' : ''}`}
            onClick={() => handleFilterChange('reserved')}
          >
            Reserved
          </button>
          <button
            className={`filter-btn ${filter === 'occupied' ? 'active' : ''}`}
            onClick={() => handleFilterChange('occupied')}
          >
            Occupied
          </button>
        </div>
        
        <div className="filter-info">
          Showing {filteredLots.length} of {lots.length} lots
        </div>
      </div>

      {/* Map container */}
      <div className="map-container">
        <MapboxMap
          lots={filteredLots}
          selectedLot={selectedLot}
          onLotClick={handleLotClick}
          onMapClick={() => {}} // No map click functionality for clients
          onLotCreate={() => {}} // No lot creation for clients
          isEditing={false} // Clients can't edit
          showRoads={true}
          showColumbarium={true}
        />
      </div>

      {/* Statistics panel */}
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-number">{lots.filter(lot => lot.status === 'available').length}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{lots.filter(lot => lot.status === 'reserved').length}</span>
          <span className="stat-label">Reserved</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{lots.filter(lot => lot.status === 'occupied').length}</span>
          <span className="stat-label">Occupied</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{lots.filter(lot => lot.type === 'landmark').length}</span>
          <span className="stat-label">Landmarks</span>
        </div>
      </div>

      {/* Lot details panel */}
      {selectedLot && (
        <div className="lot-details-panel">
          <div className="lot-details-header">
            <h3>{selectedLot.block} {selectedLot.lotNumber}</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedLot(null)}
            >
              ×
            </button>
          </div>
          
          <div className="lot-details-content">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${selectedLot.status}`}>
                {selectedLot.status.charAt(0).toUpperCase() + selectedLot.status.slice(1)}
              </span>
            </div>
            
            {selectedLot.type && (
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedLot.type}</span>
              </div>
            )}
            
            {selectedLot.name && (
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedLot.name}</span>
              </div>
            )}
            
            {selectedLot.sqm && (
              <div className="detail-row">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{selectedLot.sqm} sqm</span>
              </div>
            )}
            
            {selectedLot.price && (
              <div className="detail-row">
                <span className="detail-label">Price:</span>
                <span className="detail-value">₱{parseInt(selectedLot.price).toLocaleString()}</span>
              </div>
            )}
            
            {selectedLot.location && (
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{selectedLot.location}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

