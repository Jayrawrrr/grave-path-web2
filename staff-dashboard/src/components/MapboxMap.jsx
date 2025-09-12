import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl, ScaleControl, FullscreenControl, GeolocateControl } from 'react-map-gl';
import { MAPBOX_CONFIG, imageToLatLng, getMapStyleOptions } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css';

const MapboxMap = ({
  lots = [],
  selectedLot = null,
  onLotClick = () => {},
  onMapClick = () => {},
  onLotCreate = () => {},
  isEditing = false,
  showRoads = true,
  showColumbarium = true,
  className = '',
  style = {}
}) => {
  const mapRef = useRef(null);
  const [viewport, setViewport] = useState({
    latitude: MAPBOX_CONFIG.defaultViewport.latitude,
    longitude: MAPBOX_CONFIG.defaultViewport.longitude,
    zoom: MAPBOX_CONFIG.defaultViewport.zoom,
    bearing: 0,
    pitch: 0
  });
  
  const [popupInfo, setPopupInfo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  
  // FREE FEATURE: Map style switching
  const [currentMapStyle, setCurrentMapStyle] = useState(MAPBOX_CONFIG.defaultMapStyle);
  const mapStyleOptions = getMapStyleOptions();

  // Handle map click for creating new lots
  const handleMapClick = useCallback((event) => {
    if (isEditing) {
      const { lng, lat } = event.lngLat;
      setClickedPosition([lat, lng]);
      setShowCreateModal(true);
      onMapClick([lat, lng]);
    }
  }, [isEditing, onMapClick]);

  // Handle lot marker click
  const handleLotClick = useCallback((lot, event) => {
    event.stopPropagation();
    setPopupInfo(lot);
    onLotClick(lot);
  }, [onLotClick]);

  // Close popup when clicking elsewhere
  const handleMapClickClose = useCallback(() => {
    setPopupInfo(null);
  }, []);

  // Get marker color based on lot status
  const getMarkerColor = (status) => {
    return MAPBOX_CONFIG.lotMarkers[status]?.color || '#6c757d';
  };

  // Get marker size based on lot type
  const getMarkerSize = (type) => {
    return type === 'landmark' ? 20 : 12;
  };

  // Render lot markers
  const renderLotMarkers = () => {
    return lots.map((lot) => {
      if (!lot.bounds || lot.bounds.length < 2) return null;
      
      // Calculate center point from bounds
      const centerLat = (lot.bounds[0][0] + lot.bounds[1][0]) / 2;
      const centerLng = (lot.bounds[0][1] + lot.bounds[1][1]) / 2;
      
      return (
        <Marker
          key={lot._id || lot.id}
          latitude={centerLat}
          longitude={centerLng}
          onClick={(e) => handleLotClick(lot, e)}
        >
          <div
            className={`lot-marker ${lot.status} ${lot.type}`}
            style={{
              backgroundColor: getMarkerColor(lot.status),
              width: getMarkerSize(lot.type),
              height: getMarkerSize(lot.type),
              borderRadius: lot.type === 'landmark' ? '50% 50% 50% 0' : '50%',
              transform: lot.type === 'landmark' ? 'rotate(-45deg)' : 'none',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer'
            }}
            title={`${lot.block || 'Block'} ${lot.lotNumber || 'Lot'} - ${lot.status}`}
          />
        </Marker>
      );
    });
  };

  // Render roads as polylines
  const renderRoads = () => {
    if (!showRoads) return null;

    const roadCoordinates = [
      // Main horizontal road from entrance
      [imageToLatLng(614, 1044), imageToLatLng(922, 1024)],
      
      // Main vertical roads
      [imageToLatLng(792, 1024), imageToLatLng(792, 1700)],
      [imageToLatLng(1048, 512), imageToLatLng(1048, 942)],
      
      // Left section paths
      [imageToLatLng(676, 1638), imageToLatLng(666, 1358)],
      [imageToLatLng(666, 1358), imageToLatLng(666, 1276)],
      [imageToLatLng(676, 1638), imageToLatLng(676, 803)],
      
      // Central paths
      [imageToLatLng(922, 1026), imageToLatLng(1048, 938)],
      [imageToLatLng(1048, 938), imageToLatLng(1048, 1264)],
      
      // Right section paths
      [imageToLatLng(1110, 1344), imageToLatLng(1110, 1475)],
      [imageToLatLng(1438, 910), imageToLatLng(1333, 1397)]
    ];

    return (
      <Source
        id="roads"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: roadCoordinates.map((road, index) => ({
            type: 'Feature',
            properties: { id: `road-${index}` },
            geometry: {
              type: 'LineString',
              coordinates: road
            }
          }))
        }}
      >
        <Layer
          id="roads"
          type="line"
          paint={{
            'line-color': '#8B4513',
            'line-width': 3,
            'line-opacity': 0.8
          }}
        />
      </Source>
    );
  };

  // Render columbarium building
  const renderColumbarium = () => {
    if (!showColumbarium) return null;

    const columbariumBounds = [
      [imageToLatLng(348, 1065)], // Top-left
      [imageToLatLng(512, 1065)], // Top-right
      [imageToLatLng(512, 1229)], // Bottom-right
      [imageToLatLng(348, 1229)], // Bottom-left
      [imageToLatLng(348, 1065)]  // Close polygon
    ];

    return (
      <Source
        id="columbarium"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: { name: 'Columbarium' },
            geometry: {
              type: 'Polygon',
              coordinates: [columbariumBounds]
            }
          }]
        }}
      >
        <Layer
          id="columbarium-fill"
          type="fill"
          paint={{
            'fill-color': '#2c3e50',
            'fill-opacity': 0.7
          }}
        />
        <Layer
          id="columbarium-outline"
          type="line"
          paint={{
            'line-color': '#34495e',
            'line-width': 2
          }}
        />
      </Source>
    );
  };

  return (
    <div className={`mapbox-container ${className}`} style={style}>
      <Map
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        onClick={handleMapClick}
        onLoad={() => {
          // Map loaded successfully
          console.log('Mapbox map loaded');
        }}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        style={{ width: '100%', height: '100%' }}
        mapStyle={currentMapStyle}
        interactiveLayerIds={[]}
      >
        {/* FREE FEATURES: Map Controls */}
        {MAPBOX_CONFIG.controls.navigation && (
          <NavigationControl position="top-left" />
        )}
        
        {MAPBOX_CONFIG.controls.scale && (
          <ScaleControl position="bottom-left" />
        )}
        
        {MAPBOX_CONFIG.controls.fullscreen && (
          <FullscreenControl position="top-right" />
        )}
        
        {MAPBOX_CONFIG.controls.geolocate && (
          <GeolocateControl
            position="top-right"
            trackUserLocation={true}
            showAccuracyCircle={false}
            showUserHeading={true}
          />
        )}
        {/* Cemetery image overlay would go here if needed */}
        
        {/* Roads */}
        {renderRoads()}
        
        {/* Columbarium building */}
        {renderColumbarium()}
        
        {/* Lot markers */}
        {renderLotMarkers()}
        
        {/* Popup for lot information */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.bounds ? (popupInfo.bounds[0][0] + popupInfo.bounds[1][0]) / 2 : 0}
            longitude={popupInfo.bounds ? (popupInfo.bounds[0][1] + popupInfo.bounds[1][1]) / 2 : 0}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
          >
            <div className="lot-popup">
              <h4>{popupInfo.block} {popupInfo.lotNumber}</h4>
              <p><strong>Status:</strong> {popupInfo.status}</p>
              <p><strong>Type:</strong> {popupInfo.type}</p>
              {popupInfo.name && <p><strong>Name:</strong> {popupInfo.name}</p>}
              {popupInfo.sqm && <p><strong>Size:</strong> {popupInfo.sqm} sqm</p>}
              {popupInfo.price && <p><strong>Price:</strong> ₱{parseInt(popupInfo.price).toLocaleString()}</p>}
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Map controls */}
      <div className="map-controls">
        {/* FREE FEATURE: Map Style Switcher */}
        <div className="style-switcher">
          <h4>Map Style</h4>
          <select 
            value={currentMapStyle} 
            onChange={(e) => setCurrentMapStyle(e.target.value)}
            className="style-select"
          >
            {mapStyleOptions.map(option => (
              <option key={option.key} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="map-legend">
          <h4>Legend</h4>
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color reserved"></div>
            <span>Reserved</span>
          </div>
          <div className="legend-item">
            <div className="legend-color occupied"></div>
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-color landmark"></div>
            <span>Landmark</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;
