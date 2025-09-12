// src/pages/ClientMapView.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, ImageOverlay, Rectangle, Popup, ZoomControl, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import GraveLocator from '../components/GraveLocator';
import 'leaflet/dist/leaflet.css';
import './ClientMapView.css';
import eventBus, { EVENTS } from '../utils/eventBus';
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

// Columbarium building coordinates and size (based on the black square in the image)
const COLUMBARIUM_BUILDING = {
  bounds: [
    [mapHeight * 0.52, mapWidth * 0.17], // Top-left corner
    [mapHeight * 0.60, mapWidth * 0.25]  // Bottom-right corner
  ],
  name: 'Columbarium Building',
  type: 'building',
  color: '#000000'
};

// Create custom icons for navigation markers
const startIcon = L.divIcon({
  html: `
    <div style="
      background-color: #28a745;
      color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      📍
    </div>
    <div style="
      background-color: #28a745;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      margin-top: 2px;
      text-align: center;
      white-space: nowrap;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    ">
      You are here
    </div>
  `,
  className: 'custom-start-marker',
  iconSize: [80, 50],
  iconAnchor: [40, 25]
});

const endIcon = L.divIcon({
  html: `
    <div style="
      background-color: #dc3545;
      color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      🎯
    </div>
    <div style="
      background-color: #dc3545;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      margin-top: 2px;
      text-align: center;
      white-space: nowrap;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    ">
      End here
    </div>
  `,
  className: 'custom-end-marker',
  iconSize: [80, 50],
  iconAnchor: [40, 25]
});

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
  const navigate = useNavigate();
  const location = useLocation();
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [pathToPlot, setPathToPlot] = useState(null);
  const [map, setMap] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [error, setError] = useState('');
  const [showColumbariumPopup, setShowColumbariumPopup] = useState(false);
  const [columbariumPopupPosition, setColumbariumPopupPosition] = useState(null);
  const [columbariumSearchResult, setColumbariumSearchResult] = useState(null);
  
  // Memoize the map ready callback
  const handleMapReady = React.useCallback((mapInstance) => {
    console.log('Map ready:', mapInstance);
    setMap(mapInstance);
  }, []);

  // Fetch user's bookmarks
  const fetchBookmarks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/client/lots/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(res.data.map(lot => lot._id));
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };

  // Add bookmark
  const addBookmark = async (lotId) => {
    setBookmarkLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/client/lots/${lotId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(prev => [...prev, lotId]);
    } catch (err) {
      console.error('Error adding bookmark:', err);
      setError(err.response?.data?.msg || 'Failed to bookmark lot');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Remove bookmark
  const removeBookmark = async (lotId) => {
    setBookmarkLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/client/lots/${lotId}/bookmark`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(prev => prev.filter(id => id !== lotId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setError(err.response?.data?.msg || 'Failed to remove bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Add price calculation helper
  const calculatePrice = (sqm, pricePerSqm) => {
    const sqmValue = parseFloat(sqm) || 0;
    const pricePerSqmValue = parseFloat(pricePerSqm) || 4000;
    return (sqmValue * pricePerSqmValue).toString();
  };

  useEffect(() => {
    axios.get(
      `${process.env.REACT_APP_API_URL}/client/lots`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setLots(res.data))
    .catch(err => console.error(err));

    // Fetch bookmarks
    fetchBookmarks();

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

    // Add columbarium search navigation listener
    const handleColumbariumSearchNavigation = (searchResult) => {
      if (searchResult && searchResult.type === 'columbarium') {
        handleColumbariumSearchResult(searchResult);
      }
    };

    eventBus.on(EVENTS.COLUMBARIUM_SEARCH_NAVIGATE, handleColumbariumSearchNavigation);

    return () => {
      eventBus.off(EVENTS.LOT_UPDATED, handleUpdate);
      eventBus.off(EVENTS.LOT_CREATED, handleUpdate);
      eventBus.off(EVENTS.LOT_DELETED, handleUpdate);
      eventBus.off(EVENTS.RESERVATION_CHANGED, handleUpdate);
      eventBus.off(EVENTS.COLUMBARIUM_SEARCH_NAVIGATE, handleColumbariumSearchNavigation);
    };
  }, [token]);

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

  // Function to create path to columbarium building
  const createPathToColumbarium = () => {
    const buildingCenter = [
      (COLUMBARIUM_BUILDING.bounds[0][0] + COLUMBARIUM_BUILDING.bounds[1][0]) / 2,
      (COLUMBARIUM_BUILDING.bounds[0][1] + COLUMBARIUM_BUILDING.bounds[1][1]) / 2
    ];

    const startRoadPoint = findNearestRoadPoint(ENTRY_POINT);
    const endRoadPoint = findNearestRoadPoint(buildingCenter);

    let path = [ENTRY_POINT];
    path.push(startRoadPoint.point);

    const roadPath = findPathThroughRoads(startRoadPoint, endRoadPoint);
    path = [...path, ...roadPath];

    path.push(endRoadPoint.point);
    path.push(buildingCenter);

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

  const handleColumbariumClick = () => {
    const buildingCenter = [
      (COLUMBARIUM_BUILDING.bounds[0][0] + COLUMBARIUM_BUILDING.bounds[1][0]) / 2,
      (COLUMBARIUM_BUILDING.bounds[0][1] + COLUMBARIUM_BUILDING.bounds[1][1]) / 2
    ];

    // Create path to columbarium
    const path = createPathToColumbarium();
    setPathToPlot(path);

    // Show popup at building center
    setColumbariumPopupPosition(buildingCenter);
    setShowColumbariumPopup(true);
    setColumbariumSearchResult(null); // Clear any search result

    // Clear any existing lot selection
    setSelectedLot(null);
  };

  // Handle columbarium search result navigation
  const handleColumbariumSearchResult = (searchResult) => {
    const buildingCenter = [
      (COLUMBARIUM_BUILDING.bounds[0][0] + COLUMBARIUM_BUILDING.bounds[1][0]) / 2,
      (COLUMBARIUM_BUILDING.bounds[0][1] + COLUMBARIUM_BUILDING.bounds[1][1]) / 2
    ];

    // Create path to columbarium
    const path = createPathToColumbarium();
    setPathToPlot(path);

    // Show popup with search result details
    setColumbariumPopupPosition(buildingCenter);
    setShowColumbariumPopup(true);
    setColumbariumSearchResult(searchResult);

    // Clear any existing lot selection
    setSelectedLot(null);
  };

  const handleEnterColumbarium = () => {
    setShowColumbariumPopup(false);
    // Navigate to columbarium page for clients
    window.location.href = '/client/columbarium';
  };

  const handleCancelColumbarium = () => {
    setShowColumbariumPopup(false);
    setPathToPlot(null); // Clear navigation path
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

          {/* Display navigation markers */}
          {pathToPlot && pathToPlot.length > 0 && (
            <>
              {/* Start marker - "You are here" */}
              <Marker
                position={pathToPlot[0]}
                icon={startIcon}
                zIndexOffset={1000}
              />
              
              {/* End marker - "End here" */}
              <Marker
                position={pathToPlot[pathToPlot.length - 1]}
                icon={endIcon}
                zIndexOffset={1000}
              />
            </>
          )}

          {/* Columbarium Building */}
          <Rectangle
            bounds={COLUMBARIUM_BUILDING.bounds}
            pathOptions={{
              color: COLUMBARIUM_BUILDING.color,
              fillColor: COLUMBARIUM_BUILDING.color,
              weight: 2,
              fillOpacity: 0.8,
              opacity: 1
            }}
            eventHandlers={{
              click: handleColumbariumClick
            }}
          />

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

          {/* Columbarium Popup */}
          {showColumbariumPopup && columbariumPopupPosition && (
            <Popup
              position={columbariumPopupPosition}
              onClose={handleCancelColumbarium}
              className="columbarium-popup"
              closeButton={true}
              autoPan={false}
              closeOnClick={false}
            >
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <h3>{COLUMBARIUM_BUILDING.name}</h3>
                
                {columbariumSearchResult ? (
                  <div className="columbarium-search-result">
                    <div className="search-result-header">
                      <h4>📍 Found: {columbariumSearchResult.deceased_name}</h4>
                    </div>
                    
                    <div className="location-details">
                      <div className="location-item">
                        <strong>Building:</strong> {columbariumSearchResult.building}
                      </div>
                      <div className="location-item">
                        <strong>Floor:</strong> {columbariumSearchResult.floor}
                      </div>
                      <div className="location-item">
                        <strong>Section:</strong> {columbariumSearchResult.section}
                      </div>
                      <div className="location-item">
                        <strong>Row:</strong> {columbariumSearchResult.row}
                      </div>
                      <div className="location-item">
                        <strong>Column:</strong> {columbariumSearchResult.column}
                      </div>
                      <div className="location-item">
                        <strong>Slot ID:</strong> {columbariumSearchResult.slot_id}
                      </div>
                      <div className="location-item">
                        <strong>Size:</strong> {columbariumSearchResult.size}
                      </div>
                    </div>
                    
                    {columbariumSearchResult.birth_date && (
                      <div className="date-info">
                        <strong>Born:</strong> {new Date(columbariumSearchResult.birth_date).toLocaleDateString()}
                      </div>
                    )}
                    {columbariumSearchResult.death_date && (
                      <div className="date-info">
                        <strong>Died:</strong> {new Date(columbariumSearchResult.death_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    <div className="popup-buttons">
                      <button 
                        className="enter-button"
                        onClick={handleEnterColumbarium}
                      >
                        View in Columbarium
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={handleCancelColumbarium}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>Would you like to browse available columbarium slots?</p>
                    <div className="popup-buttons">
                      <button 
                        className="enter-button"
                        onClick={handleEnterColumbarium}
                      >
                        Browse Slots
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={handleCancelColumbarium}
                      >
                        No, Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          )}

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
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#000000' }} />
              <span>Columbarium</span>
            </div>
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
                        price: selectedLot.price || calculatePrice(selectedLot.sqm, selectedLot.pricePerSqm)
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
                    <button
                      className={`action-button bookmark-button ${bookmarks.includes(selectedLot._id) ? 'bookmarked' : ''}`}
                      onClick={() => {
                        if (bookmarks.includes(selectedLot._id)) {
                          removeBookmark(selectedLot._id);
                        } else {
                          addBookmark(selectedLot._id);
                        }
                      }}
                      disabled={bookmarkLoading}
                    >
                      {bookmarkLoading ? 'LOADING...' : 
                       bookmarks.includes(selectedLot._id) ? 'BOOKMARKED' : 'BOOKMARK'}
                    </button>
                  </div>
                )}
                {selectedLot.status === 'active' && (
                  <div className="active-notice">
                    This lot is currently occupied
                    <button
                      className={`action-button bookmark-button ${bookmarks.includes(selectedLot._id) ? 'bookmarked' : ''}`}
                      onClick={() => {
                        if (bookmarks.includes(selectedLot._id)) {
                          removeBookmark(selectedLot._id);
                        } else {
                          addBookmark(selectedLot._id);
                        }
                      }}
                      disabled={bookmarkLoading}
                    >
                      {bookmarkLoading ? 'LOADING...' : 
                       bookmarks.includes(selectedLot._id) ? 'BOOKMARKED' : 'BOOKMARK'}
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
        .bookmark-button {
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
        .bookmark-button:hover {
          background-color: #e9ecef;
        }
        .bookmark-button.bookmarked {
          background-color: #ffc107;
          color: #212529;
          border-color: #ffc107;
        }
        .bookmark-button.bookmarked:hover {
          background-color: #e0a800;
          border-color: #d39e00;
        }
        .bookmark-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .popup-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          justify-content: center;
        }
        .enter-button {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .enter-button:hover {
          background-color: #218838;
        }
        .cancel-button {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .cancel-button:hover {
          background-color: #5a6268;
        }
      `}</style>
    </div>
  );
}
