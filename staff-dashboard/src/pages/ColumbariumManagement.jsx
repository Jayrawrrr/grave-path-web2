import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaChartBar, FaEye, FaEyeSlash } from 'react-icons/fa';
import CreateSlotModal from '../components/columbarium/CreateSlotModal';
import EditSlotModal from '../components/columbarium/EditSlotModal';
import BulkCreateModal from '../components/columbarium/BulkCreateModal';
import SlotDetailsModal from '../components/columbarium/SlotDetailsModal';
import './ColumbariumManagement.css';

const ColumbariumManagement = () => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Filters and search
  const [filters, setFilters] = useState({
    status: '',
    floor: '',
    section: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSlots, setTotalSlots] = useState(0);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    reservedSlots: 0,
    occupiedSlots: 0,
    totalRevenue: 0,
    occupancyRate: 0
  });

  const api = (endpoint, options = {}) => {
    const baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://api.grave-path.com';
    
    return fetch(`${baseURL}/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
  };

  const fetchSlots = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', page);
      params.append('limit', 20);

      const response = await api(`/admin/columbarium/slots?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalSlots(data.pagination?.totalSlots || 0);
      } else {
        setError('Failed to fetch slots');
      }
    } catch (error) {
      setError('Error fetching slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await api('/admin/columbarium/reservations');
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        setError('Failed to fetch reservations');
      }
    } catch (error) {
      setError('Error fetching reservations');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = slots.length;
    const available = slots.filter(s => s.status === 'available').length;
    const reserved = slots.filter(s => s.status === 'reserved').length;
    const occupied = slots.filter(s => s.status === 'occupied').length;
    const revenue = slots.filter(s => s.status === 'occupied').reduce((sum, s) => sum + s.price, 0);
    const occupancyRate = total > 0 ? ((occupied + reserved) / total * 100).toFixed(1) : 0;

    setStats({
      totalSlots: total,
      availableSlots: available,
      reservedSlots: reserved,
      occupiedSlots: occupied,
      totalRevenue: revenue,
      occupancyRate
    });
  };

  useEffect(() => {
    if (activeTab === 'slots') {
      fetchSlots(currentPage);
    } else if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'dashboard') {
      fetchSlots(1);
    }
  }, [activeTab, currentPage, filters]);

  useEffect(() => {
    if (slots.length > 0) {
      calculateStats();
    }
  }, [slots]);

  // Handler functions
  const handleCreateSlot = async (slotData) => {
    try {
      const response = await api('/admin/columbarium/slots', {
        method: 'POST',
        body: JSON.stringify(slotData)
      });
      
      if (response.ok) {
        setSuccess('Slot created successfully');
        fetchSlots(currentPage);
        setShowCreateModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create slot');
      }
    } catch (error) {
      setError('Error creating slot');
    }
  };

  const handleEditSlot = async (slotData) => {
    try {
      const response = await api(`/admin/columbarium/slots/${selectedSlot._id}`, {
        method: 'PUT',
        body: JSON.stringify(slotData)
      });
      
      if (response.ok) {
        setSuccess('Slot updated successfully');
        fetchSlots(currentPage);
        setShowEditModal(false);
        setSelectedSlot(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update slot');
      }
    } catch (error) {
      setError('Error updating slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    
    try {
      const response = await api(`/admin/columbarium/slots/${slotId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Slot deleted successfully');
        fetchSlots(currentPage);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete slot');
      }
    } catch (error) {
      setError('Error deleting slot');
    }
  };

  const handleBulkCreate = async (bulkData) => {
    try {
      const response = await api('/admin/columbarium/bulk-create', {
        method: 'POST',
        body: JSON.stringify(bulkData)
      });
      
      if (response.ok) {
        setSuccess('Slots created successfully');
        fetchSlots(currentPage);
        setShowBulkCreateModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create slots');
      }
    } catch (error) {
      setError('Error creating slots');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      floor: '',
      section: '',
      size: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const openEditModal = (slot) => {
    setSelectedSlot(slot);
    setShowEditModal(true);
  };

  const openReservationModal = (slot) => {
    setSelectedSlot(slot);
    setShowReservationModal(true);
  };

  return (
    <div className="columbarium-management">
      <div className="columbarium-management-header-FIXED">
        <div className="header-content">
          <div className="header-icon">
            <FaBuilding />
          </div>
          <div className="header-text">
            <h1>Columbarium Management</h1>
            <p>Manage columbarium slots and reservations</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="tab-navigation">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaChartBar /> Dashboard
        </button>
        <button 
          className={activeTab === 'slots' ? 'active' : ''}
          onClick={() => setActiveTab('slots')}
        >
          <FaBuilding /> Slots Management
        </button>
        <button 
          className={activeTab === 'reservations' ? 'active' : ''}
          onClick={() => setActiveTab('reservations')}
        >
          <FaEye /> Reservations
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaBuilding />
              </div>
              <div className="stat-content">
                <h3>{stats.totalSlots}</h3>
                <p>Total Slots</p>
              </div>
            </div>
            <div className="stat-card available">
              <div className="stat-icon">
                <FaEye />
              </div>
              <div className="stat-content">
                <h3>{stats.availableSlots}</h3>
                <p>Available</p>
              </div>
            </div>
            <div className="stat-card reserved">
              <div className="stat-icon">
                <FaEye />
              </div>
              <div className="stat-content">
                <h3>{stats.reservedSlots}</h3>
                <p>Reserved</p>
              </div>
            </div>
            <div className="stat-card occupied">
              <div className="stat-icon">
                <FaEye />
              </div>
              <div className="stat-content">
                <h3>{stats.occupiedSlots}</h3>
                <p>Occupied</p>
              </div>
            </div>
            <div className="stat-card revenue">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3>₱{stats.totalRevenue.toLocaleString()}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
            <div className="stat-card occupancy">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3>{stats.occupancyRate}%</h3>
                <p>Occupancy Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="slots-section">
          <div className="section-header">
            <h2>Columbarium Slots</h2>
            <div className="header-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus /> Create Slot
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBulkCreateModal(true)}
              >
                <FaPlus /> Bulk Create
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Search:</label>
                  <input
                    type="text"
                    placeholder="Search by slot ID..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Status:</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Floor:</label>
                  <select
                    value={filters.floor}
                    onChange={(e) => handleFilterChange('floor', e.target.value)}
                  >
                    <option value="">All Floors</option>
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="3">Floor 3</option>
                    <option value="4">Floor 4</option>
                    <option value="5">Floor 5</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Section:</label>
                  <select
                    value={filters.section}
                    onChange={(e) => handleFilterChange('section', e.target.value)}
                  >
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>
              <div className="filter-row">
                <div className="filter-group">
                  <label>Size:</label>
                  <select
                    value={filters.size}
                    onChange={(e) => handleFilterChange('size', e.target.value)}
                  >
                    <option value="">All Sizes</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="family">Family</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Min Price:</label>
                  <input
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Max Price:</label>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
                <div className="filter-actions">
                  <button className="btn btn-outline" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="slots-table">
              <thead>
                <tr>
                  <th>Slot ID</th>
                  <th>Location</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="loading">Loading...</td></tr>
                ) : slots.length === 0 ? (
                  <tr><td colSpan="6" className="no-data">No slots found</td></tr>
                ) : (
                  slots.map(slot => (
                    <tr key={slot.slotId}>
                      <td>{slot.slotId}</td>
                      <td>Floor {slot.floor}, Section {slot.section}, Row {slot.row}, Col {slot.column}</td>
                      <td><span className="size-badge">{slot.size}</span></td>
                      <td><span className={`status-badge ${slot.status}`}>{slot.status}</span></td>
                      <td>₱{slot.price.toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon edit"
                            onClick={() => openEditModal(slot)}
                            title="Edit Slot"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn-icon view"
                            onClick={() => openReservationModal(slot)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="btn-icon delete"
                            onClick={() => handleDeleteSlot(slot._id)}
                            title="Delete Slot"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages} ({totalSlots} total slots)
              </span>
              <button 
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="reservations-section">
          <div className="section-header">
            <h2>Reservations</h2>
          </div>
          <div className="table-container">
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Slot ID</th>
                  <th>Client Name</th>
                  <th>Deceased Name</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="loading">Loading...</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No reservations found</td></tr>
                ) : (
                  reservations.map(reservation => (
                    <tr key={reservation._id}>
                      <td>{reservation._id.slice(-8)}</td>
                      <td>{reservation.slotId}</td>
                      <td>{reservation.clientName}</td>
                      <td>{reservation.deceasedInfo?.name || 'N/A'}</td>
                      <td><span className={`status-badge ${reservation.status}`}>{reservation.status}</span></td>
                      <td>₱{reservation.paymentAmount?.toLocaleString() || '0'}</td>
                      <td>{new Date(reservation.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon view"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals will be added here */}
      {showCreateModal && (
        <CreateSlotModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSlot}
        />
      )}

      {showEditModal && selectedSlot && (
        <EditSlotModal
          slot={selectedSlot}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSlot(null);
          }}
          onSave={handleEditSlot}
        />
      )}

      {showBulkCreateModal && (
        <BulkCreateModal
          onClose={() => setShowBulkCreateModal(false)}
          onSave={handleBulkCreate}
        />
      )}

      {showReservationModal && selectedSlot && (
        <SlotDetailsModal
          slot={selectedSlot}
          onClose={() => {
            setShowReservationModal(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </div>
  );
};

export default ColumbariumManagement;