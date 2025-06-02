// src/components/PlotAvailability.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  ZoomControl,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import eventBus, { EVENTS } from '../utils/eventBus';

// Your SVG's pixel dimensions
const mapWidth  = 2048;
const mapHeight = 1025;

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

export default function PlotAvailability() {
  const { token, role } = useContext(AuthContext);
  
  // Dynamically import CSS based on role
  useEffect(() => {
    if (role === 'client') {
      import('./PlotAvailabilityClient.css');
    } else {
      import('./PlotAvailability.css');
    }
  }, [role]);

  const [lots, setLots] = useState([]);
  const [error, setError] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAvailableLots = async () => {
    try {
      setLoading(true);
      setError('');

      // Use different endpoints based on role
      const endpoint = role === 'client' ? 'client' : 'staff';
      
      // Fetch all lots using the correct URL
      const lotsRes = await axios.get(`${API_BASE_URL}/${endpoint}/lots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only available lots
      const availableLots = lotsRes.data.filter(lot => lot.status === 'available').map(lot => ({
        ...lot,
        price: calculatePrice(lot.sqm, lot.pricePerSqm)
      }));

      setLots(availableLots);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lots:', err);
      setError('Could not load available plots. Please try again later.');
      setLoading(false);
    }
  };

  // Add price calculation helper
  const calculatePrice = (sqm, pricePerSqm) => {
    const sqmValue = parseFloat(sqm) || 0;
    const pricePerSqmValue = parseFloat(pricePerSqm) || 4000;
    return (sqmValue * pricePerSqmValue).toString();
  };

  useEffect(() => {
    fetchAvailableLots();

    // Subscribe to lot and reservation events
    const handleUpdate = () => fetchAvailableLots();
    eventBus.on(EVENTS.LOT_UPDATED, handleUpdate);
    eventBus.on(EVENTS.LOT_CREATED, handleUpdate);
    eventBus.on(EVENTS.LOT_DELETED, handleUpdate);
    eventBus.on(EVENTS.RESERVATION_CHANGED, handleUpdate);

    return () => {
      eventBus.off(EVENTS.LOT_UPDATED, handleUpdate);
      eventBus.off(EVENTS.LOT_CREATED, handleUpdate);
      eventBus.off(EVENTS.LOT_DELETED, handleUpdate);
      eventBus.off(EVENTS.RESERVATION_CHANGED, handleUpdate);
    };
  }, [token, role]);

  if (loading) {
    return <div className="loading-spinner">Loading available plots...</div>;
  }

  return (
    <div className="plot-availability-wrapper">
      {error && <div className="error-banner">{error}</div>}

      <MapContainer
        crs={L.CRS.Simple}
        center={[mapHeight / 2, mapWidth / 2]}
        zoom={0}
        zoomControl={false}
        maxBounds={[[0, 0], [mapHeight, mapWidth]]}
        maxBoundsViscosity={1.0}
      >
        <ZoomControl position="topleft" />

        <ImageOverlay
          url="/cemetery-map.svg"
          bounds={[[0, 0], [mapHeight, mapWidth]]}
        />

        {lots.map(lot => {
          let [[y1, x1], [y2, x2]] = lot.bounds;
          y1 = Math.min(mapHeight, Math.max(0, y1 * mapHeight));
          y2 = Math.min(mapHeight, Math.max(0, y2 * mapHeight));
          x1 = Math.min(mapWidth,  Math.max(0, x1 * mapWidth));
          x2 = Math.min(mapWidth,  Math.max(0, x2 * mapWidth));

          return (
            <Rectangle
              key={lot._id}
              bounds={[[y1, x1], [y2, x2]]}
              pathOptions={{ 
                color: '#28a745', 
                fillColor: '#28a745', 
                fillOpacity: 0.6, 
                weight: 3 
              }}
              eventHandlers={{ 
                click: () => setSelectedLot(lot)
              }}
            />
          );
        })}

        {selectedLot && (
          <Popup
            position={[
              (selectedLot.bounds[0][0] + selectedLot.bounds[1][0]) / 2 * mapHeight,
              (selectedLot.bounds[0][1] + selectedLot.bounds[1][1]) / 2 * mapWidth
            ]}
            onClose={() => setSelectedLot(null)}
            className="lot-popup"
            closeButton={false}
          >
            <div className="lot-info">
              <h3>Available Lot Information</h3>
              <div className="info-row">
                <strong>Lot ID:</strong>
                <span className="info-row-value">{selectedLot.id}</span>
              </div>
              <div className="info-row">
                <strong>Location:</strong>
                <span className="info-row-value">{selectedLot.location || '—'}</span>
              </div>
              <div className="info-row">
                <strong>Square Meters:</strong>
                <span className="info-row-value">{selectedLot.sqm || '—'}</span>
              </div>
              <div className="info-row">
                <strong>Price:</strong>
                <span className="info-row-value">
                  ₱{Number(calculatePrice(selectedLot.sqm, selectedLot.pricePerSqm)).toLocaleString()}
                </span>
              </div>
              
              <div className="action-buttons">
                <button
                  className="action-button book-button"
                  onClick={() => {
                    const lotData = {
                      id: selectedLot.id,
                      name: selectedLot.name,
                      sqm: selectedLot.sqm,
                      location: selectedLot.location,
                      status: selectedLot.status,
                      price: selectedLot.price || calculatePrice(selectedLot.sqm, selectedLot.pricePerSqm)
                    };
                    navigate('/client/reservations/booking', { state: { lotDetails: lotData } });
                    setSelectedLot(null);
                  }}
                >
                  RESERVE
                </button>
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
}