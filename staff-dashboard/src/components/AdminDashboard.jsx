import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FaMapMarkerAlt, 
  FaCalendarCheck, 
  FaDollarSign, 
  FaUsers,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaPrint,
  FaTachometerAlt,
  FaUserShield,
  FaBuilding,
  FaChartBar,
  FaClipboardList,
  FaFileAlt,
  FaListAlt
} from 'react-icons/fa';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useReactToPrint } from 'react-to-print';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const monthNames = [
  '',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const printRef = useRef(null);
  const [dashboardData, setDashboardData] = useState({
    totalLots: 0,
    availableLots: 0,
    reservedLots: 0,
    pendingReservations: 0,
    approvedReservations: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentReservations: [],
    recentActivities: []
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Cemetery Analytics Report - Garden of Memories Memorial Park',
    removeAfterPrint: true,
    onAfterPrint: () => console.log('Analytics report printed successfully'),
  });

  useEffect(() => {
    fetchDashboardData();
    fetchStatistics();
  }, [token]);

  const fetchStatistics = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_URL || '/api';
      const cleanURL = baseURL.replace(/\/+$/, '');
      const endpoint = cleanURL.endsWith('/api') ? '/admin/statistics' : '/api/admin/statistics';
      
      const res = await axios.get(
        `${cleanURL}${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(res.data);
    } catch (err) {
      console.error('Statistics fetch error:', err);
      // Don't set error for stats, just log it
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all necessary data in parallel
      const [lotsRes, reservationsRes, activityLogsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/staff/lots`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/reservations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/admin/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })) // Handle if logs endpoint doesn't exist
      ]);

      const lots = lotsRes.data;
      const reservations = reservationsRes.data;
      const activities = activityLogsRes.data;

      // Process lots data
      const totalLots = lots.length;
      const availableLots = lots.filter(lot => lot.status === 'available').length;
      const reservedLots = totalLots - availableLots;

      // Process reservations data
      const pendingReservations = reservations.filter(r => r.status === 'pending').length;
      const approvedReservations = reservations.filter(r => r.status === 'approved').length;

      // Calculate revenue
      const totalRevenue = reservations
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = reservations
        .filter(r => {
          const reservationDate = new Date(r.createdAt);
          return r.status === 'approved' && 
                 reservationDate.getMonth() === currentMonth && 
                 reservationDate.getFullYear() === currentYear;
        })
        .reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);

      // Get recent reservations (last 5)
      const recentReservations = reservations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Get recent activities (last 10)
      const recentActivities = activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      setDashboardData({
        totalLots,
        availableLots,
        reservedLots,
        pendingReservations,
        approvedReservations,
        totalRevenue,
        monthlyRevenue,
        recentReservations,
        recentActivities
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="status-icon approved" />;
      case 'pending': return <FaClock className="status-icon pending" />;
      case 'rejected': return <FaExclamationTriangle className="status-icon rejected" />;
      default: return <FaClock className="status-icon" />;
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  // Prepare chart data
  let months = [];
  let counts = [];
  let intermentCounts = [];
  let totalBurials = 0;
  let totalInterments = 0;
  let totalReservations = 0;
  let completionRate = 0;
  let basicInsights = [];

  if (stats && stats.burialsByMonth) {
    months = stats.burialsByMonth.map(item => `${monthNames[item._id.month]} ${item._id.year}`);
    counts = stats.burialsByMonth.map(item => item.count);
    intermentCounts = stats.intermentsByMonth?.map(item => item.count) || [];
    
    totalBurials = stats.summary?.burials || 0;
    totalInterments = stats.summary?.interments || 0;
    totalReservations = stats.summary?.reservations || 0;
    completionRate = totalBurials > 0 ? ((totalInterments / totalBurials) * 100).toFixed(1) : 0;
    basicInsights = stats.insights || [];
  }

  // Service distribution data for pie chart
  const serviceData = {
    labels: ['Completed', 'In Progress', 'Reserved'],
    datasets: [{
      data: [
        totalInterments,
        totalBurials - totalInterments,
        totalReservations - totalBurials
      ],
      backgroundColor: [
        '#28a745',
        '#ffc107', 
        '#17a2b8'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  return (
    <div className="admin-dashboard">
      {/* Modern Header with Icon */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <div className="admin-icon-wrapper">
            <FaTachometerAlt className="admin-header-icon" />
          </div>
          <div className="admin-header-text">
            <h1 className="admin-page-title">Admin Dashboard</h1>
            <p className="admin-page-subtitle">
              Comprehensive overview of cemetery management system
            </p>
          </div>
        </div>
        <button className="admin-print-button" onClick={handlePrint}>
          <FaPrint /> Generate Report
        </button>
      </div>

      <div ref={printRef}>
        {/* Key Metrics Cards */}
        <div className="dashboard-metrics">
          <div className="metric-card">
            <div className="metric-icon lots">
              <FaBuilding />
            </div>
            <div className="metric-content">
              <h3>Total Lots</h3>
              <p className="metric-value">{dashboardData.totalLots}</p>
              <span className="metric-detail">
                {dashboardData.availableLots} available, {dashboardData.reservedLots} reserved
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon reservations">
              <FaClipboardList />
            </div>
            <div className="metric-content">
              <h3>Reservations</h3>
              <p className="metric-value">{dashboardData.approvedReservations}</p>
              <span className="metric-detail">
                {dashboardData.pendingReservations} pending approval
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon revenue">
              <FaDollarSign />
            </div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p className="metric-value">{formatCurrency(dashboardData.totalRevenue)}</p>
              <span className="metric-detail">
                {formatCurrency(dashboardData.monthlyRevenue)} this month
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon growth">
              <FaChartBar />
            </div>
            <div className="metric-content">
              <h3>Occupancy Rate</h3>
              <p className="metric-value">
                {dashboardData.totalLots > 0 
                  ? Math.round((dashboardData.reservedLots / dashboardData.totalLots) * 100)
                  : 0}%
              </p>
              <span className="metric-detail">
                {dashboardData.reservedLots} of {dashboardData.totalLots} lots
              </span>
            </div>
          </div>
        </div>

        {/* Key Insights Section */}
        {stats && (
          <div className="key-insights-section">
            <div className="insights-header">
              <div className="insights-icon">
                <FaChartBar />
              </div>
              <h2 className="insights-title">Key Insights</h2>
            </div>
            
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-icon trend-down">
                  <FaChartLine />
                </div>
                <div className="insight-content">
                  <span className="insight-text">
                    Monthly {stats.burialsByMonth && stats.burialsByMonth.length > 1 ? 
                      `decrease of ${Math.abs((stats.burialsByMonth[stats.burialsByMonth.length - 1]?.count || 0) - (stats.burialsByMonth[stats.burialsByMonth.length - 2]?.count || 0))} burials from previous month` :
                      'burial data available'
                    }
                  </span>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon success">
                  <FaCheckCircle />
                </div>
                <div className="insight-content">
                  <span className="insight-text">
                    High service completion rate of {completionRate}%
                  </span>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon info">
                  <FaClipboardList />
                </div>
                <div className="insight-content">
                  <span className="insight-text">
                    {totalReservations} reservations in pipeline for future services
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        {stats && (
          <div className="statistics-section">
            <div className="section-header">
              <div className="section-icon">
                <FaChartLine />
              </div>
              <h2 className="section-title">Analytics & Trends</h2>
            </div>
            
            {/* Additional Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card primary">
                <div className="card-header">
                  <span className="card-icon"><FaFileAlt /></span>
                  <span className="card-label">Total Burials</span>
                </div>
                <div className="card-value">{totalBurials.toLocaleString()}</div>
                <div className="card-detail">Lifetime services provided</div>
              </div>

              <div className="summary-card secondary">
                <div className="card-header">
                  <span className="card-icon"><FaBuilding /></span>
                  <span className="card-label">Interments</span>
                </div>
                <div className="card-value">{totalInterments.toLocaleString()}</div>
                <div className="card-detail">{completionRate}% completion rate</div>
              </div>

              <div className="summary-card accent">
                <div className="card-header">
                  <span className="card-icon"><FaListAlt /></span>
                  <span className="card-label">Active Reservations</span>
                </div>
                <div className="card-value">{totalReservations.toLocaleString()}</div>
                <div className="card-detail">Current bookings</div>
              </div>

              <div className="summary-card success">
                <div className="card-header">
                  <span className="card-icon"><FaDollarSign /></span>
                  <span className="card-label">Verified Income</span>
                </div>
                <div className="card-value">
                  {stats.summary?.totalIncome ? formatCurrency(stats.summary.totalIncome) : formatCurrency(dashboardData.totalRevenue)}
                </div>
                <div className="card-detail">Verified payments</div>
              </div>
            </div>

            {/* Charts Section */}
            {months.length > 0 && (
              <div className="charts-grid">
                {/* Monthly Trends Chart */}
                <div className="chart-container">
                  <h3 className="chart-title">Monthly Burial Trends</h3>
                  <div className="chart-wrapper">
                    <Bar
                      data={{
                        labels: months,
                        datasets: [
                          {
                            label: 'Burials',
                            data: counts,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            borderRadius: 4,
                          },
                          ...(intermentCounts.length > 0 ? [{
                            label: 'Interments',
                            data: intermentCounts,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            borderRadius: 4,
                          }] : [])
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            display: true,
                            position: 'top',
                          },
                          title: { 
                            display: true, 
                            text: 'Service Activity by Month',
                            font: { size: 16, weight: 'bold' }
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.1)' }
                          },
                          x: {
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Service Distribution Chart */}
                <div className="chart-container">
                  <h3 className="chart-title">Service Distribution</h3>
                  <div className="chart-wrapper">
                    <Doughnut
                      data={serviceData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: 'bottom',
                            labels: { padding: 20 }
                          },
                          title: { 
                            display: true, 
                            text: 'Current Service Status',
                            font: { size: 16, weight: 'bold' }
                          },
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Table */}
            {stats.burialsByMonth && (
              <div className="data-section">
                <div className="section-header">
                  <div className="section-icon">
                    <FaClipboardList />
                  </div>
                  <h3 className="section-title">Monthly Data Overview</h3>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Year</th>
                        <th>Month</th>
                        <th>Burials</th>
                        <th>Growth</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.burialsByMonth.map((item, idx) => {
                        const prevCount = idx > 0 ? stats.burialsByMonth[idx - 1].count : null;
                        const growth = prevCount ? ((item.count - prevCount) / prevCount * 100).toFixed(1) : null;
                        const growthIcon = growth > 0 ? '📈' : growth < 0 ? '📉' : '➖';
                        
                        return (
                          <tr key={idx} className={idx === stats.burialsByMonth.length - 1 ? 'current-month' : ''}>
                            <td>{idx + 1}</td>
                            <td>{item._id.year}</td>
                            <td>{monthNames[item._id.month]}</td>
                            <td className="count-cell">{item.count}</td>
                            <td className="growth-cell">
                              {growth ? `${growthIcon} ${growth}%` : '—'}
                            </td>
                            <td>
                              {idx === stats.burialsByMonth.length - 1 && 
                                <span className="status-badge current">Current</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Recent Activities Section */}
      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Reservations</h2>
            <FaEye className="section-icon" />
          </div>
          <div className="reservations-list">
            {dashboardData.recentReservations.length > 0 ? (
              dashboardData.recentReservations.map((reservation, index) => (
                <div key={reservation._id || index} className="reservation-item">
                  <div className="reservation-info">
                    <h4>Lot {reservation.lotId}</h4>
                    <p>{reservation.clientName || 'N/A'}</p>
                    <span className="reservation-date">
                      {formatDate(reservation.createdAt)}
                    </span>
                  </div>
                  <div className="reservation-status">
                    {getStatusIcon(reservation.status)}
                    <span className={`status-text ${reservation.status}`}>
                      {reservation.status}
                    </span>
                    <span className="reservation-amount">
                      {formatCurrency(reservation.totalAmount || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No recent reservations</p>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activities</h2>
            <FaUsers className="section-icon" />
          </div>
          <div className="activities-list">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity, index) => (
                <div key={activity._id || index} className="activity-item">
                  <div className="activity-content">
                    <p>{activity.action || activity.message || 'System activity'}</p>
                    <span className="activity-user">
                      by {activity.userId || 'System'}
                    </span>
                  </div>
                  <span className="activity-time">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-data">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => window.location.href = '/admin/reservations/management'}
          >
            Manage Reservations
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => window.location.href = '/admin/users'}
          >
            Manage Staff
          </button>
          <button 
            className="action-btn tertiary"
            onClick={() => window.location.href = '/admin/reports/financial'}
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
} 