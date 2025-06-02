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
import './PlotAvailability.css';
import eventBus, { EVENTS } from '../utils/eventBus';

const mapWidth = 2048;
const mapHeight = 1025;
const API_BASE_URL = 'http://localhost:5000/api';

export default function AdminPlotAvailability() {
  const { token } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [error, setError] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define lot status colors and labels
  const statusConfig = {
    available: {
      color: '#28a745',
      label: 'Available'
    },
    reserved: {
      color: '#007bff',
      label: 'Reserved'
    },
    active: {
      color: '#8e8e93',
      label: 'Active'
    },
    unavailable: {
      color: '#dc3545',
      label: 'Unavailable'
    }
  };

  const getLotColor = (status) => {
    return statusConfig[status]?.color || statusConfig.available.color;
  };

  const getLotLabel = (status) => {
    return statusConfig[status]?.label || 'Available';
  };

  const fetchLotsAndReservations = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all lots using staff endpoint since admin has access
      const lotsRes = await axios.get(`${API_BASE_URL}/staff/lots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allLots = lotsRes.data.map(lot => ({
        ...lot,
        price: calculatePrice(lot.sqm, lot.pricePerSqm)
      }));
      
      // Fetch all reservations
      const reservationsRes = await axios.get(`${API_BASE_URL}/staff/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reservations = reservationsRes.data;

      // Update lots with reservation status
      allLots = allLots.map(lot => {
        const reservation = reservations.find(r => r.lotId === lot.id);
        if (reservation) {
          return {
            ...lot,
            status: reservation.status,
            reservationId: reservation._id
          };
        }
        return lot;
      });

      console.log('All lots:', allLots);
      setLots(allLots);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lots:', err);
      setError('Could not load plots. Please try again later.');
      setLoading(false);
    }
  };

  const calculatePrice = (sqm, pricePerSqm) => {
    const sqmValue = parseFloat(sqm) || 0;
    const pricePerSqmValue = parseFloat(pricePerSqm) || 4000;
    return (sqmValue * pricePerSqmValue).toString();
  };

  useEffect(() => {
    fetchLotsAndReservations();

    // Subscribe to lot and reservation events
    const handleUpdate = () => fetchLotsAndReservations();
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
  }, [token]);

  const handleReserve = async (lot) => {
    try {
      const totalPrice = calculatePrice(lot.sqm, lot.pricePerSqm);
      
      const lotData = {
        id: lot.id,
        name: lot.name,
        sqm: lot.sqm,
        location: lot.location,
        status: lot.status,
        price: totalPrice,
        pricePerSqm: lot.pricePerSqm
      };

      // Use the admin booking route
      navigate('/admin/reservations/booking', { 
        state: { 
          lotDetails: lotData,
          isAdminBooking: true
        } 
      });
      
      setSelectedLot(null);
      eventBus.emit(EVENTS.LOT_UPDATED, lot);
    } catch (err) {
      console.error('Error preparing reservation:', err);
      alert('Failed to prepare reservation: ' + err.message);
    }
  };

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
                color: getLotColor(lot.status), 
                fillColor: getLotColor(lot.status), 
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
              <h3>Lot Information</h3>
              <div className="info-row">
                <strong>Lot ID:</strong>
                <span className="info-row-value">{selectedLot.id}</span>
              </div>
              <div className="info-row">
                <strong>Name:</strong>
                <span className="info-row-value">{selectedLot.name || '—'}</span>
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
                <strong>Status:</strong>
                <span className={`info-row-value status-${selectedLot.status}`}>
                  {getLotLabel(selectedLot.status)}
                </span>
              </div>
              <div className="info-row">
                <strong>Price:</strong>
                <span className="info-row-value">
                  ₱{Number(calculatePrice(selectedLot.sqm, selectedLot.pricePerSqm)).toLocaleString()}
                </span>
              </div>
              
              <div className="action-buttons">
                {/* Allow admin to reserve any lot that's not unavailable */}
                {selectedLot.status !== 'unavailable' && (
                  <button
                    className="action-button reserve-button"
                    onClick={() => handleReserve(selectedLot)}
                  >
                    RESERVE
                  </button>
                )}
                {selectedLot.status === 'unavailable' && (
                  <div className="reserved-notice">
                    This lot is unavailable
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
} 