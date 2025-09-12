import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  ZoomControl,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import './PlotAvailabilityClient.css';

// Your SVG's pixel dimensions
const mapWidth  = 2048;
const mapHeight = 1025;

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

export default function GuestPlotAvailability() {
  const [lots, setLots] = useState([]);
  const [error, setError] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLots = async () => {
    try {
      setLoading(true);
      setError('');

      // Use public endpoint for guest access
      const lotsRes = await axios.get(`${process.env.REACT_APP_API_URL}/public/lots`);

      // Process lots
      const processedLots = lotsRes.data.map(lot => {
        return {
          ...lot,
          price: calculatePrice(lot.sqm, lot.pricePerSqm)
        };
      });

      setLots(processedLots);
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
  }, []);

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
          x1 = Math.min(mapWidth, Math.max(0, x1 * mapWidth));
          x2 = Math.min(mapWidth, Math.max(0, x2 * mapWidth));

          const bounds = [[y1, x1], [y2, x2]];
          const color = getLotColor(lot.status);

          return (
            <Rectangle
              key={lot._id}
              bounds={bounds}
              pathOptions={{ 
                color, 
                fillColor: color, 
                fillOpacity: 0.6, 
                weight: 2 
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
              selectedLot.bounds[0][0] * mapHeight,
              selectedLot.bounds[0][1] * mapWidth
            ]}
            onClose={() => setSelectedLot(null)}
            className="lot-popup"
          >
            <div className="popup-content">
              <h3>Plot Information</h3>
              <p><strong>Plot ID:</strong> {selectedLot.id}</p>
              <p><strong>Name:</strong> {selectedLot.name || '—'}</p>
              <p><strong>Location:</strong> {selectedLot.location || '—'}</p>
              <p><strong>Square Meters:</strong> {selectedLot.sqm || '—'}</p>
              <p><strong>Status:</strong> {getLotLabel(selectedLot.status)}</p>
              
              {selectedLot.status === 'available' && (
                <button
                  className="action-button book-button"
                  onClick={() => navigate('/login')}
                >
                  LOGIN TO RESERVE
                </button>
              )}
              {(selectedLot.status === 'unavailable' || selectedLot.status === 'active') && (
                <button
                  className="action-button guest-notice-button"
                  onClick={() => navigate('/login')}
                >
                  LOGIN TO BOOKMARK
                </button>
              )}
            </div>
          </Popup>
        )}
      </MapContainer>

      <style jsx>{`
        .guest-notice-button {
          background-color: #f8f9fa;
          color: #6c757d;
          border: 2px solid #6c757d;
          margin-top: 10px;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
        }
        .guest-notice-button:hover {
          background-color: #e9ecef;
        }
      `}</style>
    </div>
  );
} 