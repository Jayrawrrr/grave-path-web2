// src/components/PlotAvailability.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Use actual SVG dimensions
const mapWidth = 2048;
const mapHeight = 1025;
const blockSize = 100;

export default function PlotAvailability({ token }) {
  const [availableLots, setAvailableLots] = useState([]);

  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/client/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setAvailableLots(
      res.data.filter(l => l.status === 'available')
    ))
    .catch(err => console.error(err));
  }, [token]);

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={[[0, 0], [mapHeight, mapWidth]]}
      zoom={0}
      style={{ height: '95vh', width: '100%' }}
    >
      <ImageOverlay
        url="/cemetery-map.svg"
        bounds={[[0, 0], [mapHeight, mapWidth]]}
      />

      {availableLots.map(lot => {
        const [[yf1, xf1], [yf2, xf2]] = lot.bounds;
        // scale fractional coords to actual
        const y1 = Math.max(0, Math.min(mapHeight, yf1 * mapHeight));
        const y2 = Math.max(0, Math.min(mapHeight, yf2 * mapHeight));
        const x1 = Math.max(0, Math.min(mapWidth,  xf1 * mapWidth));
        const x2 = Math.max(0, Math.min(mapWidth,  xf2 * mapWidth));

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const half = blockSize / 2;

        const southWest = [cy - half, cx - half];
        const northEast = [cy + half, cx + half];

        return (
          <Rectangle
            key={lot._id}
            bounds={[southWest, northEast]}
            pathOptions={{
              color: 'green',
              fillColor: 'green',
              fillOpacity: 0.5,
              weight: 2
            }}
          />
        );
      })}
    </MapContainer>
  );
}
