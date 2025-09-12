import React from 'react';
import PlotAvailability from './PlotAvailability';

// Admin uses the same PlotAvailability component as staff
// since they have the same functionality
export default function AdminPlotAvailability() {
  return <PlotAvailability />;
} 