// Mapbox configuration - Optimized for free tier usage
export const MAPBOX_CONFIG = {
  // You'll need to get your own Mapbox access token from https://mapbox.com
  // For now, using a placeholder - replace with your actual token
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example',
  
  // FREE FEATURES OPTIMIZATION:
  // Using free map styles - no custom style costs
  mapStyles: {
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12', // FREE - Satellite with streets
    street: 'mapbox://styles/mapbox/streets-v12', // FREE - Standard street map
    outdoor: 'mapbox://styles/mapbox/outdoors-v12', // FREE - Outdoor/topographic
    light: 'mapbox://styles/mapbox/light-v11', // FREE - Light theme
    dark: 'mapbox://styles/mapbox/dark-v11' // FREE - Dark theme
  },
  
  // Default style (can be changed by user)
  defaultMapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
  
  // Cemetery map bounds (based on your current image dimensions)
  cemeteryBounds: {
    north: 0.8,
    south: 0.2,
    east: 0.8,
    west: 0.1
  },
  
  // Default viewport
  defaultViewport: {
    latitude: 0.5,
    longitude: 0.45,
    zoom: 1.5
  },
  
  // FREE FEATURES: Custom markers using Mapbox GL JS (no additional cost)
  lotMarkers: {
    available: {
      color: '#28a745',
      size: 12,
      symbol: 'circle',
      // Using free Mapbox icons
      icon: 'marker-15'
    },
    reserved: {
      color: '#ffc107',
      size: 12,
      symbol: 'circle',
      icon: 'marker-15'
    },
    occupied: {
      color: '#dc3545',
      size: 12,
      symbol: 'circle',
      icon: 'marker-15'
    },
    landmark: {
      color: '#6c757d',
      size: 16,
      symbol: 'marker',
      icon: 'religious-christian-15' // FREE Mapbox icon
    }
  },
  
  // FREE FEATURES: Geocoding configuration (50,000 free requests/month)
  geocoding: {
    enabled: true,
    // Using free Mapbox Geocoding API
    apiUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    // Cemetery location for context
    proximity: [0.45, 0.5], // lng, lat
    country: 'PH', // Philippines
    types: 'address,poi'
  },
  
  // FREE FEATURES: Directions API (25,000 free requests/month)
  directions: {
    enabled: true,
    // Using free Mapbox Directions API
    apiUrl: 'https://api.mapbox.com/directions/v5/mapbox',
    profile: 'walking', // walking, driving, cycling
    alternatives: false, // Save on API calls
    steps: true,
    geometries: 'geojson'
  },
  
  // FREE FEATURES: Map controls and interactions
  controls: {
    navigation: true, // FREE - zoom/pan controls
    scale: true, // FREE - scale control
    fullscreen: true, // FREE - fullscreen toggle
    geolocate: true, // FREE - user location
    attribution: true // FREE - required attribution
  },
  
  // FREE FEATURES: Clustering for performance (no additional cost)
  clustering: {
    enabled: true,
    radius: 50,
    maxZoom: 14,
    minPoints: 2
  }
};

// Helper function to convert image coordinates to lat/lng
export const imageToLatLng = (imageX, imageY, imageWidth = 2048, imageHeight = 1025) => {
  // Convert image coordinates to normalized coordinates (0-1)
  const normalizedX = imageX / imageWidth;
  const normalizedY = imageY / imageHeight;
  
  // Convert to lat/lng using cemetery bounds
  const lng = MAPBOX_CONFIG.cemeteryBounds.west + 
    (normalizedX * (MAPBOX_CONFIG.cemeteryBounds.east - MAPBOX_CONFIG.cemeteryBounds.west));
  const lat = MAPBOX_CONFIG.cemeteryBounds.north - 
    (normalizedY * (MAPBOX_CONFIG.cemeteryBounds.north - MAPBOX_CONFIG.cemeteryBounds.south));
  
  return [lat, lng];
};

// Helper function to convert lat/lng to image coordinates
export const latLngToImage = (lat, lng, imageWidth = 2048, imageHeight = 1025) => {
  // Convert lat/lng to normalized coordinates
  const normalizedX = (lng - MAPBOX_CONFIG.cemeteryBounds.west) / 
    (MAPBOX_CONFIG.cemeteryBounds.east - MAPBOX_CONFIG.cemeteryBounds.west);
  const normalizedY = (MAPBOX_CONFIG.cemeteryBounds.north - lat) / 
    (MAPBOX_CONFIG.cemeteryBounds.north - MAPBOX_CONFIG.cemeteryBounds.south);
  
  // Convert to image coordinates
  const imageX = normalizedX * imageWidth;
  const imageY = normalizedY * imageHeight;
  
  return [imageX, imageY];
};

