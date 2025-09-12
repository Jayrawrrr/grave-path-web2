import React, { useState, useRef, useEffect } from 'react';
import { 
  MAPBOX_CONFIG, 
  optimizeRoute, 
  getMatrix, 
  getIsochrone, 
  generateStaticMap,
  tilequery,
  mapMatch,
  calculateDistance
} from '../config/mapbox';
import './MapboxAdvancedFeatures.css';

const MapboxAdvancedFeatures = ({ accessToken }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});
  
  // Sample cemetery coordinates
  const cemeteryEntrance = [0.45, 0.5];
  const chapel = [0.47, 0.52];
  const columbarium = [0.43, 0.48];
  const maintenanceBuilding = [0.46, 0.49];
  const sampleLots = [
    [0.48, 0.51],
    [0.49, 0.52],
    [0.50, 0.53],
    [0.51, 0.54]
  ];

  // FREE FEATURE: Optimization API Demo
  const handleOptimizeRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const waypoints = [maintenanceBuilding, ...sampleLots, maintenanceBuilding];
      const optimizedRoute = await optimizeRoute(waypoints, accessToken, 'walking');
      
      setResults(prev => ({
        ...prev,
        optimization: {
          waypoints: waypoints.length,
          distance: optimizedRoute?.distance ? (optimizedRoute.distance / 1000).toFixed(2) + ' km' : 'N/A',
          duration: optimizedRoute?.duration ? Math.round(optimizedRoute.duration / 60) + ' minutes' : 'N/A',
          route: optimizedRoute
        }
      }));
    } catch (err) {
      setError('Failed to optimize route');
    } finally {
      setLoading(false);
    }
  };

  // FREE FEATURE: Matrix API Demo
  const handleMatrixCalculation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const matrix = await getMatrix([cemeteryEntrance], sampleLots, accessToken, 'walking');
      
      if (matrix?.durations) {
        const distances = matrix.durations[0].map((duration, index) => ({
          lot: `Lot ${index + 1}`,
          duration: Math.round(duration / 60) + ' minutes',
          coordinates: sampleLots[index]
        }));
        
        setResults(prev => ({
          ...prev,
          matrix: distances
        }));
      }
    } catch (err) {
      setError('Failed to calculate matrix');
    } finally {
      setLoading(false);
    }
  };

  // FREE FEATURE: Isochrone API Demo
  const handleIsochroneCalculation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const isochrone = await getIsochrone(cemeteryEntrance, 5, 'walking', accessToken);
      
      setResults(prev => ({
        ...prev,
        isochrone: {
          center: cemeteryEntrance,
          minutes: 5,
          features: isochrone.length,
          area: isochrone[0]?.properties?.area ? 
            (isochrone[0].properties.area / 1000000).toFixed(2) + ' km²' : 'N/A'
        }
      }));
    } catch (err) {
      setError('Failed to calculate isochrone');
    } finally {
      setLoading(false);
    }
  };

  // FREE FEATURE: Static Images API Demo
  const handleGenerateStaticMap = () => {
    const staticMapUrl = generateStaticMap(
      chapel, 
      16, 
      800, 
      600, 
      accessToken
    );
    
    setResults(prev => ({
      ...prev,
      staticMap: {
        url: staticMapUrl,
        location: 'Chapel',
        coordinates: chapel,
        size: '800x600'
      }
    }));
  };

  // FREE FEATURE: Distance Calculation Demo
  const handleDistanceCalculation = () => {
    const distances = [];
    
    // Calculate distances between all major points
    const points = [
      { name: 'Entrance', coords: cemeteryEntrance },
      { name: 'Chapel', coords: chapel },
      { name: 'Columbarium', coords: columbarium },
      { name: 'Maintenance', coords: maintenanceBuilding }
    ];
    
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = calculateDistance(points[i].coords, points[j].coords);
        distances.push({
          from: points[i].name,
          to: points[j].name,
          distance: distance.toFixed(2) + ' km'
        });
      }
    }
    
    setResults(prev => ({
      ...prev,
      distances
    }));
  };

  // FREE FEATURE: Map Matching Demo (simulated GPS trace)
  const handleMapMatching = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate a GPS trace from entrance to chapel
      const gpsTrace = [
        cemeteryEntrance,
        [0.455, 0.505],
        [0.46, 0.51],
        [0.465, 0.515],
        chapel
      ];
      
      const matchedRoute = await mapMatch(gpsTrace, accessToken, 'walking');
      
      setResults(prev => ({
        ...prev,
        mapMatching: {
          originalPoints: gpsTrace.length,
          matchedRoute: matchedRoute ? 'Successfully matched to road network' : 'No match found',
          confidence: matchedRoute?.confidence || 'N/A'
        }
      }));
    } catch (err) {
      setError('Failed to perform map matching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mapbox-advanced-features">
      <div className="features-header">
        <h2>Advanced Mapbox Free Features</h2>
        <p>Demonstrating advanced APIs available in the free tier</p>
      </div>

      <div className="features-grid">
        {/* Optimization API */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🚀 Route Optimization</h3>
            <span className="feature-badge">100k free/month</span>
          </div>
          <p>Optimize maintenance routes for multiple stops</p>
          
          <button 
            onClick={handleOptimizeRoute} 
            disabled={loading}
            className="feature-btn"
          >
            {loading ? 'Optimizing...' : 'Optimize Maintenance Route'}
          </button>

          {results.optimization && (
            <div className="result-display">
              <h4>Optimized Route:</h4>
              <p><strong>Stops:</strong> {results.optimization.waypoints}</p>
              <p><strong>Distance:</strong> {results.optimization.distance}</p>
              <p><strong>Duration:</strong> {results.optimization.duration}</p>
            </div>
          )}
        </div>

        {/* Matrix API */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>📊 Distance Matrix</h3>
            <span className="feature-badge">100k elements/month</span>
          </div>
          <p>Calculate distances from entrance to all lots</p>
          
          <button 
            onClick={handleMatrixCalculation} 
            disabled={loading}
            className="feature-btn"
          >
            {loading ? 'Calculating...' : 'Calculate Distance Matrix'}
          </button>

          {results.matrix && (
            <div className="result-display">
              <h4>Distance Matrix:</h4>
              {results.matrix.map((item, index) => (
                <div key={index} className="matrix-item">
                  <span className="lot-name">{item.lot}</span>
                  <span className="duration">{item.duration}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Isochrone API */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>⏱️ Isochrone Analysis</h3>
            <span className="feature-badge">100k free/month</span>
          </div>
          <p>Show areas reachable within 5 minutes from entrance</p>
          
          <button 
            onClick={handleIsochroneCalculation} 
            disabled={loading}
            className="feature-btn"
          >
            {loading ? 'Calculating...' : 'Calculate 5-Minute Area'}
          </button>

          {results.isochrone && (
            <div className="result-display">
              <h4>Isochrone Results:</h4>
              <p><strong>Center:</strong> Entrance</p>
              <p><strong>Time:</strong> {results.isochrone.minutes} minutes</p>
              <p><strong>Area:</strong> {results.isochrone.area}</p>
              <p><strong>Features:</strong> {results.isochrone.features}</p>
            </div>
          )}
        </div>

        {/* Static Images API */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🖼️ Static Map Images</h3>
            <span className="feature-badge">50k free/month</span>
          </div>
          <p>Generate static map images for reports</p>
          
          <button 
            onClick={handleGenerateStaticMap} 
            className="feature-btn"
          >
            Generate Chapel Map
          </button>

          {results.staticMap && (
            <div className="result-display">
              <h4>Static Map Generated:</h4>
              <p><strong>Location:</strong> {results.staticMap.location}</p>
              <p><strong>Size:</strong> {results.staticMap.size}</p>
              <div className="static-map-preview">
                <img 
                  src={results.staticMap.url} 
                  alt="Static map of chapel"
                  className="static-map-image"
                />
              </div>
            </div>
          )}
        </div>

        {/* Distance Calculation */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>📏 Distance Calculator</h3>
            <span className="feature-badge">Free</span>
          </div>
          <p>Calculate distances between cemetery landmarks</p>
          
          <button 
            onClick={handleDistanceCalculation} 
            className="feature-btn"
          >
            Calculate All Distances
          </button>

          {results.distances && (
            <div className="result-display">
              <h4>Distance Matrix:</h4>
              {results.distances.map((item, index) => (
                <div key={index} className="distance-item">
                  <span className="route">{item.from} → {item.to}</span>
                  <span className="distance">{item.distance}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Matching */}
        <div className="feature-card">
          <div className="feature-header">
            <h3>🗺️ Map Matching</h3>
            <span className="feature-badge">100k free/month</span>
          </div>
          <p>Snap GPS traces to road network</p>
          
          <button 
            onClick={handleMapMatching} 
            disabled={loading}
            className="feature-btn"
          >
            {loading ? 'Matching...' : 'Match GPS Trace'}
          </button>

          {results.mapMatching && (
            <div className="result-display">
              <h4>Map Matching Results:</h4>
              <p><strong>GPS Points:</strong> {results.mapMatching.originalPoints}</p>
              <p><strong>Result:</strong> {results.mapMatching.matchedRoute}</p>
              <p><strong>Confidence:</strong> {results.mapMatching.confidence}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="usage-summary">
        <h3>Free Tier Usage Summary</h3>
        <div className="usage-grid">
          <div className="usage-item">
            <span className="api-name">Optimization API</span>
            <span className="limit">100,000 requests/month</span>
            <span className="usage">~100/month</span>
          </div>
          <div className="usage-item">
            <span className="api-name">Matrix API</span>
            <span className="limit">100,000 elements/month</span>
            <span className="usage">~1,000/month</span>
          </div>
          <div className="usage-item">
            <span className="api-name">Isochrone API</span>
            <span className="limit">100,000 requests/month</span>
            <span className="usage">~50/month</span>
          </div>
          <div className="usage-item">
            <span className="api-name">Static Images</span>
            <span className="limit">50,000 requests/month</span>
            <span className="usage">~100/month</span>
          </div>
          <div className="usage-item">
            <span className="api-name">Map Matching</span>
            <span className="limit">100,000 requests/month</span>
            <span className="usage">~200/month</span>
          </div>
        </div>
        <p className="cost-note">
          <strong>Total Cost: $0</strong> - All usage well within free tier limits!
        </p>
      </div>
    </div>
  );
};

export default MapboxAdvancedFeatures;

