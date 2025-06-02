// src/pages/ClientMapView.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, ImageOverlay, Rectangle, Popup, ZoomControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import GraveLocator from '../components/GraveLocator';
import 'leaflet/dist/leaflet.css';
import './ClientMapView.css';
import eventBus, { EVENTS } from '../utils/eventBus';
import { useNavigate } from 'react-router-dom';

const mapWidth = 2048;
const mapHeight = 1025;
const blockSize = 1;

// Define the road network
const roads = [
  // Main horizontal road from entrance
  [[mapHeight * 0.51, mapWidth * 0.3], [mapHeight * 0.5, mapWidth * 0.45]],
  
  // Main vertical roads
  [[mapHeight * 0.5, mapWidth * 0.387], [mapHeight * 0.83, mapWidth * 0.393]],  // Central vertical
  [[mapHeight * 0.25, mapWidth * 0.5119], [mapHeight * 0.46, mapWidth * 0.5119]], // Right vertical
  
  // Left section paths
  [[mapHeight * 0.8, mapWidth * 0.33], [mapHeight * 0.6635, mapWidth * 0.3251]],  // Diagonal left
  [[mapHeight * 0.663, mapWidth * 0.325], [mapHeight * 0.654, mapWidth * 0.623]], // Long horizontal
  [[mapHeight * 0.8, mapWidth * 0.33], [mapHeight * 0.8, mapWidth * 0.392]],     // Top horizontal
  
  // Central paths
  [[mapHeight * 0.501, mapWidth * 0.45], [mapHeight * 0.459, mapWidth * 0.512]], // Diagonal center
  [[mapHeight * 0.458, mapWidth * 0.512], [mapHeight * 0.448, mapWidth * 0.617]], // Upper right
  
  // Right section paths
  [[mapHeight * 0.6567, mapWidth * 0.542], [mapHeight * 0.72, mapWidth * 0.542]], // Right horizontal
  [[mapHeight * 0.444, mapWidth * 0.702], [mapHeight * 0.682, mapWidth * 0.651]], // Far right diagonal
];

// Entry point coordinates
const ENTRY_POINT = [mapHeight * 0.51, mapWidth * 0.3];

// Add MapController component at the top level
function MapController({ onMapReady }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
}

