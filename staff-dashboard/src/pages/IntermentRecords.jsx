// src/pages/IntermentRecords.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import IntermentModal from '../components/IntermentModal';
import { FaBuilding, FaPlus, FaFilter } from 'react-icons/fa';
import './IntermentRecords.css';

export default function IntermentRecords() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalRecord, setModalRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    name: '',
    plotId: '',
    intermentDate: '',
    intermentTime: '',
    officiant: '',
    status: 'scheduled'
  });
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    intermentDateFrom: '',
    intermentDateTo: '',
    plotId: '',
    status: '',
    officiant: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/interments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load interment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleEdit = record => setModalRecord(record);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      intermentDateFrom: '',
      intermentDateTo: '',
      plotId: '',
      status: '',
      officiant: ''
    });
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = !filters.search || 
      record.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.plotId.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.officiant.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDateFrom = !filters.intermentDateFrom || 
      new Date(record.intermentDate) >= new Date(filters.intermentDateFrom);
    
    const matchesDateTo = !filters.intermentDateTo || 
      new Date(record.intermentDate) <= new Date(filters.intermentDateTo);
    
    const matchesPlotId = !filters.plotId || 
      record.plotId.toLowerCase().includes(filters.plotId.toLowerCase());
    
    const matchesStatus = !filters.status || record.status === filters.status;
    
    const matchesOfficiant = !filters.officiant || 
      record.officiant.toLowerCase().includes(filters.officiant.toLowerCase());
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesPlotId && matchesStatus && matchesOfficiant;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const handleSave = async updated => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/interments/${updated._id}`,
        updated,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
      setModalRecord(null);
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this interment record?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/interments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
      setModalRecord(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleCreate = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/interments`,
        newRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRecord({ name: '', plotId: '', intermentDate: '', intermentTime: '', officiant: '', status: 'scheduled' });
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed 20 dummy interment records? This will add to existing records.')) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/interments/seed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Seeding failed');
    }
  };

  // Calculate statistics
  const scheduledCount = records.filter(r => r.status === 'scheduled').length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const cancelledCount = records.filter(r => r.status === 'cancelled').length;

  if (loading) return <div className="loading-spinner">Loading interment records...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="interment-records-page">
      <div className="interment-records-header-FIXED">
        <div className="header-content">
          <div className="header-icon">
            <FaBuilding />
          </div>
          <div className="header-text">
            <h2>Interment Records Management</h2>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleSeed} className="btn-secondary">
            <FaPlus />
            Seed 20 Dummy Records
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-box total">
          <span className="stat-label">Total Records</span>
          <span className="stat-value">{records.length}</span>
        </div>
        <div className="stat-box scheduled">
          <span className="stat-label">Scheduled</span>
          <span className="stat-value">{scheduledCount}</span>
        </div>
        <div className="stat-box completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{completedCount}</span>
        </div>
        <div className="stat-box cancelled">
          <span className="stat-label">Cancelled</span>
          <span className="stat-value">{cancelledCount}</span>
        </div>
      </div>

      {/* Add New Record Form */}
      <div className="form-section">
        <h3>Add New Interment Record</h3>
        <form onSubmit={handleCreate} className="create-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter full name"
                value={newRecord.name}
                onChange={e => setNewRecord({ ...newRecord, name: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="plotId">Plot ID</label>
              <input
                id="plotId"
                type="text"
                placeholder="Enter plot ID"
                value={newRecord.plotId}
                onChange={e => setNewRecord({ ...newRecord, plotId: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="intermentDate">Interment Date</label>
              <input
                id="intermentDate"
                type="date"
                value={newRecord.intermentDate}
                onChange={e => setNewRecord({ ...newRecord, intermentDate: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="intermentTime">Interment Time</label>
              <input
                id="intermentTime"
                type="time"
                placeholder="Enter time (optional)"
                value={newRecord.intermentTime}
                onChange={e => setNewRecord({ ...newRecord, intermentTime: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="officiant">Officiant</label>
              <input
                id="officiant"
                type="text"
                placeholder="Enter officiant name (optional)"
                value={newRecord.officiant}
                onChange={e => setNewRecord({ ...newRecord, officiant: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={newRecord.status}
                onChange={e => setNewRecord({ ...newRecord, status: e.target.value })}
                className="form-select"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add Interment Record
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="table-section">
        <div className="section-header">
          <h3>Interment Records ({filteredRecords.length} of {records.length} total)</h3>
          <div className="section-actions">
            <div className="page-size-control">
              <label>Show:</label>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="page-size-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>
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
                  placeholder="Search by name, plot ID, or officiant..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Plot ID:</label>
                <input
                  type="text"
                  placeholder="Filter by plot ID..."
                  value={filters.plotId}
                  onChange={(e) => handleFilterChange('plotId', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Officiant:</label>
                <input
                  type="text"
                  placeholder="Filter by officiant..."
                  value={filters.officiant}
                  onChange={(e) => handleFilterChange('officiant', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Interment Date From:</label>
                <input
                  type="date"
                  value={filters.intermentDateFrom}
                  onChange={(e) => handleFilterChange('intermentDateFrom', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Interment Date To:</label>
                <input
                  type="date"
                  value={filters.intermentDateTo}
                  onChange={(e) => handleFilterChange('intermentDateTo', e.target.value)}
                />
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        )}
        {filteredRecords.length === 0 ? (
          <div className="no-records">
            <p>{records.length === 0 ? 'No interment records found. Add your first record using the form above.' : 'No records match your current filters.'}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Plot ID</th>
                    <th>Date of Interment</th>
                    <th>Time</th>
                    <th>Officiant</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map(record => (
                  <tr key={record._id}>
                    <td className="name-cell">{record.name}</td>
                    <td className="plot-id">{record.plotId}</td>
                    <td className="date-cell">
                      {new Date(record.intermentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="time-cell">{record.intermentTime || '—'}</td>
                    <td className="officiant-cell">{record.officiant || '—'}</td>
                    <td className="status-cell">
                      <span className={`status-badge ${record.status}`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(record._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
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
                Page {currentPage} of {totalPages} ({filteredRecords.length} records)
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
          </>
        )}
      </div>

      {modalRecord && (
        <IntermentModal
          record={modalRecord}
          onClose={() => setModalRecord(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
