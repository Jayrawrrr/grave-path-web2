import React, { useState } from 'react';
import MapboxMap from './MapboxMap';
import MapboxFreeFeatures from './MapboxFreeFeatures';
import MapboxAdvancedFeatures from './MapboxAdvancedFeatures';
import { MAPBOX_CONFIG } from '../config/mapbox';
import './MapboxDemo.css';

// Sample lot data for demonstration
const sampleLots = [
  {
    _id: 'demo-lot-1',
    id: 'demo-lot-1',
    block: 'A',
    lotNumber: '001',
    status: 'available',
    type: 'lot',
    sqm: '12.5',
    price: '50000',
    bounds: [[0.5, 0.4], [0.51, 0.41]]
  },
  {
    _id: 'demo-lot-2',
    id: 'demo-lot-2',
    block: 'A',
    lotNumber: '002',
    status: 'reserved',
    type: 'lot',
    sqm: '12.5',
    price: '50000',
    bounds: [[0.52, 0.42], [0.53, 0.43]]
  },
  {
    _id: 'demo-lot-3',
    id: 'demo-lot-3',
    block: 'B',
    lotNumber: '001',
    status: 'occupied',
    type: 'lot',
    name: 'John Doe',
    sqm: '12.5',
    price: '50000',
    bounds: [[0.48, 0.38], [0.49, 0.39]]
  },
  {
    _id: 'demo-landmark-1',
    id: 'demo-landmark-1',
    block: 'Main',
    lotNumber: 'Chapel',
    status: 'landmark',
    type: 'landmark',
    name: 'Chapel',
    bounds: [[0.45, 0.35], [0.47, 0.37]]
  }
];

export default function MapboxDemo() {
  const [selectedLot, setSelectedLot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFreeFeatures, setShowFreeFeatures] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  const handleLotClick = (lot) => {
    setSelectedLot(lot);
    console.log('Lot clicked:', lot);
  };

  const handleMapClick = (position) => {
    console.log('Map clicked at:', position);
  };

  const handleLotCreate = (lotData) => {
    console.log('Creating lot:', lotData);
  };

  return (
    <div className="mapbox-demo">
      <div className="demo-header">
        <h2>Mapbox Integration Demo</h2>
        <p>This is a demonstration of the Mapbox integration for the cemetery management system.</p>
        
        <div className="demo-controls">
          <div className="demo-buttons">
            <button
              className={`demo-btn ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </button>
            
            <button
              className={`demo-btn ${showFreeFeatures ? 'active' : ''}`}
              onClick={() => setShowFreeFeatures(!showFreeFeatures)}
            >
              {showFreeFeatures ? 'Hide Free Features' : 'Show Free Features'}
            </button>
            
            <button
              className={`demo-btn ${showAdvancedFeatures ? 'active' : ''}`}
              onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
            >
              {showAdvancedFeatures ? 'Hide Advanced Features' : 'Show Advanced Features'}
            </button>
          </div>
          
          <div className="demo-info">
            <p><strong>Features:</strong></p>
            <ul>
              <li>🟢 Green markers: Available lots</li>
              <li>🟡 Yellow markers: Reserved lots</li>
              <li>🔴 Red markers: Occupied lots</li>
              <li>⚫ Gray markers: Landmarks</li>
              <li>🎨 5 Free map styles</li>
              <li>📍 Geocoding (100k free/month)</li>
              <li>🗺️ Directions (100k free/month)</li>
              <li>🚀 Route Optimization (100k free/month)</li>
              <li>📊 Matrix API (100k free/month)</li>
              <li>⏱️ Isochrone API (100k free/month)</li>
              <li>🖼️ Static Images (50k free/month)</li>
              <li>🗺️ Map Matching (100k free/month)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="demo-map-container">
        <MapboxMap
          lots={sampleLots}
          selectedLot={selectedLot}
          onLotClick={handleLotClick}
          onMapClick={handleMapClick}
          onLotCreate={handleLotCreate}
          isEditing={isEditing}
          showRoads={true}
          showColumbarium={true}
        />
      </div>

      {selectedLot && (
        <div className="demo-selection">
          <h3>Selected Lot: {selectedLot.block} {selectedLot.lotNumber}</h3>
          <p><strong>Status:</strong> {selectedLot.status}</p>
          <p><strong>Type:</strong> {selectedLot.type}</p>
          {selectedLot.name && <p><strong>Name:</strong> {selectedLot.name}</p>}
          {selectedLot.sqm && <p><strong>Size:</strong> {selectedLot.sqm} sqm</p>}
          {selectedLot.price && <p><strong>Price:</strong> ₱{parseInt(selectedLot.price).toLocaleString()}</p>}
        </div>
      )}

      {/* Free Features Demo */}
      {showFreeFeatures && (
        <div className="free-features-section">
          <MapboxFreeFeatures accessToken={MAPBOX_CONFIG.accessToken} />
        </div>
      )}

      {/* Advanced Features Demo */}
      {showAdvancedFeatures && (
        <div className="advanced-features-section">
          <MapboxAdvancedFeatures accessToken={MAPBOX_CONFIG.accessToken} />
        </div>
      )}

      <div className="demo-instructions">
        <h3>Setup Instructions:</h3>
        <ol>
          <li>Get a Mapbox access token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer">mapbox.com</a></li>
          <li>Create a <code>.env</code> file in the staff-dashboard directory</li>
          <li>Add: <code>REACT_APP_MAPBOX_ACCESS_TOKEN=your_token_here</code></li>
          <li>Restart the development server</li>
        </ol>
        
        <div className="free-tier-info">
          <h4>Complete Free Tier Includes:</h4>
          <ul>
            <li>50,000 map loads per month</li>
            <li>100,000 geocoding requests per month</li>
            <li>100,000 directions requests per month</li>
            <li>100,000 route optimization requests per month</li>
            <li>100,000 matrix API elements per month</li>
            <li>100,000 isochrone requests per month</li>
            <li>50,000 static images per month</li>
            <li>100,000 map matching requests per month</li>
            <li>200,000 tile requests per month</li>
            <li>50 GB tileset hosting per month</li>
            <li>5 free map styles</li>
            <li>All map controls and interactions</li>
            <li>Custom markers and styling</li>
            <li>Navigation SDK (25,000 MAU)</li>
            <li>Search Box API (100,000 requests)</li>
            <li>Address Autofill (100,000 requests)</li>
          </ul>
        </div>
        
        <p><strong>Note:</strong> Without a valid Mapbox token, the map will not load properly.</p>
      </div>
    </div>
  );
}
