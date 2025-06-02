import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  Popup,
  Polyline,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import eventBus, { EVENTS } from '../utils/eventBus';

import GraveLocator from '../components/GraveLocator';
import CreateLotModal from '../components/CreateLotModal';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Enable Leaflet dragging
L.Rectangle.include({
  _initInteraction: function () {
    if (!this.options.interactive) { return; }

    this._map = this._path.parentNode._leaflet_map;
    this.setStyle({ interactive: true });

    if (this.options.draggable) {
      this.dragging = new L.Handler.PathDrag(this);
      if (this.options.draggable) {
        this.dragging.enable();
      }
    }
  }
});

// Actual image dimensions
const mapWidth = 2048;
const mapHeight = 1025;

// Define constant plot size - making them smaller
const PLOT_WIDTH = 0.0005;  // Smaller width
const PLOT_HEIGHT = 0.001; // Smaller height

// Define status configuration
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

// ============= EDIT ROAD POSITIONS HERE =============
// Each road is an array of two points: [start, end]
// Format: [[y1, x1], [y2, x2]]
// - y values are multiplied by mapHeight (1025)
// - x values are multiplied by mapWidth (2048)
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
// ================ END ROAD POSITIONS ================

// Entry point coordinates (where visitors start)
const ENTRY_POINT = [mapHeight * 0.51, mapWidth * 0.3];

