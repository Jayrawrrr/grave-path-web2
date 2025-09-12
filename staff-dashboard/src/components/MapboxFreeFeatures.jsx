import React, { useState } from 'react';
import { MAPBOX_CONFIG, geocodeAddress, reverseGeocode, getDirections, calculateDistance } from '../config/mapbox';
import './MapboxFreeFeatures.css';

const MapboxFreeFeatures = ({ accessToken }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FREE FEATURE: Geocoding (50,000 free requests/month)
  const handleGeocodeSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await geocodeAddress(searchQuery, accessToken);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search location');
    } finally {
      setLoading(false);
    }
  };

  // FREE FEATURE: Reverse Geocoding
  const handleReverseGeocode = async (lng, lat) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reverseGeocode(lng, lat, accessToken);
      if (result) {
        setSelectedLocation(result);
      }
    } catch (err) {
      setError('Failed to get location details');
    } finally {
      setLoading(false);
    }
  };

  // FREE FEATURE: Directions (25,000 free requests/month)
  const handleGetDirections = async (from, to) => {
    setLoading(true);
    setError(null);
    
    try {
      const route = await getDirections(from, to, accessToken, 'walking');
      setDirections(route);
    } catch (err) {
      setError('Failed to get directions');
    } finally {
      setLoading(false);
    }
  };

  // FREE FEATURE: Distance Calculation
  const handleCalculateDistance = (coord1, coord2) => {
    const distance = calculateDistance(coord1, coord2);
    return distance.toFixed(2);
  };

  return (
    <div className="mapbox-free-features">
      <div className="features-header">
        <h2>Mapbox Free Features Demo</h2>
        <p>Demonstrating the free features included in your Mapbox integration</p>
      </div>

      <div className="features-grid">
        {/* Geocoding Feature */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>📍 Geocoding</h3>
            <span className="feature-badge">50,000 free/month</span>
          </div>
          <p>Search for addresses and get coordinates</p>
          
          <div className="feature-input">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter an address..."
              onKeyPress={(e) => e.key === 'Enter' && handleGeocodeSearch()}
            />
            <button onClick={handleGeocodeSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Results:</h4>
              {searchResults.map((result, index) => (
                <div key={index} className="search-result">
                  <div className="result-info">
                    <strong>{result.place_name}</strong>
                    <p>Coordinates: {result.center[1].toFixed(6)}, {result.center[0].toFixed(6)}</p>
                  </div>
                  <div className="result-actions">
                    <button onClick={() => handleReverseGeocode(result.center[0], result.center[1])}>
                      Get Details
                    </button>
                    <button onClick={() => {
                      const cemeteryCoords = [0.45, 0.5]; // Cemetery center
                      handleGetDirections(cemeteryCoords, result.center);
                    }}>
                      Get Directions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reverse Geocoding Feature */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🔄 Reverse Geocoding</h3>
            <span className="feature-badge">Included</span>
          </div>
          <p>Get address from coordinates</p>
          
          {selectedLocation && (
            <div className="location-details">
              <h4>Location Details:</h4>
              <p><strong>Address:</strong> {selectedLocation.place_name}</p>
              <p><strong>Type:</strong> {selectedLocation.place_type?.join(', ')}</p>
              <p><strong>Relevance:</strong> {selectedLocation.relevance}</p>
            </div>
          )}
        </div>

        {/* Directions Feature */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🗺️ Directions</h3>
            <span className="feature-badge">25,000 free/month</span>
          </div>
          <p>Get walking directions between points</p>
          
          {directions && (
            <div className="directions-info">
              <h4>Route Information:</h4>
              <p><strong>Distance:</strong> {(directions.distance / 1000).toFixed(2)} km</p>
              <p><strong>Duration:</strong> {Math.round(directions.duration / 60)} minutes</p>
              <p><strong>Profile:</strong> {directions.legs?.[0]?.summary || 'Walking'}</p>
            </div>
          )}
        </div>

        {/* Distance Calculation Feature */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>📏 Distance Calculation</h3>
            <span className="feature-badge">Free</span>
          </div>
          <p>Calculate distances between coordinates</p>
          
          <div className="distance-demo">
            <p><strong>Cemetery Center:</strong> 0.5, 0.45</p>
            <p><strong>Sample Point:</strong> 0.52, 0.48</p>
            <p><strong>Distance:</strong> {handleCalculateDistance([0.45, 0.5], [0.48, 0.52])} km</p>
          </div>
        </div>

        {/* Map Styles Feature */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🎨 Map Styles</h3>
            <span className="feature-badge">5 Free Styles</span>
          </div>
          <p>Multiple free map styles available</p>
          
          <div className="map-styles-list">
            <ul>
              <li>🛰️ Satellite Streets</li>
              <li>🏙️ Streets</li>
              <li>🏔️ Outdoors</li>
              <li>☀️ Light</li>
              <li>🌙 Dark</li>
            </ul>
          </div>
        </div>

        {/* Controls Feature */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🎮 Map Controls</h3>
            <span className="feature-badge">All Free</span>
          </div>
          <p>Built-in map controls and interactions</p>
          
          <div className="controls-list">
            <ul>
              <li>🧭 Navigation (zoom/pan)</li>
              <li>📏 Scale control</li>
              <li>🔍 Fullscreen toggle</li>
              <li>📍 User location</li>
              <li>ℹ️ Attribution</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="usage-info">
        <h3>Free Tier Usage</h3>
        <div className="usage-stats">
          <div className="usage-item">
            <span className="usage-number">50,000</span>
            <span className="usage-label">Map Loads/Month</span>
          </div>
          <div className="usage-item">
            <span className="usage-number">100,000</span>
            <span className="usage-label">Geocoding Requests/Month</span>
          </div>
          <div className="usage-item">
            <span className="usage-number">25,000</span>
            <span className="usage-label">Directions Requests/Month</span>
          </div>
        </div>
        <p className="usage-note">
          These limits are generous and should be more than sufficient for most cemetery management applications.
        </p>
      </div>
    </div>
  );
};

export default MapboxFreeFeatures;

