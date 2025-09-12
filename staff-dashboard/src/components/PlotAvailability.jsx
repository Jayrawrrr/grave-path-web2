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
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Use the same status configuration as MapView.jsx
const statusConfig = {
  available: {
    color: '#28a745',
    label: 'Available'
  },
  unavailable: {
    color: '#dc3545',
    label: 'Unavailable'
  },
  reserved: {
    color: '#007bff',
    label: 'Pending/Reserve'
  },
  active: {
    color: '#8e8e93',
    label: 'Active/Occupied'
  },
  landmark: {
    color: '#000000',
    label: 'Landmark'
  }
};

const getLotColor = (status) => {
  return statusConfig[status]?.color || statusConfig.available.color;
};

const getLotLabel = (status) => {
  return statusConfig[status]?.label || 'Available';
};

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

  const fetchLots = async () => {
    try {
      setLoading(true);
      setError('');

      // Use different endpoints based on role
      const endpoint = role === 'client' ? 'client' : 'staff';
      
      // For staff/admin, fetch all lots and reservations to show different colors
      const [lotsRes, reservationsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/${endpoint}/lots`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      // Create a map of lot IDs to their reservation status
      const reservationStatusMap = {};
      reservationsRes.data.forEach(reservation => {
        // Only override if there's an active reservation
        if (reservation.status === 'pending' || reservation.status === 'approved' || reservation.status === 'reserved') {
          reservationStatusMap[reservation.lotId] = true; // Mark as having reservation
        }
      });

      // Process lots with reservation status
      const processedLots = lotsRes.data.map(lot => {
        const hasActiveReservation = reservationStatusMap[lot.id] || false;
        // If there's a reservation, status should be 'reserved', otherwise keep original
        const finalStatus = hasActiveReservation ? 'reserved' : lot.status;
        
        return {
          ...lot,
          price: calculatePrice(lot.sqm, lot.pricePerSqm),
          status: finalStatus,
          originalStatus: lot.status, // Keep track of original status
          hasReservation: hasActiveReservation
        };
      });

      // Filter lots based on role
      if (role === 'client') {
        // Clients can see all lots to understand availability
        setLots(processedLots);
      } else {
        // Staff/admin only see available lots for management purposes
        const availableLots = processedLots.filter(lot => lot.status === 'available');
        setLots(availableLots);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lots:', err);
      setError('Could not load plots. Please try again later.');
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
    fetchLots();

    // Subscribe to lot and reservation events
    const handleUpdate = () => fetchLots();
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
    return <div className="loading-spinner">Loading plots...</div>;
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
          interactive={false}
        />



        {lots.map(lot => {
          // Check if bounds are valid
          if (!lot.bounds || !Array.isArray(lot.bounds) || lot.bounds.length !== 2) {
            return null; // Skip this lot
          }

          let [[y1, x1], [y2, x2]] = lot.bounds;
          
          // Check if bounds coordinates are numbers
          if (typeof y1 !== 'number' || typeof x1 !== 'number' || 
              typeof y2 !== 'number' || typeof x2 !== 'number') {
            return null; // Skip this lot
          }
          
          y1 = Math.min(mapHeight, Math.max(0, y1 * mapHeight));
          y2 = Math.min(mapHeight, Math.max(0, y2 * mapHeight));
          x1 = Math.min(mapWidth,  Math.max(0, x1 * mapWidth));
          x2 = Math.min(mapWidth,  Math.max(0, x2 * mapWidth));

          // Simple status-based color logic
          let lotColor;
          let isClickable = false;
          
          const status = lot.status.toLowerCase();
          
          if (status === 'landmark' || lot.type === 'landmark') {
            lotColor = getLotColor('landmark'); // Black
            isClickable = false; // Landmarks are not clickable for booking
          } else if (status === 'available') {
            lotColor = getLotColor('available'); // Green
            isClickable = true;
          } else if (status === 'reserve' || status === 'reserved' || status === 'pending' || status === 'approved') {
            lotColor = getLotColor('reserved'); // Blue
            isClickable = false;
          } else if (status === 'active' || status === 'occupied' || status === 'confirmed') {
            lotColor = getLotColor('active'); // Gray
            isClickable = false;
          } else {
            lotColor = getLotColor('unavailable'); // Red
            isClickable = false;
          }
          



          return (
            <Rectangle
              key={lot._id || lot.id}
              bounds={[[y1, x1], [y2, x2]]}
              pathOptions={{ 
                color: lotColor, // Use the correct color
                fillColor: lotColor, 
                fillOpacity: 0.6, 
                weight: 2,
                interactive: isClickable
              }}
              eventHandlers={isClickable ? { 
                click: () => setSelectedLot(lot)
              } : {}}
              className={isClickable ? 'clickable-lot' : ''}
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
                    
                    // Navigate to appropriate booking route based on user role
                    if (role === 'client') {
                      navigate('/client/reservations/booking', { 
                        state: { 
                          lotDetails: lotData,
                          isClientBooking: true
                        } 
                      });
                    } else {
                      // For staff/admin users
                      navigate('/staff/reservations/booking', { 
                        state: { 
                          lotDetails: lotData,
                          isStaffBooking: true
                        } 
                      });
                    }
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

      <style>{`
        .plot-availability-wrapper {
          position: relative;
          height: 100vh;
          width: 100%;
        }
        .clickable-lot {
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        .clickable-lot:hover {
          opacity: 0.8 !important;
          filter: brightness(1.1) !important;
        }
        .leaflet-interactive {
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        .leaflet-container {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}