// FREE FEATURE: Geocoding utility (50,000 free requests/month)
export const geocodeAddress = async (address, accessToken) => {
  if (!MAPBOX_CONFIG.geocoding.enabled) return null;
  
  try {
    const { apiUrl, proximity, country, types } = MAPBOX_CONFIG.geocoding;
    const url = `${apiUrl}/${encodeURIComponent(address)}.json?` +
      `access_token=${accessToken}&` +
      `proximity=${proximity[0]},${proximity[1]}&` +
      `country=${country}&` +
      `types=${types}&` +
      `limit=5`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features || [];
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

// FREE FEATURE: Reverse geocoding utility
export const reverseGeocode = async (lng, lat, accessToken) => {
  if (!MAPBOX_CONFIG.geocoding.enabled) return null;
  
  try {
    const { apiUrl, country, types } = MAPBOX_CONFIG.geocoding;
    const url = `${apiUrl}/${lng},${lat}.json?` +
      `access_token=${accessToken}&` +
      `country=${country}&` +
      `types=${types}&` +
      `limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features?.[0] || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// FREE FEATURE: Directions utility (25,000 free requests/month)
export const getDirections = async (start, end, accessToken, profile = 'walking') => {
  if (!MAPBOX_CONFIG.directions.enabled) return null;
  
  try {
    const { apiUrl, alternatives, steps, geometries } = MAPBOX_CONFIG.directions;
    const startCoords = `${start[0]},${start[1]}`;
    const endCoords = `${end[0]},${end[1]}`;
    
    const url = `${apiUrl}/${profile}/${startCoords};${endCoords}?` +
      `access_token=${accessToken}&` +
      `alternatives=${alternatives}&` +
      `steps=${steps}&` +
      `geometries=${geometries}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.routes?.[0] || null;
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
};

// FREE FEATURE: Distance calculation utility
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// FREE FEATURE: Map style switcher
export const getMapStyleOptions = () => {
  return Object.entries(MAPBOX_CONFIG.mapStyles).map(([key, value]) => ({
    key,
    value,
    label: key.charAt(0).toUpperCase() + key.slice(1)
  }));
};

// FREE FEATURE: Optimization API (100,000 free requests/month)
export const optimizeRoute = async (waypoints, accessToken, profile = 'walking') => {
  try {
    const coordinates = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';');
    const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/${profile}/${coordinates}?` +
      `access_token=${accessToken}&` +
      `source=first&` +
      `destination=last&` +
      `roundtrip=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.trips?.[0] || null;
  } catch (error) {
    console.error('Route optimization error:', error);
    return null;
  }
};

// FREE FEATURE: Matrix API (100,000 free elements/month)
export const getMatrix = async (sources, destinations, accessToken, profile = 'walking') => {
  try {
    const sourceCoords = sources.map(s => `${s[0]},${s[1]}`).join(';');
    const destCoords = destinations.map(d => `${d[0]},${d[1]}`).join(';');
    
    const url = `https://api.mapbox.com/distance-matrix/v1/mapbox/${profile}/${sourceCoords};${destCoords}?` +
      `access_token=${accessToken}&` +
      `sources=0&` +
      `destinations=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Matrix API error:', error);
    return null;
  }
};

// FREE FEATURE: Isochrone API (100,000 free requests/month)
export const getIsochrone = async (coordinates, minutes, profile = 'walking', accessToken) => {
  try {
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${coordinates[0]},${coordinates[1]}?` +
      `access_token=${accessToken}&` +
      `contours_minutes=${minutes}&` +
      `polygons=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features || [];
  } catch (error) {
    console.error('Isochrone API error:', error);
    return [];
  }
};

// FREE FEATURE: Static Images API (50,000 free requests/month)
export const generateStaticMap = (coordinates, zoom = 15, width = 600, height = 400, accessToken) => {
  const [lng, lat] = coordinates;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `pin-s-lot+ff0000(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}@2x?` +
    `access_token=${accessToken}`;
};

// FREE FEATURE: Tilequery API (100,000 free requests/month)
export const tilequery = async (coordinates, tilesetId, accessToken, radius = 1000) => {
  try {
    const url = `https://api.mapbox.com/v4/${tilesetId}/tilequery/${coordinates[0]},${coordinates[1]}.json?` +
      `access_token=${accessToken}&` +
      `radius=${radius}&` +
      `limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features || [];
  } catch (error) {
    console.error('Tilequery API error:', error);
    return [];
  }
};

// FREE FEATURE: Map Matching API (100,000 free requests/month)
export const mapMatch = async (coordinates, accessToken, profile = 'walking') => {
  try {
    const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
    const url = `https://api.mapbox.com/matching/v5/mapbox/${profile}/${coordString}?` +
      `access_token=${accessToken}&` +
      `geometries=geojson&` +
      `overview=full`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.matchings?.[0] || null;
  } catch (error) {
    console.error('Map matching error:', error);
    return null;
  }
};

// FREE FEATURE: Search Box API utilities
export const createSearchBox = (map, accessToken, options = {}) => {
  // Note: SearchBox and AddressAutofill require mapbox-gl to be imported
  // These are utility functions that should be used where mapbox-gl is available
  const defaultOptions = {
    accessToken,
    map,
    marker: false,
    placeholder: 'Search for lots, landmarks...',
    proximity: [0.45, 0.5], // Cemetery center
    country: 'PH',
    ...options
  };
  
  // Return configuration object instead of instantiated class
  return {
    type: 'SearchBox',
    options: defaultOptions
  };
};

// FREE FEATURE: Address Autofill utilities
export const createAddressAutofill = (accessToken, options = {}) => {
  const defaultOptions = {
    accessToken,
    options: {
      country: 'PH',
      language: 'en',
      ...options
    }
  };
  
  // Return configuration object instead of instantiated class
  return {
    type: 'AddressAutofill',
    options: defaultOptions
  };
};
