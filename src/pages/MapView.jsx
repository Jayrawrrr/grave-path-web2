import React, { useEffect, useState, useContext } from 'react';
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  Popup
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import EditLotModal from '../components/EditLotModal';
import GraveLocator from '../components/GraveLocator';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Actual image dimensions
const mapWidth = 2048;
const mapHeight = 1025;

export default function MapView() {
  const { token } = useContext(AuthContext);
  const [lots,        setLots]        = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [editLot,     setEditLot]     = useState(null);
  const [map,         setMap]         = useState(null);

  // 1) fetch all lots on mount
  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/staff/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setLots(res.data))
    .catch(console.error);
  }, [token]);

  // 2) when locator “View on Map” is clicked
  const handleLocate = lot => {
    if (!map) return;

    const [[y1f, x1f], [y2f, x2f]] = lot.bounds;
    const y1 = y1f * mapHeight;
    const x1 = x1f * mapWidth;
    const y2 = y2f * mapHeight;
    const x2 = x2f * mapWidth;

    map.fitBounds(
      [
        [y1, x1],
        [y2, x2]
      ],
      { padding: [50, 50] }
    );

    setSelectedLot({
      ...lot,
      popupBounds: [[y1, x1], [y2, x2]]
    });
  };

  // 3) when a Rectangle is clicked on the map
  const handleRectClick = lot => {
    const [[y1f, x1f], [y2f, x2f]] = lot.bounds;
    const y1 = y1f * mapHeight;
    const x1 = x1f * mapWidth;
    setSelectedLot({
      ...lot,
      popupBounds: [[y1, x1], [y2f * mapHeight, x2f * mapWidth]]
    });
  };

  // 4) save edits from modal
  const handleSave = async updated => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/lots/${updated._id}`,
        updated,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLots(ls => ls.map(l => l._id === res.data._id ? res.data : l));
      setEditLot(null);
      setSelectedLot(null);
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  return (
    <div className="mapview-wrapper">
      {/* Locator panel (staff/admin only) */}
      <div className="locator-panel">
        <GraveLocator lots={lots} onSelect={handleLocate} />
      </div>

      {/* Leaflet map */}
      <MapContainer
        crs={L.CRS.Simple}
        bounds={[[0, 0], [mapHeight, mapWidth]]}
        zoom={0}
        style={{ height: '100vh', width: '100%' }}
        whenCreated={mapInstance => setMap(mapInstance)}
      >
        <ImageOverlay
          url="/cemetery-map.svg"
          bounds={[[0, 0], [mapHeight, mapWidth]]}
        />

        {lots.map(lot => {
          // tiny clickable rectangle at the center
          let [[y1, x1], [y2, x2]] = lot.bounds;
          y1 *= mapHeight; x1 *= mapWidth;
          y2 *= mapHeight; x2 *= mapWidth;
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const half = 5; // px
          const sw = [cy - half, cx - half];
          const ne = [cy + half, cx + half];
          const color =
            lot.status === 'available'   ? 'green' :
            lot.status === 'unavailable' ? 'red'   : 'gray';

          return (
            <Rectangle
              key={lot._id}
              bounds={[sw, ne]}
              pathOptions={{ color, fillOpacity: 0.5 }}
              eventHandlers={{ click: () => handleRectClick(lot) }}
            />
          );
        })}

        {/* Popup for selected lot */}
        {selectedLot && (
          <Popup
            position={selectedLot.popupBounds[0]}
            onClose={() => setSelectedLot(null)}
          >
            <div className="popup-content">
              <h3>Lot {selectedLot.id}</h3>
              <p><strong>Name:</strong> {selectedLot.name || '—'}</p>
              <p><strong>Status:</strong> {selectedLot.status}</p>
              <button
                onClick={() => {
                  setEditLot(selectedLot);
                  setSelectedLot(null);
                }}
              >
                Edit Lot
              </button>
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Edit modal */}
      {editLot && (
        <EditLotModal
          lot={editLot}
          onClose={() => setEditLot(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
