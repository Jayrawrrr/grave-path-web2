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
import './PlotAvailability.css';
import EditLotModal from './EditLotModal';

// Your SVG's pixel dimensions
const mapWidth  = 2048;
const mapHeight = 1025;
// Fallback block size if a lot has no area
const blockSize = 10;

export default function PlotAvailability() {
  const { token } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL;

  const [lots,        setLots]        = useState([]);
  const [error,       setError]       = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [editLot,     setEditLot]     = useState(null);

  useEffect(() => {
    axios
      .get(
        `${API_BASE}/staff/lots`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => {
        const startY = 0.73;
        const startX = 0.34;
        const size   = 0.025;
        const gap    = 0.020;
        const moreLots = [
          { _id:'custom-21', id:'C21', name:'Custom Lot 21', status:'available',
            bounds:[[startY, startX], [startY + size, startX + size]] },
          { _id:'custom-22', id:'C22', name:'Custom Lot 22', status:'available',
            bounds:[[startY, startX + gap], [startY + size, startX + gap + size]] },
          { _id:'custom-23', id:'C23', name:'Custom Lot 23', status:'available',
            bounds:[[startY + gap, startX], [startY + gap + size, startX + size]] },
          { _id:'custom-24', id:'C24', name:'Custom Lot 24', status:'available',
            bounds:[[startY + gap, startX + gap], [startY + gap + size, startX + gap + size]] },
          { _id:'custom-25', id:'C25', name:'Custom Lot 25', status:'available',
            bounds:[[startY + 2*gap, startX], [startY + 2*gap + size, startX + size]] },
          { _id:'custom-26', id:'C26', name:'Custom Lot 26', status:'available',
            bounds:[[startY + 2*gap, startX + gap], [startY + 2*gap + size, startX + gap + size]] },
        ];

        setLots([...res.data, ...moreLots]);
      })
      .catch(() => setError('Could not load plots.'));
  }, [API_BASE, token]);

  // Helper to clamp and scale a fractional coordinate [0–1] → pixel [0–max]
  const scalePx = (f, max) => Math.max(0, Math.min(max, f * max));

  return (
    <div className="plot-availability-wrapper">
      {error && <div className="error-banner">{error}</div>}

      <MapContainer
        crs={L.CRS.Simple}
        center={[mapHeight / 2, mapWidth / 2]}
        zoom={0}
        zoomControl={false}
        style={{ height: '95vh', width: '100%' }}
      >
        <ZoomControl position="topleft" />

        <ImageOverlay
          url="/cemetery-map.svg"
          bounds={[[0, 0], [mapHeight, mapWidth]]}
        />

        {lots.map(lot => {
          let [[y1, x1], [y2, x2]] = lot.bounds;
          y1 = scalePx(y1, mapHeight);
          y2 = scalePx(y2, mapHeight);
          x1 = scalePx(x1, mapWidth);
          x2 = scalePx(x2, mapWidth);

          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const half = blockSize / 2;
          const southWest = [cy - half, cx - half];
          const northEast = [cy + half, cx + half];

          const color =
            lot.status === 'available'   ? 'green' :
            lot.status === 'unavailable' ? 'red'   : 'gray';

          return (
            <Rectangle
              key={lot._id}
              bounds={[southWest, northEast]}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 3
              }}
              eventHandlers={{
                click: () => setSelectedLot({
                  ...lot,
                  popupBounds: [southWest, northEast]
                })
              }}
            />
          );
        })}

        {selectedLot && (
          <Popup
            position={selectedLot.popupBounds[0]}
            onClose={() => setSelectedLot(null)}
          >
            <div className="lot-popup">
              <h3>Lot {selectedLot.id}</h3>
              <p><strong>Name:</strong> {selectedLot.name || '—'}</p>
              <p><strong>Status:</strong> {selectedLot.status}</p>
              <button onClick={() => {
                setEditLot(selectedLot);
                setSelectedLot(null);
              }}>
                Edit Lot
              </button>
            </div>
          </Popup>
        )}

        {editLot && (
          <EditLotModal
            lot={editLot}
            onClose={() => setEditLot(null)}
            onSave={async updated => {
              try {
                const res = await axios.put(
                  `${API_BASE}/staff/lots/${updated._id}`,
                  updated,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setLots(ls => ls.map(l => l._id === res.data._id ? res.data : l));
                setEditLot(null);
              } catch (err) {
                console.error(err);
                alert('Update failed');
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
