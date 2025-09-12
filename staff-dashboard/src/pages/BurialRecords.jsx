// src/pages/BurialRecords.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RecordModal from '../components/RecordModal';
import { FaFileAlt, FaPlus, FaFilter } from 'react-icons/fa';
import './BurialRecords.css';

export default function BurialRecords() {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalRecord, setModalRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    name: '',
    burialDate: '',
    plotId: '',
    deathCertificateUrl: ''
  });
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    burialDateFrom: '',
    burialDateTo: '',
    plotId: '',
    status: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/burials`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load burial records');
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
      burialDateFrom: '',
      burialDateTo: '',
      plotId: '',
      status: ''
    });
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = !filters.search || 
      record.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.plotId.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDateFrom = !filters.burialDateFrom || 
      new Date(record.burialDate) >= new Date(filters.burialDateFrom);
    
    const matchesDateTo = !filters.burialDateTo || 
      new Date(record.burialDate) <= new Date(filters.burialDateTo);
    
    const matchesPlotId = !filters.plotId || 
      record.plotId.toLowerCase().includes(filters.plotId.toLowerCase());
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesPlotId;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const handleSave = async updated => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/burials/${updated._id}`,
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
    if (!window.confirm('Delete this burial record?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/burials/${id}`,
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
        `${process.env.REACT_APP_API_URL}/admin/burials`,
        newRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRecord({ name: '', burialDate: '', plotId: '', deathCertificateUrl: '' });
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed 20 dummy burial records? This will add to existing records.')) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/burials/seed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Seeding failed');
    }
  };

  if (loading) return <div className="loading-spinner">Loading burial records...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="burial-records-page">
      <div className="page-header-FIXED-TEST">
        <div className="header-content">
          <div className="header-icon">
            <FaFileAlt />
          </div>
          <div className="header-text">
            <h2>Burial Records Management</h2>
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
        <div className="stat-box recent">
          <span className="stat-label">Recent Burials</span>
          <span className="stat-value">
            {records.filter(r => {
              const burialDate = new Date(r.burialDate);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return burialDate >= thirtyDaysAgo;
            }).length}
          </span>
        </div>
        <div className="stat-box upcoming">
          <span className="stat-label">Upcoming Burials</span>
          <span className="stat-value">
            {records.filter(r => new Date(r.burialDate) > new Date()).length}
          </span>
        </div>
      </div>

      {/* Add New Record Form */}
      <div className="form-section">
        <h3>Add New Burial Record</h3>
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
              <label htmlFor="burialDate">Burial Date</label>
              <input
                id="burialDate"
                type="date"
                value={newRecord.burialDate}
                onChange={e => setNewRecord({ ...newRecord, burialDate: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="deathCertificateUrl">Death Certificate URL</label>
              <input
                id="deathCertificateUrl"
                type="url"
                placeholder="Enter certificate URL (optional)"
                value={newRecord.deathCertificateUrl}
                onChange={e => setNewRecord({ ...newRecord, deathCertificateUrl: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add Burial Record
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="table-section">
        <div className="section-header">
          <h3>Burial Records ({filteredRecords.length} of {records.length} total)</h3>
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
                  placeholder="Search by name or plot ID..."
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
                <label>Burial Date From:</label>
                <input
                  type="date"
                  value={filters.burialDateFrom}
                  onChange={(e) => handleFilterChange('burialDateFrom', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Burial Date To:</label>
                <input
                  type="date"
                  value={filters.burialDateTo}
                  onChange={(e) => handleFilterChange('burialDateTo', e.target.value)}
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
            <p>{records.length === 0 ? 'No burial records found. Add your first record using the form above.' : 'No records match your current filters.'}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Plot ID</th>
                    <th>Date of Burial</th>
                    <th>Death Certificate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map(record => (
                  <tr key={record._id}>
                    <td className="name-cell">{record.name}</td>
                    <td className="plot-id">{record.plotId}</td>
                    <td className="date-cell">
                      {new Date(record.burialDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="certificate-cell">
                      {record.deathCertificateUrl ? (
                        <a
                          href={record.deathCertificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="certificate-link"
                        >
                          View Certificate
                        </a>
                      ) : (
                        <span className="no-certificate">No Certificate</span>
                      )}
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
        <RecordModal
          record={modalRecord}
          onClose={() => setModalRecord(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
