import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import eventBus, { EVENTS } from '../utils/eventBus';
import MapboxMap from '../components/MapboxMap';
import CreateLotModal from '../components/CreateLotModal';
import './MapboxMapView.css';

export default function MapboxMapView() {
  const { token, role } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
        `${process.env.REACT_APP_API_URL}/staff/lots`,
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

  const handleMapClick = (position) => {
    if (isEditing) {
      setClickedPosition(position);
      setShowCreateModal(true);
    }
  };

  const handleLotClick = (lot) => {
    setSelectedLot(lot);
  };

  const handleCreateLot = async (lotData) => {
    try {
      const [lat, lng] = clickedPosition;
      
      // Create bounds around the clicked position
      const bounds = [
        [lat - 0.00025, lng - 0.00025],
        [lat + 0.00025, lng + 0.00025]
      ];

      const requestData = {
        ...lotData,
        bounds
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/staff/lots`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLots([...lots, response.data]);
      setShowCreateModal(false);
      setClickedPosition(null);
      eventBus.emit(EVENTS.LOT_CREATED, response.data);
    } catch (err) {
      console.error('Failed to create lot:', err.response?.data || err);
      setError(`Failed to create lot: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleEditLot = async (lotData) => {
    try {
      const updatedLotData = {
        ...lotData,
        bounds: selectedLot.bounds
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/lots/${selectedLot._id}`,
        updatedLotData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLots(lots.map(lot => 
        lot._id === selectedLot._id ? { ...response.data, bounds: selectedLot.bounds } : lot
      ));
      setSelectedLot(null);
      setShowCreateModal(false);
      eventBus.emit(EVENTS.LOT_UPDATED, response.data);
    } catch (err) {
      console.error('Failed to update lot:', err);
      setError('Failed to update lot');
    }
  };

  const handleDeleteLot = async (lotId) => {
    if (!lotId) {
      setError('Cannot delete lot: Invalid ID');
      return;
    }

    try {
      const simpleId = lotId.split('/').pop().split('_').pop();
      
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/staff/lots/${simpleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLots(lots.filter(lot => lot._id !== lotId && lot.id !== lotId));
      setSelectedLot(null);
      setShowCreateModal(false);
      setError(null);
      eventBus.emit(EVENTS.LOT_DELETED, lotId);
    } catch (err) {
      console.error('Failed to delete lot:', err);
      setError(`Failed to delete lot: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedLot(null);
    setClickedPosition(null);
  };

  if (loading) {
    return (
      <div className="mapbox-map-view loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading cemetery map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mapbox-map-view">
      {/* Header with controls */}
      <div className="map-header">
        <div className="map-title">
          <h2>Cemetery Map</h2>
          <p>Interactive map showing all lots and landmarks</p>
        </div>
        
        <div className="map-controls">
          <button
            className={`control-btn ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Exit edit mode' : 'Enter edit mode'}
          >
            {isEditing ? '✓ Done Editing' : '✏️ Edit Mode'}
          </button>
          
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

      {/* Map container */}
      <div className="map-container">
        <MapboxMap
          lots={lots}
          selectedLot={selectedLot}
          onLotClick={handleLotClick}
          onMapClick={handleMapClick}
          onLotCreate={handleCreateLot}
          isEditing={isEditing}
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

      {/* Create/Edit Lot Modal */}
      {showCreateModal && (
        <CreateLotModal
          show={showCreateModal}
          onClose={handleCloseModal}
          onSave={selectedLot ? handleEditLot : handleCreateLot}
          onDelete={selectedLot ? () => handleDeleteLot(selectedLot._id) : null}
          initialLot={selectedLot}
          position={clickedPosition}
        />
      )}
    </div>
  );
}

