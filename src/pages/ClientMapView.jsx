// src/pages/ClientMapView.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, ImageOverlay, Rectangle, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import GraveLocator from '../components/GraveLocator';
import 'leaflet/dist/leaflet.css';
import './ClientMapView.css';

const mapWidth = 2048;
const mapHeight = 1025;
const blockSize = 1;

export default function ClientMapView() {
  const { token } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);

  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/client/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setLots(res.data))
    .catch(err => console.error(err));
  }, [token]);

  return (
    <div className="client-page">
      <div className="map-container">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={[[0, 0], [mapHeight, mapWidth]]}
          zoom={0}
          style={{ width: '100%', height: '100vh' }}
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <ImageOverlay
            url="/cemetery-map.svg"
            bounds={[[0, 0], [mapHeight, mapWidth]]}
          />

          {lots.map(lot => {
            let [[y1, x1], [y2, x2]] = lot.bounds;
            y1 = Math.min(mapHeight, Math.max(0, y1 * mapHeight));
            y2 = Math.min(mapHeight, Math.max(0, y2 * mapHeight));
            x1 = Math.min(mapWidth, Math.max(0, x1 * mapWidth));
            x2 = Math.min(mapWidth, Math.max(0, x2 * mapWidth));
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const half = blockSize / 2;
            const southWest = [cy - half, cx - half];
            const northEast = [cy + half, cx + half];
            const color =
              lot.status === 'available' ? 'green' :
              lot.status === 'unavailable' ? 'red' :
              'gray';

            return (
              <Rectangle
                key={lot._id}
                bounds={[southWest, northEast]}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 3 }}
                eventHandlers={{ click: () => setSelectedLot({ ...lot, bounds: [southWest, northEast] }) }}
              />
            );
          })}

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
              </div>
            </Popup>
          )}
        </MapContainer>

        <div className="floating-locator">
          <GraveLocator />
        </div>
      </div>
    </div>
  );
}
