import React, { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Rectangle, Popup, ZoomControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import GraveLocator from '../components/GraveLocator';
import 'leaflet/dist/leaflet.css';
import './ClientMapView.css';
import { useNavigate, useLocation } from 'react-router-dom';

const mapWidth = 2048;
const mapHeight = 1025;
const blockSize = 1;

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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

export default function GuestMapView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [pathToPlot, setPathToPlot] = useState(null);
  const [map, setMap] = useState(null);
  const [error, setError] = useState('');
  
  // Memoize the map ready callback
  const handleMapReady = React.useCallback((mapInstance) => {
    console.log('Map ready:', mapInstance);
    setMap(mapInstance);
  }, []);

  // Add price calculation helper
  const calculatePrice = (sqm, pricePerSqm) => {
    const sqmValue = parseFloat(sqm) || 0;
    const pricePerSqmValue = parseFloat(pricePerSqm) || 4000;
    return (sqmValue * pricePerSqmValue).toString();
  };

  useEffect(() => {
    // Fetch lots from public API endpoint for guests
    const fetchLots = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/public/lots`);
        setLots(response.data);
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('Failed to fetch lots from public API:', err);
        setError('Unable to load cemetery plots. Please try again later.');
        // Fallback to mock data if API fails
        const mockLots = [
          {
            _id: 'mock1',
            id: 'A001',
            name: 'John Doe',
            location: 'Section A',
            sqm: '6',
            birth: '1960-01-01',
            death: '2020-01-01',
            status: 'active',
            bounds: [[0.1, 0.1], [0.15, 0.15]]
          },
          {
            _id: 'mock2',
            id: 'A002',
            name: '',
            location: 'Section A',
            sqm: '6',
            status: 'available',
            bounds: [[0.1, 0.2], [0.15, 0.25]]
          },
          {
            _id: 'mock3',
            id: 'B001',
            name: '',
            location: 'Section B',
            sqm: '8',
            status: 'available',
            bounds: [[0.3, 0.3], [0.35, 0.35]]
          }
        ];
        setLots(mockLots);
      }
    };
    
    fetchLots();
  }, []);

  // Handle navigation from bookmarks
  useEffect(() => {
    const navigationState = location.state;
    if (navigationState && navigationState.selectedLotId && map && lots.length > 0) {
      const targetLot = lots.find(lot => lot._id === navigationState.selectedLotId);
      if (targetLot) {
        // Delay to ensure map is fully ready
        setTimeout(() => {
          // Create path using roads
          const path = createPathToPlot(targetLot);
          setPathToPlot(path);

          const scaledBounds = [
            [targetLot.bounds[0][0] * mapHeight, targetLot.bounds[0][1] * mapWidth],
            [targetLot.bounds[1][0] * mapHeight, targetLot.bounds[1][1] * mapWidth]
          ];

          // Only pan to the location without zooming
          const center = [
            (scaledBounds[0][0] + scaledBounds[1][0]) / 2,
            (scaledBounds[0][1] + scaledBounds[1][1]) / 2
          ];
          map.setView(center, map.getZoom());

          setSelectedLot({
            ...targetLot,
            bounds: scaledBounds
          });
        }, 300);
        
        // Clear the navigation state to prevent re-selection on re-renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [lots, map, location.state]);

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

  // Function to create point-to-point navigation between two lots
  const createPointToPointPath = (startLot, endLot) => {
    const startPlotCenter = getPlotCenter(startLot.bounds);
    const endPlotCenter = getPlotCenter(endLot.bounds);
    
    const startPoint = [startPlotCenter[0], startPlotCenter[1]];
    const endPoint = [endPlotCenter[0], endPlotCenter[1]];

    const startRoadPoint = findNearestRoadPoint(startPoint);
    const endRoadPoint = findNearestRoadPoint(endPoint);

    let path = [startPoint]; // Start from the starting lot
    path.push(startRoadPoint.point); // Move to nearest road

    const roadPath = findPathThroughRoads(startRoadPoint, endRoadPoint);
    path = [...path, ...roadPath]; // Navigate through road network

    path.push(endRoadPoint.point); // Move from road to destination
    path.push(endPoint); // End at the destination lot

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

  // Handler for point-to-point navigation
  const handlePointToPointNavigation = React.useCallback((startLot, endLot) => {
    if (!map) {
      console.error('Map not ready');
      return;
    }

    console.log('Point-to-point navigation from:', startLot.id, 'to:', endLot.id);
    
    // Create path between the two lots
    const path = createPointToPointPath(startLot, endLot);
    setPathToPlot(path);

    // Calculate bounds to fit both lots and the path
    const startCenter = getPlotCenter(startLot.bounds);
    const endCenter = getPlotCenter(endLot.bounds);
    
    const bounds = [
      [Math.min(startCenter[0], endCenter[0]) - 50, Math.min(startCenter[1], endCenter[1]) - 50],
      [Math.max(startCenter[0], endCenter[0]) + 50, Math.max(startCenter[1], endCenter[1]) + 50]
    ];
    
    // Fit the map to show both lots and the navigation path
    map.fitBounds(bounds, { padding: [50, 50] });

    // Clear any existing selection
    setSelectedLot(null);
  }, [map]);

  const statusConfig = {
    available: {
      color: '#34c759',
      label: 'Available'
    },
    unavailable: {
      color: '#ff3b30',
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

  return (
    <div className="client-page">
      {error && <div className="error-message">{error}</div>}
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
              (lot.status === 'landmark' || lot.type === 'landmark') ? '#000000' :
              lot.status === 'available' ? '#34c759' :
              (lot.status === 'reserve' || lot.status === 'reserved' || lot.status === 'pending' || lot.status === 'approved') ? '#007bff' :
              (lot.status === 'active' || lot.status === 'occupied' || lot.status === 'confirmed') ? '#8e8e93' :
              '#ff3b30'; // Default to red for unavailable

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
                    onClick={() => navigate('/login')}
                  >
                    LOGIN TO RESERVE
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
                    <button
                      className="action-button guest-notice-button"
                      onClick={() => navigate('/login')}
                    >
                      LOGIN TO BOOKMARK
                    </button>
                  </div>
                )}
                {selectedLot.status === 'active' && (
                  <div className="active-notice">
                    This lot is currently occupied
                    <button
                      className="action-button guest-notice-button"
                      onClick={() => navigate('/login')}
                    >
                      LOGIN TO BOOKMARK
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          )}
        </MapContainer>

        <div className="floating-locator">
          <GraveLocator 
            lots={lots} 
            onSelect={handleLotSelect} 
            onNavigate={handlePointToPointNavigation}
          />
        </div>
      </div>

      <style jsx>{`
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px;
          margin: 10px;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }
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