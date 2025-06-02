import React from 'react';
import { AuthProvider } from './context/AuthContext';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';

import Landing         from './pages/Landing';
import Login           from './pages/Login';
import ClientRegister  from './pages/ClientRegister';
import MapView         from './pages/MapView';
import ClientMapView   from './pages/ClientMapView';
import Users           from './pages/Users';
import HomePage        from './pages/HomePage';

// Public-access components
import VisitorInfo      from './components/VisitorInfo';
import AnnouncementForm from './components/AnnouncementForm';
import GraveLocator     from './components/GraveLocator';

// Staff Reservations
import PlotAvailability from './components/PlotAvailability';
import BookingForm      from './components/BookingForm';
import ReservationList  from './components/ReservationList';

// Admin Record-Management
import BurialRecords      from './pages/BurialRecords';
import IntermentRecords   from './pages/IntermentRecords';

// Admin Reporting
import ActivityLogs            from './pages/ActivityLogs';
import BurialRecordsReport     from './pages/BurialRecordsReport';
import IntermentRecordsReport  from './pages/IntermentRecordsReport';
import FinancialReport         from './pages/FinancialReport';
import StatisticsReport        from './pages/StatisticsReport';
import ReservationReport       from './pages/ReservationReport';

import PrivateRoute  from './components/PrivateRoute';
import SidebarStaff  from './components/Sidebar';         // staff & admin
import ClientDashboardLayout from './components/ClientDashboardLayout'; // NEW
import AdminBookingForm from './components/AdminBookingForm';
import AdminPlotAvailability from './components/AdminPlotAvailability';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<ClientRegister />} />

          {/* Client (uses ClientDashboardLayout) */}
          <Route path="/client/*" element={
            <PrivateRoute roles={['client']}>
              <ClientDashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="map" element={<ClientMapView />} />
            <Route path="public-access">
              <Route path="visitor-info" element={<VisitorInfo />} />
              <Route path="grave-locator" element={<GraveLocator />} />
            </Route>
            <Route path="reservations">
              <Route path="availability" element={<PlotAvailability />} />
              <Route path="booking"      element={<BookingForm />} />
              <Route path="management"   element={<ReservationList />} />
            </Route>
          </Route>

          {/* Staff (uses SidebarStaff) */}
          <Route path="/staff/*" element={
            <PrivateRoute roles={['staff']}>
              <div style={{ display: 'flex' }}>
                <SidebarStaff />
                <main style={{ flex: 1, marginLeft: 330, padding: '1rem' }}>
                  <Outlet />
                </main>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<MapView />} />
            <Route path="public-access">
              <Route path="info"           element={<VisitorInfo />} />
              <Route path="announcements"  element={<AnnouncementForm />} />
              <Route path="locator"        element={<GraveLocator />} />
            </Route>
            <Route path="reservations">
              <Route path="availability" element={<PlotAvailability />} />
              <Route path="booking"      element={<BookingForm />} />
              <Route path="management"   element={<ReservationList />} />
            </Route>
          </Route>

          {/* Admin (uses SidebarStaff) */}
          <Route path="/admin/*" element={
            <PrivateRoute roles={['admin']}>
              <div style={{ display: 'flex' }}>
                <SidebarStaff />
                <main style={{ flex: 1, marginLeft: 330, padding: '1rem' }}>
                  <Outlet />
                </main>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map"   element={<MapView />} />
            <Route path="users" element={<Users />} />

            <Route path="public-access">
              <Route path="info"          element={<VisitorInfo />} />
              <Route path="announcements" element={<AnnouncementForm />} />
              <Route path="locator"       element={<GraveLocator />} />
            </Route>

            <Route path="reservations">
              <Route path="availability" element={<AdminPlotAvailability />} />
              <Route path="booking"      element={<AdminBookingForm />} />
              <Route path="management"   element={<ReservationList />} />
            </Route>

            <Route path="record-management">
              <Route path="burial-records"    element={<BurialRecords />} />
              <Route path="interment-records" element={<IntermentRecords />} />
            </Route>

            <Route path="reports">
              <Route path="activity-logs"       element={<ActivityLogs />} />
              <Route path="burial-records"      element={<BurialRecordsReport />} />
              <Route path="interment-records"   element={<IntermentRecordsReport />} />
              <Route path="financial"           element={<FinancialReport />} />
              <Route path="statistics"          element={<StatisticsReport />} />
              <Route path="reservations"        element={<ReservationReport />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
