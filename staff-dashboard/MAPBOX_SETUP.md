# Mapbox Integration Setup

## Overview
This project now includes Mapbox integration for interactive cemetery mapping. The implementation provides:

- **Interactive Maps**: High-performance, customizable maps
- **Lot Markers**: Visual indicators for available, reserved, and occupied lots
- **Mobile Responsive**: Optimized for all device sizes
- **Filtering**: Search and filter lots by status
- **Real-time Updates**: Live updates when lot status changes

## Setup Instructions

### 1. Get Mapbox Access Token

1. Go to [mapbox.com](https://mapbox.com) and create a free account
2. Navigate to your account dashboard
3. Go to "Access tokens" section
4. Copy your default public token or create a new one

### 2. Configure Environment Variables

Create a `.env` file in the `staff-dashboard` directory with:

```env
# Mapbox Configuration
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# API Configuration (if different from default)
REACT_APP_API_URL=https://api.grave-path.com
```

### 3. Install Dependencies

The required dependencies are already installed:
- `mapbox-gl`: Core Mapbox GL JS library
- `react-map-gl`: React wrapper for Mapbox GL JS

### 4. Usage

The new Mapbox components are available:

- **Staff/Admin**: `MapboxMapView` - Full editing capabilities
- **Client**: `MapboxClientMapView` - View and filter lots
- **Guest**: `MapboxGuestMapView` - Public access with contact options

## Features

### Interactive Map
- Satellite imagery with street overlay
- Smooth zoom and pan
- Touch-friendly mobile interactions
- Custom cemetery styling

### Lot Management
- Color-coded markers by status:
  - 🟢 Green: Available lots
  - 🟡 Yellow: Reserved lots
  - 🔴 Red: Occupied lots
  - ⚫ Gray: Landmarks
- Click markers for detailed information
- Real-time status updates

### Filtering & Search
- Filter by lot status (All, Available, Reserved, Occupied)
- Live statistics display
- Responsive filter controls

### Mobile Optimization
- Touch-optimized interactions
- Responsive design for all screen sizes
- Swipe gestures for navigation
- Optimized popup sizing

## File Structure

```
src/
├── config/
│   └── mapbox.js              # Mapbox configuration
├── components/
│   ├── MapboxMap.jsx          # Core map component
│   └── MapboxMap.css          # Map styling
└── pages/
    ├── MapboxMapView.jsx      # Staff/Admin map view
    ├── MapboxMapView.css      # Staff styling
    ├── MapboxClientMapView.jsx # Client map view
    ├── MapboxClientMapView.css # Client styling
    ├── MapboxGuestMapView.jsx  # Guest map view
    └── MapboxGuestMapView.css  # Guest styling
```

## Customization

### Map Style
Edit `src/config/mapbox.js` to change:
- Map style (satellite, street, etc.)
- Default viewport
- Cemetery bounds
- Marker colors and sizes

### Marker Colors
```javascript
lotMarkers: {
  available: { color: '#28a745', size: 12 },
  reserved: { color: '#ffc107', size: 12 },
  occupied: { color: '#dc3545', size: 12 },
  landmark: { color: '#6c757d', size: 16 }
}
```

## Performance

- **Optimized Rendering**: Only visible markers are rendered
- **Efficient Updates**: Minimal re-renders on data changes
- **Mobile Performance**: Touch-optimized for smooth interactions
- **Caching**: Map tiles cached for faster loading

## Troubleshooting

### Map Not Loading
1. Check your Mapbox access token
2. Verify internet connection
3. Check browser console for errors

### Markers Not Showing
1. Verify lot data has proper `bounds` coordinates
2. Check API endpoint responses
3. Ensure lots have valid status values

### Mobile Issues
1. Test on actual devices, not just browser dev tools
2. Check touch event handling
3. Verify responsive breakpoints

## Migration from Leaflet

The original Leaflet implementation is still available. To switch to Mapbox:

1. Update route imports in `App.js`
2. Replace `MapView` with `MapboxMapView`
3. Replace `ClientMapView` with `MapboxClientMapView`
4. Replace `GuestMapView` with `MapboxGuestMapView`

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Mapbox token permissions
3. Test with different map styles
4. Check network requests in dev tools

