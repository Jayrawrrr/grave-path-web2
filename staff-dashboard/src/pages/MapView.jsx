// src/pages/MapView.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, ImageOverlay, Rectangle, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import EditLotModal from '../components/EditLotModal';
import 'leaflet/dist/leaflet.css';

// Actual image dimensions
const mapWidth = 2048;
const mapHeight = 1025;
// Block size for lot highlight
const blockSize = 1;

export default function MapView() {
  const { token } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [editLot, setEditLot] = useState(null);

  // Fetch lots data
  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/staff/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setLots(res.data))
    .catch(err => console.error(err));
  }, [token]);

  // Save updated lot
  const handleSave = async updated => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/lots/${updated._id}`,
        updated,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLots(lots.map(l => l._id === res.data._id ? res.data : l));
      setEditLot(null);
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  return (
    <> {/* Full-viewport map */}
      <MapContainer
        crs={L.CRS.Simple}
        bounds={[[0, 0], [mapHeight, mapWidth]]}
        zoom={0}
        style={{ width: '100%', height: '100vh' }}
      >
        {/* Image overlay from public */}
        <ImageOverlay
          url="/cemetery-map.svg"
          bounds={[[0, 0], [mapHeight, mapWidth]]}
        />

        {/* Render lot rectangles */}
        {lots.map(lot => {
          // original fractional bounds [y,x] in [0,1]
          let [[y1, x1], [y2, x2]] = lot.bounds;
          // scale to image px
          y1 = Math.min(mapHeight, Math.max(0, y1 * mapHeight));
          y2 = Math.min(mapHeight, Math.max(0, y2 * mapHeight));
          x1 = Math.min(mapWidth,  Math.max(0, x1 * mapWidth));
          x2 = Math.min(mapWidth,  Math.max(0, x2 * mapWidth));

          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const half = blockSize / 2;
          const southWest = [cy - half, cx - half];
          const northEast = [cy + half, cx + half];
          const color = lot.status === 'available'
            ? 'green'
            : lot.status === 'unavailable'
              ? 'red'
              : 'gray';

          return (
            <Rectangle
              key={lot._id}
              bounds={[southWest, northEast]}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 3 }}
              eventHandlers={{ click: () => setSelectedLot({ ...lot, bounds: [southWest, northEast] }) }}
            />
          );
        })}

        {/* Popup for details */}
        {selectedLot && (
          <Popup
            position={selectedLot.bounds[0]}
            onClose={() => setSelectedLot(null)}
          >
            <div>
              <h3>Lot {selectedLot.id}</h3>
              <p><strong>Name:</strong> {selectedLot.name || '—'}</p>
              <p><strong>Birth:</strong> {selectedLot.birth || '—'}</p>
              <p><strong>Death:</strong> {selectedLot.death || '—'}</p>
              <p><strong>Status:</strong> {selectedLot.status}</p>
              <button onClick={() => { setSelectedLot(null); setEditLot(selectedLot); }}>
                Edit Lot
              </button>
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Edit modal */}
      {editLot && (
        <EditLotModal lot={editLot} onClose={() => setEditLot(null)} onSave={handleSave} />
      )}
    </>
  );
}