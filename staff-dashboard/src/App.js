// staff-dashboard/src/App.js
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
import Users           from './pages/Users';

// Public-access components
import VisitorInfo      from './components/VisitorInfo';
import AnnouncementForm from './components/AnnouncementForm';
import GraveLocator     from './components/GraveLocator';

// Staff Reservations
import PlotAvailability  from './components/PlotAvailability';
import BookingForm       from './components/BookingForm';
import ReservationList   from './components/ReservationList';

// Admin Record-Management
import BurialRecords      from './pages/BurialRecords';
import IntermentRecords   from './pages/IntermentRecords';

// Admin Reporting
import ActivityLogs             from './pages/ActivityLogs';
import BurialRecordsReport      from './pages/BurialRecordsReport';
import IntermentRecordsReport   from './pages/IntermentRecordsReport';
import FinancialReport          from './pages/FinancialReport';
import StatisticsReport         from './pages/StatisticsReport';
import ReservationReport        from './pages/ReservationReport';

import PrivateRoute    from './components/PrivateRoute';
import Sidebar         from './components/Sidebar';
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

          {/* Client */}
          <Route path="/client/*" element={
            <PrivateRoute roles={['client']}>
              <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flex: 1, marginLeft: 330, padding: '1rem' }}>
                  <Outlet />
                </main>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<MapView />} />
            <Route path="public-access">
              <Route path="visitor-info" element={<VisitorInfo />} />
              <Route path="grave-locator" element={<GraveLocator />} />
              <Route index element={<Navigate to="visitor-info" replace />} />
            </Route>
            <Route path="reservations">
              <Route path="availability" element={<PlotAvailability />} />
              <Route path="booking"      element={<BookingForm />} />
              <Route path="management"   element={<ReservationList />} />
              <Route index element={<Navigate to="availability" replace />} />
            </Route>
          </Route>

          {/* Staff */}
          <Route path="/staff/*" element={
            <PrivateRoute roles={['staff']}>
              <div style={{ display: 'flex' }}>
                <Sidebar />
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
              <Route index element={<Navigate to="info" replace />} />
            </Route>
            <Route path="reservations">
              <Route path="availability" element={<PlotAvailability />} />
              <Route path="booking"      element={<BookingForm />} />
              <Route path="management"   element={<ReservationList />} />
              <Route index element={<Navigate to="availability" replace />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route path="/admin/*" element={
            <PrivateRoute roles={['admin']}>
              <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flex: 1, marginLeft: 330, padding: '1rem' }}>
                  <Outlet />
                </main>
              </div>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map"   element={<MapView />} />
            <Route path="users" element={<Users />} />

            {/* Admin Public Access */}
            <Route path="public-access">
              <Route path="info"          element={<VisitorInfo />} />
              <Route path="announcements" element={<AnnouncementForm />} />
              <Route path="locator"       element={<GraveLocator />} />
              <Route index element={<Navigate to="info" replace />} />
            </Route>

            {/* Admin Reservations */}
            <Route path="reservations">
              <Route path="availability" element={<PlotAvailability />} />
              <Route path="booking"      element={<BookingForm />} />
              <Route path="management"   element={<ReservationList />} />
              <Route index element={<Navigate to="availability" replace />} />
            </Route>

            {/* Record Management */}
            <Route path="record-management">
              <Route path="burial-records"    element={<BurialRecords />} />
              <Route path="interment-records" element={<IntermentRecords />} />
              <Route index element={<Navigate to="burial-records" replace />} />
            </Route>

            {/* Reporting */}
            <Route path="reports">
              <Route path="activity-logs"       element={<ActivityLogs />} />
              <Route path="burial-records"      element={<BurialRecordsReport />} />
              <Route path="interment-records"   element={<IntermentRecordsReport />} />
              <Route path="financial"           element={<FinancialReport />} />
              <Route path="statistics"          element={<StatisticsReport />} />
              <Route path="reservations"        element={<ReservationReport />} />
              <Route index element={<Navigate to="activity-logs" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}