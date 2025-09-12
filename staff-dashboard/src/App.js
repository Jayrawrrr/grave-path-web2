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
import Terms           from './pages/Terms';
import MapView         from './pages/MapView';
import ClientMapView   from './pages/ClientMapView';
// Mapbox implementations
import MapboxMapView         from './pages/MapboxMapView';
import MapboxClientMapView   from './pages/MapboxClientMapView';
import MapboxGuestMapView    from './pages/MapboxGuestMapView';
import Users           from './pages/Users';
import HomePage        from './pages/HomePage';
import Profile         from './pages/Profile';

// Public-access components
import VisitorInfo      from './components/VisitorInfo';
import AnnouncementForm from './components/AnnouncementForm';
import GraveLocator     from './components/GraveLocator';

// Client-specific components
import BookmarkManager  from './components/BookmarkManager';

// Staff Reservations
import PlotAvailability from './components/PlotAvailability';
import AdminPlotAvailability from './components/AdminPlotAvailability';
import BookingForm      from './components/BookingForm';
import ReservationList  from './components/ReservationList';

// Admin Components
import AdminDashboard from './components/AdminDashboard';

// Admin Record-Management
import BurialRecords      from './pages/BurialRecords';
import IntermentRecords   from './pages/IntermentRecords';

// Admin Reporting
import ActivityLogs            from './pages/ActivityLogs';
import BurialRecordsReport     from './pages/BurialRecordsReport';
import IntermentRecordsReport  from './pages/IntermentRecordsReport';
import FinancialReport         from './pages/FinancialReport';
import ColumbariumManagement   from './pages/ColumbariumManagement';
import ColumbariumClient       from './pages/ColumbariumClient';
import ChatbotManagement       from './pages/ChatbotManagement';
import VisitorInfoManagement   from './pages/VisitorInfoManagement';

import ReservationReport       from './pages/ReservationReport';

import PrivateRoute  from './components/PrivateRoute';
import SidebarStaff  from './components/Sidebar';         // staff & admin
import ClientDashboardLayout from './components/ClientDashboardLayout'; // NEW
import GuestDashboardLayout from './components/GuestDashboardLayout'; // Guest layout
import AdminBookingForm from './components/AdminBookingForm';

// Guest components
import GuestHomePage from './pages/GuestHomePage';
import GuestMapView from './pages/GuestMapView';
import GuestPlotAvailability from './components/GuestPlotAvailability';
import GuestVisitorInfo from './pages/GuestVisitorInfo';

// Mapbox Demo
import MapboxDemo from './components/MapboxDemo';

// import './App.css'; // File doesn't exist

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<ClientRegister />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/mapbox-demo" element={<MapboxDemo />} />

          {/* Guest Access (uses GuestDashboardLayout) */}
          <Route path="/guest/*" element={<GuestDashboardLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<GuestHomePage />} />
            <Route path="map" element={<GuestMapView />} />
            <Route path="mapbox-map" element={<MapboxGuestMapView />} />
            <Route path="plot-availability" element={<GuestPlotAvailability />} />
            <Route path="public-access">
              <Route path="visitor-info" element={<GuestVisitorInfo />} />
            </Route>
          </Route>

          {/* Client (uses ClientDashboardLayout) */}
          <Route path="/client/*" element={
            <PrivateRoute roles={['client']}>
              <ClientDashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="map" element={<ClientMapView />} />
            <Route path="mapbox-map" element={<MapboxClientMapView />} />
            <Route path="profile" element={<Profile />} />
            <Route path="bookmarks" element={<BookmarkManager />} />
            <Route path="public-access">
              <Route path="visitor-info" element={<VisitorInfo />} />
              <Route path="grave-locator" element={<GraveLocator />} />
            </Route>
            <Route path="reservations">
              <Route path="availability" element={<PlotAvailability />} />
              <Route path="booking"      element={<BookingForm />} />
              <Route path="management"   element={<ReservationList />} />
            </Route>
            <Route path="columbarium" element={<ColumbariumClient />} />
          </Route>

          {/* Staff (uses SidebarStaff) */}
          <Route path="/staff/*" element={
            <PrivateRoute roles={['staff']}>
              <div style={{ display: 'flex' }}>
                <SidebarStaff />
                <main style={{ flex: 1, marginLeft: 280, padding: '1rem' }}>
                  <Outlet />
                </main>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<MapView />} />
            <Route path="mapbox-map" element={<MapboxMapView />} />
            <Route path="profile" element={<Profile />} />
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
            <Route path="columbarium">
              <Route path="management" element={<ColumbariumManagement />} />
            </Route>
          </Route>

          {/* Admin (uses SidebarStaff) */}
          <Route path="/admin/*" element={
            <PrivateRoute roles={['admin']}>
              <div style={{ display: 'flex' }}>
                <SidebarStaff />
                <main style={{ flex: 1, marginLeft: 280, padding: '1rem' }}>
                  <Outlet />
                </main>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="map"   element={<MapView />} />
            <Route path="mapbox-map" element={<MapboxMapView />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />

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

            <Route path="columbarium">
              <Route path="management" element={<ColumbariumManagement />} />
            </Route>

            <Route path="chatbot">
              <Route path="management" element={<ChatbotManagement />} />
            </Route>

            <Route path="visitor-info">
              <Route path="management" element={<VisitorInfoManagement />} />
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