export default function ClientMapView() {
  const { token } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [pathToPlot, setPathToPlot] = useState(null);
  const [map, setMap] = useState(null);
  const navigate = useNavigate();
  
  // Memoize the map ready callback
  const handleMapReady = React.useCallback((mapInstance) => {
    console.log('Map ready:', mapInstance);
    setMap(mapInstance);
  }, []);

  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/client/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setLots(res.data))
    .catch(err => console.error(err));

    // Subscribe to lot and reservation events
    const handleUpdate = () => {
      axios.get(
        `${process.env.REACT_APP_API_URL}/client/lots`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => setLots(res.data))
      .catch(err => console.error(err));
    };

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

  // Function to get plot center
  const getPlotCenter = (plotBounds) => {
    const [[y1, x1], [y2, x2]] = plotBounds;
    return [
      (y1 * mapHeight + y2 * mapHeight) / 2,
      (x1 * mapWidth + x2 * mapWidth) / 2
    ];
  };

  // Function to find the closest point on a line segment to a target point
  const findClosestPointOnLine = (lineStart, lineEnd, targetPoint) => {
    const lineVector = [
      lineEnd[0] - lineStart[0],
      lineEnd[1] - lineStart[1]
    ];
    const pointVector = [
      targetPoint[0] - lineStart[0],
      targetPoint[1] - lineStart[1]
    ];

    const lengthSquared = lineVector[0] * lineVector[0] + lineVector[1] * lineVector[1];
    const t = Math.max(0, Math.min(1, (
      pointVector[0] * lineVector[0] + pointVector[1] * lineVector[1]
    ) / lengthSquared));

    return [
      lineStart[0] + t * lineVector[0],
      lineStart[1] + t * lineVector[1]
    ];
  };

  // Function to find the nearest point on any road segment
  const findNearestRoadPoint = (point) => {
    let nearestPoint = null;
    let minDistance = Infinity;
    let roadIndex = null;

    roads.forEach((road, index) => {
      const pointOnRoad = findClosestPointOnLine(road[0], road[1], point);
      const distance = Math.sqrt(
        Math.pow(point[0] - pointOnRoad[0], 2) + 
        Math.pow(point[1] - pointOnRoad[1], 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = pointOnRoad;
        roadIndex = index;
      }
    });

    return { point: nearestPoint, roadIndex, distance: minDistance };
  };

  // Function to check if two road segments are connected
  const areRoadsConnected = (road1, road2) => {
    const start1 = road1[0];
    const end1 = road1[1];
    const start2 = road2[0];
    const end2 = road2[1];

    const point1OnRoad2 = findClosestPointOnLine(start2, end2, start1);
    const point2OnRoad1 = findClosestPointOnLine(start1, end1, start2);
    const point3OnRoad2 = findClosestPointOnLine(start2, end2, end1);
    const point4OnRoad1 = findClosestPointOnLine(start1, end1, end2);

    const distance1 = Math.sqrt(
      Math.pow(start1[0] - point1OnRoad2[0], 2) + 
      Math.pow(start1[1] - point1OnRoad2[1], 2)
    );
    const distance2 = Math.sqrt(
      Math.pow(start2[0] - point2OnRoad1[0], 2) + 
      Math.pow(start2[1] - point2OnRoad1[1], 2)
    );
    const distance3 = Math.sqrt(
      Math.pow(end1[0] - point3OnRoad2[0], 2) + 
      Math.pow(end1[1] - point3OnRoad2[1], 2)
    );
    const distance4 = Math.sqrt(
      Math.pow(end2[0] - point4OnRoad1[0], 2) + 
      Math.pow(end2[1] - point4OnRoad1[1], 2)
    );

    const threshold = mapHeight * 0.02;
    return Math.min(distance1, distance2, distance3, distance4) < threshold;
  };

  // Function to find a path through the road network
  const findPathThroughRoads = (startPoint, endPoint) => {
    let path = [];
    let currentRoadIndex = startPoint.roadIndex;
    let targetRoadIndex = endPoint.roadIndex;

    if (currentRoadIndex === targetRoadIndex) {
      return [];
    }

    let visited = new Set([currentRoadIndex]);
    let queue = [{
      roadIndex: currentRoadIndex,
      path: []
    }];

    while (queue.length > 0) {
      const { roadIndex, path: currentPath } = queue.shift();

      roads.forEach((_, index) => {
        if (visited.has(index)) return;

        if (areRoadsConnected(roads[roadIndex], roads[index])) {
          const newPath = [...currentPath];
          
          const point1OnRoad2 = findClosestPointOnLine(roads[index][0], roads[index][1], roads[roadIndex][0]);
          const point2OnRoad1 = findClosestPointOnLine(roads[roadIndex][0], roads[roadIndex][1], roads[index][0]);
          
          const distance1 = Math.sqrt(
            Math.pow(roads[roadIndex][0][0] - point1OnRoad2[0], 2) + 
            Math.pow(roads[roadIndex][0][1] - point1OnRoad2[1], 2)
          );
          const distance2 = Math.sqrt(
            Math.pow(roads[index][0][0] - point2OnRoad1[0], 2) + 
            Math.pow(roads[index][0][1] - point2OnRoad1[1], 2)
          );
          
          const connectionPoint = distance1 < distance2 ? point1OnRoad2 : point2OnRoad1;
          newPath.push(connectionPoint);

          if (index === targetRoadIndex) {
            path = newPath;
            return;
          }

          queue.push({
            roadIndex: index,
            path: newPath
          });
          visited.add(index);
        }
      });
    }

    return path;
  };

  // Function to create path to plot using roads
  const createPathToPlot = (targetLot) => {
    const plotCenter = getPlotCenter(targetLot.bounds);
    const plotPoint = [plotCenter[0], plotCenter[1]];

    const startRoadPoint = findNearestRoadPoint(ENTRY_POINT);
    const endRoadPoint = findNearestRoadPoint(plotPoint);

    let path = [ENTRY_POINT];
    path.push(startRoadPoint.point);

    const roadPath = findPathThroughRoads(startRoadPoint, endRoadPoint);
    path = [...path, ...roadPath];

    path.push(endRoadPoint.point);
    path.push(plotPoint);

    return path;
  };

  const handleLotSelect = React.useCallback((lot) => {
    if (!map) {
      console.error('Map not ready');
      return;
    }

    // Use the original bounds directly for selection
    const [[y1, x1], [y2, x2]] = lot.bounds;
    
    // Create path using roads
    const path = createPathToPlot(lot);
    setPathToPlot(path);

    const scaledBounds = [
      [y1 * mapHeight, x1 * mapWidth],
      [y2 * mapHeight, x2 * mapWidth]
    ];

    // Only pan to the location without zooming
    const center = [
      (scaledBounds[0][0] + scaledBounds[1][0]) / 2,
      (scaledBounds[0][1] + scaledBounds[1][1]) / 2
    ];
    map.setView(center, map.getZoom());

    setSelectedLot({
      ...lot,
      bounds: scaledBounds
    });
  }, [map]); // Only recreate when map changes

  const clearSelection = () => {
    setSelectedLot(null);
    setPathToPlot(null);  // Clear the navigation path
  };

  const statusConfig = {
    available: {
      color: '#34c759',
      label: 'Available'
    },
    reserved: {
      color: '#007bff',
      label: 'Reserved'
    },
    unavailable: {
      color: '#ff3b30',
      label: 'Unavailable'
    },
    active: {
      color: '#8e8e93',
      label: 'Active'
    }
  };

  return (
    <div className="client-page">
      <div className="map-container">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={[[0, 0], [mapHeight, mapWidth]]}
          zoom={0}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          maxBounds={[[0, 0], [mapHeight, mapWidth]]}
          maxBoundsViscosity={1.0}
        >
          <MapController onMapReady={handleMapReady} />
          <ZoomControl position="bottomright" />
          <ImageOverlay
            url="/cemetery-map.svg"
            bounds={[[0, 0], [mapHeight, mapWidth]]}
          />

          {/* Display roads */}
          {roads.map((road, index) => (
            <Polyline
              key={`base-road-${index}`}
              positions={road}
              pathOptions={{
                color: '#99ccff',
                weight: 4,
                opacity: 0
              }}
            />
          ))}

          {/* Display navigation path */}
          {pathToPlot && pathToPlot.length > 0 && (
            <Polyline
              positions={pathToPlot}
              pathOptions={{
                color: '#0066ff',
                weight: 4,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          )}

          {lots.map(lot => {
            let [[y1, x1], [y2, x2]] = lot.bounds;
            y1 = y1 * mapHeight;
            y2 = y2 * mapHeight;
            x1 = x1 * mapWidth;
            x2 = x2 * mapWidth;

            const bounds = [[y1, x1], [y2, x2]];
            const color =
              lot.status === 'available' ? '#34c759' :
              lot.status === 'unavailable' ? '#ff3b30' :
              lot.status === 'reserved' ? '#007bff' :
              lot.status === 'pending' ? '#ffc107' :
              lot.status === 'active' ? '#8e8e93' :
              '#8e8e93';

            return (
              <Rectangle
                key={lot._id}
                bounds={bounds}
                pathOptions={{ 
                  color, 
                  fillColor: color, 
                  fillOpacity: 0.6, 
                  weight: 2,
                  opacity: 0.8 
                }}
                eventHandlers={{
                  click: () => handleLotSelect(lot)
                }}
              />
            );
          })}

          {/* Add Legend */}
          <div className="plot-legend">
            <div className="legend-title">Plot Status</div>
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="legend-item">
                <div 
                  className={`legend-color ${status}`}
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.label}</span>
              </div>
            ))}
          </div>

          {selectedLot && (
            <Popup
              position={selectedLot.bounds[0]}
              onClose={clearSelection}
              className="lot-popup"
              closeButton={true}
              autoPan={false}
              closeOnClick={true}
            >
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <h3>Lot Information</h3>
                <p>
                  <strong>Lot ID:</strong>
                  <span>{selectedLot.id}</span>
                </p>
                <p>
                  <strong>Name:</strong>
                  <span>{selectedLot.name || '—'}</span>
                </p>
                <p>
                  <strong>Location:</strong>
                  <span>{selectedLot.location || '—'}</span>
                </p>
                <p>
                  <strong>Square Meters:</strong>
                  <span>{selectedLot.sqm || '—'}</span>
                </p>
                <p>
                  <strong>Birth:</strong>
                  <span>{selectedLot.birth || '—'}</span>
                </p>
                <p>
                  <strong>Death:</strong>
                  <span>{selectedLot.death || '—'}</span>
                </p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status-${selectedLot.status}`}>
                    {statusConfig[selectedLot.status]?.label || 'Unknown'}
                  </span>
                </p>
                {selectedLot.status === 'available' && (
                  <button
                    className="action-button book-button"
                    onClick={() => {
                      const lotData = {
                        id: selectedLot.id,
                        name: selectedLot.name,
                        sqm: selectedLot.sqm,
                        location: selectedLot.location,
                        status: selectedLot.status,
                        price: selectedLot.price
                      };
                      navigate('/client/reservations/booking', { state: { lotDetails: lotData } });
                      clearSelection();
                    }}
                  >
                    RESERVE
                  </button>
                )}
                {selectedLot.status === 'reserved' && (
                  <div className="reserved-notice">
                    This lot is currently reserved
                  </div>
                )}
                {selectedLot.status === 'pending' && (
                  <div className="pending-notice">
                    This lot has a pending reservation
                  </div>
                )}
                {selectedLot.status === 'unavailable' && (
                  <div className="unavailable-notice">
                    This lot is not available
                  </div>
                )}
                {selectedLot.status === 'active' && (
                  <div className="active-notice">
                    This lot is currently occupied
                  </div>
                )}
              </div>
            </Popup>
          )}
        </MapContainer>

        <div className="floating-locator">
          <GraveLocator lots={lots} onSelect={handleLotSelect} />
        </div>
      </div>
    </div>
  );
}