// DraggableLot component
function DraggableLot({ lot, bounds, color, onDragEnd, isEditing }) {
  const map = useMap();
  const rectRef = useRef();

  useEffect(() => {
    if (!rectRef.current || !isEditing) return;

    const rectangle = rectRef.current;
    const leafletElement = rectangle.getElement();

    if (leafletElement) {
      let isDragging = false;
      let startPos;

      const onMouseDown = (e) => {
        if (!isEditing) return;
        isDragging = true;
        map.dragging.disable(); // Disable map dragging
        startPos = map.mouseEventToLatLng(e);
        leafletElement.style.cursor = 'grabbing';
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        
        const currentPos = map.mouseEventToLatLng(e);
        const deltaLat = currentPos.lat - startPos.lat;
        const deltaLng = currentPos.lng - startPos.lng;

        const [[y1, x1], [y2, x2]] = rectangle.getBounds();
        const newBounds = [
          [y1 + deltaLat, x1 + deltaLng],
          [y2 + deltaLat, x2 + deltaLng]
        ];
        rectangle.setBounds(newBounds);
        startPos = currentPos;
      };

      const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        map.dragging.enable(); // Re-enable map dragging
        leafletElement.style.cursor = '';
        
        const bounds = rectangle.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        
        // Convert back to relative coordinates
        const newBounds = [
          [sw.lat/mapHeight, sw.lng/mapWidth],
          [ne.lat/mapHeight, ne.lng/mapWidth]
        ];
        onDragEnd(lot._id, newBounds);
      };

      leafletElement.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      return () => {
        leafletElement.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [map, isEditing, lot._id, onDragEnd]);

  return (
    <Rectangle
      ref={rectRef}
      bounds={bounds}
      pathOptions={{
        color,
        weight: 1,
        fillOpacity: 0.3
      }}
    />
  );
}

// MapEvents component to handle map clicks
function MapEvents({ onMapClick, moveMode, onMoveClick }) {
  useMapEvents({
    click: (e) => {
      const { lat: y, lng: x } = e.latlng;
      if (moveMode) {
        onMoveClick([y, x]);
      } else {
        onMapClick([y/mapHeight, x/mapWidth]); // Convert to relative coordinates
      }
    }
  });
  return null;
}

export default function MapView() {
  const { token, role } = useContext(AuthContext);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [lotToMove, setLotToMove] = useState(null);

  const [map, setMap] = useState(null);
  const [pathToPlot, setPathToPlot] = useState(null);
  const [error, setError] = useState(null);

  // Add error timeout cleanup
  useEffect(() => {
    let errorTimeout;
    if (error) {
      errorTimeout = setTimeout(() => {
        setError(null);
      }, 3000); // 3 seconds
    }
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [error]);

  // Fetch lots from backend
  const fetchLots = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/staff/lots`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Raw lots data:', response.data);
      
      // Ensure each lot has both _id and id fields
      const processedLots = response.data.map(lot => ({
        ...lot,
        _id: lot._id || lot.id, // Use existing _id or fallback to id
        id: lot.id || lot._id   // Use existing id or fallback to _id
      }));
      
      console.log('Processed lots:', processedLots);
      setLots(processedLots);
    } catch (err) {
      console.error('Failed to fetch lots:', err);
      setError('Failed to load lots from server');
    }
  };

  useEffect(() => {
    fetchLots();

    // Subscribe to lot events
    const handleLotUpdate = () => fetchLots();
    eventBus.on(EVENTS.LOT_UPDATED, handleLotUpdate);
    eventBus.on(EVENTS.LOT_CREATED, handleLotUpdate);
    eventBus.on(EVENTS.LOT_DELETED, handleLotUpdate);
    eventBus.on(EVENTS.RESERVATION_CHANGED, handleLotUpdate);

    return () => {
      eventBus.off(EVENTS.LOT_UPDATED, handleLotUpdate);
      eventBus.off(EVENTS.LOT_CREATED, handleLotUpdate);
      eventBus.off(EVENTS.LOT_DELETED, handleLotUpdate);
      eventBus.off(EVENTS.RESERVATION_CHANGED, handleLotUpdate);
    };
  }, [token]);

  const handleMapClick = (position) => {
    if (isEditing) {
      setClickedPosition(position);
      setShowCreateModal(true);
    }
  };

  const handleCreateLot = async (lotData) => {
    try {
      // Calculate bounds based on clicked position
      const [y, x] = clickedPosition;
      console.log('Clicked position:', { y, x });
      
      // Ensure bounds are within valid range (0 to 1)
      const normalizedY = Math.min(1, Math.max(0, y));
      const normalizedX = Math.min(1, Math.max(0, x));
      console.log('Normalized coordinates:', { normalizedY, normalizedX });
      
      const bounds = [
        [normalizedY - PLOT_HEIGHT/2, normalizedX - PLOT_WIDTH/2],
        [normalizedY + PLOT_HEIGHT/2, normalizedX + PLOT_WIDTH/2]
      ];
      console.log('Calculated bounds:', bounds);

      const requestData = {
        ...lotData,
        bounds
      };
      console.log('Full request data being sent:', requestData);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/staff/lots`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Server response:', response.data);
      setLots([...lots, response.data]);
      setShowCreateModal(false);
      setClickedPosition(null);
      eventBus.emit(EVENTS.LOT_CREATED, response.data);
    } catch (err) {
      console.error('Failed to create lot:', err.response?.data || err);
      setError(`Failed to create lot: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleEditLot = async (lotData) => {
    try {
      // Preserve the existing bounds from the selected lot
      const updatedLotData = {
        ...lotData,
        bounds: selectedLot.bounds // Keep the existing bounds
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/lots/${selectedLot._id}`,
        updatedLotData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLots(lots.map(lot => 
        lot._id === selectedLot._id ? { ...response.data, bounds: selectedLot.bounds } : lot
      ));
      setSelectedLot(null);
      setShowCreateModal(false);
      eventBus.emit(EVENTS.LOT_UPDATED, response.data);
    } catch (err) {
      console.error('Failed to update lot:', err);
      setError('Failed to update lot');
    }
  };

  const handleDeleteLot = async (lotId) => {
    if (!lotId) {
      console.error('No lot ID provided for deletion');
      setError('Cannot delete lot: Invalid ID');
      return;
    }

    try {
      // Extract just the numeric/simple ID if it's a complex ID
      const simpleId = lotId.split('/').pop().split('_').pop();
      console.log('Using simple ID for deletion:', simpleId);

      await axios.delete(
        `${process.env.REACT_APP_API_URL}/staff/lots/${simpleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLots(lots.filter(lot => lot._id !== lotId && lot.id !== lotId));
      setSelectedLot(null);
      setShowCreateModal(false);
      setError(null);
      eventBus.emit(EVENTS.LOT_DELETED, lotId);
    } catch (err) {
      console.error('Failed to delete lot:', err);
      setError(`Failed to delete lot: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDragEnd = async (lotId, newBounds) => {
    try {
      const lotToUpdate = lots.find(l => l._id === lotId);
      if (!lotToUpdate) return;

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/staff/lots/${lotId}`,
        { ...lotToUpdate, bounds: newBounds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLots(lots.map(lot => 
        lot._id === lotId ? response.data : lot
      ));
    } catch (err) {
      console.error('Failed to update lot position:', err);
      setError('Failed to update lot position');
    }
  };

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

  // Function to check if two road segments intersect or are very close
  const areRoadsConnected = (road1, road2) => {
    const start1 = road1[0];
    const end1 = road1[1];
    const start2 = road2[0];
    const end2 = road2[1];

    // Check if any endpoints are close to the other road segment
    const point1OnRoad2 = findClosestPointOnLine(start2, end2, start1);
    const point2OnRoad1 = findClosestPointOnLine(start1, end1, start2);
    const point3OnRoad2 = findClosestPointOnLine(start2, end2, end1);
    const point4OnRoad1 = findClosestPointOnLine(start1, end1, end2);

    // Calculate distances between endpoints and their closest points on the other road
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

    // Use a slightly larger threshold for better connectivity
    const threshold = mapHeight * 0.02;
    return Math.min(distance1, distance2, distance3, distance4) < threshold;
  };

  // Function to create path to plot using roads
  const createPathToPlot = (targetLot) => {
    // Get the center point of the plot
    const plotCenter = getPlotCenter(targetLot.bounds);
    const plotPoint = [plotCenter[0], plotCenter[1]];

    // Find nearest road points for start and end
    const startRoadPoint = findNearestRoadPoint(ENTRY_POINT);
    const endRoadPoint = findNearestRoadPoint(plotPoint);

    // Start path from entry point
    let path = [ENTRY_POINT];

    // Add the point where we first hit the road network
    path.push(startRoadPoint.point);

    // Find a path through the road network from start to end
    const roadPath = findPathThroughRoads(startRoadPoint, endRoadPoint);
    path = [...path, ...roadPath];

    // Add the final approach to the plot
    path.push(endRoadPoint.point);
    path.push(plotPoint);

    return path;
  };

  // Function to find a path through the road network
  const findPathThroughRoads = (startPoint, endPoint) => {
    let path = [];
    let currentRoadIndex = startPoint.roadIndex;
    let targetRoadIndex = endPoint.roadIndex;

    // If we're on the same road, we're done
    if (currentRoadIndex === targetRoadIndex) {
      return [];
    }

    // Find connected roads that lead to the target
    let visited = new Set([currentRoadIndex]);
    let queue = [{
      roadIndex: currentRoadIndex,
      path: []
    }];

    while (queue.length > 0) {
      const { roadIndex, path: currentPath } = queue.shift();

      // Check all roads for connections
      roads.forEach((_, index) => {
        if (visited.has(index)) return;

        if (areRoadsConnected(roads[roadIndex], roads[index])) {
          const newPath = [...currentPath];
          
          // Find the connection point between the roads
          const point1OnRoad2 = findClosestPointOnLine(roads[index][0], roads[index][1], roads[roadIndex][0]);
          const point2OnRoad1 = findClosestPointOnLine(roads[roadIndex][0], roads[roadIndex][1], roads[index][0]);
          
          // Use the point that's closest to both roads
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
            // We found a path to the target road
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

  const handleLocate = lot => {
    if (!map) return;

    console.log('Locating lot:', lot);
    const [[y1f, x1f], [y2f, x2f]] = lot.bounds;
    const y1 = y1f * mapHeight;
    const x1 = x1f * mapWidth;
    const y2 = y2f * mapHeight;
    const x2 = x2f * mapWidth;

    // Create path using roads
    const path = createPathToPlot(lot);
    console.log('Setting path:', path);
    setPathToPlot(path);

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

  const handleRectClick = async (lot) => {
    if (!moveMode) {
      if (isEditing) {
        try {
          // Fetch the full lot details before opening edit modal
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/staff/lots/${lot._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Preserve the bounds and combine with fetched data
          const lotWithDetails = {
            ...response.data,
            bounds: lot.bounds
          };
          
          setSelectedLot(lotWithDetails);
          setShowCreateModal(true);
        } catch (err) {
          console.error('Failed to fetch lot details:', err);
          setError('Failed to load lot details for editing');
        }
      } else {
        const [[y1f, x1f], [y2f, x2f]] = lot.bounds;
        const y1 = y1f * mapHeight;
        const x1 = x1f * mapWidth;

        // Create path using roads
        const path = createPathToPlot(lot);
        setPathToPlot(path);

        setSelectedLot({
          ...lot,
          popupBounds: [[y1, x1], [y2f * mapHeight, x2f * mapWidth]]
        });
      }
    }
  };

  const clearSelection = () => {
    setSelectedLot(null);
    setPathToPlot(null);  // Clear the navigation path
  };

  const handleMoveClick = async (newPosition) => {
    if (!lotToMove) {
      console.error('No valid lot selected for moving');
      setError('Cannot move lot: No lot selected');
      return;
    }

    try {
      console.log('Moving lot:', lotToMove);
      const [y, x] = newPosition;
      const newBounds = [
        [y/mapHeight - PLOT_HEIGHT/2, x/mapWidth - PLOT_WIDTH/2],
        [y/mapHeight + PLOT_HEIGHT/2, x/mapWidth + PLOT_WIDTH/2]
      ];

      // Get the MongoDB _id from the lot object
      const lotId = lotToMove._id || lotToMove.id;
      console.log('Using ID for move:', lotId);

      const requestUrl = `${process.env.REACT_APP_API_URL}/staff/lots/${lotId}`;
      const requestPayload = {
        bounds: newBounds,
        id: lotToMove.id,
        name: lotToMove.name,
        birth: lotToMove.birth,
        death: lotToMove.death,
        status: lotToMove.status
      };

      console.log('Move request:', {
        url: requestUrl,
        payload: requestPayload
      });

      const response = await axios.put(
        requestUrl,
        requestPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Move response:', response.data);

      if (response.data) {
        setLots(lots.map(lot => 
          (lot._id === lotId || lot.id === lotId) ? response.data : lot
        ));
        setMoveMode(false);
        setLotToMove(null);
        setSelectedLot(null);
        setError(null);
        eventBus.emit(EVENTS.LOT_UPDATED, response.data);
      }
    } catch (err) {
      console.error('Failed to move lot:', {
        error: err,
        response: err.response,
        lotToMove: lotToMove
      });
      setError(`Failed to move lot: ${err.response?.data?.message || err.message}`);
    }
  };

  const startMoveMode = (lot) => {
    if (!lot) {
      console.error('Invalid lot data:', lot);
      setError('Cannot move lot: Invalid data');
      return;
    }

    console.log('Starting move mode with lot:', lot);
    
    // Ensure we have an ID to work with
    const lotId = lot._id || lot.id;
    if (!lotId) {
      console.error('No valid ID found in lot:', lot);
      setError('Cannot move lot: Missing ID');
      return;
    }

    setMoveMode(true);
    setLotToMove(lot);
    setSelectedLot(null);
    setShowCreateModal(false);
    setError(null);
  };

  const cancelMoveMode = () => {
    setMoveMode(false);
    setLotToMove(null);
  };

  return (
    <div className="mapview-wrapper">
      {error && <div className="error-message">{error}</div>}
      <div className="locator-panel">
        <GraveLocator lots={lots} onSelect={handleLocate} />
      </div>

      <div className="edit-mode-toggle">
        <button onClick={() => {
          setIsEditing(!isEditing);
          if (moveMode) {
            cancelMoveMode();
          }
        }}>
          {isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
        {isEditing && !moveMode && (
          <div className="edit-instructions">
            Click to create a new lot. Click existing lots to edit, move, or delete them.
          </div>
        )}
        {moveMode && (
          <div className="move-instructions">
            Click anywhere on the map to move the lot to that position.
            <button onClick={cancelMoveMode} className="cancel-move-button">
              Cancel Move
            </button>
          </div>
        )}
      </div>

      <MapContainer
        crs={L.CRS.Simple}
        bounds={[[0, 0], [mapHeight, mapWidth]]}
        zoom={0}
        style={{ height: '100vh', width: '100%' }}
        ref={setMap}
      >
        <ImageOverlay
          url="/cemetery-map.svg"
          bounds={[[0, 0], [mapHeight, mapWidth]]}
        />

        <MapEvents 
          onMapClick={handleMapClick} 
          moveMode={moveMode}
          onMoveClick={handleMoveClick}
        />

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

        {roads.map((road, index) => (
          <Polyline
            key={`base-road-${index}`}
            positions={road}
            pathOptions={{
              color: '#99ccff',
              weight: 4,
              opacity: 1
            }}
          />
        ))}

        {lots.map(lot => {
          const [[y1, x1], [y2, x2]] = lot.bounds;
          const centerY = (y1 + y2) / 2;
          const centerX = (x1 + x2) / 2;
          
          const bounds = [
            [(centerY - PLOT_HEIGHT/2) * mapHeight, (centerX - PLOT_WIDTH/2) * mapWidth],
            [(centerY + PLOT_HEIGHT/2) * mapHeight, (centerX + PLOT_WIDTH/2) * mapWidth]
          ];
          
          // Use the same color handling as PlotAvailability
          const color = getLotColor(lot.status);

          // Highlight the lot being moved
          const isMoving = lotToMove && lotToMove.id === lot.id;
          
          return (
            <Rectangle
              key={lot._id}
              bounds={bounds}
              pathOptions={{
                color: isMoving ? 'yellow' : color,
                weight: isMoving ? 2 : 1,
                fillOpacity: isMoving ? 0.5 : 0.3
              }}
              eventHandlers={{ 
                click: () => {
                  if (!moveMode) {
                    if (isEditing) {
                      setSelectedLot(lot);
                      setShowCreateModal(true);
                    } else {
                      handleRectClick(lot);
                    }
                  }
                }
              }}
            />
          );
        })}

        {selectedLot && !isEditing && (
          <Popup
            position={selectedLot.popupBounds[0]}
            onClose={clearSelection}
            className="lot-popup"
            closeButton={true}
            autoPan={false}
            closeOnClick={true}
          >
            <div className="popup-content">
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
                  {getLotLabel(selectedLot.status)}
                </span>
              </p>
            </div>
          </Popup>
        )}

        {/* Add Legend */}
        <div className="plot-legend">
          <div className="legend-title">Plot Status</div>
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="legend-item">
              <div className={`legend-color ${status}`} style={{ backgroundColor: config.color }} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>

      </MapContainer>

      <CreateLotModal
        show={showCreateModal && isEditing}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedLot(null);
          setClickedPosition(null);
        }}
        onSave={selectedLot ? handleEditLot : handleCreateLot}
        onDelete={handleDeleteLot}
        onMove={startMoveMode}
        initialLot={selectedLot}
        position={clickedPosition}
      />
    </div>
  );
}
